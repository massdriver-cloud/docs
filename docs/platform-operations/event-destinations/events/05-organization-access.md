---
id: event-reference-organization-access
slug: /platform-operations/event-destinations/events/organization-access
title: Organization and Access Events
sidebar_label: Organization and access
---

For the fields that every event has, refer to [Event Reference](/platform-operations/event-destinations/events).

The events on this page have no `md-project`, `md-environment`, or other attributes that a destination can select. A destination with **Attributes** never receives them. To select some of these events, use a condition.

## Organization

| Event type | Occurs when |
|---|---|
| `organization.created` | An organization was created. |
| `organization.updated` | The name or settings of an organization changed. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the organization. |
| `identifier` | string | The identifier of the organization, such as `acme`. |
| `name` | string | The name of the organization. |
| `settings` | object or null | The settings of the organization: `default_bundle_access` (`none` or `all_projects`), `naming_convention`, and `default_tags`. |
| `owner_account_id` | UUID | The ID of the person that owns the organization. |
| `created_at`, `updated_at` | time | |

### `data.attributes`

`md-id`, the identifier of the organization.

### Example conditions

| To send | Events | Condition |
|---|---|---|
| Updates that leave a naming convention set | `organization.updated` | `.data.entity.settings.naming_convention != null` |
| Updates that give new projects access to every bundle | `organization.updated` | `.data.entity.settings.default_bundle_access == "all_projects"` |

## Access token

| Event type | Occurs when |
|---|---|
| `access_token.created` | An access token was issued to a person or a service account. |
| `access_token.revoked` | An access token was revoked. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the access token. |
| `name` | string | The name of the access token. |
| `token_prefix` | string | The first characters of the token, to identify it. |
| `scopes` | list of strings | The scopes of the token. |
| `expires_at` | time | When the token expires. |
| `last_used_at` | time or null | When the token was last used. |
| `revoked_at` | time or null | When the token was revoked. |
| `account_id` | UUID or null | The person that the token belongs to. |
| `service_account_id` | UUID or null | The service account that the token belongs to. |
| `organization_id` | UUID | The ID of the organization. |
| `created_at`, `updated_at` | time | |

### Example conditions

| To send | Events | Condition |
|---|---|---|
| Tokens for service accounts only | `access_token.created` | `.data.entity.service_account_id != null` |
| Tokens that a person revoked for someone else | `access_token.revoked` | `.data.entity.account_id != .data.actor.account_id` |

## Service account

| Event type | Occurs when |
|---|---|
| `service_account.created` | A service account was created. |
| `service_account.updated` | The name or description of a service account changed. |
| `service_account.deleted` | A service account was deleted. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the service account. |
| `name` | string | The name of the service account. |
| `description` | string or null | The description of the service account. |
| `last_used_at` | time or null | When the service account was last used. |
| `organization_id` | UUID | The ID of the organization. |
| `created_at`, `updated_at` | time | |

### Example conditions

| To send | Events | Condition |
|---|---|---|
| Service accounts with a name that starts with `ci-` | `service_account.*` | `.data.entity.name \| startswith("ci-")` |

## Group

| Event type | Occurs when |
|---|---|
| `group.created` | A group was created. |
| `group.updated` | The name, description, or role of a group changed. |
| `group.deleted` | A group was deleted. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the group. |
| `name` | string | The name of the group. |
| `description` | string or null | The description of the group. |
| `role` | string | `organization.admin` for a group of organization administrators, or `custom`. |
| `scim_external_id` | string or null | The ID of the group in your identity provider, when SCIM manages the group. |
| `organization_id` | UUID | The ID of the organization. |
| `created_at`, `updated_at` | time | |

### `data.attributes`

`md-id`, the ID of the group.

### Example conditions

| To send | Events | Condition |
|---|---|---|
| Changes to administrator groups | `group.*` | `.data.entity.role == "organization.admin"` |
| Groups that a person changed, not SCIM | `group.*` | `.data.entity.scim_external_id == null` |

## Group membership

| Event type | Occurs when |
|---|---|
| `group_membership.added` | A person or a service account was added to a group. |
| `group_membership.removed` | A person or a service account was removed from a group. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the membership. |
| `group_id` | UUID | The ID of the group. |
| `group_name` | string | The name of the group. |
| `account_id` | UUID | For a person: the ID of the person. |
| `account_email` | string | For a person: the email of the person. |
| `account_name` | string | For a person: the first and last name, or the email when the person has neither. |
| `service_account_id` | UUID | For a service account: the ID of the service account. |
| `service_account_name` | string | For a service account: the name of the service account. |
| `created_at`, `updated_at` | time | |

The membership of a person has the `account_*` fields. The membership of a service account has the `service_account_*` fields.

### Example

```json
{
  "type": "group_membership.added",
  "data": {
    "entity": {
      "id": "3e5a7c9b-1d2f-4a6e-8b0c-5d7f9a1c3e62",
      "group_id": "95b33344-c409-4ac4-9a6a-1885d671c01d",
      "group_name": "Platform",
      "account_id": "7d1f0b8e-3c2a-4f5e-9b6d-2a8c4e1f0d3b",
      "account_email": "sam@example.com",
      "account_name": "Sam Lee",
      "created_at": "2026-11-19T15:04:11Z",
      "updated_at": "2026-11-19T15:04:11Z"
    },
    "actor": {
      "account_id": "8d2f4c61-7a0e-4b9d-9c53-1f6a2e8b4d07",
      "name": "Jane Doe",
      "organization_id": "5a2c8e4f-1b7d-4e3a-9c6f-8d0b2a4e6c17"
    },
    "metadata": { "credential": "session" },
    "attributes": {}
  }
}
```

### Example conditions

| To send | Events | Condition |
|---|---|---|
| People added to one group | `group_membership.added` | `.data.entity.group_name == "Platform"` |
| Service accounts added to any group | `group_membership.added` | `.data.entity.service_account_id != null` |
| People from outside your email domain | `group_membership.added` | `.data.entity.account_email != null and (.data.entity.account_email \| endswith("@example.com") \| not)` |

## Group invitation

| Event type | Occurs when |
|---|---|
| `group_invitation.accepted` | A person accepted an invitation to a group. Massdriver records it, so it has no `data.actor`. |
| `group_invitation.revoked` | An invitation was revoked before the person accepted it. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the invitation. |
| `email` | string | The email that the invitation was sent to. |
| `group_id` | UUID | The ID of the group. |
| `created_at`, `updated_at` | time | |

## Custom attribute

| Event type | Occurs when |
|---|---|
| `custom_attribute.created` | A custom attribute key was added to the organization. |
| `custom_attribute.updated` | The allowed values of a custom attribute, or if it is required, changed. |
| `custom_attribute.deleted` | A custom attribute key was removed from the organization. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the custom attribute. |
| `key` | string | The key, such as `team`. |
| `scope` | string | Where the attribute is set: `project`, `environment`, `component`, or `repo`. |
| `required` | boolean | `true` when each entity of the scope must have a value. |
| `values` | list of strings | The allowed values. |
| `organization_id` | UUID | The ID of the organization. |
| `created_at`, `updated_at` | time | |

### Example conditions

| To send | Events | Condition |
|---|---|---|
| Changes to the `team` attribute | `custom_attribute.*` | `.data.entity.key == "team"` |

## Event destination

| Event type | Occurs when |
|---|---|
| `event_destination.created` | A destination was added. |
| `event_destination.updated` | The name, settings, credentials, events, attributes, or condition of a destination changed. |
| `event_destination.paused` | A destination was paused, by a person or because its sends failed for too long. |
| `event_destination.resumed` | A destination was resumed. |
| `event_destination.redelivered` | Failed deliveries of a destination were queued to be sent again. |
| `event_destination.lagging` | The oldest event that waits to be sent to an active destination is older than the lag limit (15 minutes by default). |
| `event_destination.caught_up` | A destination that was lagging is within the lag limit again. |
| `event_destination.deleted` | A destination was deleted. |

### `data.entity`

The entity does not include the settings, credentials, or signing secret of the destination.

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the destination. |
| `name` | string | The name of the destination. |
| `adapter` | string | `http`, `slack`, `service_now`, or `pager_duty`. |
| `status` | string | `active` or `paused`. |
| `event_types` | list of strings | The **Events** of the destination. |
| `attributes` | map | The **Attributes** of the destination. |
| `condition` | string or null | The **Condition** of the destination. |
| `lagging_since` | time or null | When the destination started to lag. With microseconds. |
| `organization_id` | UUID | The ID of the organization. |
| `created_at`, `updated_at` | time | |

### `data.metadata`

On `event_destination.lagging` and `event_destination.caught_up`, `lag_seconds` is the number of seconds since the oldest event that waits to be sent occurred.

### Example conditions

| To send | Events | Condition |
|---|---|---|
| Automatic pauses only | `event_destination.paused` | `.data.actor == null` |
| Lag of more than one hour | `event_destination.lagging` | `.data.metadata.lag_seconds > 3600` |
| Changes to Slack destinations | `event_destination.*` | `.data.entity.adapter == "slack"` |

## Account

Massdriver records `account.registered` when a person signs up. A person does not belong to an organization at sign up, so no destination receives this event.
