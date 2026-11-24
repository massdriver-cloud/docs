---
id: event-destinations-servicenow
slug: /platform-operations/event-destinations/servicenow
title: ServiceNow Event Destinations
sidebar_label: ServiceNow
---

The `SERVICE_NOW` adapter creates one record in a ServiceNow table for each event, with the [Table API](https://www.servicenow.com/docs/bundle/latest-api-reference/page/integrate/inbound-rest/concept/c_TableAPI.html). The default table is `incident`.

For the events that a destination receives, retries, deliveries, and pause, refer to [Event Destinations](/platform-operations/event-destinations).

## Settings

| Object | Field | Value |
|---|---|---|
| `config` | `instance` | The name of your instance: `acme` for `https://acme.service-now.com`. Required. |
| `config` | `table` | The table that gets a record for each event. The default is `incident`. The table must have a `correlation_id` field, as `incident` and the other tables that extend `task` have. |
| `config` | `fields` | Field names and values that each record gets, such as `assignment_group` or `urgency`. Each value is a string. |
| `auth` | `username` | A ServiceNow user that can read and create records in the table. It cannot contain `:`. Required. |
| `auth` | `password` | The password of that user. Required. |

Massdriver sends requests only to `https://<instance>.service-now.com`. An instance on a custom domain is not supported.

ServiceNow destinations do not have a signing secret.

## Make a ServiceNow user

1. In ServiceNow, create a user for Massdriver, such as `massdriver`. Select **Web service access only**.
2. Give the user a role that can read and create records in the table. For `incident`, the `itil` role is enough.
3. Set a password for the user.

## Add the destination

In the Massdriver UI:

1. Go to **Organization Settings** → **Event destinations**, and click **New destination**.
2. Select **ServiceNow**.
3. Enter a **Name** and the **Instance**. Optional: enter the **Table** and the **Fields**.
4. Under **Credentials**, enter the **User name** and **Password**.
5. Choose the **Events**. Refer to [Choose events](/platform-operations/event-destinations#choose-events).
6. Click **Create destination**.

With the API, use [`createEventDestination`](/api/graphql/operations/mutations/create-event-destination) with `adapter: SERVICE_NOW`. Pass `auth` as a variable:

```graphql
mutation CreateEventDestination($auth: Map) {
  createEventDestination(
    organizationId: "my-org"
    input: {
      name: "Failed production deployments"
      adapter: SERVICE_NOW
      config: "{\"instance\": \"acme\", \"fields\": {\"assignment_group\": \"Platform\", \"urgency\": \"2\"}}"
      auth: $auth
      eventTypes: ["deployment.failed"]
      attributes: "{\"md-environment\": \"prod\"}"
    }
  ) {
    result { id }
    successful
    messages { field message }
  }
}
```

```json
{
  "auth": "{\"username\": \"massdriver\", \"password\": \"...\"}"
}
```

## Use cases

Each use case is one destination. To send different events with different fields, such as a higher `urgency` for production, make one destination for each set of fields. For the attribute keys, refer to [Attribute keys](/platform-operations/event-destinations#attribute-keys).

### Incidents for failed production deployments

| Setting | Value |
|---|---|
| Events | `deployment.failed`, `deployment.aborted` |
| Attributes | `{"md-environment": "prod"}`. To limit it to one project, add `"md-project": "api"`. To limit it to one bundle, add `"md-repo": "aws-aurora"`. |
| Condition | `.data.metadata.deployment_action != "PLAN"`, to skip failed plans |
| Table | `incident` |
| Fields | `{"assignment_group": "Platform", "urgency": "2", "impact": "2", "category": "software"}` |

### Incidents when a production alarm fires

| Setting | Value |
|---|---|
| Events | `alarm_state.created` |
| Attributes | `{"md-environment": "prod"}`. To limit it to databases, add `"md-component": "database"`. To limit it to one instance, use `"md-instance": "api-prod-database"`. |
| Condition | `.data.entity.status == "ALARM"`, to skip the change back to `OK` |
| Table | `incident` |
| Fields | `{"assignment_group": "Platform", "urgency": "1", "impact": "1"}` |

Massdriver opens a new incident each time an alarm changes to `ALARM`. It does not close the incident when the alarm changes back to `OK`.

### Security review when a secret leaves Massdriver

| Setting | Value |
|---|---|
| Events | `resource.exported` |
| Attributes | (empty). To limit it to production, use `{"md-environment": "prod"}`. |
| Condition | `.data.metadata.contains_secrets == true`. To limit it to IAM roles, add `and (.data.attributes["md-resource-type"] // "" \| startswith("aws-iam-role@"))`. |
| Table | `incident`, or a security table that extends `task` |
| Fields | `{"assignment_group": "Security", "category": "security"}` |

### Access changes for an audit trail

| Setting | Value |
|---|---|
| Events | `access_token.created`, `access_token.revoked`, `service_account.created`, `service_account.deleted`, `group_membership.added`, `group_membership.removed` |
| Attributes | (empty). These events have no attributes, so a destination with **Attributes** never receives them. |
| Condition | (empty) |
| Table | A table that extends `task` and that your security team reviews |
| Fields | `{"assignment_group": "Security"}` |

### A record of each production change

| Setting | Value |
|---|---|
| Events | `deployment.completed` |
| Attributes | `{"md-environment": "prod"}` |
| Condition | `.data.metadata.deployment_action != "PLAN"`. To record only removals, use `.data.metadata.deployment_action == "DECOMMISSION"`. |
| Table | `change_request`, or another table that extends `task` |
| Fields | The fields that your change process requires, such as `category` and `assignment_group` |

Use the [preview](/platform-operations/event-destinations#choose-events) on the destination to see the recent events that a use case selects before you save it.

## Limits

- Massdriver only creates records. It does not update or close a record, for example when an alarm changes back to `OK`.
- The values in `config.fields` are the same for every record of a destination. To use different values, make more than one destination.
- Massdriver does not set `cmdb_ci` from the event. You can set one fixed `cmdb_ci` in `config.fields`.
- The table must have a `correlation_id` field.
- Massdriver uses basic authentication, and sends only to `https://<instance>.service-now.com`.

## The record

| Field | Value |
|---|---|
| `short_description` | A headline that tells what happened, such as `Deploy of api-prod-database failed`. It is the same headline as in a [Slack message](/platform-operations/event-destinations/slack#the-message), without the emoji. At most 160 characters. |
| `description` | The message of the deployment or of the alarm, when the event has one. Then the **Project**, **Environment**, **Component**, **Instance**, and **Status** that the event has, and details such as the bundle version and the person who deployed. Then the time, the event type and `id`, and the `subject`. Last, a link to the page of the entity's instance, environment, or project in Massdriver, when the event is about a project. |
| `correlation_id` | The event `id`. |
| `correlation_display` | `Massdriver` |

The record also gets each field in `config.fields`. If `config.fields` has `short_description`, `description`, `correlation_id`, or `correlation_display`, Massdriver uses its own value.

Before Massdriver creates a record, it looks for a record in the table with the event `id` as `correlation_id`. If one exists, Massdriver does not create a second record. Thus a retry does not make a duplicate record. If the user cannot read the table, ServiceNow returns no records, and a retry can make a duplicate.

## Responses

| Result | What Massdriver does |
|---|---|
| `200` or `201` | The event is sent. |
| `408`, `429`, or `5xx`, no response in 10 seconds, or a connection that cannot be made | Massdriver retries the event. |
| Any other status, such as `401`, `403`, or `404` | The event becomes a failed event at once. |
| A response that is not a Table API result, such as the page of a hibernating instance | The event becomes a failed event at once. |

The destination's `lastError` field shows the status, for example `HTTP 401`. Refer to [Failures and retries](/platform-operations/event-destinations#failures-and-retries).

| Error | What to do |
|---|---|
| `HTTP 401` | Make sure that the user name and password are correct, and update the destination's credentials. |
| `HTTP 403` | Give the user a role that can read and create records in the table. |
| `HTTP 404` | Make sure that the instance name and the table are correct. |

After you repair the problem, [send the failed events again](/platform-operations/event-destinations#send-failed-events-again).
