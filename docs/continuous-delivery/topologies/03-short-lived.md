---
id: topologies-short-lived
slug: /continuous-delivery/topologies/short-lived
title: Short-Lived Environments
sidebar_label: Short-Lived Environments
description: Environments forked for a while and then removed.
---

# Short-Lived Environments

Each topology on this page adds [forks](/continuous-delivery/fork-environment) to an existing project. A fork is a new environment of that project, so it has the same blueprint as the environment it came from. It starts with that environment's params. It gets the parent's environment defaults, secrets, and remote references only when you ask for them.

Forking the same environment again with the same name resets the fork to the parent's current params. When the work is done, the fork is decommissioned and deleted.

## Pull Request Preview {#pull-request-preview}

<Topology id="pull-request-preview" />

One environment per open pull request. It is forked when the pull request opens and removed when it closes.

- **Environments:** One per pull request, forked from the environment it should look like, usually staging.
- **Resources from elsewhere:** The preview deploys every component on the blueprint. The cluster and network are not on the blueprint. The preview copies them from the parent's environment defaults, so it runs on the same non-production cluster as staging.
- **Parity:** Comparing a preview with staging should show only the overrides in the preview file.

**Example.** Each pull request on the storefront repository runs this in CI:

```bash
mass environment preview pr${GITHUB_PR} -f preview.yaml
```

```yaml
project: storefront
baseEnvironment: staging
copyEnvironmentDefaults: true
```

`storefront-pr212` gets its own web service, cache, and small database, and runs on the platform project's non-production cluster. Closing the pull request decommissions it. Refer to [Preview Environments](/continuous-delivery/preview).

## Workspace {#workspace}

<Topology id="workspace" />

One environment per developer or per agent task. It deploys only what that person or agent is working on.

- **Environments:** One per developer, such as `alice`, or one per task, such as `task481`.
- **Resources from elsewhere:** The workspace deploys the components being changed and leaves the rest undeployed. A deployed instance that depends on an undeployed component gets a remote reference to that resource in the parent environment.
- **Parity:** A workspace is partial on purpose. Forking it again resets its params to the parent's current params.

**Example.** Alice works on the payments service in the `ecomm` project. She forks dev, deploys only the payments service, and points its database slot at dev's database:

```bash
mass environment fork ecomm-dev alice --copy-environment-defaults
mass instance remote-reference set ecomm-alice-payments database <dev-database-resource-id>
mass instance deploy ecomm-alice-payments
```

The [sandbox-on-join](/continuous-delivery/automations/sandbox-on-join) automation runs the fork when someone joins a group and decommissions it when they leave.

An agent workspace has the same shape. A coding agent forks `ecomm-staging` into `ecomm-task481` with an `agent=true` attribute and deploys only the components named in its task. An [access policy](/platform-operations/security/access-control#policies) on that attribute lets the agent's service account deploy only in its own forks.

## Purpose Fork {#purpose-fork}

<Topology id="purpose-fork" />

A fork made for one job and removed afterward. The shape is the same each time. What differs is the parent, what the fork shares with it, and how long it lives.

| Purpose | Forked from | Resources from elsewhere | Lives for |
|---|---|---|---|
| Hotfix | `prod` | Deploys every component with prod's params, so the bug can be reproduced. | Until the fix ships |
| Load test | `prod` | Deploys every component at production size, including its own database. Its cluster is a separate environment default, so the test does not load production. | Hours |
| Security or chaos test | `prod` | Sets credentials for an isolated cloud account as its environment default, so nothing outside the fork can be reached. | The length of the test |
| Demo | `staging` | Deploys every component at small sizes. A nightly fork with the same name resets it. | Long-lived |
| Training | A reference environment | One fork per attendee, each with every component. | The session |
| Spike | `dev` | Changes params for an experiment. An experiment that adds a component is a different blueprint and needs its own project. | Days |
| Scheduled | `staging` | Forked and deployed by a schedule, then decommissioned by another. | The window |

**Example.** Two weeks before a sales event, `ecomm-prod` is forked into `ecomm-loadtest`. The database is on the blueprint, so the fork deploys its own copy at production size. The fork does not copy prod's environment defaults. It gets a cluster of its own instead:

```bash
mass environment fork ecomm-prod loadtest --copy-secrets
mass environment default ecomm-loadtest <loadtest-cluster-resource-id>
mass environment deploy ecomm-loadtest
```

A load generator runs against it for two hours, and the environment is decommissioned.
