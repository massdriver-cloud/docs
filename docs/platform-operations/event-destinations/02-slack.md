---
id: event-destinations-slack
slug: /platform-operations/event-destinations/slack
title: Slack Event Destinations
sidebar_label: Slack
---

The `SLACK` adapter posts each event to a Slack channel as a message. Massdriver posts with the bot token of a Slack app that you make in your Slack workspace.

For the events that a destination receives, retries, deliveries, and pause, refer to [Event Destinations](/platform-operations/event-destinations).

## Settings

| Object | Field | Value |
|---|---|---|
| `config` | `channel` | The ID of the Slack channel, such as `C0123456789`. Required. |
| `auth` | `token` | The bot token of your Slack app. It starts with `xoxb-`. Required. |

Slack destinations do not have a signing secret.

## Make a Slack app

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and click **Create New App**. Select **From scratch**.
2. Enter a name, such as `Massdriver`, and select your workspace. Click **Create App**.
3. Go to **OAuth & Permissions**. Under **Bot Token Scopes**, add these scopes:
   - `chat:write`, to post messages.
   - `chat:write.public`, to post to public channels that the app has not joined. Without it, add the app to each channel.
4. Click **Install to Workspace**, and allow the access.
5. Copy the **Bot User OAuth Token**. It starts with `xoxb-`.

To post to a private channel, add the app to the channel. In the channel, send `/invite @<app name>`.

## Find the channel ID

In Slack, open the channel and click its name. The channel ID is at the bottom of the **About** tab, such as `C0123456789`. Use the ID, not the channel name. The ID does not change when someone renames the channel.

## Add the destination

In the Massdriver UI:

1. Go to **Organization Settings** → **Event destinations**, and click **New destination**.
2. Select **Slack**.
3. Enter a **Name** and the **Channel ID**.
4. Under **Credentials**, enter the **Bot token**.
5. Choose the **Events**. Refer to [Choose events](/platform-operations/event-destinations#choose-events).
6. Click **Create destination**.

With the API, use [`createEventDestination`](/api/graphql/operations/mutations/create-event-destination) with `adapter: SLACK`. Pass `auth` as a variable:

```graphql
mutation CreateEventDestination($auth: Map) {
  createEventDestination(
    organizationId: "my-org"
    input: {
      name: "Failed production deployments"
      adapter: SLACK
      config: "{\"channel\": \"C0123456789\"}"
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
  "auth": "{\"token\": \"xoxb-...\"}"
}
```

## The message

Each message has:

- The event type, such as `deployment.failed`, and what the event type means.
- The **Project**, **Environment**, **Component**, and **Instance** of the entity, from the event's `data.attributes`. The message shows only the ones that the event has.
- The **Status** and **Message** of the entity, when the event has them. For `alarm_state.created`, these are the state of the alarm, such as `ALARM`, and the alarm message. Alarm events have the attributes of the alarm's instance.
- The time of the event and its `id`.
- A **View in Massdriver** button that opens the page of the entity's instance, environment, or project. Events that are not about a project, such as organization events, have no button.

The notification text is the event type and the instance, such as `deployment.failed: api-prod-database`. When the event has no instance, it is the event's `subject`.

| To post | Events | Attributes | Condition |
|---|---|---|---|
| Alarms that fire in production | `alarm_state.created` | `{"md-environment": "prod"}` | `.data.entity.status == "ALARM"` |
| Deployments that fail | `deployment.failed` | (empty) | (empty) |
| Production deployments that complete | `deployment.completed` | `{"md-environment": "prod"}` | (empty) |

## Responses

Slack returns `"ok": false` and an error code for most failures.

| Result | What Massdriver does |
|---|---|
| `"ok": true` | The event is sent. |
| `ratelimited`, `internal_error`, `fatal_error`, `service_unavailable`, or `request_timeout` | Massdriver retries the event. |
| Any other error, such as `channel_not_found`, `not_in_channel`, `invalid_auth`, or `missing_scope` | The event becomes a failed event at once. |
| HTTP `408`, `429`, or `5xx`, no response in 10 seconds, or a connection that cannot be made | Massdriver retries the event. |

The destination's `lastError` field shows the error, for example `Slack channel_not_found`. Refer to [Failures and retries](/platform-operations/event-destinations#failures-and-retries).

| Error | What to do |
|---|---|
| `channel_not_found` | Make sure that the channel ID is correct. For a private channel, add the app to the channel. |
| `not_in_channel` | Add the app to the channel, or add the `chat:write.public` scope and install the app again. |
| `invalid_auth`, `token_revoked`, or `account_inactive` | Copy the bot token again, and update the destination's credentials. |
| `missing_scope` | Add the scope, and install the app again. |
| `is_archived` | Use a channel that is not archived. |

After you repair the problem, [send the failed events again](/platform-operations/event-destinations#send-failed-events-again).
