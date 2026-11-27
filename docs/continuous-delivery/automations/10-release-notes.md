---
id: automation-release-notes
slug: /continuous-delivery/automations/release-notes
title: release-notes
sidebar_label: release-notes
description: Post new bundle versions, and the instances that can upgrade, to Slack and Teams.
image: /img/og/automation-release-notes.png
---

When a new bundle version is published, post it to Slack, Microsoft Teams, or both. The message has:

- the bundle name and version
- the changelog of that version, when the publisher included one
- the instances that can upgrade to it, by project and environment, with the version each one is on
- the instances on a release channel, such as `~1` or `latest`, that Massdriver moves to the new version and
  deploys, with the version each one has deployed

An instance is listed only when it is `PROVISIONED` or `FAILED`. An instance can upgrade when its
`availableUpgrade` is the new version.

Development versions, such as `1.3.1-dev.20261124T055403Z`, are skipped. Set `INCLUDE_DEVELOPMENT=true` to post
them.

## Configuration

| Variable | Default | |
|---|---|---|
| `MASSDRIVER_ORGANIZATION_ID` | | Required. Your organization's identifier. |
| `MASSDRIVER_API_KEY` | | Required. An `md_` access token of a service account. |
| `MASSDRIVER_SIGNING_SECRET` | | Required. The `whsec_` signing secret of the event destination. |
| `SLACK_WEBHOOK_URL` | | A Slack [incoming webhook](https://api.slack.com/messaging/webhooks) URL. |
| `TEAMS_WEBHOOK_URL` | | A Microsoft Teams Workflows webhook URL, from the "Post to a channel when a webhook request is received" template. |
| `INCLUDE_DEVELOPMENT` | `false` | `true` posts development versions too. |
| `MASSDRIVER_URL` | `https://api.massdriver.cloud` | The URL of your Massdriver installation. |
| `PORT` | `8080` | |

Set `SLACK_WEBHOOK_URL`, `TEAMS_WEBHOOK_URL`, or both.

The service account needs `repo:view` on the bundle repositories, and view access to the projects whose
instances you want listed. Instances in projects it cannot view are left out.

## Event destination

```bash
mass event destination create \
  --name release-notes \
  --url https://automations.example.com/hooks/massdriver \
  --event-type repo.published \
  --attribute md-repo-artifact-type=bundle
```

To post only some bundles, add a condition, such as
`--condition '.data.entity.name | startswith("aws-")'`.

Copy the signing secret from the destination into `MASSDRIVER_SIGNING_SECRET`.

## Run

```bash
docker run -p 8080:8080 \
  -e MASSDRIVER_ORGANIZATION_ID=acme \
  -e MASSDRIVER_API_KEY=md_... \
  -e MASSDRIVER_SIGNING_SECRET=whsec_... \
  -e SLACK_WEBHOOK_URL=https://hooks.slack.com/services/... \
  massdrivercloud/massdriver-automations:latest run release-notes
```

## Limits

- The `repo.published` event names the repository, not the version. The automation posts the newest version
  that was published at or before the time of the event. The event also has no way to tell a development
  version apart, so the destination cannot skip them with a condition. The automation skips them.
- Each version is posted once while the automation runs, in memory. Run one replica.
- The automation responds before it posts. A failed post is logged, and Massdriver does not send the event again.
- Slack shows the first 2,900 characters of the changelog and of each instance list.
- Slack and Teams do not show Markdown headings. The automation shows them in bold.
