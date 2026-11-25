---
id: automation-rollback-on-failure
slug: /continuous-delivery/automations/rollback-on-failure
title: rollback-on-failure
sidebar_label: rollback-on-failure
description: Roll an instance back to its last completed deployment when a deployment fails.
---

When a `PROVISION` deployment of an instance with the attribute `autorollback=true` fails, roll the instance back
to its most recent `COMPLETED` `PROVISION` deployment.

The rollback has two steps:

1. `rollbackDeployment` proposes a new `PROVISION` deployment with the bundle version, params, and dependency
   connections of the completed deployment.
2. `approveDeployment` approves the proposal, so it runs.

Refer to [Roll back a deployment](/continuous-delivery/rollback) for what a rollback restores.

The automation skips the event when:

- the failed deployment is itself a rollback. A failed rollback needs a person, so the automation posts a notice
  and stops.
- a deployment of the instance is `PENDING`, `APPROVED`, or `RUNNING`.
- the instance has no `COMPLETED` `PROVISION` deployment.
- a `PROVISION` that started after the failed one has completed.

When the environment has separation of duty turned on, the service account cannot approve its own proposal. The
proposal stays `PROPOSED` for a person to approve, and the notice says so.

## Opt in

Attribute keys must match `^[A-Za-z_][A-Za-z0-9_]{0,63}$`, and a key must be a custom attribute before you set it.
Create a component-scope custom attribute with the key `autorollback` and the values `true` and `false`. Set
**Required** to off, so that components without it stay valid. Then set `autorollback=true` on each component to
roll back. The attribute applies to the instances of the component in every environment.

## Configuration

| Variable | Default | |
|---|---|---|
| `MASSDRIVER_ORGANIZATION_ID` | | Required. Your organization's identifier. |
| `MASSDRIVER_API_KEY` | | Required. An `md_` access token of a service account. |
| `MASSDRIVER_SIGNING_SECRET` | | Required. The `whsec_` signing secret of the event destination. |
| `MASSDRIVER_URL` | `https://api.massdriver.cloud` | The URL of your Massdriver installation. |
| `MASSDRIVER_APP_URL` | `https://app.massdriver.cloud` | The URL of the Massdriver UI, for the links in notices. |
| `AUTO_ROLLBACK_ATTR_KEY` | `autorollback` | The attribute key that opts an instance in. |
| `AUTO_ROLLBACK_ATTR_VALUE` | `true` | The attribute value that opts an instance in. |
| `SLACK_WEBHOOK_URL` | | A Slack incoming webhook. Empty sends notices to the logs only. |
| `PORT` | `8080` | |

The service account needs these permissions on the opted-in instances:

- `instance:propose`, for `rollbackDeployment`
- `instance:deploy`, for `approveDeployment`
- `project:view` on their projects, to read the deployment history

## Event destination

Requires [mass](/reference/cli/overview) 2.6.0 or later.

```bash
mass event destination create \
  --name rollback-on-failure \
  --url https://rollback.example.com/hooks/massdriver \
  --event-type deployment.failed \
  --condition '.data.metadata.deployment_action == "PROVISION" and .data.attributes["autorollback"] == "true"'
```

The condition drops failed `PLAN` and `DECOMMISSION` deployments, and instances that did not opt in, so
Massdriver marks them `SKIPPED` and does not send them. If you change `AUTO_ROLLBACK_ATTR_KEY` or
`AUTO_ROLLBACK_ATTR_VALUE`, change the condition to match. To act on one environment only, add
`--attribute md-environment=prod`.

Copy the signing secret from the destination's **Overview** tab into `MASSDRIVER_SIGNING_SECRET`.

## Run

```bash
docker run -p 8080:8080 \
  -e MASSDRIVER_ORGANIZATION_ID=acme \
  -e MASSDRIVER_API_KEY=md_... \
  -e MASSDRIVER_SIGNING_SECRET=whsec_... \
  -e SLACK_WEBHOOK_URL=https://hooks.slack.com/services/... \
  massdrivercloud/massdriver-automations:latest run rollback-on-failure
```

## Limits

- Duplicate events are dropped by id for one hour, in memory. Run one replica.
- The rollback restores the bundle version, params, and dependency connections of the completed deployment. It
  does not restore data, or changes made outside Massdriver.
- The approval pins the instance to the bundle version of the completed deployment and saves its params on the
  instance. To move forward again, set the instance's version and params.
- When the API call fails, the automation responds `500` and Massdriver retries the event. A retry approves the
  proposal from the earlier attempt instead of proposing a second one.
