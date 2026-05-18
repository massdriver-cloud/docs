---
id: workflows-overview
slug: /workflows
title: Workflows
sidebar_label: Overview
---

# Workflows

Massdriver's data model, automations, and IaC plugin model compose into
the building blocks of a cloud management platform — one where
environments fork, configs promote, previews stand up on every PR, and
the people who know how the infrastructure works don't have to be in
the room for every change.

Three pieces make that possible:

- **A real data model.** Projects, environments, instances, resources,
  and the connections between them are first-class entities with
  identifiers, ACLs, attributes, version history, and an audit log.
  Forking an environment is an API call, not a copy-paste exercise.
- **Automations that already know your graph.** `forkEnvironment`,
  `copyInstance`, `deployEnvironment`, `decommissionEnvironment`,
  `setEnvironmentDefault`, and related mutations are idempotent by
  construction. The workflows in this section compose them — no glue
  scripts, no "what-order-do-I-run-these-in."
- **IaC as the plugin model.** Your Terraform, OpenTofu, Helm, and
  Bicep bundles tell Massdriver what a "database," "cluster," or
  "queue" is. Publish a bundle, and every workflow — fork, promote,
  preview, deploy — composes it the same way.

The CLI command for every workflow here is one line. Wrap it in CI,
drop it in a cron job, paste it into a Slack workflow — same
primitives either way.

## Workflows in this section

- **[Fork an environment](/workflows/fork-environment)** — clone an
  existing environment into a new one. Use it for spinning up staging
  from prod, ramping a developer's personal env off staging, or any
  time you want a controlled copy you can diverge from.
- **[Promote configs across environments](/workflows/promote)** — push
  a validated configuration from one instance to another (e.g. staging
  → prod). The destination ends up with a plan deployment for review
  before anything ships.
- **[Preview environments from the CLI](/workflows/preview)** — declare
  a preview env in a single YAML file and run one command on every PR.
  Forks the base env, pins environment defaults, applies per-instance
  overrides, and deploys — every step idempotent, so re-running
  converges the env back to the declared state.

## Why one command, not a workflow engine

Every primitive is idempotent at the API layer. `forkEnvironment`
re-fires its seed against an existing fork. `setEnvironmentDefault` is
an upsert. `copyInstance` deep-merges and stages a plan.
`deployEnvironment` cancels in-flight rollouts and replaces them.
`decommissionEnvironment` does the same in reverse — cancel the
current wave, fan a teardown across every instance. Re-running the
same command converges; CI doesn't need to checkpoint state.

Composability follows from that. Use `mass environment preview <ID> -f
preview.yaml` for the bundled flow, or drive the primitives directly:

```bash
mass environment fork ecomm-production pr42 --copy-environment-defaults
mass environment default ecomm-pr42 <shared-vpc-resource-id>
mass instance copy ecomm-production-db --to ecomm-pr42-db --copy-secrets
mass environment deploy ecomm-pr42
```

The CLI mirrors the API. Whatever you'd reach for in the UI for a
one-off, you can script for the fleet.
