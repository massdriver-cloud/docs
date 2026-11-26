---
id: event-reference-deployments-instances
slug: /platform-operations/event-destinations/events/deployments-instances
title: Deployment and Instance Events
sidebar_label: Deployments and instances
---

For the fields that every event has, refer to [Event Reference](/platform-operations/event-destinations/events).

## Deployment

A deployment provisions, plans, or decommissions one instance.

| Event type | Occurs when |
|---|---|
| `deployment.created` | A deployment was created for an instance. |
| `deployment.proposed` | A deployment was proposed for approval. It does not run until someone approves it. |
| `deployment.approved` | A proposed deployment was approved. |
| `deployment.rejected` | A proposed deployment was rejected. It does not run. |
| `deployment.enqueued` | The deployment queue accepted the deployment. It waits for a runner. |
| `deployment.started` | A runner started the deployment. |
| `deployment.completed` | The deployment finished successfully. |
| `deployment.failed` | The deployment failed. |
| `deployment.aborted` | The deployment was stopped before it finished. |

Massdriver records `deployment.enqueued`, `deployment.started`, `deployment.completed`, and `deployment.failed` on its own. These events have no `data.actor`, and their `credential` is `system`. To select deployments by who started them, use `deployed_by_account_id`, `deployed_by_service_account_id`, or `deployed_by_name` in `data.entity`.

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the deployment. |
| `status` | string | `PROPOSED`, `APPROVED`, `REJECTED`, `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, or `ABORTED`. |
| `action` | string | `PROVISION`, `PLAN`, or `DECOMMISSION`. |
| `version` | string | The bundle version that the deployment uses, such as `1.4.2`. |
| `message` | string or null | The message that the person or service account gave the deployment. |
| `tags` | map | The tags of the deployment. |
| `deployed_by_name` | string | The name of the person or service account that started the deployment. |
| `deployed_by_account_id` | UUID or null | The person that started the deployment. |
| `deployed_by_service_account_id` | UUID or null | The service account that started the deployment. |
| `instance_id` | UUID | The ID of the instance. |
| `bundle_id` | UUID | The ID of the bundle version. |
| `rollback_of_deployment_id` | UUID or null | The deployment that this deployment rolls back. `null` when it is not a rollback. |
| `last_transitioned_at` | time or null | When `status` last changed. |
| `logs_compacted_at` | time or null | When Massdriver compacted the logs of the deployment. |
| `created_at`, `updated_at` | time | With microseconds. |

The event does not include the parameters of the deployment.

### `data.metadata`

`deployment_action`: the same value as `data.entity.action`.

### `data.attributes`

`md-project`, `md-environment`, `md-component`, `md-instance`, `md-repo`, `md-bundle`, the custom attributes of the instance, and `md-id`, the ID of the deployment.

### Example

```json
{
  "type": "deployment.failed",
  "data": {
    "entity": {
      "id": "5c1de0a7-92b4-4f1e-8d3a-6e27c9f0b815",
      "status": "FAILED",
      "action": "PROVISION",
      "version": "1.4.2",
      "message": "Bump the instance size",
      "tags": {},
      "deployed_by_name": "github-actions",
      "deployed_by_account_id": null,
      "deployed_by_service_account_id": "c3e9a7b2-5d1f-4a8e-b6c0-9f2d4e7a1b85",
      "instance_id": "e4a7b2c9-15d3-4f86-a0b1-9c3e5d7f2a68",
      "bundle_id": "3f9a6c1e-8b2d-4e7a-b5c4-0d1e2f3a4b5c",
      "rollback_of_deployment_id": null,
      "last_transitioned_at": "2026-11-19T15:04:11Z",
      "logs_compacted_at": null,
      "created_at": "2026-11-19T14:58:02.104371Z",
      "updated_at": "2026-11-19T15:04:11.471205Z"
    },
    "metadata": { "credential": "system", "deployment_action": "PROVISION" },
    "attributes": {
      "md-id": "5c1de0a7-92b4-4f1e-8d3a-6e27c9f0b815",
      "md-project": "api",
      "md-environment": "prod",
      "md-component": "database",
      "md-instance": "api-prod-database",
      "md-repo": "aws-rds-postgres",
      "md-bundle": "aws-rds-postgres@1.4.2"
    }
  }
}
```

### Example conditions

| To send | Events | Condition |
|---|---|---|
| Deployments that a service account started | `deployment.completed`, `deployment.failed` | `.data.entity.deployed_by_service_account_id != null` |
| Decommissions only | `deployment.completed` | `.data.entity.action == "DECOMMISSION"` |
| Rollbacks only | `deployment.created` | `.data.entity.rollback_of_deployment_id != null` |
| Deployments that are not plans | `deployment.*` | `.data.metadata.deployment_action != "PLAN"` |
| Deployments of a major version 2 bundle | `deployment.completed` | `.data.entity.version \| startswith("2.")` |
| Deployments with a message that names a ticket | `deployment.created` | `.data.entity.message // "" \| test("JIRA-[0-9]+")` |

## Instance

An instance is a component in one environment.

| Event type | Occurs when |
|---|---|
| `instance.created` | An instance was created: its component was added to an environment, or an environment was created or forked. |
| `instance.updated` | The version or release strategy of an instance changed. |
| `instance.deleted` | An instance was deleted. |
| `instance.orphaned` | An instance was orphaned with `orphanInstance`. |
| `instance.moved` | An instance moved to an environment in another project. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the instance. |
| `identifier` | string | The identifier of the instance, such as `api-prod-database`. |
| `status` | string | `INITIALIZED`, `PROVISIONED`, `DECOMMISSIONED`, or `FAILED`. |
| `version` | string | The version constraint of the instance, such as `1.2.3` or `~1.2`. |
| `release_strategy` | string | `stable`, or `development` when the instance uses development versions. |
| `params` | map or null | The parameters of the instance. |
| `name_prefix` | string or null | The name prefix that the organization's naming convention gave the instance. |
| `tags` | map | The tags of the instance. |
| `attributes` | map | The custom attributes set on the instance. |
| `component_id` | UUID | The ID of the component. |
| `environment_id` | UUID | The ID of the environment. |
| `bundle_id` | UUID | The ID of the bundle version. |
| `previous_identifier` | string | Only on `instance.moved`: the identifier of the instance before the move. |
| `created_at`, `updated_at` | time | |

### `data.attributes`

`md-project`, `md-environment`, `md-component`, `md-instance`, `md-repo`, `md-bundle`, the custom attributes of the instance, and `md-id`, the identifier of the instance.

### Example

```json
{
  "type": "instance.moved",
  "data": {
    "entity": {
      "id": "e4a7b2c9-15d3-4f86-a0b1-9c3e5d7f2a68",
      "identifier": "api-prod-database",
      "previous_identifier": "web-prod-database",
      "status": "PROVISIONED",
      "version": "~1.4",
      "release_strategy": "stable",
      "params": { "instance_class": "db.r6g.large" },
      "name_prefix": "api-prod-database",
      "tags": {},
      "attributes": {},
      "component_id": "08c33afd-b40a-419b-8c32-5c976a90681e",
      "environment_id": "2b7e4d1a-6c3f-4e8b-9a5d-0f1c2e3d4b6a",
      "bundle_id": "3f9a6c1e-8b2d-4e7a-b5c4-0d1e2f3a4b5c",
      "created_at": "2026-10-02T09:12:44Z",
      "updated_at": "2026-11-19T15:04:11Z"
    },
    "metadata": { "credential": "session" },
    "attributes": {
      "md-id": "api-prod-database",
      "md-project": "api",
      "md-environment": "prod",
      "md-component": "database",
      "md-instance": "api-prod-database",
      "md-repo": "aws-rds-postgres",
      "md-bundle": "aws-rds-postgres@1.4.2"
    }
  }
}
```

### Example conditions

| To send | Events | Condition |
|---|---|---|
| Instances that change to development versions | `instance.updated` | `.data.entity.release_strategy == "development"` |
| Instances that use a pinned version | `instance.updated` | `.data.entity.version \| test("^[0-9]+\\.[0-9]+\\.[0-9]+$")` |
| Instances that leave one project | `instance.moved` | `.data.entity.previous_identifier \| startswith("web-")` |

## Connection

A connection fills a dependency of an instance with a resource of another instance, because of a link on the project blueprint.

| Event type | Occurs when |
|---|---|
| `connection.created` | A link started to fill a dependency of an instance. |
| `connection.deleted` | A link stopped filling a dependency of an instance. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the connection. |
| `to_field` | string | The name of the dependency on the instance. |
| `to_instance_id` | UUID | The ID of the instance that has the dependency. |
| `resource_id` | UUID | The ID of the resource that fills the dependency. |
| `link_id` | UUID or null | The ID of the link. |
| `created_at`, `updated_at` | time | |

Connection events have no attributes and no actor.

### Example conditions

| To send | Events | Condition |
|---|---|---|
| Changes to one dependency of one instance | `connection.*` | `.data.entity.to_instance_id == "e4a7b2c9-15d3-4f86-a0b1-9c3e5d7f2a68" and .data.entity.to_field == "database"` |

## Remote reference

A remote reference fills a dependency of an instance with a resource that you choose.

| Event type | Occurs when |
|---|---|
| `remote_reference.assigned` | A resource was set on a dependency of an instance. |
| `remote_reference.unset` | The resource was removed from the dependency. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the remote reference. |
| `field` | string | The name of the dependency on the instance. |
| `instance_id` | UUID | The ID of the instance. |
| `resource_id` | UUID | The ID of the resource. |
| `created_at`, `updated_at` | time | |

Remote reference events have no attributes.

### Example conditions

| To send | Events | Condition |
|---|---|---|
| Changes to the network of every instance | `remote_reference.*` | `.data.entity.field == "network"` |
