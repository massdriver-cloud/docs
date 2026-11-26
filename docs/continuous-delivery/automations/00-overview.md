---
id: automations-overview
slug: /continuous-delivery/automations
title: Automations
sidebar_label: Overview
description: Services that act on Massdriver events with a service account.
---

An automation is a service that acts on [Massdriver events](/platform-operations/event-destinations). It receives events from an [HTTP event destination](/platform-operations/event-destinations/http), verifies the [Standard Webhooks](https://www.standardwebhooks.com) signature, and calls the Massdriver API as a service account, or calls another service such as Slack or GitHub.

The automations are open source in [massdriver-automations](https://github.com/massdriver-cloud/massdriver-automations). All of them ship in one image. Run one automation per container:

```bash
docker run -p 8080:8080 \
  -e MASSDRIVER_SIGNING_SECRET=whsec_... \
  massdrivercloud/massdriver-automations:latest run autodeploy-downstream
```

`AUTOMATION=<name>` works in place of `run <name>`. `list` prints every automation.

| Automation | Events | Does |
|---|---|---|
| [release-notes](/continuous-delivery/automations/release-notes) | `repo.published` | Posts new bundle versions, and the instances that can upgrade, to Slack and Teams. |
| [bundle-scanner](/continuous-delivery/automations/bundle-scanner) | `repo.published` | Scans each new bundle version with Trivy and Checkov. Uses the `-scanner` image tag. |
| [sandbox-on-join](/continuous-delivery/automations/sandbox-on-join) | `group_membership.*`, `deployment.completed` | Forks a sandbox environment for each new group member, and removes it when they leave. |
| [proposal-chatops](/continuous-delivery/automations/proposal-chatops) | `deployment.proposed`, `deployment.approved`, `deployment.rejected` | Approve or reject proposed deployments from Slack. |
| [freeze-guard](/continuous-delivery/automations/freeze-guard) | `group.created`, `group.updated`, `group.deleted` | Adds deny policies for deployment actions to groups during change freeze windows. |
| [autodeploy-downstream](/continuous-delivery/automations/autodeploy-downstream) | `deployment.completed` | Deploys opted-in dependents when an instance deploys. |
| [github-deployments](/continuous-delivery/automations/github-deployments) | `deployment.*` | Shows Massdriver deployments as GitHub Deployments. |
| [rollback-on-failure](/continuous-delivery/automations/rollback-on-failure) | `deployment.failed` | Rolls an opted-in instance back to its last completed deployment when a deployment fails. |
| [drift](/continuous-delivery/automations/drift) | `deployment.completed`, `deployment.failed`, `deployment.aborted` | Plans instances on a schedule, alerts Slack about drift, and can re-apply the deployed configuration. |
| [statuspage](/continuous-delivery/automations/statuspage) | `alarm.*`, `alarm_state.created`, `deployment.*`, `instance.*` | Serves a public status page from alarms, instances, and deployments. |
| [audit-archiver](/continuous-delivery/automations/audit-archiver) | every event | Archives every event, unchanged, in S3, Splunk, or Datadog. |
| [router](/continuous-delivery/automations/router) | configured per route | Runs HTTP requests, commands, and Massdriver API calls for the events that match configured routes. Commands use the `-scripts` image tag. |

Each automation's page has its settings, the permissions of its service account, and the `mass event destination create` command that sends it only the events it uses.

## Build your own with router

When none of these automations does what you need, build your own destination with [router](/continuous-delivery/automations/router). A route selects events by type, attributes, and an expression, then runs HTTP requests, commands, and Massdriver API calls in order. You write YAML, not Go. Examples and the full configuration reference are in [`automations/router`](https://github.com/massdriver-cloud/massdriver-automations/tree/main/automations/router).

## How an automation acts

An automation has the access of its service account and nothing more. Policies decide what the service account can do in each environment, the same as for a person. An automation that proposes a deployment in an environment with [separation of duty](/concepts/deployments#separation-of-duty) cannot approve its own proposal, so a person approves it. A [freeze window](/continuous-delivery/automations/freeze-guard) denies the service accounts in frozen groups like the people in them.

The automations that opt instances in, such as autodeploy-downstream and rollback-on-failure, read an attribute such as `autodeploy=true`. Set it on a project, an environment, or a component, and every instance below it gets it. The key must be a declared [custom attribute](/platform-operations/security/access-control#custom-attributes) before you set it.

## Deploy

[Two Massdriver bundles](/continuous-delivery/automations/deploy) run any set of the automations, and create an event destination for each:

| Bundle | Runs on |
|---|---|
| `massdriver-automations` | A Kubernetes cluster, with an ingress controller. |
| `massdriver-automations-ecs` | Amazon ECS with Fargate, behind an Application Load Balancer. |

## Common settings

| Variable | Default | |
|---|---|---|
| `MASSDRIVER_SIGNING_SECRET` | | Required. The `whsec_` signing secret of the event destination. |
| `MASSDRIVER_ORGANIZATION_ID` | | Your organization's identifier. Required by automations that call the API. |
| `MASSDRIVER_API_KEY` | | An `md_` access token of a [service account](/platform-operations/security/service-accounts). Required by automations that call the API. |
| `MASSDRIVER_URL` | `https://api.massdriver.cloud` | The URL of your Massdriver installation. |
| `PORT` | `8080` | |
| `LOG_FORMAT` | `json` | `json` or `text`. |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, or `error`. |

Every automation receives events on `POST /hooks/massdriver` and answers health checks on `GET /healthz`.

### Logs

Each log record is one line on stderr. Every record has `time`, `level`, `msg`, `automation`, and `version`. Records about an event also have `event_id` and `event_type`. Each request writes one `request` record; health checks write theirs at `debug`.

```json
{"time":"2026-11-25T22:05:42.539271Z","level":"INFO","msg":"request","automation":"router","version":"v1.4.0","method":"POST","path":"/hooks/massdriver","status":204,"duration_ms":10.42,"bytes":0,"event_id":"evt-local-1","event_type":"deployment.completed"}
```

## Run locally

Run an automation on your computer, and give Massdriver a public URL with a tunnel.

### 1. Start the automation

From a clone of the repository:

```bash
export MASSDRIVER_ORGANIZATION_ID=acme
export MASSDRIVER_API_KEY=md_...
export MASSDRIVER_SIGNING_SECRET=whsec_...   # set after step 3; any whsec_ value works until then
go run ./cmd/massdriver-automations run autodeploy-downstream
```

Or with Docker:

```bash
docker run --rm -p 8080:8080 \
  -e MASSDRIVER_ORGANIZATION_ID -e MASSDRIVER_API_KEY -e MASSDRIVER_SIGNING_SECRET \
  massdrivercloud/massdriver-automations:latest run autodeploy-downstream
```

The automation listens on port 8080. Set `PORT` to change it.

### 2. Open a tunnel

Massdriver refuses a destination URL whose host is a private address. Use a tunnel that prints a public `https://` URL and forwards to port 8080, such as `ngrok http 8080` or `cloudflared tunnel --url http://localhost:8080`. Refer to [Send events to your computer](/platform-operations/event-destinations/http#send-events-to-your-computer) for more tunnels.

### 3. Create the event destination

Use the command on the automation's page, with the tunnel URL and the `/hooks/massdriver` path:

```bash
mass event destination create \
  --name autodeploy-downstream-local \
  --url https://<tunnel-host>/hooks/massdriver \
  --event-type deployment.completed \
  --condition '.data.metadata.deployment_action == "PROVISION"'
```

Copy the signing secret from the destination's **Overview** tab into `MASSDRIVER_SIGNING_SECRET`, and restart the automation. Click **Send test event** on the destination: the automation answers `204` to the `event_destination.tested` event, which shows that the URL and the secret work.

When the tunnel URL changes, update the destination:

```bash
mass event destination update <id> --url https://<new-tunnel-host>/hooks/massdriver
```

Events that arrived while the tunnel was down wait as failed deliveries. Send them again with `mass event destination redeliver <id>`.

### Send an event without Massdriver

`scripts/send-event.sh` signs a CloudEvent file the way Massdriver does and posts it. It needs `jq`, `openssl`, `xxd`, and `curl`.

```bash
cat > event.json <<'JSON'
{"specversion":"1.0","id":"4b0b5a8e-0f6c-4a53-9d0c-5a1f4ad5c1c2","type":"deployment.completed",
 "subject":"mri:acme:api:prod:database","time":"2026-11-24T05:54:03Z",
 "data":{"entity":{"id":"b9dc3d18-19fc-429c-8d36-6753615fe17c","action":"PROVISION"},
         "attributes":{"md-instance":"api-prod-database"},
         "metadata":{"deployment_action":"PROVISION"}}}
JSON
MASSDRIVER_SIGNING_SECRET=whsec_... scripts/send-event.sh event.json http://localhost:8080/hooks/massdriver
```

It prints the status code. Each automation drops an event id it has already handled, so change `id` to send the same event again. To copy real events, run `mass event destination preview --event-type <type> -o json`.

## Write an automation

For a reaction that needs no code, such as an HTTP request, a script, or one GraphQL call, configure a route in [router](/continuous-delivery/automations/router). See [Build your own with router](#build-your-own-with-router).

Otherwise, an automation is a Go package that implements one method:

```go
type Automation interface {
	Handle(ctx context.Context, ev automation.Event) error
}
```

- `pkg/automation` verifies the signature, drops repeated event ids, and calls `Handle`. Return an error to respond `500`, so Massdriver sends the event again. Massdriver waits 10 seconds for a response, so start long work in a goroutine.
- Implement `Routes(mux *http.ServeMux)` to serve more routes, such as a callback from Slack or a web page.
- `pkg/massdriver` calls the [V2 GraphQL API](/api/graphql). Put each operation in a `.graphql` file under `queries/` and load it with `//go:embed`.
- Export a `Definition` and add it to `automations/registry.go`.
- Test with `automation.Handler` and `automation.SignRequest`, against `httptest` fakes of the APIs you call.

[`autodeploy-downstream`](https://github.com/massdriver-cloud/massdriver-automations/tree/main/automations/autodeploy-downstream) is a short, complete example.

`pkg/automation` and `pkg/massdriver` are importable, so you can also build automations in your own repository.
