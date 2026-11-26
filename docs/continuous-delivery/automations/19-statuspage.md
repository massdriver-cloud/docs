---
id: automation-statuspage
slug: /continuous-delivery/automations/statuspage
title: statuspage
sidebar_label: statuspage
description: Serve a public status page from alarms, instances, and deployments.
---

A public status site for your Massdriver environments. It needs no login.

At startup, the service reads `statuspage.yaml`. Then it loads each configured environment from the Massdriver
API: its instances, their status, their alarms with the current state of each alarm, and the latest deployment
of each instance. After that, events keep the site current. Each event renders the site again at once.

The site has:

- an overall status banner, and one section for each environment, with one row for each component
- a bar for each day of the last 90 days, and the uptime of each component
- active incidents, past incidents, and active or scheduled maintenance
- announcements from the config
- `/api/status.json`, an Atom feed of incidents, and an SVG status badge for each page

The site shows only the titles in the config and the names of instances. It does not show identifiers of
projects, environments, instances, or alarms.

## Component status

Each row has one of these statuses. The row takes the worst status of its instances. An environment takes the
worst status of its rows, and a page takes the worst status of its environments.

| Status | When |
|---|---|
| Major outage | An alarm fires on an instance whose impact is `major_outage`. |
| Partial outage | The instance is `FAILED`: its last `PROVISION` or `DECOMMISSION` deployment failed. Or an alarm fires on an instance whose impact is `partial_outage`. |
| Degraded performance | An alarm fires. This is the default impact of an alarm. |
| Under maintenance | A `PROVISION` or `DECOMMISSION` deployment of the instance runs, and `deploys_as_maintenance` is on. Or a scheduled maintenance window from the config is open. |
| Operational | None of the above. |

An outage is worse than maintenance, so an alarm that fires during maintenance still shows.

An alarm counts only after it fires for `min_duration`. An alarm that clears before then leaves no incident.

The impact of an alarm comes from, in order:

1. the `status_impact` attribute of the instance (`degraded`, `partial_outage`, or `major_outage`)
2. the `impact` of the component in the config
3. `degraded`

The site shows only instances that are `PROVISIONED` or `FAILED`. It hides instances that are `INITIALIZED` or
`DECOMMISSIONED`, and instances with the attribute `status_hidden=true`.

An incident opens when a row becomes degraded or worse, and resolves when the row is operational or under
maintenance again. Uptime counts partial and major outages as downtime. Degraded performance and maintenance
are not downtime.

## Configuration

| Variable | Default | |
|---|---|---|
| `MASSDRIVER_ORGANIZATION_ID` | | Required. Your organization's identifier. |
| `MASSDRIVER_API_KEY` | | Required. An `md_` access token of a service account. |
| `MASSDRIVER_SIGNING_SECRET` | | Required. The `whsec_` signing secret of the event destination. |
| `MASSDRIVER_URL` | `https://api.massdriver.cloud` | The URL of your Massdriver installation. |
| `STATUSPAGE_CONFIG` | `./statuspage.yaml` | The path of the config file. |
| `STATE_DIR` | | A directory for incident and uptime history (`statuspage.json`). |
| `OUTPUT_DIR` | | A directory to write the static site to after each change. |
| `PORT` | `8080` | |

The service account needs view access to the projects of the configured environments.

### statuspage.yaml

[`statuspage.example.yaml`](https://github.com/massdriver-cloud/massdriver-automations/blob/main/automations/statuspage/statuspage.example.yaml) shows every setting. The smallest config is:

```yaml
pages:
  - title: Acme
    environments:
      - id: api-prod
        title: Production
```

| Key | Default | |
|---|---|---|
| `site.title` | `Status` | The name in the header, the feed, and the browser tab. |
| `site.base_url` | | The public URL of the site. Absolute links in the feed and `status.json` start with it. |
| `site.logo` | | The URL of a logo image. |
| `site.accent_color` | `#2563eb` | A hex color for links. |
| `site.timezone` | `UTC` | An IANA zone, such as `Europe/Berlin`. Dates and day boundaries use it. |
| `site.template` | | A Go `html/template` file that replaces the built-in page. The path is relative to the config file. |
| `site.show_alarm_details` | `false` | Adds alarm names and provider messages to incident updates. |
| `site.footer_links` | | A list of `title` and `url`. |
| `history_days` | `90` | Days of uptime bars and incident history, from 1 to 365. |
| `deploys_as_maintenance` | `true` | Shows a running deployment as maintenance. Each environment can override it. |
| `min_duration` | `0s` | How long an alarm must fire before it counts, such as `2m`. |
| `attributes.title` | `status_title` | The attribute that sets the row title of an instance. |
| `attributes.hidden` | `status_hidden` | The attribute that hides an instance when its value is `true`. |
| `attributes.impact` | `status_impact` | The attribute that sets the impact of the alarms of an instance. |
| `announcements` | | Banners: `message`, `level` (`info`, `warning`, `critical`), `url`, `pages` (slugs), `starts_at`, `ends_at`. |
| `maintenance` | | Windows: `title`, `description`, `starts_at`, `ends_at`, `environments` (ids), `components` (titles). |
| `pages[].title` | | Required. |
| `pages[].slug` | from the title | The path of the page. The first page is also at `/`. |
| `pages[].description` | | Text under the header. |
| `pages[].environments[].id` | | Required. The environment identifier, such as `api-prod`. |
| `pages[].environments[].title` | | Required. The title that the page shows. |
| `pages[].environments[].components` | | Rows, each with `title`, `description`, `match`, and `impact`. |

With `components`, an instance appears in the first component whose `match` attributes it has, such as
`{md-component: database}`. Instances that match no component do not appear, and a component with no visible
instance does not appear. Without `components`, each instance has its own row. Its title is the value of
`status_title`, or the instance name.

Times in the config are RFC 3339, such as `2026-12-06T10:00:00Z`.

## Paths

| Path | |
|---|---|
| `/` | The first page. |
| `/<slug>/` | Each page. |
| `/<slug>/feed.atom`, `/feed.atom` | Atom feed of the incidents of a page. |
| `/<slug>/badge.svg`, `/badge.svg` | Status badge of a page. |
| `/api/status.json` | Status, components, uptime, incidents, and scheduled maintenance of every page. |
| `POST /hooks/massdriver` | Events from Massdriver. |

`OUTPUT_DIR` gets the same files at the same paths, such as `index.html`, `acme/index.html`, and
`api/status.json`. Links are relative, so you can sync the directory to S3 or GitHub Pages.

## Event destination

```bash
mass event destination create \
  --name statuspage \
  --url https://status.example.com/hooks/massdriver \
  --event-type 'alarm.*' \
  --event-type alarm_state.created \
  --event-type deployment.started \
  --event-type deployment.completed \
  --event-type deployment.failed \
  --event-type deployment.aborted \
  --event-type 'instance.*' \
  --condition '(.data.attributes["md-project"] + "-" + .data.attributes["md-environment"]) as $env
    | ($env | IN("api-prod", "web-prod", "api-staging"))
      and (.data.metadata.deployment_action // "PROVISION") != "PLAN"'
```

List the environment identifiers of your config in `IN(...)`. When every environment is in one project, also
add `--attribute md-project=<project>`.

Copy the signing secret from the destination into `MASSDRIVER_SIGNING_SECRET`.

## Run

```bash
docker run -p 8080:8080 \
  -e MASSDRIVER_ORGANIZATION_ID=acme \
  -e MASSDRIVER_API_KEY=md_... \
  -e MASSDRIVER_SIGNING_SECRET=whsec_... \
  -e STATUSPAGE_CONFIG=/config/statuspage.yaml \
  -e STATE_DIR=/state \
  -v "$PWD/statuspage.yaml:/config/statuspage.yaml:ro" \
  -v "$PWD/state:/state" \
  massdrivercloud/massdriver-automations:latest run statuspage
```

The image runs as user `65532`. That user must be able to write to `STATE_DIR` and `OUTPUT_DIR`.

## Limits

- Without `STATE_DIR`, history starts when the service starts. A restart loses past incidents and uptime.
- The service does not backfill history from before its first start. The API gives only the current state of
  each alarm. The audit log has past states, but reading it needs `organization:manage`.
- The service exits when it cannot load an environment at startup. Massdriver retries events that fail while
  it restarts.
- Run one replica. State is in memory and in one file.
- Attributes are set on projects, environments, and components, not on single instances. Each custom attribute
  has a fixed list of values, so declare each `status_title` value on the attribute first.
- Massdriver has no event for the end of an environment deployment. Each instance deployment is shown on its own.
- A deployment shows as maintenance only while it runs. Queued and proposed deployments do not.
- `OUTPUT_DIR` does not delete files of a page that you remove from the config.
