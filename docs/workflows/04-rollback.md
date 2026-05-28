---
id: workflow-rollback
slug: /workflows/rollback
title: Roll Back a Deployment
sidebar_label: Roll Back
---

# Roll Back a Deployment

A **rollback** returns an instance to the state of a past deployment —
same bundle version, same params, same connection wiring — as a
*proposal*. Nothing ships until someone with deploy authority approves
it, so the rollback follows the same review path as any other change to
the instance.

Use a rollback when:

- A deploy left an instance in a bad state and you want to return to
  the last known-good run.
- An upgrade made it through staging but misbehaves under production
  load and you want to step it back to the prior version with the same
  params it had then.
- You're rehearsing an incident response and want to verify the
  rollback path before you need it.

A rollback is not the right tool for "deploy a slightly older bundle
version." For that, edit the instance's version constraint and run
`deployInstance`. A rollback specifically reproduces the snapshot of a
past run.

## What `rollbackDeployment` actually does

One API call, atomic:

1. Validates the source — it must be a `COMPLETED` `PROVISION`
   deployment. You cannot roll back to a `FAILED`, `PROPOSED`, or
   `DECOMMISSION` deployment, and you cannot roll back to a deployment
   from a different instance.
2. Snapshots the source's user params. The `md_metadata` block is
   refreshed against the current package; everything else is carried
   verbatim.
3. Snapshots the source's `connection_params` — the resolved IDs of
   the connections the instance was wired to at the time of the source
   run.
4. Carries the source's bundle release pointer (`bundle_release_id`)
   and `version` forward.
5. Creates a new `PROPOSED` `PROVISION` deployment with the above and
   records `rollbackOf` pointing at the source.

The result is a regular proposed deployment. It can be approved
(`approveDeployment`), rejected (`rejectDeployment`), or have a plan
run against it (`planDeployment`) — the same surface as any other
proposal.

### On approval

`approveDeployment` on a rollback proposal does one extra thing beyond
a normal approval: it pins the package's bundle release pointer
(`bundle_release_id` and `version`) to the source's. The instance ends
up running the snapshot *and* configured with the snapshot's release as
its current release, so subsequent edits compose on top of the
rolled-back state.

## The mutation

```graphql
mutation Rollback($orgId: ID!, $sourceDeploymentId: UUID!) {
  rollbackDeployment(
    organizationId: $orgId
    id: $sourceDeploymentId
  ) {
    successful
    result {
      id
      status         # always PROPOSED
      action         # always PROVISION
      message        # auto-generated "Rollback to deployment <id> (v<version>) ..."
      rollbackOf { id version }
    }
    messages { field message }
  }
}
```

`id` is the **source** — the historical deployment you want to return
to. The mutation returns the new proposal; pass its `id` to
`approveDeployment` / `rejectDeployment` / `planDeployment`.

### Authorization

- Proposing the rollback requires `instance:propose` on the instance —
  the same gate as any other proposal.
- Approving or rejecting requires `instance:deploy` on the instance.
  There is no separate "rollback approval" permission.

For incident response, granting SREs `instance:propose` +
`instance:deploy` in production (see the [ABAC SRE
example](/platform-operations/security/access-control#sre-with-cross-cutting-production-access))
lets an oncall engineer author and approve a rollback without waiting
for another team.

## The flow

```graphql
# 1. Find the deployment you want to return to. The most recent
#    completed provision is the usual answer.
query LastGoodDeployment($instanceId: ID!) {
  instance(id: $instanceId) {
    deployments(
      first: 5
      filter: { action: PROVISION, status: COMPLETED }
      sortBy: CREATED_AT
      sortOrder: DESC
    ) {
      edges {
        node { id version message createdAt }
      }
    }
  }
}

# 2. Propose the rollback against that source deployment's id.
mutation {
  rollbackDeployment(organizationId: "acme", id: "$sourceDeploymentId") {
    successful
    result { id rollbackOf { id version } }
  }
}

# 3. (Optional) Run a plan against the proposal to see the diff before
#    approving. A normal planDeployment — no rollback-specific behavior.
mutation {
  planDeployment(organizationId: "acme", id: "$proposalId") {
    successful
    result { id status }
  }
}

# 4. Approve. This step ships the deployment and pins the package's
#    release pointer to the source's.
mutation {
  approveDeployment(organizationId: "acme", id: "$proposalId") {
    successful
    result { id status }
  }
}
```

If the rollback turns out to be the wrong call mid-review,
`rejectDeployment` takes the proposal out of contention. The instance
never moved, and the audit log captures both the proposal and the
rejection.

## What does — and doesn't — get snapshotted

| Source's value | What ends up on the rollback proposal |
|---|---|
| `params` (your config) | Verbatim, minus `md_metadata` |
| `md_metadata` (platform-injected) | Re-generated from current package state |
| `connection_params` (resolved connections) | Verbatim |
| `version` | Verbatim |
| `bundle_release_id` (which published bundle) | Verbatim |
| `release` (release-channel pointer) | Verbatim |
| `secrets` | Not part of a deployment — the instance's current secrets apply. Rollback doesn't touch them. |

The asymmetry between `md_metadata` (refreshed) and everything else
(snapshotted) is deliberate. `md_metadata` describes the platform
context — org, project, environment, instance identity — and that
context shouldn't roll back with the config. If the instance has moved
environments or been renamed since the source run, the metadata
reflects the current state. Everything you authored rolls back; the
plumbing stays current.

## What rollback doesn't do

- **It doesn't move secrets.** Secrets live on the instance, not on
  deployments. If the failing deploy was caused by a secret change,
  revert the secret separately.
- **It doesn't migrate data.** A bundle version that altered a schema
  on the way up may not have a working migration on the way down.
  Rollback returns the bundle and params; it does not generate or run
  reverse migrations.
- **It doesn't decommission anything.** Resources the failing
  deployment created that don't exist in the snapshot are removed by
  the next provision (the rollback's `PROVISION` run reconciles
  state); resources created outside of Massdriver are not.
- **It can't skip the approval gate.** Even authors with
  `instance:deploy` go through `approveDeployment`. The approval step
  is what creates the audit record.

## Why approval pins the release pointer

A normal provision deployment applies a configuration but leaves the
package's `bundle_release_id` / `version` pointer wherever the user
left it, so the next edit composes against the latest intent.

A rollback rewrites that pointer to the source's. The reasoning: if
the source's run is the desired state, the instance's configured
release should reflect that. Otherwise the next deploy would compose
against the broken release, and the rollback would be a one-shot patch
instead of a return to a known state.

For one-shot behavior — deploy this snapshot once, but keep the
current pinned version — propose the deployment manually with
`proposeDeployment` rather than `rollbackDeployment`.

## Reference

- API mutation: `rollbackDeployment` in the V2 schema.
- Related mutations: `proposeDeployment`, `approveDeployment`,
  `rejectDeployment`, `planDeployment`.
- Permissions: [`instance:propose` and `instance:deploy`](/platform-operations/security/access-control#instance).
- Concept: [Deployments](/concepts/deployments).
