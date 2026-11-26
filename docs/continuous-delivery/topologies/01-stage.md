---
id: topologies-stage
slug: /continuous-delivery/topologies/stage
title: Stage Topologies
sidebar_label: Stage
description: Environments that are steps in a sequence, such as dev, staging, and prod.
---

# Stage Topologies

Each environment is a step in a sequence, and a change moves through the steps in order.

## Linear Promotion {#linear-promotion}

<Topology id="linear-promotion" />

Environments are stages in a fixed order, such as dev, staging, prod. Two stages or six, the topology is the same.

- **Project:** One project. Every stage is an environment of it, so every stage has the same canvas.
- **Instances:** Every component is deployed in every stage, at smaller sizes in the early ones.
- **Versions:** Dev instances follow a `+dev` channel, staging follows a stable channel, and prod follows a minor channel or holds exact versions.
- **Parity:** Compare on two adjacent stages should show size and credentials and nothing else. Config moves forward with instance promote, which ends in a plan on the destination.

**Example.** A `billing` project has `dev`, `staging`, and `prod`. Dev follows `~1+dev`, so it already ran the development releases of the API. A merge to main publishes 1.5.0, and staging takes it through `~1`. When staging checks pass, the API moves to prod:

```bash
mass instance promote billing-staging-api --to billing-prod-api
```

The promote copies the version and params and leaves a plan on `billing-prod-api` for review.

## Branch-Mapped Promotion {#branch-mapped-promotion}

<Topology id="branch-mapped-promotion" />

Each long-lived branch maps to one environment. Merging a branch into the next one is what triggers the publish or the promote for that stage.

- **Project:** One project, with one environment per long-lived branch.
- **Instances:** Every component is deployed in every environment.
- **Versions:** The develop branch publishes development releases, which dev follows on `+dev`. The release branch publishes the stable version that staging picks up. Merging to main promotes the staging versions to prod as exact versions.
- **Parity:** Same as linear promotion. A hotfix branch publishes a patch that prod takes directly, so the earlier stages are behind prod until they take the same patch.

**Example.** A team on git flow runs `mass bundle publish --development` on every push to `develop`, and dev deploys each one. Cutting `release/1.5` publishes 1.5.0 and staging deploys it. Merging to `main` runs `mass instance promote` from staging to prod for each changed instance. A `hotfix/1.5.1` branch publishes 1.5.1, which is promoted to prod straight away and reaches staging on its channel.

## Shared Integration {#shared-integration}

<Topology id="shared-integration" />

Each team has an environment for its own components, and all of them meet in one integration environment before production.

- **Project:** One project. The blueprint holds every team's components.
- **Instances:** A team environment deploys only that team's components and fills its other dependencies with remote references to the integration environment. Integration and prod deploy everything.
- **Versions:** Team environments run development releases of their own components. Integration follows stable channels.
- **Parity:** Team environments are partial on purpose. Integration is the first environment that should compare cleanly against prod.

**Example.** The payments, search, and billing teams share an `ecomm` project. The `payments` environment deploys only the payments service, on the team's latest development release, and reads the search and billing services from `integration` by remote reference. When a team publishes a stable release, integration deploys it next to every other team's current release, and integration is the source of every promote to prod.
