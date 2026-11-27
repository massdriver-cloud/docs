---
id: guides-annotations-notes
slug: /guides/annotations/notes
title: Notes
sidebar_label: Notes
---

# Notes

A note is text that you write in [Liquid](https://shopify.github.io/liquid/). Massdriver puts stash values into the text, then shows the result as markdown.

## Where a note shows

| Pinned to | Shows on |
|---|---|
| A project | The project header, next to the project name |
| An environment | The canvas legend |
| An instance | The instance's node on the canvas |
| A line between two instances | The line on the canvas |

## Stash values

Each stash is a namespace. Read a key with bracket access:

```liquid
{{ instance.stash["schema.version"] }}
```

Use bracket access for every key. Keys can hold `.`, `/`, and `-`, which dot access cannot read.

The namespaces you can use depend on where the note is pinned.

| Pinned to | Namespaces |
|---|---|
| A project | `project` |
| An environment | `project`, `environment` |
| An instance | `project`, `environment`, `component`, `instance` |
| A line | `project`, `environment`, `source`, `destination` |

On a line, `source` is the instance at the start of the line and `destination` is the instance at the end.

Each namespace also has an `id`, such as `{{ instance.id }}`.

### Text and JSON entries

A text entry is a string. A JSON entry is an object, so you can read its fields:

```liquid
{{ instance.stash["md/traffic"].rps }} requests per second
```

### Missing values

A key that is missing, expired, or sensitive renders as empty. Use the `default` filter to show something else:

```liquid
Owner: {{ instance.stash["owner"] | default: "not set" }}
```

Use `if` to show a line only when a value exists:

```liquid
{% if instance.stash["incident"] %}Incident: {{ instance.stash["incident"] }}{% endif %}
```

## Liquid that works here

- Output tags: `{{ ... }}`
- Tags: `if`, `elsif`, `else`, `unless`, `case`, `for`, `assign`, `capture`
- The standard Liquid filters, such as `default`, `upcase`, `downcase`, `round`, `times`, `divided_by`, `plus`, `minus`, `date`, `join`, and `size`

An unknown filter is an error. The note shows the error message in place of the text. `include` and `render` are not available.

## Markdown output

The output of a note renders as markdown. You can use headings, lists, bold, italics, code, and tables.

- Links work only with `http` and `https` URLs. A link with any other URL shows as plain text. Links open in a new browser tab.
- Images do not show.
- Raw HTML does not show.

## Cookbook

### Status line on an instance

Pin to an instance.

```bash
mass stash set billing-dev-app.status "healthy"
mass stash set billing-dev-app.version "2.14.0"
```

```liquid
**{{ instance.stash["status"] | default: "unknown" | upcase }}** · v{{ instance.stash["version"] | default: "?" }}
```

### Connection pool usage

Pin to an instance.

```bash
mass stash set billing-dev-app.db/connections "42"
mass stash set billing-dev-app.db/max_connections "100"
```

```liquid
{% if instance.stash["db/connections"] %}Pool: {{ instance.stash["db/connections"] }} / {{ instance.stash["db/max_connections"] }} connections{% endif %}
```

### Traffic note on a line

Pin to a line. The source instance writes its traffic to its own stash as a JSON entry.

```bash
mass stash set billing-dev-app.md/traffic '{"rps": 120.5, "errors_5m": 3, "p95_ms": 84}' --format json --ttl 300
```

```liquid
{% assign t = source.stash["md/traffic"] %}
{% if t %}{{ t.rps | round }} rps · p95 {{ t.p95_ms }} ms · {{ t.errors_5m }} errors in 5 min{% else %}No traffic data{% endif %}
```

The `--ttl 300` flag deletes the entry after 5 minutes. When the writer stops, the note shows "No traffic data". The same entry also draws the [traffic widget](/guides/annotations/widgets#traffic) on the line.

### Canvas legend with a runbook link

Pin to an environment.

```bash
mass stash set billing-dev.oncall "Dana Smith"
mass stash set billing-dev.runbook "https://wiki.example.com/billing/runbook"
```

```liquid
### billing dev
- On call: {{ environment.stash["oncall"] | default: "nobody" }}
- [Runbook]({{ environment.stash["runbook"] }})
```

### Release train on a project

Pin to a project.

```bash
mass stash set billing.release/train '{"name": "2026.48", "cutoff": "2026-11-28T17:00:00Z", "captain": "Lee"}' --format json
```

```liquid
{% assign train = project.stash["release/train"] %}
{% if train %}Train {{ train.name }} · cutoff {{ train.cutoff | date: "%b %-d %H:%M" }} · {{ train.captain }}{% endif %}
```

The `date` filter shows the time in your browser's time zone.

### Migration marker from a deployment step

Pin to an instance. A deployment writes the schema version after its migrations run.

```bash
mass stash set billing-dev-app.schema.version "42" --label "Schema version"
```

```liquid
Schema {{ instance.stash["schema.version"] | default: "unknown" }}
```
