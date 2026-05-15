---
id: workflows-overview
slug: /workflows
title: Workflows
sidebar_label: Overview
---

# Workflows

**Massdriver is the platform you didn't have to build.**

Most teams don't actually want a CI/CD pipeline duct-taped to a half-dozen
Terraform repos. They want a *cloud management platform* — one place where
environments fork, configs promote, previews stand up on every PR, and the
people who know how the infrastructure works don't have to be in the room
for every change. That platform is what Massdriver gives you, out of the
box.

Three things make that possible, and you can compose them however you
need to:

- **A real data model.** Projects, environments, instances, resources, and
  the connections between them aren't strings in a YAML file — they're
  first-class entities with identifiers, ACLs, attributes, version
  history, and an audit log. Forking an environment is an API call, not a
  copy-paste exercise.
- **Automations that already know your graph.** `forkEnvironment`,
  `copyInstance`, `deployEnvironment`, `setEnvironmentDefault`,
  `setRemoteReference` — every workflow in this section is the platform
  composing those primitives for you. No glue scripts. No
  "what-order-do-I-run-these-in." Idempotent by construction.
- **IaC as the plugin model.** Your Terraform, OpenTofu, Helm, and Bicep
  bundles are how Massdriver knows what a "database" or a "cluster" or a
  "queue" is. Publish a bundle, and every workflow — fork, promote,
  preview, deploy — composes it like a Lego brick. The framework handles
  the wiring, your code handles the cloud.

The CLI command for every workflow here is one line. Wrap it in CI, paste
it into a Slack workflow, drop it in a cron job — same primitives, every
time.

## Workflows in this section

- **[Fork an environment](/workflows/fork-environment)** — clone an existing
  environment into a new one. Use it for spinning up staging from prod,
  ramping a developer's personal env off staging, or any time you want a
  controlled copy you can diverge from.
- **[Promote configs across environments](/workflows/promote)** — push a
  validated configuration from one environment's instance to another's
  (e.g. staging → prod) with a plan deployment for review. Same command,
  same promote-on-merge flow you'd build yourself in a week.
- **[Preview environments from the CLI](/workflows/preview)** — declare a
  preview env in a single YAML file and run one command on every PR. Forks
  the base env, pins environment defaults, applies per-instance overrides
  (params, secrets, remote references), and deploys — every step
  idempotent, so re-running converges the env back to the declared state.

## Why one command, not a workflow engine

Every primitive is **idempotent at the API layer**. `forkEnvironment`
re-fires its seed against the existing fork. `setEnvironmentDefault` is an
upsert. `copyInstance` deep-merges and stages a plan. `deployEnvironment`
cancels in-flight rollouts and replaces them. That means the workflows
here aren't fragile scripts that you have to babysit through retries — you
re-run the same command and the platform converges. CI doesn't need to
checkpoint state.

Composability is what falls out of that. You can use the high-level
`mass environment preview <ID> -f preview.yaml` for the bundle of all four
operations, or you can drive the primitives yourself:

```bash
# Same flow, primitives form.
mass environment fork ecomm-production pr42 --copy-environment-defaults
mass environment default ecomm-pr42 <shared-vpc-resource-id>
mass instance copy ecomm-production-db ecomm-pr42-db --copy-secrets
mass environment deploy ecomm-pr42
```

The CLI is the same surface as the API. Whatever you'd reach for in the
UI for a one-off, you can script for the fleet.
