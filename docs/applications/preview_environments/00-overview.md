---
title: Overview
---

# Preview Environments

A **preview environment** is a temporary clone of an existing environment —
typically `production` or `staging` — that gets stood up for a branch, PR, or
spike, then torn down when the work merges. Every instance on the project's
canvas comes along: networks, clusters, databases, queues, apps. Anything that
deploys in the source environment deploys in the preview.

The CLI command `mass environment preview` converges a preview environment from
a single YAML config. Re-running it is safe — every step is idempotent — so the
same command works for "create on PR open" and "update on every push".

## Quickstart

A preview environment is described by a YAML file. The minimum looks like:

```yaml
# preview.yaml
project: demo
baseEnvironment: production
```

Run the converge:

```shell
mass environment preview pr123 -f preview.yaml
```

That produces an environment with the identifier `demo-pr123`, forked from
`demo-production`, with every instance seeded from the parent and a deployment
in flight.

> **Environment identifiers** must match `^[a-z0-9]{1,20}$` — lowercase
> alphanumeric only, no dashes, up to 20 chars. The full stored identifier is
> `<project>-<env>` (e.g. `demo-pr123`), where the dashes are *segment
> separators*, not part of the env identifier itself.

## What the converge does

Four steps, all of them safe to repeat:

1. **`forkEnvironment`** — creates a new environment in the project, linked to
   the parent via its `parent` field. Each instance is seeded with the parent
   instance's params, version, and release channel.
2. **`setEnvironmentDefault`** per entry in `environmentDefaults` — pins
   specific resources as the env's defaults of their type.
3. **Per-instance overrides** — for each entry under `instances`, applies the
   declared params (deep-merged via `copyInstance`), version, secrets, and
   remote references.
4. **`deployEnvironment`** — schedules a provision wave across every instance
   in dependency order.

A second run with the same identifier reconverges: params reset to the
parent's current values, defaults reset, overrides re-apply, deploy re-fires.
Useful for resetting local edits back to the declared state.

## Config schema

```yaml
# Required. The project the preview env lives in.
project: demo

# Required. The local segment of the environment to fork from. The full parent
# identifier is `<project>-<baseEnvironment>` — `demo-production` here.
baseEnvironment: production

# Optional. Carry the parent's default resource connections (the canvas-level
# defaults) into the fork. Default false.
copyEnvironmentDefaults: true

# Optional. Fan `copyInstance(copySecrets: true)` to every instance during the
# fork. Useful when the preview env should run with the parent's secret
# values. Default false.
copySecrets: false

# Optional. Fan `copyInstance(copyRemoteReferences: true)` to every instance
# during the fork. Default false.
copyRemoteReferences: false

# Optional. Environment-scope attributes for ABAC. Required when the org
# declares attributes at the environment scope (e.g., `region`). Keys and
# values must be strings.
attributes:
  region: us-east-1
  pr: "${GITHUB_PR}"

# Optional. Pin specific resources as defaults for this env. `resourceType`
# is documentation for the human reader; the CLI only needs `resourceId` to
# set the default.
environmentDefaults:
  - resourceType: aws-iam-role
    resourceId: 161aeb95-e1c5-4f8d-803e-ef82087d7ad4

# Optional. Per-instance overrides. Listed instances with no fields just
# inherit from the fork's seed.
#
# `remoteReferences` direction: each entry sits under the *consumer*
# instance, and `field` names a key in the consumer's `connections_schema`
# (its input slots). `resourceId` is the producer the slot should point
# at — see the next section for both supported formats.
instances:
  chatdb:
    # Version constraint. Append `+dev` to pull from the dev release channel
    # (e.g. `latest+dev`, `~2.0+dev`).
    version: "~2.0"

  chatsvc:
    version: "latest+dev"
    params:
      ingress:
        enabled: true
        host: chatty-pr-${GITHUB_PR}.example.com
        path: /
    secrets:
      - name: STRIPE_KEY
        value: ${STRIPE_TEST_KEY}
    remoteReferences:
      # Fill chatsvc's `kubernetes_cluster` connection slot with a shared
      # cluster from another project (UUID form).
      - resourceId: a1b2c3d4-5678-90ab-cdef-1234567890ab
        field: kubernetes_cluster
      # Fill chatsvc's `database` slot with the prod database instance's
      # `hostname` output (`<instance-id>.<field>` form).
      - resourceId: demo-prod-db.hostname
        field: database

  # listed without fields — inherits from the fork
  sessions:
```

## Environment-variable expansion

`${VAR}` and `$VAR` references anywhere in the YAML are expanded from the
process environment before parsing. This is the standard way to pipe CI
metadata (PR numbers, branch names, commit SHAs) into the config without
templating the whole file:

```yaml
attributes:
  pr: "${GITHUB_PR}"

instances:
  chatsvc:
    params:
      host: chatty-pr-${GITHUB_PR}.example.com
    secrets:
      - name: STRIPE_KEY
        value: ${STRIPE_TEST_KEY}
```

Undefined variables expand to empty strings.

## Shared infrastructure with remote references

Preview environments don't need their own VPC, cluster, or shared database
for every PR. A **remote reference** is a per-instance override that points
a connection slot at a resource provisioned in another project (or an
imported resource).

Direction: the YAML entry sits under the **consumer** — the instance whose
slot is being filled. `field` is a key in the consumer's
`connectionsSchema` (its inputs). `resourceId` is the producer.

`resourceId` accepts two formats:

- **Resource UUID** — for imported resources, environment defaults, or any
  resource you can look up via `mass resource list`.
- **`<instance-id>.<field>`** — addresses another instance's provisioned
  output artifact. For example, `demo-prod-db.hostname` resolves to the
  `hostname` output of the `demo-prod-db` instance. Use this when the
  producer is itself a Massdriver-managed instance.

```yaml
instances:
  app:
    remoteReferences:
      # UUID form — point at an imported VPC.
      - resourceId: 1e9fc8a3-f011-433f-b937-b5e525fd753c
        field: network
      # instance.field form — point at the prod cluster instance's output.
      - resourceId: shared-prod-eks.kubernetes_cluster
        field: kubernetes_cluster
```

The override takes priority over any blueprint Link wired into the same
slot and over environment defaults. Removing the reference reverts the
slot to the Link (or default). See [Sharing
Infrastructure](/guides/sharing-infrastructure) for the broader pattern.

## Using it in CI

A typical GitHub Actions workflow converges on every push and decommissions
on PR close. The CLI command is the same — wrap it however your CI prefers:

```yaml
name: Preview Environment

on:
  pull_request:
    types: [opened, reopened, synchronize, closed]

jobs:
  preview:
    runs-on: ubuntu-latest
    env:
      MASSDRIVER_API_KEY: ${{ secrets.MASSDRIVER_API_KEY }}
      MASSDRIVER_ORG_ID: ${{ secrets.MASSDRIVER_ORG_ID }}
      GITHUB_PR: ${{ github.event.pull_request.number }}
    steps:
      - uses: actions/checkout@v4
      - uses: massdriver-cloud/actions/setup@v5

      # Converge on every push (open, reopen, synchronize).
      # Note: env identifiers can't contain dashes, so the PR number runs
      # straight up against the prefix — `pr42`, not `pr-42`.
      - name: Converge preview env
        if: github.event.action != 'closed'
        run: mass environment preview "pr${GITHUB_PR}" -f preview.yaml

      # Tear down on close/merge.
      - name: Decommission preview env
        if: github.event.action == 'closed'
        run: mass environment delete "demo-pr${GITHUB_PR}"
```

For other CI systems, the pattern is the same: export the relevant env
vars, then run `mass environment preview <ID>`.

## Reference

- Full command reference: [`mass environment preview`](/cli/commands/mass_environment) — see the `preview` subcommand.
- Related: [`mass environment create`](/cli/commands/mass_environment_create),
  [`mass environment default`](/cli/commands/mass_environment_default).
