---
id: event-destinations-pagerduty
slug: /platform-operations/event-destinations/pagerduty
title: PagerDuty Event Destinations
sidebar_label: PagerDuty
image: /img/og/event-destinations-pagerduty.png
---

The `PAGER_DUTY` adapter triggers one PagerDuty alert for each event, with the [Events API v2](https://developer.pagerduty.com/docs/events-api-v2-overview). The alert goes to the service or ruleset of your integration key.

For the events that a destination receives, retries, deliveries, and pause, refer to [Event Destinations](/platform-operations/event-destinations).

## Settings

| Object | Field | Value |
|---|---|---|
| `config` | `severity` | The severity of each alert: `critical`, `error`, `warning`, or `info`. The default is `error`. |
| `auth` | `routing_key` | The integration key of an Events API v2 integration. It has 32 characters. Required. |

The API never returns the integration key.

PagerDuty destinations do not have a signing secret.

## Get an integration key

1. In PagerDuty, go to **Services** → **Service Directory**, and open the service that gets the alerts.
2. On the **Integrations** tab, click **Add an integration**.
3. Select **Events API V2**, and click **Add**.
4. Expand the integration, and copy the **Integration Key**.

You can also use the integration key of an integration on a global ruleset. Ruleset keys start with `R`.

## Add the destination

In the Massdriver UI:

1. Go to **Organization Settings** → **Event destinations**, and click **New destination**.
2. Select **PagerDuty**.
3. Enter a **Name**. Optional: select the **Severity**.
4. Under **Credentials**, enter the **Integration key**.
5. Choose the **Events**. Refer to [Choose events](/platform-operations/event-destinations#choose-events).
6. Click **Create destination**.

With the API, use [`createEventDestination`](/api/graphql/operations/mutations/create-event-destination) with `adapter: PAGER_DUTY`. Pass `auth` as a variable:

```graphql
mutation CreateEventDestination($auth: Map) {
  createEventDestination(
    organizationId: "my-org"
    input: {
      name: "Production alarms"
      adapter: PAGER_DUTY
      config: "{\"severity\": \"critical\"}"
      auth: $auth
      eventTypes: ["alarm_state.created"]
      attributes: "{\"md-environment\": \"prod\"}"
      condition: ".data.entity.status == \"ALARM\""
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
  "auth": "{\"routing_key\": \"e93facc04764012d7bfb002500d5d1a6\"}"
}
```

## Use cases

Each use case is one destination. To send different events with different severities, make one destination for each severity. For the attribute keys, refer to [Attribute keys](/platform-operations/event-destinations#attribute-keys).

### Page when a production alarm fires

| Setting | Value |
|---|---|
| Events | `alarm_state.created` |
| Attributes | `{"md-environment": "prod"}`. To limit it to databases, add `"md-component": "database"`. To limit it to one instance, use `"md-instance": "api-prod-database"`. |
| Condition | `.data.entity.status == "ALARM"`, to skip the change back to `OK` |
| Severity | `critical` |

Massdriver triggers a new alert each time an alarm changes to `ALARM`. It does not resolve the alert when the alarm changes back to `OK`.

### Page when a production deployment fails

| Setting | Value |
|---|---|
| Events | `deployment.failed` |
| Attributes | `{"md-environment": "prod"}`. To limit it to one project, add `"md-project": "api"`. |
| Condition | `.data.metadata.deployment_action != "PLAN"`, to skip failed plans |
| Severity | `error` |

Use the [preview](/platform-operations/event-destinations#choose-events) on the destination to see the recent events that a use case selects before you save it.

## The event that PagerDuty receives

Massdriver sends a `trigger` event to `https://events.pagerduty.com/v2/enqueue`.

| Field | Value |
|---|---|
| `routing_key` | The integration key. |
| `event_action` | `trigger` |
| `dedup_key` | The event `id`. PagerDuty adds a retry of the same event to the first alert, so a retry does not make a second alert. |
| `payload.summary` | A headline that tells what happened, such as `Deploy of api-prod-database failed`. It is the same headline as in a [Slack message](/platform-operations/event-destinations/slack#the-message), without the emoji. At most 1,024 characters. |
| `payload.source` | The instance, such as `api-prod-database`. For an event without an instance, the event `subject`. |
| `payload.severity` | The `severity` of the destination. |
| `payload.timestamp` | The time of the event. |
| `payload.custom_details` | The `Project`, `Environment`, `Component`, `Instance`, and `Status` of the entity, when the event has them. `Details`, such as the bundle version and the person who deployed. `Note`, the message of the deployment or of the alarm. Last, the `Event type` and the `Event ID`. |
| `links` | A link with the text `Open in Massdriver` to the page of the entity's instance, environment, or project, when the event is about a project. |

An example for a failed deployment:

```json
{
  "routing_key": "e93facc04764012d7bfb002500d5d1a6",
  "event_action": "trigger",
  "dedup_key": "4b0b5a8e-0f6c-4a53-9d0c-5a1f4ad5c1c2",
  "payload": {
    "summary": "Deploy of api-prod-database failed",
    "source": "api-prod-database",
    "severity": "critical",
    "timestamp": "2026-11-19T15:04:11.482913Z",
    "custom_details": {
      "Project": "api",
      "Environment": "prod",
      "Component": "database",
      "Instance": "api-prod-database",
      "Status": "FAILED",
      "Details": ["aws-aurora@1.2.3", "by Jane Doe"],
      "Note": "quota exceeded",
      "Event type": "deployment.failed",
      "Event ID": "4b0b5a8e-0f6c-4a53-9d0c-5a1f4ad5c1c2"
    }
  },
  "links": [
    {
      "href": "https://app.massdriver.cloud/orgs/acme/projects/api/environments/prod/instances/database?tab=history&deployment=5c1de0a7-92b4-4f1e-8d3a-6e27c9f0b815",
      "text": "Open in Massdriver"
    }
  ]
}
```

## Limits

- Massdriver only triggers alerts. It does not acknowledge or resolve an alert, for example when an alarm changes back to `OK`.
- The severity is the same for every alert of a destination. To use different severities, make more than one destination.

## Responses

| Result | What Massdriver does |
|---|---|
| `202` | The event is sent. |
| `429` or `5xx`, no response in 10 seconds, or a connection that cannot be made | Massdriver retries the event. |
| `400`, or any other status | The event becomes a failed event at once. |

The destination's `lastError` field shows the status. For a `400`, it also shows the `message` and the `errors` from PagerDuty, in the format `HTTP 400: <message>: <errors>`. Refer to [Failures and retries](/platform-operations/event-destinations#failures-and-retries).

| Error | What to do |
|---|---|
| `HTTP 400` with an error about `routing_key` | Make sure that the integration key is correct, and update the destination's credentials. |
| `HTTP 400` with another error | Read the `errors` text from PagerDuty. |

After you repair the problem, [send the failed events again](/platform-operations/event-destinations#send-failed-events-again).
