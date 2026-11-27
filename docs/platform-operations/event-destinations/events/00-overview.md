---
id: event-reference
slug: /platform-operations/event-destinations/events
title: Event Reference
sidebar_label: Overview
image: /img/og/event-reference.png
---

Each event has the same [CloudEvent](/platform-operations/event-destinations#the-event) fields. The fields of `data.entity` change with the entity that the event is about. The pages of this section list the fields of each entity, so that you can write a [condition](/platform-operations/event-destinations#choose-events) on them.

| Page | Entities |
|---|---|
| [Deployments and instances](/platform-operations/event-destinations/events/deployments-instances) | `deployment`, `instance`, `connection`, `remote_reference` |
| [Projects and environments](/platform-operations/event-destinations/events/projects-environments) | `project`, `environment`, `environment_default`, `component`, `link`, `secret`, `stash_entry` |
| [Resources and bundles](/platform-operations/event-destinations/events/resources-bundles) | `resource`, `resource_type`, `repo` |
| [Alarms](/platform-operations/event-destinations/events/alarms) | `alarm`, `alarm_state` |
| [Organization and access](/platform-operations/event-destinations/events/organization-access) | `organization`, `account`, `access_token`, `service_account`, `group`, `group_invitation`, `group_membership`, `custom_attribute`, `event_destination` |

The entity is the part of the event type before the period. For example, the entity of `deployment.failed` is `deployment`.

## The fields of every event

A condition gets this object. The `data.entity` object is different for each entity.

```json
{
  "specversion": "1.0",
  "id": "0b6f1e9c-3f4a-4c55-9d0e-8a2f6b1c7d42",
  "source": "https://app.massdriver.cloud",
  "type": "deployment.created",
  "subject": "mri:acme:api:prod:deployment:5c1de0a7-92b4-4f1e-8d3a-6e27c9f0b815",
  "time": "2026-11-19T15:04:11.482913Z",
  "datacontenttype": "application/json",
  "data": {
    "entity": { "id": "5c1de0a7-92b4-4f1e-8d3a-6e27c9f0b815", "status": "PENDING" },
    "actor": {
      "account_id": "8d2f4c61-7a0e-4b9d-9c53-1f6a2e8b4d07",
      "name": "Jane Doe",
      "organization_id": "5a2c8e4f-1b7d-4e3a-9c6f-8d0b2a4e6c17"
    },
    "metadata": { "credential": "session", "deployment_action": "PROVISION" },
    "attributes": { "md-project": "api", "md-environment": "prod", "team": "payments" }
  }
}
```

| Path | Type | Value |
|---|---|---|
| `.type` | string | The event type, such as `deployment.created`. |
| `.subject` | string | The Massdriver resource identifier (MRI) of the entity. |
| `.time` | string | When the event occurred (UTC, ISO 8601). |
| `.data.entity` | object | The entity as it was when the event occurred. Refer to the page of the entity. |
| `.data.actor` | object | Who caused the event. Not present when Massdriver caused the event. |
| `.data.metadata` | object | Facts about the event. |
| `.data.attributes` | object | The attributes of the entity when the event occurred. |

### `data.actor`

| Field | Type | Present when |
|---|---|---|
| `organization_id` | string (UUID) | Always. |
| `name` | string | Always. The name of the person, the name of the service account, or the `deployed_by_name` of the deployment. |
| `account_id` | string (UUID) | A person caused the event, or started the deployment that caused it. |
| `service_account_id` | string (UUID) | A service account caused the event, or started the deployment that caused it. |
| `deployment_id` | string (UUID) | A running deployment caused the event. |

### `data.metadata`

Every event has `credential`. The other fields are on the event types that the table names.

| Field | Type | On | Value |
|---|---|---|---|
| `credential` | string | Every event | How the actor authenticated: `session` (a person signed in to Massdriver), `access_token` (a personal access token, as the CLI uses), `service_account`, `deployment` (a running deployment), or `system` (Massdriver). |
| `access_token_id` | string (UUID) | Every event | The access token that the actor used. Present only when `credential` is `access_token`. |
| `deployment_action` | string | `deployment.*` | `PROVISION`, `PLAN`, or `DECOMMISSION`. |
| `contains_secrets` | boolean | `resource.exported` | `true` when the export revealed a value of a field that the resource type marks as sensitive. |
| `lag_seconds` | integer | `event_destination.lagging`, `event_destination.caught_up` | The number of seconds since the oldest event that waits to be sent to the destination occurred. |

### `data.attributes`

The custom attributes of the entity, such as `team`, and the system attributes (`md-*`). Refer to [Attribute keys](/platform-operations/event-destinations#attribute-keys). Each entity page lists the system attributes of its entities. `md-id` is the identifier of the entity itself.

## Value types

| Type | Example |
|---|---|
| UUID | `"5c1de0a7-92b4-4f1e-8d3a-6e27c9f0b815"` |
| Time | `"2026-11-19T15:04:11Z"`. Some times also have microseconds, such as `"2026-11-19T15:04:11.482913Z"`. Compare times as strings only when they have the same format. |
| Enum | An uppercase or lowercase string, as each field lists. For example, deployment `status` is `"FAILED"` and instance `release_strategy` is `"stable"`. |
| Map | A JSON object. `tags` and `attributes` hold string values. |

A field that has no value is `null`. It is not removed from the entity.

## Write a condition

A condition is a [jq](https://jqlang.org/manual/) expression. Massdriver sends the event only when the condition outputs `true`. Any other output, such as `false` or `null`, skips the event.

### Compare a field

```jq
.data.entity.status == "FAILED"
```

### Match one of many values

```jq
.data.attributes["md-environment"] | IN("prod", "staging")
```

### Match the start of a value, or a pattern

```jq
.data.attributes["md-bundle"] // "" | startswith("aws-")
```

```jq
.data.entity.name // "" | test("^prod-")
```

### Use a field that some events do not have

A path to a field that does not exist outputs `null`. Use `//` to give a default value, so that a function such as `startswith` gets a string.

```jq
(.data.metadata.contains_secrets // false) == true
```

### Apply a test to one event type only

When a destination selects more than one event type, use `.type` to apply a test to one of them and pass the others.

```jq
.type != "deployment.completed" or .data.metadata.deployment_action != "PLAN"
```

### Select events by who caused them

```jq
.data.actor.service_account_id != null
```

```jq
.data.metadata.credential == "session"
```

```jq
.data.actor.name == "github-actions"
```

### Select events that Massdriver caused

```jq
.data.actor == null
```

### Check a custom attribute

```jq
.data.attributes.team == "payments"
```

Use `["..."]` for keys with a `-`, such as `.data.attributes["md-project"]`.

## Check a condition

To see the recent events that a condition passes before you save it, use the event preview in the UI, [`previewEventDestination`](/api/graphql/operations/queries/preview-event-destination), or the CLI:

```bash
mass event destination preview \
  --event-type 'deployment.*' \
  --condition '.data.entity.status == "FAILED"'
```

To see the full event of a recent event, query [`auditLogs`](/api/graphql/operations/queries/audit-logs) and read its `data`.
