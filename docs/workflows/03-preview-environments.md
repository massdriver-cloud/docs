---
id: workflow-preview-environments
slug: /workflows/preview
title: Preview Environments from the CLI
sidebar_label: Preview Environments
---

# Preview Environments from the CLI

A **preview environment** is a per-branch (usually per-PR) clone of an
existing env — production, staging, anywhere — that stands up when code
changes and tears down when it merges. The CLI command for the entire
lifecycle is one line:

```bash
mass environment preview pr42 -f preview.yaml
```

This is the four primitives — `forkEnvironment`,
`setEnvironmentDefault`, `copyInstance`, `deployEnvironment` — composed
behind a single declarative config. Every step is idempotent, so the
same command runs on open, on every push, and on the converge after a
rebase. CI doesn't need to track state.

## The config

```yaml
# preview.yaml — minimum viable form.
project: demo
baseEnvironment: production
```

That's enough to fork `demo-production` into `demo-pr42`, seed every
instance from the parent, and deploy. The full schema covers everything
the API will accept:

```yaml
project: demo                # parity boundary
baseEnvironment: production  # the env we're forking

# Optional fork-level macros.
copyEnvironmentDefaults: true
copySecrets: false
copyRemoteReferences: false

# Required when the org gates `environment:create` on attribute policies.
attributes:
  region: us-east-1
  pr: "${GITHUB_PR}"          # ${VAR} expanded from process env

# Pin specific resources as defaults for this env.
environmentDefaults:
  - resourceType: aws-iam-role        # documentation; CLI uses resourceId
    resourceId: 161aeb95-...

# Per-instance overrides. Listed instances with no fields just inherit
# from the fork's seed.
instances:
  chatsvc:
    version: "latest+dev"     # `+dev` pulls from the dev release channel
    params:
      ingress:
        enabled: true
        host: chatty-pr-${GITHUB_PR}.example.com
    secrets:
      - name: STRIPE_KEY
        value: ${STRIPE_TEST_KEY}
    remoteReferences:
      # Fill chatsvc's `kubernetes_cluster` connection slot with a shared
      # cluster from another project (UUID form).
      - resourceId: a1b2c3d4-...
        field: kubernetes_cluster
      # Or address another instance's output: `<instance-id>.<field>`.
      - resourceId: demo-prod-db.hostname
        field: database
```

See the full reference in [Applications →
Preview Environments](/applications/preview_environments/overview).

## The flow `mass environment preview` executes

1. **`forkEnvironment`** — creates `<project>-<ID>` (or returns the
   existing one), seeds instances from the parent, optionally fans the
   `copy*` macros.
2. **`setEnvironmentDefault`** per entry in `environmentDefaults` — pins
   the declared resources as defaults for this env.
3. **Per-instance overrides** — for each `instances` entry, applies the
   declared params (deep-merged via `copyInstance`), version, secrets,
   and remote references.
4. **`deployEnvironment`** — fans a provision deployment across every
   instance in dependency order.

Re-running converges. Edited an instance manually mid-PR? The next
`preview` run resets it. Forgot `copySecrets` on the first call?
Add it to the YAML and re-run; secrets backfill.

## Environment-variable expansion

`${VAR}` / `$VAR` anywhere in the YAML is expanded from the process
environment before parsing. This is the contract for piping CI metadata
into the config without templating the whole file:

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

Undefined variables expand to empty strings — same semantics as
`os.ExpandEnv`.

## A GitHub Actions example

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
      MASSDRIVER_ORG_ID:  ${{ secrets.MASSDRIVER_ORG_ID }}
      GITHUB_PR:          ${{ github.event.pull_request.number }}
    steps:
      - uses: actions/checkout@v4
      - uses: massdriver-cloud/actions/setup@v5

      # Converge on open / reopen / synchronize. Env identifiers can't
      # contain dashes, so the PR number sits right against the prefix.
      - name: Converge preview env
        if: github.event.action != 'closed'
        run: mass environment preview "pr${GITHUB_PR}" -f preview.yaml

      # Tear down on close / merge. `decommission` runs the per-instance
      # teardowns in reverse dependency order; `--follow` blocks until
      # every instance is gone so the subsequent `delete` (which
      # requires an empty environment) succeeds.
      - name: Decommission preview env
        if: github.event.action == 'closed'
        run: |
          mass environment decommission "demo-pr${GITHUB_PR}" --follow
          mass environment delete "demo-pr${GITHUB_PR}"
```

## When to drop down to primitives

`preview` is convenient but not load-bearing. If your team wants a
different composition — say, fork on open, hold on to the env across
PRs, promote configs from main into it — drive the primitives
directly:

```bash
mass environment fork ecomm-production pr42 --copy-environment-defaults --copy-secrets
mass environment default ecomm-pr42 <shared-vpc-resource-id>
mass instance promote ecomm-staging-app --to ecomm-pr42-app
mass environment deploy ecomm-pr42

# When the PR merges:
mass environment decommission ecomm-pr42 --follow
mass environment delete ecomm-pr42
```

Same APIs. Same outcomes. Same idempotency guarantees.

## Reference

- CLI command: [`mass environment preview`](/cli/commands/mass_environment) — see the `preview` subcommand.
- Full schema reference: [Applications → Preview
  Environments](/applications/preview_environments/overview).
- Primitives this composes: [`fork`](/workflows/fork-environment),
  [`promote`](/workflows/promote), `setEnvironmentDefault`,
  `deployEnvironment`, `decommissionEnvironment`.
