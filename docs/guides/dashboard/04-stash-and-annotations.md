---
id: guides-dashboard-stash-and-annotations
slug: /guides/dashboard/stash-and-annotations
title: Stash and Annotations
sidebar_label: Stash and Annotations
---

# Stash and Annotations

:::caution Alpha
This feature is alpha. Names, fields, and behavior can change or be removed at any time without notice.
:::

The dashboard draws the same [widgets](/guides/annotations/widgets) and [notes](/guides/annotations/notes) as the Massdriver canvas, from the same [stash](/guides/stash) entries.

## The stash feed

The dashboard reads the stash of every project, environment, component, and instance in view once, then streams each key as it is set or deleted. It opens one stream for each environment in view, and moves them when the view moves. Every refresh, 30 seconds by default, it reads the whole stash again to catch anything a dropped stream missed.

Streaming needs a personal access token. With a service account, or while a stream reconnects, the dashboard reads the stash on an interval instead, every 3 seconds by default. Change the interval with `--stash`:

```bash
mass dashboard --stash 1s
```

Each read covers every stash in view, so a shorter interval costs more requests. `--stash 0` reads the stash only with each refresh.

Each key that is set or deleted goes on the ticker in yellow, such as `stash set Billing / Development · md/v1/health = degraded`. Its environment ripples and floats up the key. A key that changes again replaces its own line on the ticker, so a script that writes every second does not fill the ticker.

When a read fails for one project, that project keeps the entries from the last read that worked. Nothing is reported as deleted.

## Widgets from well-known keys

A [well-known key](/guides/stash/well-known-keys) draws its widget for everyone who can view the project:

| Key | Set on | In the dashboard |
|---|---|---|
| `md/v1/health` | Instance | The instance's dot, and its health in the side panel: green for `healthy`, `ok`, or `up`; amber for `degraded`, `warning`, or `recovering`; red for `down`, `failed`, or `error`; gray for anything else. A red instance blinks on the map. |
| `md/v1/usage` | Instance | A bar under the instance in the side panel, such as `████████░░ 82/100 connections`. Amber from 80%, red from 95%. |
| `md/v1/traffic` | Instance | The links that leave the environment carry the rate, p95 latency, and errors, and the sparks follow the rate. A rate of 0 shows no sparks. |
| `md/v1/banner` | Environment | A banner across the top of the map, a ⚑ next to the environment, and the message in the side panel, colored by level |
| `md/v1/links` | Environment | Links under the environment's name in the side panel. Only `http` and `https` links show. |

For example:

```bash
mass stash set billing-dev-app.md/v1/health degraded
mass stash set billing-dev-app.md/v1/usage '{"value": 37, "max": 100, "label": "connections"}' --format json
mass stash set billing-dev-app.md/v1/traffic '{"rps": 240, "errors_5m": 2, "p95_ms": 85}' --format json
mass stash set billing-dev.md/v1/banner '{"message": "Deploy freeze until Friday", "level": "warning"}' --format json
mass stash set billing-dev.md/v1/links '{"links": [{"label": "Runbook", "url": "https://wiki.example.com/billing"}]}' --format json
```

Traffic counts toward a link when the instance that the link leaves sets `md/v1/traffic`. A link between two environments adds up the traffic of each instance in the first environment that sends on it. Traffic that has not been reported for 10 minutes shows as `stale`.

## Your annotations

The dashboard also shows the annotations you pin in the web app:

- **Widgets you pin** read any stash key, not only the well-known ones, including a field of a JSON entry and a number written as text. A widget you pin replaces the automatic widget in the same spot. If yours has no value, the automatic one shows.
- **Notes** render their Liquid template with the same namespaces as the canvas: `project`, `environment`, `component`, `instance`, `source`, and `destination`. Markdown becomes plain text, links keep their text, and images are dropped.

| A note pinned to | Shows in the side panel |
|---|---|
| A project | Under the banner of each of the project's environments |
| An environment | Under its banner |
| An instance or a component | Under the instance |
| A line | Under **NOTES ON LINKS**, with the two instances it joins |

A note that does not render shows the template's error in its place. A note that takes too long to render is cut off.

### Annotations need a personal access token

Only you can see your annotations, and service accounts cannot have them. When you run the dashboard with a profile that signs in as a service account, notes and pinned widgets do not show, and `?` says why. Automatic widgets from well-known keys still show. Use a profile with your personal access token to see your annotations.

## Text from the stash

The dashboard removes control characters, bidirectional overrides, and directional marks from text it reads from the stash and from notes, so a value cannot change your terminal or disguise itself.
