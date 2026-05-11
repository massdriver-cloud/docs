---
id: security-graphql-permissions
slug: /platform-operations/security/graphql-permissions
title: GraphQL Permission Reference
sidebar_label: GraphQL Permissions
---

# GraphQL Permission Reference

This page maps every operation in the Massdriver GraphQL API to the [ABAC permission(s)](/platform-operations/security/access-control) it requires. Use it when authoring policies for groups, debugging `forbidden` errors, or planning the minimum permission set for a service account.

## How to read this table

- **Operation** — the GraphQL operation name (camelCase, as it appears in the schema).
- **Type** — Query, Mutation, or Subscription.
- **Required permission(s)** — every ABAC action the resolver checks. When more than one is listed, all are required (sequential `AND`). Operations that read attributes through filtered list queries instead of explicit `can_i?` checks are noted as *visibility-filtered*.
- **Notes** — non-obvious behavior: which entity the permission is checked against, conditional permissions, and lifecycle constraints.

If you're building a least-privilege policy, scan the table for the operations the principal needs and assemble the union of required permissions. List queries (`projects`, `instances`, `resources`, etc.) are visibility-filtered: a caller only sees what their group policies and grants make visible — there's no explicit list permission to grant.

---

## Project

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `projects` | Query | *visibility-filtered* | Returns only projects the caller has `project:view` on. |
| `project` | Query | `project:view` | |
| `createProject` | Mutation | `project:create` | Checked against the *proposed* effective attributes, including `md-project` (the project's local identifier). |
| `cloneProject` | Mutation | `project:view`, `project:create` | View on source, then create on the proposed clone. |
| `updateProject` | Mutation | `project:update` | |
| `deleteProject` | Mutation | `project:delete` | Project must have no environments, components, or instances. |
| `addComponent` | Mutation | `project:design` | Also requires a repo grant on the bundle covering the destination project (view + grant gate). |
| `updateComponent` | Mutation | `project:design` | |
| `removeComponent` | Mutation | `project:design` | Component must have no provisioned instances. |
| `linkComponents` | Mutation | `project:design` | |
| `unlinkComponents` | Mutation | `project:design` | |
| `setComponentPosition` | Mutation | `project:design` | |
| `component` | Query | `project:view` | Loaded via parent project. |

## Environment

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `environments` | Query | *visibility-filtered* | |
| `environment` | Query | `project:view` | |
| `compareEnvironments` | Query | `project:view` (both source and target) | |
| `createEnvironment` | Mutation | `project:view`, `environment:create` | View the parent project, then `environment:create` on the proposed environment (`md-environment` is the new env's identifier). |
| `forkEnvironment` | Mutation | `project:view`, `environment:create` | Same shape as `createEnvironment`. |
| `updateEnvironment` | Mutation | `environment:update` | |
| `deleteEnvironment` | Mutation | `environment:delete` | Environment must have no provisioned instances. |
| `setEnvironmentDefault` | Mutation | `environment:configure`, `resource:view` | Configure the env, view the resource being defaulted in. Also requires a resource grant covering the destination environment. |
| `removeEnvironmentDefault` | Mutation | `environment:configure` | |

## Instance

Deployments are an action *on* an instance — `createDeployment`, `planDeployment`, `proposeDeployment`, `approveDeployment`, `rejectDeployment`, and `abortDeployment` are listed here. The two listing queries (`deployments`, `deployment`) are in the [Deployment](#deployment) section below.

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `instances` | Query | *visibility-filtered* | |
| `instance` | Query | `project:view` | |
| `paramDimensions` | Query | *visibility-filtered* | Aggregates over instances the caller can see. |
| `updateInstance` | Mutation | `instance:configure` | Sets version constraints, release strategy. |
| `setInstanceSecret` | Mutation | `instance:configure` | |
| `removeInstanceSecret` | Mutation | `instance:configure` | |
| `setRemoteReference` | Mutation | `instance:configure`, `resource:view` | Configure the destination instance, view the resource being wired in. Also requires a resource grant covering the instance's environment. |
| `removeRemoteReference` | Mutation | `instance:configure` | |
| `copyInstance` | Mutation | `project:view`, `instance:configure` | View on source instance, configure on destination. |
| `orphanInstance` | Mutation | `instance:decommission` | Break-glass reset to `INITIALIZED`. Clears state locks, bulk-aborts in-flight deployments, and (with `deleteState: true`) deletes the remote Terraform/OpenTofu state files. |
| `createDeployment` | Mutation | `instance:deploy`, `instance:plan`, or `instance:decommission` | Permission depends on `input.action`: `PROVISION` → `instance:deploy`, `PLAN` → `instance:plan`, `DECOMMISSION` → `instance:decommission`. |
| `planDeployment` | Mutation | `instance:plan` | Re-runs a `PLAN` against a source deployment's params on the same instance. Source may be in any status. |
| `proposeDeployment` | Mutation | `instance:propose` | Only `PROVISION` and `DECOMMISSION` are proposable. |
| `approveDeployment` | Mutation | `instance:deploy` | |
| `rejectDeployment` | Mutation | `instance:deploy` | Same permission as approve — both close out a proposal. |
| `abortDeployment` | Mutation | `instance:deploy`, `instance:plan`, or `instance:decommission` | Permission mirrors the deployment's original action: `PROVISION` → `instance:deploy`, `PLAN` → `instance:plan`, `DECOMMISSION` → `instance:decommission`. Only `PENDING`, `APPROVED`, or `RUNNING` deployments are abortable — use `rejectDeployment` to discard a `PROPOSED` deployment. |

## Deployment

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `deployments` | Query | *visibility-filtered* | |
| `deployment` | Query | `project:view` | |
| `compareDeployments` | Query | `project:view` (both deployments' projects) | Source and target need not be on the same instance. |

## Instance Alarm

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `instanceAlarms` | Query | *visibility-filtered* | |
| `instanceAlarm` | Query | `project:view` | |
| `createInstanceAlarm` | Mutation | `environment:update` | Alarms attach to an instance but the gate is on the surrounding environment. A deployment subject that owns the underlying instance is also allowed. |
| `updateInstanceAlarm` | Mutation | `environment:update` | A deployment subject that owns the underlying instance is also allowed. |
| `deleteInstanceAlarm` | Mutation | `environment:update` | A deployment subject that owns the underlying instance is also allowed. |

## Resource

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `resources` | Query | *visibility-filtered* | Honors group policies on `resource:view` plus project cascade plus grants. |
| `resource` | Query | `resource:view` | |
| `createResource` | Mutation | `resource:import` | Imported resource only; provisioned resources are emitted by deployments. |
| `updateResource` | Mutation | `resource:update` | Imported resource only. |
| `deleteResource` | Mutation | `resource:delete` | Imported resource only. |
| `exportResource` | Mutation | `resource:export` | Returns the unmasked sensitive payload; recorded in the audit log. |

## Resource Type

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `resourceTypes` | Query | *no explicit gate* | Available to any authenticated member. |
| `resourceType` | Query | *no explicit gate* | |
| `publishResourceType` | Mutation | `organization:manage` | Deprecated bridge from V0 `publishArtifactDefinition`. Dedicated resource type permissions are coming when resource types move to OCI-hosted distribution. |
| `deleteResourceType` | Mutation | `organization:manage` | Deprecated bridge from V0 `deleteArtifactDefinition`. Dedicated resource type permissions are coming when resource types move to OCI-hosted distribution. |

## OCI Repo / Bundle

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `ociRepos` | Query | *visibility-filtered* | Union of `repo:view` policies and matching grants. |
| `ociRepo` | Query | `repo:view` | |
| `bundles` | Query | *visibility-filtered* | |
| `bundle` | Query | `repo:view` | |
| `createOciRepo` | Mutation | `repo:create` | Checked against the proposed OCI repo's attributes (including `md-repo`). |
| `updateOciRepo` | Mutation | `repo:update` | |
| `deleteOciRepo` | Mutation | `repo:delete` | Repo must have no published bundle versions. |

## Grant

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `createRepoGrant` | Mutation | `repo:grant` | On the source repo. |
| `createResourceGrant` | Mutation | `resource:grant` | On the source resource. |
| `deleteGrant` | Mutation | `repo:grant` *or* `resource:grant` | Dispatch on grant kind: `repo:grant` for repo-source grants, `resource:grant` for resource-source grants. |

There is no `updateGrant` — grants are immutable; delete and re-create to change `recipient_conditions` or `action`.

## Group

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `groups` | Query | *visibility-filtered* | |
| `group` | Query | `group:view` | |
| `createGroup` | Mutation | `organization:manage` | Org-level: only managers can create groups. |
| `updateGroup` | Mutation | `group:manage` | |
| `deleteGroup` | Mutation | `group:manage` | |
| `addAccountToGroup` | Mutation | `group:manage` | |
| `deleteGroupMember` | Mutation | `group:manage` | |
| `addServiceAccountToGroup` | Mutation | `group:manage` | |
| `removeServiceAccountFromGroup` | Mutation | `group:manage` | |
| `deleteGroupInvitation` | Mutation | `group:manage` | |

## Policy

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `policyEntities` | Query | *no explicit gate* | Catalog of entity types that can carry policies. |
| `policyActions` | Query | *no explicit gate* | Catalog of available actions. |
| `evaluatePolicy` | Query | *no explicit gate* | Evaluation runs against the caller's own effective permissions. |
| `evaluatePolicies` | Query | *no explicit gate* | Batched form of `evaluatePolicy`. |
| `explainPolicy` | Query | `organization:view` | Renders a policy spec (same shape as `createGroupPolicy` input) as plain-English sentences. Does not require the policy to exist. |
| `createGroupPolicy` | Mutation | `group:manage` | Policies attach to groups. |
| `updatePolicy` | Mutation | `group:manage` | |
| `deletePolicy` | Mutation | `group:manage` | |

## Custom Attribute

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `customAttributeSchema` | Query | *no explicit gate* | Schema is org-public. |
| `customAttributeValues` | Query | *no explicit gate* | |
| `createCustomAttribute` | Mutation | `organization:manage` | |
| `updateCustomAttribute` | Mutation | `organization:manage` | |
| `deleteCustomAttribute` | Mutation | `organization:manage` | |

## Organization

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `organization` | Query | `organization:view` | Public profile fields require only `organization:view` (granted implicitly to every member). Sensitive subfields (`members`, `billing`, `customAttributes`) require `organization:manage` and resolve to `null` with a top-level `FORBIDDEN` error otherwise. |
| `createOrganization` | Mutation | *authenticated only* | Caller becomes the org's first owner; no ABAC permission since the org doesn't exist yet. |
| `updateOrganization` | Mutation | `organization:manage` | |
| `setOrganizationLogo` | Mutation | `organization:manage` | |
| `removeOrganizationLogo` | Mutation | `organization:manage` | |
| `deleteOrganizationMember` | Mutation | `organization:manage` | |

## Service Account

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `serviceAccounts` | Query | `organization:manage` | Service accounts are only listable by org managers. |
| `serviceAccount` | Query | `organization:manage` | |
| `createServiceAccount` | Mutation | `organization:manage` | |
| `updateServiceAccount` | Mutation | `organization:manage` | |
| `deleteServiceAccount` | Mutation | `organization:manage` | |

## Access Token

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `accessTokens` | Query | `organization:view` | Only your own tokens — admins cannot list other principals' tokens. |
| `createAccessToken` | Mutation | `organization:view` | Issues a token for the calling subject. |
| `revokeAccessToken` | Mutation | *owner-only* | Owner-scoped: only the token's owning subject can revoke; admins cannot revoke another user's personal tokens. |

## Integration

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `integrations` | Query | `organization:view` | |
| `integration` | Query | `organization:view` | |
| `integrationTypes` | Query | *no explicit gate* | |
| `createIntegration` | Mutation | `organization:manage` | |
| `enableIntegration` | Mutation | `organization:manage` | |
| `disableIntegration` | Mutation | `organization:manage` | |
| `deleteIntegration` | Mutation | `organization:manage` | |

## Audit Log

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `auditLogs` | Query | `organization:view` | Returns only entries the caller is allowed to see — `organization:manage` widens the result set. |
| `auditLog` | Query | `organization:view` | |
| `auditLogEventTypes` | Query | *no explicit gate* | Catalog query. |

## Event Catalog

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `eventTypes` | Query | *no explicit gate* | Static catalog of event identifiers. |

## Subscriptions

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `organizationEvents` | Subscription | `organization:view` | |
| `projectEvents` | Subscription | `project:view` | |
| `environmentEvents` | Subscription | `project:view` | Inherits the surrounding project's view permission. |
| `instanceEvents` | Subscription | `project:view` | |
| `deploymentEvents` | Subscription | `project:view` | |
| `deploymentLogs` | Subscription | `project:view` | Streams log lines for a single deployment. |

## Viewer (Self-context)

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `viewer` | Query | *authenticated only* | Returns the current account or service account. No ABAC check. |
| `acceptGroupInvite` | Mutation | *invitation-scoped* | Caller must be the invite's recipient. |
| `setAccountAvatar` | Mutation | *self-only* | Edits your own profile. |
| `removeAccountAvatar` | Mutation | *self-only* | |

## Server

| Operation | Type | Required permission(s) | Notes |
|---|---|---|---|
| `server` | Query | *unauthenticated* | Public endpoint exposing build/version metadata. |

---

## Visibility filtering, in detail

A *visibility-filtered* list query is not gated by a single ABAC permission. Instead, the resolver folds in the caller's group policies and any matching grants when building its query, and the result set is whatever the caller can already see through other permissions:

- `projects` returns the union of projects matched by the caller's `project:view` policies.
- `ociRepos` returns repos matched by `repo:view` policies plus repos with grants whose `recipient_conditions` match a project the caller has `project:view` on.
- `resources` returns resources matched by `resource:view` policies plus the project cascade for provisioned resources, plus grants.

The single-entity counterpart (`project`, `ociRepo`, `resource`) explicitly checks the corresponding `:view` permission and returns `not_found` to obscure existence on denial.

## Conventions

- **`forbidden` is masked as `not_found`** for read paths that need to obscure existence (e.g., `project`, `environment`). Mutations return an explicit `forbidden` error.
- **Proposed-attribute checks** apply to `create*` mutations: the resolver synthesizes the would-be entity's effective attributes (cascaded parent attrs + the entity's own `md-id` and local identifier) and checks ABAC against that map. This lets policies gate creation by name (`md-environment: [dev, staging, prod]`).
- **Org admin bypass** applies everywhere — a member of the `organization:admin` group skips every check on this page.

## See also

- [Access Control (ABAC)](/platform-operations/security/access-control) — the permission and grant model.
- [Service Accounts](/platform-operations/security/service-accounts) — how non-human principals authenticate.
- [GraphQL API Reference](/api/graphql) — the operations themselves.
