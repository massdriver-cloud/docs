---
id: event-destinations-slack
slug: /platform-operations/event-destinations/slack
title: Slack Event Destinations
sidebar_label: Slack
image: /img/og/event-destinations-slack.png
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

- A headline that tells what happened, with an emoji. For example, `⏳ Jane Doe wants to deploy api-prod-database`, `✅ api-prod-database deployed`, or `🔴 High CPU on api-prod-database is in alarm`.
- An **Open in Massdriver** button that opens the page of the entity's instance, environment, or project. Events that are not about a project, such as organization events, have no button.
- A colored bar. Green is for events that went well, such as a completed deployment. Red is for failures, such as a failed deployment or an alarm. Yellow is for events that wait for a person, such as a proposed deployment. Gray is for all other events.
- The message of the deployment or of the alarm, when the event has one.
- Details that the headline does not give, such as the bundle version and the person or service account that caused the event. Then the time of the event, in the time zone of each reader.

| Event | Headline |
|---|---|
| `deployment.proposed` | ⏳ Jane Doe wants to deploy api-prod-database |
| `deployment.approved` | 👍 Deploy of api-prod-database approved |
| `deployment.completed` | ✅ api-prod-database deployed |
| `deployment.failed` | ❌ Deploy of api-prod-database failed |
| `alarm_state.created` | 🔴 High CPU on api-prod-database is in alarm, or 🟢 High CPU on api-prod-database is back to OK |
| `group_membership.added` | 👥 Jane Doe was added to group Platform, or 👥 Service account ci-bot was added to group Platform |
| `resource.exported` | 🔐 The secrets of resource writer were exported, when the export reveals a secret |
| `repo.published` | 🎉 New version of aws-aurora published |

The notification text is the emoji and the headline.

## Use cases

Each use case is one destination, and each destination posts to one channel. To post different events to different channels, make one destination for each channel. For the attribute keys, refer to [Attribute keys](/platform-operations/event-destinations#attribute-keys).

### A team's deployments in the team's channel

| Setting | Value |
|---|---|
| Events | `deployment.completed`, `deployment.failed`, `deployment.aborted` |
| Attributes | `{"md-project": "api"}`. To limit it to production, add `"md-environment": "prod"`. To use a custom attribute, such as a team, use `{"team": "payments"}`. |
| Condition | `.data.metadata.deployment_action != "PLAN"`, to skip plans |

### Production alarms in the on-call channel

| Setting | Value |
|---|---|
| Events | `alarm_state.created` |
| Attributes | `{"md-environment": "prod"}`. To limit it to databases, add `"md-component": "database"`. |
| Condition | `.data.entity.status == "ALARM"`, to skip the change back to `OK`. To post both changes, leave it empty. |

### Deployments that wait for approval

| Setting | Value |
|---|---|
| Events | `deployment.proposed`, `deployment.approved`, `deployment.rejected` |
| Attributes | `{"md-environment": "prod"}` |
| Condition | (empty) |

Reviewers see each proposed deployment, and the **Open in Massdriver** button opens the instance.

### Security events in a security channel

| Setting | Value |
|---|---|
| Events | `resource.exported`, `access_token.created`, `service_account.created`, `group_membership.added` |
| Attributes | (empty). Access token, service account, and group events have no attributes, so a destination with **Attributes** never receives them. |
| Condition | `.type != "resource.exported" or .data.metadata.contains_secrets == true`, to post only the exports that reveal a secret |

### New bundle versions

| Setting | Value |
|---|---|
| Events | `repo.published` |
| Attributes | `{"md-repo": "aws-aurora"}` for one bundle, or empty for every bundle |
| Condition | (empty) |

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
