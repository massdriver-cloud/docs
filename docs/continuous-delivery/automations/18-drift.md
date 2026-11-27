---
id: automation-drift
slug: /continuous-delivery/automations/drift
title: drift
sidebar_label: drift
description: Plan instances on a schedule, alert on drift, and optionally re-apply the deployed configuration.
image: /img/og/automation-drift.png
---

On a schedule, plan every provisioned instance that matches a set of attributes. Read each plan's logs for
changes. Alert Slack about drift. Optionally remove the drift by re-applying the configuration that is
deployed.

## How a check runs

1. The check lists the `PROVISIONED` instances whose effective attributes match `match`.
2. For each instance, it reads the latest completed `PROVISION` deployment and calls `planDeployment` on it.
   The plan uses the params of that deployment, not the instance's saved params, so unsaved and undeployed
   edits do not show up as drift. The automation skips an instance with a deployment that is pending,
   approved, or running, and an instance with no completed `PROVISION` deployment.
3. Massdriver sends `deployment.completed`, `deployment.failed`, or `deployment.aborted` for the plan. The
   automation reads the plan's logs and gives the plan one result:

   | Result | When |
   |---|---|
   | drifted | A `drift` pattern match counts one or more changes. |
   | clean | Every step has a `clean` match, or a `drift` match with zero changes. |
   | unknown | Fewer matches than the bundle has steps, for example a Helm step. |
   | failed | The plan failed or was aborted, or no event came within 6 hours. |

4. It posts drifted, unknown, and failed results to Slack. The message has the change counts of each step,
   up to 20 lines of changed resources, and a link to the plan. Clean results are posted only with
   `notify_clean: true`.
5. For a drifted result, `mode` decides what happens next. The automation never resolves an unknown or
   failed result.

`planDeployment` plans the deployed params with the instance's **current** bundle version and dependencies.
When the instance's resolved bundle version differs from the deployed version, or a dependency changed since
the last provision, the plan also shows those changes. The alert names them, and the automation does not
resolve that instance.

## Resolve modes

| `mode` | `resolve_with: deployed` (default) | `resolve_with: saved` |
|---|---|---|
| `detect` (default) | Alert only. | Alert only. |
| `resolve` | `rollbackDeployment` on the deployment that was planned, then `approveDeployment` on the proposal. | `createDeployment` `PROVISION` with the instance's saved params. |
| `propose` | `rollbackDeployment` on the deployment that was planned. A person approves it. | `proposeDeployment` `PROVISION` with the instance's saved params. A person approves it. |

`deployed` is the default because it re-applies only what was already deployed: the params, bundle version,
and dependency snapshot of the last completed `PROVISION`. The saved params can hold edits that nobody
deployed yet, and `saved` deploys those edits along with the drift fix.

`rollbackDeployment` pins the instance to the bundle version of the deployment it re-applies. Massdriver sets
the message of a rollback to `Rollback to deployment <id> (v<version>)`. A `saved` deployment has the message
`drift: <check> resolving drift found by plan <plan id>`.

When the environment has separation of duty, the service account cannot approve its own rollback. The
proposal stays open and the alert says to approve it in Massdriver.

## Configuration

| Variable | Default | |
|---|---|---|
| `MASSDRIVER_ORGANIZATION_ID` | | Required. Your organization's identifier. |
| `MASSDRIVER_API_KEY` | | Required. An `md_` access token of a service account. |
| `MASSDRIVER_SIGNING_SECRET` | | Required. The `whsec_` signing secret of the event destination. |
| `MASSDRIVER_URL` | `https://api.massdriver.cloud` | The URL of your Massdriver installation. |
| `MASSDRIVER_APP_URL` | `https://app.massdriver.cloud` | The URL of the Massdriver UI, for the plan links. |
| `DRIFT_CONFIG` | `./drift.yaml` | The checks. |
| `SLACK_WEBHOOK_URL` | | A Slack incoming webhook. Without one, alerts go to the logs only. |
| `DRIFT_RUN_TOKEN` | | Enables `POST /drift/run`. Callers send it as `Authorization: Bearer <token>`. |
| `STATE_DIR` | | A directory for the plans in progress and the queues (`drift.json`). |
| `PORT` | `8080` | |

### drift.yaml

| Key | Default | |
|---|---|---|
| `checks[].name` | | Required. Unique. |
| `checks[].schedule` | | A cron expression (5 fields, or `@daily`, `@every 6h`). Without one, the check runs only from `POST /drift/run`. |
| `checks[].timezone` | `UTC` | The timezone of `schedule`. |
| `checks[].match` | | Effective attributes, such as `md-environment: prod`. A list matches any of its values. Keys are combined with AND. Empty matches every provisioned instance. |
| `checks[].mode` | `detect` | `detect`, `resolve`, or `propose`. |
| `checks[].resolve_with` | `deployed` | `deployed` or `saved`. |
| `checks[].max_concurrent` | `5` | Plans running at once for the check. |
| `checks[].slack_webhook_url` | `SLACK_WEBHOOK_URL` | A Slack incoming webhook for this check. |
| `checks[].notify_clean` | `false` | Post clean results. |
| `checks[].summary` | `false` | Post one line of totals when a run finishes. |
| `checks[].patterns.clean` | `No changes\.` | A Go regular expression that marks a step with no changes. |
| `checks[].patterns.drift` | `Plan: \d+ to \w+(?:, \d+ to \w+)*` | A Go regular expression that marks a step with changes. Each `<n> to <verb>` in the match is counted, so `import` and `forget` count too. |
| `checks[].patterns.resource` | `(?m)^\s*# \S+.* (?:will be\|must be) .*$` | A Go regular expression for the changed resource lines in the alert. |

[drift.example.yaml](https://github.com/massdriver-cloud/massdriver-automations/blob/main/automations/drift/drift.example.yaml) has every key.

### Run a check now

```bash
curl -X POST -H "Authorization: Bearer $DRIFT_RUN_TOKEN" "https://drift.example.com/drift/run?check=prod-nightly"
```

The response is `202`. A request for a check that does not exist gets `404`.

## Service account permissions

| Mode | Permissions on the matched instances |
|---|---|
| every mode | `project:view` on their projects, and `instance:plan` |
| `resolve`, `deployed` | `instance:propose` and `instance:deploy` |
| `resolve`, `saved` | `instance:deploy` |
| `propose` | `instance:propose` |

## Event destination

Requires [mass](/reference/cli/overview) 2.6.0 or later.

```bash
mass event destination create \
  --name drift \
  --url https://drift.example.com/hooks/massdriver \
  --event-type deployment.completed \
  --event-type deployment.failed \
  --event-type deployment.aborted \
  --condition '.data.metadata.deployment_action == "PLAN"'
```

The condition drops `PROVISION` and `DECOMMISSION` deployments, so Massdriver marks them `SKIPPED` and does not
send them. The automation ignores plans that it did not start.

Copy the signing secret from the destination's **Overview** tab into `MASSDRIVER_SIGNING_SECRET`.

## Run

```bash
docker run -p 8080:8080 \
  -e MASSDRIVER_ORGANIZATION_ID=acme \
  -e MASSDRIVER_API_KEY=md_... \
  -e MASSDRIVER_SIGNING_SECRET=whsec_... \
  -e SLACK_WEBHOOK_URL=https://hooks.slack.com/services/... \
  -e DRIFT_RUN_TOKEN=... \
  -e DRIFT_CONFIG=/config/drift.yaml \
  -e STATE_DIR=/state \
  -v "$PWD/drift.yaml:/config/drift.yaml:ro" \
  -v "$PWD/state:/state" \
  massdrivercloud/massdriver-automations:latest run drift
```

The image runs as user `65532`. That user must be able to write to `STATE_DIR`.

## Limits

- The API has no structured plan summary, so the result comes from log patterns. Output-only changes and
  provisioners other than OpenTofu and Terraform give `unknown` unless you set `patterns`.
- The logs do not name their step. Matches are given step names in log order.
- Run one replica. The schedule and the plans in progress live in one process.
- Without `STATE_DIR`, a restart forgets the plans in progress and the queues. Their results are not read.
- A plan that finishes before the automation records its id is not read.
