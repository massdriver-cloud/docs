---
id: automation-router
slug: /continuous-delivery/automations/router
title: router
sidebar_label: router
description: Run HTTP requests, commands, and Massdriver API calls for events that match configured routes.
---

Runs HTTP requests, commands, and Massdriver API calls when an event matches a route. Each route selects events by
type, attributes, and an optional expression, and runs a list of steps in order. Use it for small reactions that
need no code: page someone, post a message, call a cleanup endpoint, run a script, or plan an instance.

Use router to build your own event destinations without writing an automation. The source and example route
files are in [`automations/router`](https://github.com/massdriver-cloud/massdriver-automations/tree/main/automations/router).

## Configuration file

```yaml
engine: jq                      # or go; one engine for the whole file
routes:
  - name: page-on-prod-failure
    events: [deployment.failed]
    match:
      md-environment: prod
    when: '.data.metadata.deployment_action == "PROVISION"'
    timeout: 5s
    do:
      - http:
          url: https://events.pagerduty.com/v2/enqueue
          body: '{routing_key: env.PAGERDUTY_ROUTING_KEY, event_action: "trigger", dedup_key: .id,
                  payload: {summary: "\(.data.attributes["md-instance"]) failed", source: "massdriver", severity: "error"}}'
```

| Field | |
|---|---|
| `engine` | `jq` (default) or `go`. Every expression in the file uses this engine. |
| `routes[].name` | Required. Unique. Shown in the logs. |
| `routes[].events` | Required. Event types, such as `deployment.failed`. `instance.*` selects every event type of one entity. |
| `routes[].match` | Attributes that the event's entity must have, each with exactly this value. |
| `routes[].when` | An expression. The route runs only when jq outputs `true`, or the Go template renders `true`. |
| `routes[].async` | Default `false`. See [Sync and async routes](#sync-and-async-routes). |
| `routes[].timeout` | The time for all steps of the route. Default `8s`, which is also the largest value for a sync route. Default `1m` for an async route. |
| `routes[].do` | Required. The steps. Each step has exactly one of `http`, `exec`, and `massdriver`. |

The router reads the file at start. It does not start when the file has an unknown field, a route without events or
steps, a sync route with a timeout over `8s`, or an expression that does not compile.

More than one route can match an event. Each matching route runs.

### Steps

Steps run in order. A step that fails stops its route, and the next steps of that route do not run. A failure is an
expression error, a response other than `2xx`, a command that exits with a status other than `0`, a GraphQL error,
a mutation result with `successful: false`, or the route timeout.

#### `http`

```yaml
- http:
    method: POST                                   # default POST
    url: 'https://dns.example.com/records/\(.data.attributes["md-instance"])'
    headers:
      Authorization: 'Bearer \(env.DNS_TOKEN)'
    body: '{instance: .data.attributes["md-instance"], event: .id}'
```

| Field | jq | go |
|---|---|---|
| `url`, `headers` values | Text. Each `\(expr)` is replaced with the output of the jq expression. | A template that renders the text. |
| `body` | An expression. Its output is sent as JSON. | A template. Its text is sent as it is. |

A step with a `body` sends `Content-Type: application/json`. Set the header to send another type. The step fails on
a response other than `2xx`.

#### `exec`

```yaml
- exec: [/scripts/purge-bucket.py, '\(.data.entity.identifier)']
```

The program and its arguments. Each argument is text with `\(expr)` interpolation under jq, or a template under
go. No shell runs the command: use `[/bin/sh, -c, '...']` for one. The command gets the event as JSON on standard
input, and these environment variables:

| Variable | |
|---|---|
| `MD_EVENT_ID`, `MD_EVENT_TYPE`, `MD_EVENT_SUBJECT`, `MD_EVENT_TIME` | From the event. |
| `MD_ATTR_<KEY>` | Each attribute. The key is in upper case, with `_` in place of other characters: `md-instance` is `MD_ATTR_MD_INSTANCE`. |
| `MD_METADATA_<KEY>` | Each metadata field, such as `MD_METADATA_DEPLOYMENT_ACTION`. |

The command also gets the environment of the router, without `MASSDRIVER_SIGNING_SECRET` and `MASSDRIVER_API_KEY`.
The default image has no shell and no tools. Use the [`-scripts` image](#the--scripts-image) for commands.

#### `massdriver`

```yaml
- massdriver:
    query: |
      mutation PlanInstance($org: ID!, $id: ID!, $input: CreateDeploymentInput!) {
        createDeployment(organizationId: $org, id: $id, input: $input) {
          successful
          messages { field message }
        }
      }
    variables: '{id: .data.entity.identifier, input: {action: "PLAN", params: (.data.entity.params | tojson)}}'
```

Runs one operation against the [V2 GraphQL API](/api/graphql) as the service account of
`MASSDRIVER_API_KEY`. `variables` is an expression that outputs an object under jq, or a template that renders a
JSON object under go. When the query uses `$org` and `variables` does not set `org`, the router sets it to
`MASSDRIVER_ORGANIZATION_ID`. `Map` inputs, such as `params`, are JSON strings: use `tojson` in jq, or
`json (json .x)` in a template.

The step fails on a GraphQL error, or when a field of `data` has `successful: false`. The logs show the `messages`.

### Expressions

Every expression sees the event as Massdriver sends it:

```json
{
  "id": "4b0b5a8e-0f6c-4a53-9d0c-5a1f4ad5c1c2",
  "type": "deployment.failed",
  "subject": "mri:acme:api:prod:database",
  "time": "2026-11-24T05:54:03Z",
  "data": {
    "entity": {"id": "b9dc3d18-...", "status": "FAILED", "action": "PROVISION", "version": "1.2.3", "deployed_by_name": "Jane Doe", "message": "Bump the instance size"},
    "attributes": {"md-project": "api", "md-environment": "prod", "md-component": "database", "md-instance": "api-prod-database", "md-repo": "aws-aurora", "md-bundle": "aws-aurora@1.2.3"},
    "metadata": {"deployment_action": "PROVISION"},
    "actor": {"account_id": "0e6f2c1a-...", "name": "Jane Doe", "organization_id": "5a2c8e4f-..."}
  }
}
```

The [event destination docs](/platform-operations/event-destinations) list each event
type and its entity.

**jq** uses [gojq](https://github.com/itchyny/gojq). A `when`, `body`, or `variables` expression uses its first
output. `env.NAME` and `$ENV.NAME` read the environment of the router, without `MASSDRIVER_SIGNING_SECRET` and
`MASSDRIVER_API_KEY`. Each evaluation stops after 2 seconds. In YAML, put jq in single quotes or a block (`|`):
`\(` is not valid in a double-quoted YAML string.

| Value | jq |
|---|---|
| Event type | `.type` |
| Instance, environment, project | `.data.attributes["md-instance"]`, `.data.attributes["md-environment"]`, `.data.attributes["md-project"]` |
| Bundle and version | `.data.attributes["md-bundle"]` (`aws-aurora@1.2.3`) |
| Deployment action (`PROVISION`, `PLAN`, `DECOMMISSION`) | `.data.metadata.deployment_action` |
| Deployment status, message, and who deployed | `.data.entity.status`, `.data.entity.message`, `.data.entity.deployed_by_name` |
| Identifier of an instance or environment event | `.data.entity.identifier` |
| Person or service account that acted | `.data.actor.name` |
| Value with a default | `.data.entity.message // "No message"` |
| Event type of one entity | `.type \| startswith("deployment.")` |

**go** uses Go [`text/template`](https://pkg.go.dev/text/template). A field that the event does not have stops the
step with an error. A `when` template must render `true`; spaces around it are ignored.

| Function | |
|---|---|
| `attr "md-instance"` | An attribute of the event's entity. Use it for keys with `-`. |
| `json .data.entity` | The value as JSON. Use it to put values in a JSON body or variables. |
| `env "DNS_TOKEN"` | An environment variable of the router. Empty for `MASSDRIVER_SIGNING_SECRET` and `MASSDRIVER_API_KEY`. |

### No branching

A route is a list of steps and nothing else. There are no conditions between steps, no loops, no values passed from
one step to the next, and no state between events. When a reaction needs any of these, write a script and run it
with `exec`, or write a Go automation.

### Sync and async routes

A route is sync unless it sets `async: true`.

- **Sync**: the router runs the route before it responds to Massdriver. The sync routes of an event run at the same
  time, each within its timeout of at most `8s`, because Massdriver waits 10 seconds. When a sync route fails, the
  router responds `500` and Massdriver sends the event again. The retry runs only the routes that failed; routes that
  succeeded for that event id in the last hour do not run again.
- **Async**: the router queues the route and responds. A failed async route is logged, and nothing runs it again.
  Use async for steps that take longer than `8s`.

Massdriver delivers each event at least once, and a restart forgets which routes ran. Write every step so that
running it twice has the same effect as running it once: use the event `id` as a dedup key, `PUT` and `DELETE` in
place of `POST`, and scripts that check before they change.

## Examples

[`examples/`](https://github.com/massdriver-cloud/massdriver-automations/tree/main/automations/router/examples) has each of these files.

### Clean up after a decommission (Go templates)

```yaml
engine: go
routes:
  - name: release-dns
    events: [deployment.completed, instance.deleted]
    match:
      md-environment: prod
    when: '{{ or (eq .type "instance.deleted") (eq .data.metadata.deployment_action "DECOMMISSION") }}'
    timeout: 5s
    do:
      - http:
          method: DELETE
          url: 'https://dns.example.com/records/{{ attr "md-instance" }}'
          headers:
            Authorization: 'Bearer {{ env "DNS_TOKEN" }}'
          body: '{"instance": {{ json (attr "md-instance") }}, "event": {{ json .id }}}'

  - name: purge-environment-bucket
    events: [environment.deleted]
    async: true
    timeout: 5m
    do:
      - exec: [/scripts/purge-bucket.py, '{{ .data.entity.identifier }}']
```

`or` stops at the first true value, so an `instance.deleted` event, which has no `deployment_action`, does not reach
the second `eq`.

### Page PagerDuty when a production deployment fails

```yaml
routes:
  - name: page-on-prod-failure
    events: [deployment.failed]
    match:
      md-environment: prod
    when: '.data.metadata.deployment_action == "PROVISION"'
    timeout: 5s
    do:
      - http:
          url: https://events.pagerduty.com/v2/enqueue
          body: |
            {
              routing_key: env.PAGERDUTY_ROUTING_KEY,
              event_action: "trigger",
              dedup_key: .id,
              payload: {
                summary: "Deployment of \(.data.attributes["md-instance"]) failed",
                source: .data.attributes["md-instance"],
                severity: "error",
                custom_details: {
                  bundle: .data.attributes["md-bundle"],
                  deployed_by: .data.entity.deployed_by_name,
                  message: .data.entity.message
                }
              }
            }
```

### Post proposed deployments to Microsoft Teams

```yaml
routes:
  - name: teams-on-proposal
    events: [deployment.proposed]
    timeout: 5s
    do:
      - http:
          url: '\(env.TEAMS_WEBHOOK_URL)'
          body: |
            {
              type: "message",
              attachments: [{
                contentType: "application/vnd.microsoft.card.adaptive",
                content: {
                  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                  type: "AdaptiveCard",
                  version: "1.4",
                  body: [
                    {type: "TextBlock", weight: "Bolder", text: "\(.data.entity.deployed_by_name) proposed \(.data.entity.action) of \(.data.attributes["md-instance"])"},
                    {type: "TextBlock", wrap: true, text: (.data.entity.message // "No message")}
                  ]
                }
              }]
            }
```

### Plan an instance when its version changes

`instance.updated` is sent when an instance's version or release strategy changes. This route plans the instance
with its current params. The service account needs `instance:plan` on the instance.

```yaml
routes:
  - name: plan-on-version-change
    events: [instance.updated]
    match:
      md-environment: staging
    when: '.data.entity.params != null'
    timeout: 5s
    do:
      - massdriver:
          query: |
            mutation PlanInstance($org: ID!, $id: ID!, $input: CreateDeploymentInput!) {
              createDeployment(organizationId: $org, id: $id, input: $input) {
                successful
                messages { field message }
                result { id status }
              }
            }
          variables: |
            {
              id: .data.entity.identifier,
              input: {
                action: "PLAN",
                params: (.data.entity.params | tojson),
                message: "Plan after \(.data.entity.version) was set"
              }
            }
```

## Configuration

| Variable | Default | |
|---|---|---|
| `MASSDRIVER_SIGNING_SECRET` | | Required. The `whsec_` signing secret of the event destination. |
| `ROUTER_CONFIG` | `/etc/router/config.yaml` | The configuration file. |
| `MASSDRIVER_ORGANIZATION_ID`, `MASSDRIVER_API_KEY` | | Required when a route has a `massdriver` step. |
| `MASSDRIVER_URL` | `https://api.massdriver.cloud` | |
| `PORT` | `8080` | |

Set the credentials that routes read with `env`, such as `PAGERDUTY_ROUTING_KEY`, as environment variables of the
container.

## Event destination

Requires [mass](/reference/cli/overview) 2.6.0 or later. Add one `--event-type` for
each type in the `events` of your routes. For the PagerDuty example:

```bash
mass event destination create \
  --name router \
  --url https://router.example.com/hooks/massdriver \
  --event-type deployment.failed \
  --attribute md-environment=prod \
  --condition '.data.metadata.deployment_action == "PROVISION"'
```

An `--attribute` or `--condition` on the destination applies to every route. Use them only when every route has the
same filter, and keep the route's own `match` and `when` as well. Massdriver marks the events that the filter drops
as `SKIPPED` and does not send them.

Copy the signing secret from the destination's **Overview** tab into `MASSDRIVER_SIGNING_SECRET`.

## Run

```bash
docker run -p 8080:8080 \
  -e MASSDRIVER_SIGNING_SECRET=whsec_... \
  -e ROUTER_CONFIG=/config/config.yaml \
  -e PAGERDUTY_ROUTING_KEY=... \
  -v "$PWD/config.yaml:/config/config.yaml:ro" \
  massdrivercloud/massdriver-automations:latest run router
```

### The `-scripts` image

`massdrivercloud/massdriver-automations:<tag>-scripts` has the same binary on Alpine Linux with `sh`, `jq`, `curl`,
and `python3`. It runs as user `65532` and runs `router` by default. Use it for `exec` steps:

```bash
docker run -p 8080:8080 \
  -e MASSDRIVER_SIGNING_SECRET=whsec_... \
  -e ROUTER_CONFIG=/config/config.yaml \
  -v "$PWD/config.yaml:/config/config.yaml:ro" \
  -v "$PWD/scripts:/scripts:ro" \
  massdrivercloud/massdriver-automations:latest-scripts
```

Each script must be executable and start with a `#!` line, such as `#!/usr/bin/env python3`. For other tools, build
your own image `FROM massdrivercloud/massdriver-automations:<tag>-scripts`.

## Limits

- The logs show the result of a failed step: the HTTP status and response, the command output, or the GraphQL
  `data`, up to 4 KiB. With `LOG_LEVEL=debug`, they show the result of every step.
- The async queue holds 100 events, in memory. When it is full, the router responds `500`, and Massdriver sends the
  event again later. A restart loses the queue.
- The router remembers the routes that ran for each event id for one hour, in memory. Run one replica.
- Go templates have no evaluation timeout. A template cannot loop without end, because it can only range over the
  event.
