---
id: event-reference-projects-environments
slug: /platform-operations/event-destinations/events/projects-environments
title: Project and Environment Events
sidebar_label: Projects and environments
---

For the fields that every event has, refer to [Event Reference](/platform-operations/event-destinations/events).

## Project

| Event type | Occurs when |
|---|---|
| `project.created` | A project was created. |
| `project.updated` | The name or description of a project changed. |
| `project.deleted` | A project was deleted. |
| `project.cloned` | A project was cloned. The entity is the new project. Massdriver records no component or link events for the clone. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the project. |
| `identifier` | string | The identifier of the project, such as `api`. |
| `name` | string | The name of the project. |
| `description` | string or null | The description of the project. |
| `tags` | map | The tags of the project. |
| `attributes` | map | The custom attributes set on the project. |
| `organization_id` | UUID | The ID of the organization. |
| `created_at`, `updated_at` | time | |

### `data.attributes`

`md-project`, the custom attributes of the project, and `md-id`, the identifier of the project.

### Example conditions

| To send | Events | Condition |
|---|---|---|
| Projects that have no description | `project.created` | `(.data.entity.description // "") == ""` |
| Projects with a name that starts with `sandbox-` | `project.*` | `.data.entity.name \| startswith("sandbox-")` |

## Environment

| Event type | Occurs when |
|---|---|
| `environment.created` | An environment was created in a project. |
| `environment.updated` | The name, description, or settings of an environment changed. |
| `environment.deleted` | An environment was deleted. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the environment. |
| `identifier` | string | The full identifier of the environment, such as `api-prod`. |
| `name` | string | The name of the environment. |
| `description` | string or null | The description of the environment. |
| `decommission_protection` | boolean | `true` when Massdriver blocks decommissions in the environment. |
| `separation_of_duty` | boolean | `true` when the person or service account that proposes a deployment cannot approve it. |
| `parent_environment_id` | UUID or null | The ID of the environment that this environment was forked from. `null` when it is not a fork. |
| `tags` | map | The tags of the environment. |
| `attributes` | map | The custom attributes set on the environment. |
| `project_id` | UUID | The ID of the project. |
| `created_at`, `updated_at` | time | |

### `data.attributes`

`md-project`, `md-environment` (the last part of the identifier, such as `prod`), the custom attributes of the environment, and `md-id`, the full identifier of the environment.

### Example

```json
{
  "type": "environment.created",
  "data": {
    "entity": {
      "id": "2b7e4d1a-6c3f-4e8b-9a5d-0f1c2e3d4b6a",
      "identifier": "api-pr42",
      "name": "PR 42",
      "description": null,
      "decommission_protection": false,
      "separation_of_duty": false,
      "parent_environment_id": "7f3a1c9e-2d4b-4e6a-8c1f-5b0d3e7a9c24",
      "tags": {},
      "attributes": {},
      "project_id": "1a9d6e3f-4b2c-4d7e-8f0a-6c5b3e2d1f90",
      "created_at": "2026-11-19T15:04:11Z",
      "updated_at": "2026-11-19T15:04:11Z"
    },
    "actor": {
      "service_account_id": "c3e9a7b2-5d1f-4a8e-b6c0-9f2d4e7a1b85",
      "name": "github-actions",
      "organization_id": "5a2c8e4f-1b7d-4e3a-9c6f-8d0b2a4e6c17"
    },
    "metadata": { "credential": "service_account" },
    "attributes": { "md-id": "api-pr42", "md-project": "api", "md-environment": "pr42" }
  }
}
```

### Example conditions

| To send | Events | Condition |
|---|---|---|
| Forked environments only | `environment.created` | `.data.entity.parent_environment_id != null` |
| Environments where decommission protection is off | `environment.updated` | `.data.entity.decommission_protection == false` |
| Preview environments that a person deletes | `environment.deleted` | `(.data.attributes["md-environment"] \| startswith("pr")) and .data.actor.account_id != null` |

## Environment default

An environment default is a resource, such as a cloud credential or a network, that fills the dependencies of that resource type in every instance of an environment.

| Event type | Occurs when |
|---|---|
| `environment_default.created` | A resource was set as an environment default. |
| `environment_default.deleted` | A resource was removed from the defaults of an environment. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the environment default. |
| `environment_id` | UUID | The ID of the environment. |
| `resource_id` | UUID | The ID of the resource. |
| `resource_type_id` | UUID | The ID of the resource type. |
| `created_at`, `updated_at` | time | |

Environment default events have no attributes.

### Example conditions

| To send | Events | Condition |
|---|---|---|
| Changes to the defaults of one environment | `environment_default.*` | `.data.entity.environment_id == "2b7e4d1a-6c3f-4e8b-9a5d-0f1c2e3d4b6a"` |

## Component

A component is a bundle on the project blueprint. Each environment of the project has one instance of the component.

| Event type | Occurs when |
|---|---|
| `component.created` | A component was added to a project. |
| `component.updated` | The name, position, bundle, or parameters of a component changed. |
| `component.deleted` | A component was deleted, with its instances. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the component. |
| `identifier` | string | The full identifier of the component, such as `api-database`. |
| `name` | string | The name of the component. |
| `description` | string or null | The description of the component. |
| `suffix` | string | A random 4-character value that Massdriver adds to cloud resource names. |
| `position` | object or null | The position of the component on the blueprint: `x` and `y`. |
| `tags` | map | The tags of the component. |
| `attributes` | map | The custom attributes set on the component. |
| `project_id` | UUID | The ID of the project. |
| `repo_id` | UUID | The ID of the bundle repository. |
| `created_at`, `updated_at` | time | |

### `data.attributes`

`md-project`, `md-component` (the last part of the identifier, such as `database`), `md-repo`, the custom attributes of the component, and `md-id`, the full identifier of the component.

### Example conditions

| To send | Events | Condition |
|---|---|---|
| Components of one bundle | `component.created` | `.data.attributes["md-repo"] == "aws-rds-postgres"` |
| Components with no `team` attribute | `component.created` | `.data.attributes.team == null` |

## Link

A link is a line between two components on the project blueprint. It connects a resource of one component to a dependency of the other.

| Event type | Occurs when |
|---|---|
| `link.created` | A link was drawn. |
| `link.deleted` | A link was removed. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the link. |
| `from_component_id` | UUID | The ID of the component that has the resource. |
| `from_field` | string | The name of the resource on that component. |
| `to_component_id` | UUID | The ID of the component that has the dependency. |
| `to_field` | string | The name of the dependency on that component. |
| `from_version_constraint` | string or null | The versions of the source bundle that the link works with. |
| `to_version_constraint` | string or null | The versions of the destination bundle that the link works with. |
| `created_at`, `updated_at` | time | |

Link events have no attributes.

### Example conditions

| To send | Events | Condition |
|---|---|---|
| Links that change a network dependency | `link.*` | `.data.entity.to_field == "network"` |

## Secret

A secret is a value that you set on an instance. The event never includes the value.

| Event type | Occurs when |
|---|---|
| `secret.set` | A secret was set on an instance. |
| `secret.unset` | A secret was removed from an instance. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the secret. |
| `name` | string | The name of the secret, such as `DB_PASSWORD`. |
| `instance_id` | UUID | The ID of the instance. |
| `created_at`, `updated_at` | time | |

Secret events have no attributes. To select one instance, use `instance_id`.

### Example conditions

| To send | Events | Condition |
|---|---|---|
| Changes to secrets with names that end in `_PASSWORD` | `secret.*` | `.data.entity.name \| endswith("_PASSWORD")` |
| Secrets set with the CLI or a script | `secret.set` | `.data.metadata.credential == "access_token"` |

## Stash entry

A [stash](/guides/stash) entry is a key and a value on a project, environment, component, instance, or deployment.

| Event type | Occurs when |
|---|---|
| `stash_entry.set` | A stash entry was set. |
| `stash_entry.deleted` | A stash entry was deleted. An entry that expires sends no event. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the entry. |
| `key` | string | The key, such as `md/v1/health`. |
| `label` | string or null | The label of the entry. |
| `format` | string | `text` or `json`. |
| `immutable` | boolean | `true` when the key cannot be set again until the entry expires or is deleted. |
| `sensitive` | boolean | `true` when the value is encrypted. |
| `expires_at` | time or null | When the entry expires. `null` when it has no TTL. |
| `scope` | object | The entity that holds the entry. `kind` is `project`, `environment`, `component`, `instance`, or `deployment`. `id` is its identifier, or its ID for a deployment. |
| `value` | string or null | The value. `null` when the entry is sensitive. |
| `data` | object or null | The value parsed as JSON, for a `json` entry. `null` when the entry is sensitive. |
| `updated_at` | time | |

### `data.attributes`

The attributes of the entity that holds the entry. For a deployment's entry, the attributes of the deployment.

### Example

```json
{
  "type": "stash_entry.set",
  "data": {
    "entity": {
      "id": "9e4c2a7b-1d3f-4b6e-8a0c-5f2d7b9e1c34",
      "key": "md/v1/health",
      "label": "Health",
      "format": "text",
      "immutable": false,
      "sensitive": false,
      "expires_at": "2026-11-24T06:54:03Z",
      "updated_at": "2026-11-24T06:44:03Z",
      "scope": { "kind": "instance", "id": "api-prod-database" },
      "value": "degraded",
      "data": null
    },
    "actor": {
      "service_account_id": "c3e9a7b2-5d1f-4a8e-b6c0-9f2d4e7a1b85",
      "name": "stash-sync",
      "organization_id": "5a2c8e4f-1b7d-4e3a-9c6f-8d0b2a4e6c17"
    },
    "metadata": { "credential": "service_account" },
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
| Health changes to `down` | `stash_entry.set` | `.data.entity.key == "md/v1/health" and .data.entity.value == "down"` |
| Banners in production | `stash_entry.set` | `.data.entity.key == "md/v1/banner" and .data.attributes["md-environment"] == "prod"` |
| Entries deleted by a person | `stash_entry.deleted` | `.data.actor.account_id != null` |
