---
id: topologies-change
slug: /continuous-delivery/topologies/change
title: Change Topologies
sidebar_label: Change
description: Environments that exist for one piece of work in progress.
---

# Change Topologies

An environment exists for one piece of work in progress, and it is decommissioned when the work ships.

## Pull Request Preview {#pull-request-preview}

<Topology id="pull-request-preview" />

Each pull request gets an environment forked from production and decommissioned on merge. [`mass environment preview`](/continuous-delivery/preview) runs the whole lifecycle from one YAML file.

- **Project:** One project. A preview is a fork of prod, so it has the same canvas.
- **Instances:** The components changed in the pull request are deployed. Expensive shared components, such as the network or the cluster, are not deployed and are filled by environment defaults or remote references.
- **Versions:** Changed instances run a development release. Every other instance keeps the version the fork copied from prod.
- **Parity:** The fork starts as a copy of prod, and re-running the preview converges it back to the declared state. Differences should be limited to the overrides in the preview file.

**Example.** Every pull request on the storefront repository runs this in CI:

```bash
mass environment preview pr${GITHUB_PR} -f preview.yaml
```

The preview file forks `ecomm-prod` with `copyEnvironmentDefaults: true`, so `ecomm-pr212` deploys onto prod's network and cluster instead of creating its own. The storefront instance runs the development release that the pull request published. Closing the pull request decommissions the environment.

## Staged Preview {#staged-preview}

<Topology id="staged-preview" />

Previews fork from dev or staging instead of prod, and a merged change still passes through the chain before it reaches production.

- **Project:** One project. Previews are forks of a non-production stage.
- **Instances:** Same as a pull request preview, with shared components referenced from the stage it forked from.
- **Versions:** Changed instances run a development release. The rest inherit the channels of the parent stage, so a preview forked from dev can take another team's development release in the middle of a review.
- **Parity:** Parity is with the parent stage, which is already ahead of prod.

**Example.** A team whose production credentials must never reach a pull request sets `baseEnvironment: staging` in its preview file. Reviewers test against staging's data and staging's versions. After the merge, the change still goes through staging and is promoted to prod.

## Feature Environment {#feature-environment}

<Topology id="feature-environment" />

One fork per feature or epic. It lives for weeks and takes changes from several pull requests or repositories.

- **Project:** One project.
- **Instances:** Every component the feature touches is deployed. The rest are referenced from the parent.
- **Versions:** The feature's instances follow a `+dev` channel, so a publish from any of its pull requests redeploys them. A feature that moves a bundle to a new minor or major version can follow that version's `+dev` channel without picking up other work on the bundle.
- **Parity:** Re-forking resets the environment to the parent's current state and discards local edits, so a feature environment drifts until someone chooses to re-fork.

**Example.** A checkout rewrite spans the web, cart, and payments repositories over six weeks.

```bash
mass environment fork ecomm-staging checkoutv2
```

The cart and payments instances in `ecomm-checkoutv2` are set to `~2+dev`. Every development release of 2.x from any of the pull requests redeploys them, while staging stays on `~1`.

## Hotfix Environment {#hotfix-environment}

<Topology id="hotfix-environment" />

A fork of prod created to reproduce and verify one urgent fix, then decommissioned.

- **Project:** One project.
- **Instances:** The broken component is deployed, along with whatever is needed to reproduce the bug. Everything else is referenced from prod.
- **Versions:** The fork copies the exact versions prod is running. The fix is tested as a development release, then published as a patch that prod takes through its minor channel or a version change.
- **Parity:** The fork matches prod at the moment it is made. The earlier stages need the same patch afterward.

**Example.** Prod runs payments 1.4.2 and a rounding bug appears. `mass environment fork ecomm-prod hotfix` copies prod's versions and params. The fix is published as a 1.4.3 development release and deployed only in `ecomm-hotfix`. Once it is verified, 1.4.3 is published, prod takes it on `~1.4`, and the hotfix environment is decommissioned. Dev and staging pick up 1.4.3 on their channels.
