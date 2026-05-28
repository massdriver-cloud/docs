---
id: workflow-rollback
slug: /workflows/rollback
title: Roll Back a Deployment
sidebar_label: Roll Back
---

# Roll Back a Deployment

A **rollback** returns an instance to the state of a past deployment —
same bundle version, same params, same connection wiring — as a
proposal. The proposal goes through the same approval gate as any other
change to the instance; nothing ships until an approver with deploy
authority approves it.

Use a rollback when:

- A deploy left an instance in a bad state and you want to return to
  the last known-good run.
- An upgrade reached production and misbehaves under load, and you
  want to step it back to the prior version with the params it had
  then.
- You're rehearsing an incident response and want to verify the
  rollback path before you need it.

A rollback is not the right tool for "deploy a slightly older bundle
version." For that, edit the instance's version constraint and run
`deployInstance`. A rollback reproduces the snapshot of a specific
past run.

## `rollbackDeployment`

One API call, atomic:

1. Validates the source. It must be a `COMPLETED` `PROVISION`
   deployment on the same instance. `FAILED`, `PROPOSED`, and
   `DECOMMISSION` deployments are rejected.
2. Snapshots the source's user params. The `md_metadata` block is
   regenerated against the current package; the rest is carried
   verbatim.
3. Snapshots the source's `connection_params` — the resolved IDs of
   the connections the instance was wired to at the time of the source
   run.
4. Carries the source's `bundle_release_id` and `version` forward.
5. Creates a new `PROPOSED` `PROVISION` deployment with the above and
   records `rollbackOf` pointing at the source.

The result is a proposed deployment. It accepts `approveDeployment`,
`rejectDeployment`, and `planDeployment` — the same surface as any
other proposal.

### Approval

`approveDeployment` on a rollback proposal pins the package's
`bundle_release_id` and `version` to the source's, in addition to the
normal apply. After approval, the instance is running the snapshot and
the package's configured release is the snapshot's release, so
subsequent edits compose on top of the rolled-back state.

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

`id` is the **source** — the historical deployment to return to. The
mutation returns the new proposal; pass its `id` to
`approveDeployment`, `rejectDeployment`, or `planDeployment`.

### Authorization

- Proposing the rollback requires `instance:propose` on the instance —
  the same gate as any other proposal.
- Approving or rejecting requires `instance:deploy` on the instance.
  There is no separate rollback-approval permission.

Granting SREs `instance:propose` and `instance:deploy` in production
(see the [ABAC SRE
example](/platform-operations/security/access-control#sre-with-cross-cutting-production-access))
lets an oncall engineer author and approve a rollback without waiting
for another team.

## The flow

```graphql
# 1. Find the deployment to return to. The most recent completed
#    provision is the usual answer.
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

# 3. Optional. Run a plan against the proposal to see the diff before
#    approving. Standard planDeployment; no rollback-specific behavior.
mutation {
  planDeployment(organizationId: "acme", id: "$proposalId") {
    successful
    result { id status }
  }
}

# 4. Approve. Ships the deployment and pins the package's release
#    pointer to the source's.
mutation {
  approveDeployment(organizationId: "acme", id: "$proposalId") {
    successful
    result { id status }
  }
}
```

`rejectDeployment` discards the proposal. The instance is not
modified; the proposal and rejection both appear in the audit log.

## Snapshot behavior

| Source's value | What ends up on the rollback proposal |
|---|---|
| `params` (your config) | Verbatim, minus `md_metadata` |
| `md_metadata` (platform-injected) | Regenerated from current package state |
| `connection_params` (resolved connections) | Verbatim |
| `version` | Verbatim |
| `bundle_release_id` (which published bundle) | Verbatim |
| `release` (release-channel pointer) | Verbatim |
| `secrets` | Not part of a deployment — the instance's current secrets apply. Rollback does not touch them. |

`md_metadata` is regenerated because it describes the platform context
— org, project, environment, instance identity — and that context
should reflect the current state of the instance, not the source's. If
the instance has been renamed or moved environments since the source
run, the regenerated metadata reflects the current location.

## Limits

- **Secrets are not rolled back.** Secrets live on the instance, not
  on deployments. If a secret change caused the failure, revert it
  separately.
- **Data is not migrated.** A bundle version that altered a schema on
  the way up may not have a working migration on the way down.
  Rollback restores the bundle and params; it does not generate or
  run reverse migrations.
- **Out-of-band resources are not decommissioned.** Resources the
  failing deployment created that are absent from the snapshot are
  removed by the rollback's `PROVISION` run, which reconciles state.
  Resources created outside Massdriver are not.
- **The approval gate cannot be skipped.** Authors with
  `instance:deploy` still go through `approveDeployment`. The
  approval step is what creates the audit record.

## Release-pointer pinning

A normal provision deployment applies a configuration without changing
the package's `bundle_release_id` or `version` pointer. The next edit
composes against the pointer the user last set.

A rollback approval rewrites that pointer to the source's. Without the
rewrite, the next deploy would compose against the release the
rollback was meant to retreat from, and the rollback would behave as a
one-shot patch rather than a return to a known state.

For one-shot behavior — apply this snapshot once, keep the current
pinned version — use `proposeDeployment` directly instead of
`rollbackDeployment`.

## Reference

- API mutation: `rollbackDeployment` in the V2 schema.
- Related mutations: `proposeDeployment`, `approveDeployment`,
  `rejectDeployment`, `planDeployment`.
- Permissions: [`instance:propose` and `instance:deploy`](/platform-operations/security/access-control#instance).
- Concept: [Deployments](/concepts/deployments).
