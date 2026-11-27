---
id: guides-stash-well-known-keys
slug: /guides/stash/well-known-keys
title: Well-Known Keys
sidebar_label: Well-Known Keys
---

# Well-Known Keys

:::caution Alpha
This feature is alpha. Names, fields, and behavior can change or be removed at any time without notice.
:::

Keys that start with `md/` are reserved. Each one shows a [widget](/guides/annotations/widgets) to everyone who has `stash:view` on the entity that holds the key.

| Key | Set on | Format | Widget |
|---|---|---|---|
| `md/v1/health` | Instance | TEXT | Status dot on the instance |
| `md/v1/usage` | Instance | JSON | Usage bar on the instance |
| `md/v1/traffic` | Instance | JSON | Traffic on the lines that leave the instance |
| `md/v1/banner` | Environment | JSON | Banner across the top of the environment |
| `md/v1/links` | Environment | JSON | Links in the environment header |

The server rejects a write to an `md/` key when:

- The key is not in this table.
- The key is set on the wrong kind of entity.
- The format is not the one in the table.
- The value does not match the key's schema.
- The entry is sensitive.

The `alphaWidgetCatalog` query returns these keys and their schemas. See [GraphQL API](/guides/stash/api#alphawidgetcatalog).

## Versions

Each well-known key has a version in its name: `md/v<version>/<name>`. For example, `md/v1/health` is version 1 of `health`.

A change that breaks the shape of a key adds a new version with a new key, such as `md/v2/usage`. The old version keeps working until its deprecation window ends. When a stash has more than one version of a key, the widget uses the highest version.

`alphaWidgetCatalog` returns one row for each version of each widget. The `version` field has the version number.

Keys without a version, such as `md/health`, are not accepted. The server rejects the write with `md/health is not a well-known key. Use md/v1/health`. Massdriver renamed the entries that used the old keys to the new keys. It also changed the inputs of pinned widgets that read the old keys.

## `md/v1/health`

Set on an instance. Format: TEXT. Shows the [status dot](/guides/annotations/widgets#status-dot).

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.massdriver.cloud/stash/md/v1/health.json",
  "type": "string",
  "minLength": 1,
  "maxLength": 64,
  "examples": ["healthy", "degraded", "down"]
}
```

The dot is green for `healthy`, `ok`, and `up`. It is amber for `degraded`, `warning`, and `recovering`. It is red for `down`, `failed`, and `error`. It is gray for any other value.

```bash
mass alpha stash set billing-dev-app.md/v1/health degraded
```

## `md/v1/usage`

Set on an instance. Format: JSON. Shows the [usage bar](/guides/annotations/widgets#usage-bar).

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.massdriver.cloud/stash/md/v1/usage.json",
  "type": "object",
  "required": ["value", "max"],
  "additionalProperties": false,
  "properties": {
    "value": { "type": "number", "minimum": 0 },
    "max": { "type": "number", "exclusiveMinimum": 0 },
    "label": { "type": "string", "maxLength": 64 }
  }
}
```

| Field | Meaning |
|---|---|
| `value` | The amount in use. |
| `max` | The limit. |
| `label` | Optional. Text shown with the bar. |

```bash
mass alpha stash set billing-dev-app.md/v1/usage '{"value": 37, "max": 100, "label": "connections"}' --format json
```

## `md/v1/traffic`

Set on the instance that sends the traffic. Format: JSON. Shows [traffic](/guides/annotations/widgets#traffic) on every line that leaves the instance.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.massdriver.cloud/stash/md/v1/traffic.json",
  "type": "object",
  "required": ["rps", "errors_5m"],
  "additionalProperties": false,
  "properties": {
    "rps": { "type": "number", "minimum": 0 },
    "errors_5m": { "type": "integer", "minimum": 0 },
    "p95_ms": { "type": "number", "minimum": 0 }
  }
}
```

| Field | Meaning |
|---|---|
| `rps` | Requests per second. |
| `errors_5m` | Errors in the last 5 minutes. |
| `p95_ms` | Optional. The 95th percentile response time, in milliseconds. |

```bash
mass alpha stash set billing-dev-app.md/v1/traffic '{"rps": 240, "errors_5m": 2, "p95_ms": 180}' --format json --ttl 600
```

## `md/v1/banner`

Set on an environment. Format: JSON. Shows a [banner](/guides/annotations/widgets#banner).

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.massdriver.cloud/stash/md/v1/banner.json",
  "type": "object",
  "required": ["message"],
  "additionalProperties": false,
  "properties": {
    "message": { "type": "string", "minLength": 1, "maxLength": 280 },
    "level": { "enum": ["info", "warning", "error"] }
  }
}
```

| Field | Meaning |
|---|---|
| `message` | The banner text. |
| `level` | Optional. `info` (the default), `warning`, or `error`. |

```bash
mass alpha stash set billing-dev.md/v1/banner '{"message": "Deploy freeze until Friday", "level": "warning"}' --format json
```

## `md/v1/links`

Set on an environment. Format: JSON. Shows [header links](/guides/annotations/widgets#header-links).

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.massdriver.cloud/stash/md/v1/links.json",
  "type": "object",
  "required": ["links"],
  "additionalProperties": false,
  "properties": {
    "links": {
      "type": "array",
      "minItems": 1,
      "maxItems": 8,
      "items": {
        "type": "object",
        "required": ["label", "url"],
        "additionalProperties": false,
        "properties": {
          "label": { "type": "string", "minLength": 1, "maxLength": 40 },
          "url": { "type": "string", "maxLength": 2048, "pattern": "^https?://[^\\s]+(?![\\s\\S])" }
        }
      }
    }
  }
}
```

| Field | Meaning |
|---|---|
| `links[].label` | The button text. |
| `links[].url` | An `http` or `https` URL with no spaces. |

```bash
mass alpha stash set billing-dev.md/v1/links '{"links": [{"label": "Grafana", "url": "https://grafana.example.com/d/billing"}]}' --format json
```
