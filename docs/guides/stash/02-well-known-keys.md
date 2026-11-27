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

Keys that start with `md/` are reserved. There are two groups:

- **Widget keys** on instances and environments. The UI shows each one as a [widget](/guides/annotations/widgets) to everyone with `stash:view` on the stash.
- **[Deployment results](#deployment-results)** that a provisioner writes while a deployment runs.

| Key | Set on | Format | Widget |
|---|---|---|---|
| `md/v1/health` | Instance | TEXT | Status dot on the instance |
| `md/v1/usage` | Instance | JSON | Usage bar on the instance |
| `md/v1/traffic` | Instance | JSON | Traffic on the lines that leave the instance |
| `md/v1/banner` | Environment | JSON | Banner across the top of the environment |
| `md/v1/links` | Environment | JSON | Links in the environment header |

The server rejects a write to an `md/` key when:

- The key is not a key on this page. This includes a key without a version, such as `md/health`. The error names the key to use, such as `md/v1/health`.
- The key is set on the wrong kind of entity.
- The format is not the one in the table.
- The value does not match the key's schema.
- The entry is sensitive.

## Versions

Each well-known key has a version in its path, such as `v1` in `md/v1/health`. A breaking change to the shape of a key's value ships as a new version, with a new key, next to the old one. An old version is removed only after the deprecation period of its stability level. When a stash has more than one version of a key, the UI shows the widget from the highest version.

Each schema has an `$id` that names its key and version, such as `https://schemas.massdriver.cloud/stash/md/v1/health.json`.

The `alphaWidgetCatalog` query returns these keys, their versions, and their schemas. See [GraphQL API](/guides/stash/api#alphawidgetcatalog).

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

## Deployment results

A provisioner writes these keys while a deployment runs. Each key has the same shape for every tool, so a result from OpenTofu, Helm, or Bicep, or from Checkov or Trivy, has the same fields. The `tool` field names the tool that wrote it.

| Key | Set on | Holds |
|---|---|---|
| `md/v1/step/<step>` | Deployment | How a step ran |
| `md/v1/changes/<step>` | Deployment | What a plan or apply changes |
| `md/v1/compliance/<step>` | Deployment | The findings of an IaC or configuration scanner |
| `md/v1/policy/<step>` | Deployment | The results of a policy engine |
| `md/v1/vulnerabilities` | Deployment | The findings of an image or package scan |
| `md/v1/tests` | Deployment | Test results |
| `md/v1/cost_estimate` | Deployment | The monthly cost before and after the deployment |
| `md/v1/source` | Deployment | The code that the deployment deployed |
| `md/v1/state_lock` | Deployment | The state lock that the deployment held |
| `md/v1/drift` | Instance | Whether the real infrastructure matches the configuration |
| `md/v1/release` | Instance | What runs on the instance now |

Every schema has `additionalProperties: false`. Counts are whole numbers of 0 or more. Times are RFC 3339 strings. URLs are `http` or `https`.

The Massdriver UI does not show deployment results yet. Keys that start with `md/` do not show as metadata rows. Read the results with the [`alphaWidgetsForScopes`](/guides/stash/api#alphawidgetsforscopes) query, or with `mass alpha stash get`.

### Step keys

A key with `<step>` holds one value for each step of a bundle, because a bundle can have more than one step of the same kind. Put the step's path in place of `<step>`. In a provisioner, the path is in `MASSDRIVER_STEP_PATH`.

```bash
mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.md/v1/step/$MASSDRIVER_STEP_PATH" \
  '{"tool": "opentofu", "action": "apply", "status": "succeeded"}' \
  --format json
```

A step is 1 to 63 lowercase letters, digits, `_`, and `-`, and starts with a letter or a digit. A key with a step that does not fit this rule is rejected, and the error names the rule.

The `alphaWidgetCatalog` query returns the key with the step as a pattern, such as `md/v1/step/{step}`, and the names of the segments in `keySegments`. Each widget from `alphaWidgetsForScopes` has the values of the segments in `segments`, such as `{"step": "src"}`.

### Results on the instance

You do not write a deployment's results to the instance a second time. When you read the widgets of an instance with `alphaWidgetsForScopes`, the query also returns the results of the instance's latest deployment that has a well-known key. The `scope` of each of those widgets is that deployment. When you read a deployment's widgets, the query returns the results of that deployment only.

The instance's `stash:view` permission covers these results, because a deployment's entries belong to its instance.

### `md/v1/step/<step>`

How one step of a deployment ran. Set on a deployment. Format: JSON. Widget name: `deployment.step`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.massdriver.cloud/stash/md/v1/step.json",
  "type": "object",
  "required": ["tool", "action", "status"],
  "additionalProperties": false,
  "properties": {
    "action": { "enum": ["plan", "apply", "destroy", "test", "scan"] },
    "duration_s": { "type": "number", "minimum": 0 },
    "exit_code": { "type": "integer" },
    "finished_at": { "type": "string", "format": "date-time" },
    "message": { "type": "string", "maxLength": 280 },
    "started_at": { "type": "string", "format": "date-time" },
    "status": { "enum": ["running", "succeeded", "failed", "skipped", "canceled"] },
    "tool": { "type": "string", "maxLength": 64, "minLength": 1 },
    "tool_version": { "type": "string", "maxLength": 64, "minLength": 1 }
  }
}
```

| Field | Required | Meaning |
|---|---|---|
| `tool` | yes | The tool, for example `opentofu`. |
| `tool_version` | no | The tool's version. |
| `action` | yes | `plan`, `apply`, `destroy`, `test`, or `scan`. |
| `status` | yes | `running`, `succeeded`, `failed`, `skipped`, or `canceled`. |
| `started_at` | no | When the step started (RFC 3339). |
| `finished_at` | no | When the step finished (RFC 3339). |
| `duration_s` | no | How long the step ran, in seconds. |
| `exit_code` | no | The exit code of the tool. |
| `message` | no | A short summary, up to 280 characters. |

```bash
mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.md/v1/step/$MASSDRIVER_STEP_PATH" \
  '{"tool": "opentofu", "tool_version": "1.10.6", "action": "apply", "status": "succeeded", "started_at": "2026-11-27T20:01:02Z", "finished_at": "2026-11-27T20:03:24Z", "duration_s": 142, "exit_code": 0, "message": "Apply complete"}' \
  --format json
```

### `md/v1/changes/<step>`

What a plan or apply in one step of a deployment changes. Set on a deployment. Format: JSON. Widget name: `deployment.changes`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.massdriver.cloud/stash/md/v1/changes.json",
  "type": "object",
  "required": ["tool", "add", "change", "destroy"],
  "additionalProperties": false,
  "properties": {
    "add": { "type": "integer", "minimum": 0 },
    "change": { "type": "integer", "minimum": 0 },
    "destroy": { "type": "integer", "minimum": 0 },
    "no_op": { "type": "integer", "minimum": 0 },
    "replace": { "type": "integer", "minimum": 0 },
    "resources": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["address", "action"],
        "additionalProperties": false,
        "properties": {
          "action": { "enum": ["create", "update", "delete", "replace"] },
          "address": { "type": "string", "maxLength": 512, "minLength": 1 }
        }
      },
      "maxItems": 50
    },
    "tool": { "type": "string", "maxLength": 64, "minLength": 1 },
    "tool_version": { "type": "string", "maxLength": 64, "minLength": 1 }
  }
}
```

| Field | Required | Meaning |
|---|---|---|
| `tool` | yes | The tool, for example `opentofu`. |
| `tool_version` | no | The tool's version. |
| `add` | yes | The number of resources to create. |
| `change` | yes | The number of resources to update. |
| `destroy` | yes | The number of resources to delete. |
| `replace` | no | The number of resources to replace. |
| `no_op` | no | The number of resources with no change. |
| `resources` | no | Up to 50 changed resources, each with an `address` and an `action`: `create`, `update`, `delete`, or `replace`. |

```bash
mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.md/v1/changes/$MASSDRIVER_STEP_PATH" \
  '{"tool": "opentofu", "add": 2, "change": 3, "destroy": 0, "replace": 1, "no_op": 41, "resources": [{"address": "aws_ecs_service.app", "action": "update"}]}' \
  --format json
```

### `md/v1/compliance/<step>`

The findings of an IaC or configuration scanner in one step of a deployment. Set on a deployment. Format: JSON. Widget name: `deployment.compliance`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.massdriver.cloud/stash/md/v1/compliance.json",
  "type": "object",
  "required": ["tool", "passed", "failed"],
  "additionalProperties": false,
  "properties": {
    "blocking": { "type": "boolean" },
    "failed": { "type": "integer", "minimum": 0 },
    "passed": { "type": "integer", "minimum": 0 },
    "report_url": { "type": "string", "maxLength": 2048, "pattern": "^https?://[^\\s]+(?![\\s\\S])" },
    "severity": {
      "type": "object",
      "required": ["critical", "high", "medium", "low"],
      "additionalProperties": false,
      "properties": {
        "critical": { "type": "integer", "minimum": 0 },
        "high": { "type": "integer", "minimum": 0 },
        "low": { "type": "integer", "minimum": 0 },
        "medium": { "type": "integer", "minimum": 0 }
      }
    },
    "skipped": { "type": "integer", "minimum": 0 },
    "tool": { "type": "string", "maxLength": 64, "minLength": 1 },
    "tool_version": { "type": "string", "maxLength": 64, "minLength": 1 }
  }
}
```

| Field | Required | Meaning |
|---|---|---|
| `tool` | yes | The tool, for example `opentofu`. |
| `tool_version` | no | The tool's version. |
| `passed` | yes | The number of checks that passed. |
| `failed` | yes | The number of checks that failed. |
| `skipped` | no | The number of checks that were skipped. |
| `severity` | no | The number of findings by severity: `critical`, `high`, `medium`, and `low`. |
| `blocking` | no | True when the findings stop the deployment. |
| `report_url` | no | An http or https link to the report. |

```bash
mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.md/v1/compliance/$MASSDRIVER_STEP_PATH" \
  '{"tool": "checkov", "tool_version": "3.2.0", "passed": 36, "failed": 2, "skipped": 4, "severity": {"critical": 0, "high": 1, "medium": 1, "low": 0}, "blocking": false}' \
  --format json
```

### `md/v1/policy/<step>`

The results of a policy engine in one step of a deployment. Set on a deployment. Format: JSON. Widget name: `deployment.policy`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.massdriver.cloud/stash/md/v1/policy.json",
  "type": "object",
  "required": ["tool", "passed", "failed"],
  "additionalProperties": false,
  "properties": {
    "denials": {
      "type": "array",
      "items": { "type": "string", "maxLength": 280, "minLength": 1 },
      "maxItems": 50
    },
    "failed": { "type": "integer", "minimum": 0 },
    "passed": { "type": "integer", "minimum": 0 },
    "tool": { "type": "string", "maxLength": 64, "minLength": 1 },
    "tool_version": { "type": "string", "maxLength": 64, "minLength": 1 },
    "warnings": { "type": "integer", "minimum": 0 }
  }
}
```

| Field | Required | Meaning |
|---|---|---|
| `tool` | yes | The tool, for example `opentofu`. |
| `tool_version` | no | The tool's version. |
| `passed` | yes | The number of policies that passed. |
| `failed` | yes | The number of policies that failed. |
| `warnings` | no | The number of warnings. |
| `denials` | no | Up to 50 denial messages, each up to 280 characters. |

```bash
mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.md/v1/policy/$MASSDRIVER_STEP_PATH" \
  '{"tool": "conftest", "passed": 12, "failed": 1, "warnings": 2, "denials": ["Production databases must be Multi-AZ"]}' \
  --format json
```

### `md/v1/vulnerabilities`

The findings of an image or package scan in a deployment. Set on a deployment. Format: JSON. Widget name: `deployment.vulnerabilities`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.massdriver.cloud/stash/md/v1/vulnerabilities.json",
  "type": "object",
  "required": ["tool", "severity"],
  "additionalProperties": false,
  "properties": {
    "fixable": { "type": "integer", "minimum": 0 },
    "severity": {
      "type": "object",
      "required": ["critical", "high", "medium", "low"],
      "additionalProperties": false,
      "properties": {
        "critical": { "type": "integer", "minimum": 0 },
        "high": { "type": "integer", "minimum": 0 },
        "low": { "type": "integer", "minimum": 0 },
        "medium": { "type": "integer", "minimum": 0 }
      }
    },
    "target": { "type": "string", "maxLength": 512, "minLength": 1 },
    "tool": { "type": "string", "maxLength": 64, "minLength": 1 },
    "tool_version": { "type": "string", "maxLength": 64, "minLength": 1 }
  }
}
```

| Field | Required | Meaning |
|---|---|---|
| `tool` | yes | The tool, for example `opentofu`. |
| `tool_version` | no | The tool's version. |
| `target` | no | The image or package that was scanned. |
| `severity` | yes | The number of findings by severity: `critical`, `high`, `medium`, and `low`. |
| `fixable` | no | The number of findings with a fix. |

```bash
mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.md/v1/vulnerabilities" \
  '{"tool": "trivy", "target": "visits:a41c9e2", "severity": {"critical": 0, "high": 2, "medium": 9, "low": 14}, "fixable": 7}' \
  --format json
```

### `md/v1/tests`

The test results of a deployment. Set on a deployment. Format: JSON. Widget name: `deployment.tests`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.massdriver.cloud/stash/md/v1/tests.json",
  "type": "object",
  "required": ["tool", "passed", "failed"],
  "additionalProperties": false,
  "properties": {
    "duration_s": { "type": "number", "minimum": 0 },
    "failed": { "type": "integer", "minimum": 0 },
    "passed": { "type": "integer", "minimum": 0 },
    "skipped": { "type": "integer", "minimum": 0 },
    "tool": { "type": "string", "maxLength": 64, "minLength": 1 },
    "tool_version": { "type": "string", "maxLength": 64, "minLength": 1 }
  }
}
```

| Field | Required | Meaning |
|---|---|---|
| `tool` | yes | The tool, for example `opentofu`. |
| `tool_version` | no | The tool's version. |
| `passed` | yes | The number of tests that passed. |
| `failed` | yes | The number of tests that failed. |
| `skipped` | no | The number of tests that were skipped. |
| `duration_s` | no | How long the tests ran, in seconds. |

```bash
mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.md/v1/tests" \
  '{"tool": "smoke", "passed": 8, "failed": 0, "skipped": 1, "duration_s": 21}' \
  --format json
```

### `md/v1/cost_estimate`

The estimated monthly cost of an instance before and after a deployment. Set on a deployment. Format: JSON. Widget name: `deployment.cost_estimate`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.massdriver.cloud/stash/md/v1/cost_estimate.json",
  "type": "object",
  "required": ["tool", "currency", "monthly_after"],
  "additionalProperties": false,
  "properties": {
    "currency": { "type": "string", "pattern": "^[A-Z]{3}$" },
    "delta": { "type": "number" },
    "monthly_after": { "type": "number", "minimum": 0 },
    "monthly_before": { "type": "number", "minimum": 0 },
    "tool": { "type": "string", "maxLength": 64, "minLength": 1 },
    "tool_version": { "type": "string", "maxLength": 64, "minLength": 1 }
  }
}
```

| Field | Required | Meaning |
|---|---|---|
| `tool` | yes | The tool, for example `opentofu`. |
| `tool_version` | no | The tool's version. |
| `currency` | yes | The ISO 4217 currency code, for example `USD`. |
| `monthly_before` | no | The monthly cost before the deployment. |
| `monthly_after` | yes | The monthly cost after the deployment. |
| `delta` | no | The change in monthly cost. Negative when the cost goes down. |

```bash
mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.md/v1/cost_estimate" \
  '{"tool": "infracost", "currency": "USD", "monthly_before": 41.20, "monthly_after": 41.58, "delta": 0.38}' \
  --format json
```

### `md/v1/source`

The code that a deployment deployed. Set on a deployment. Format: JSON. Widget name: `deployment.source`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.massdriver.cloud/stash/md/v1/source.json",
  "type": "object",
  "required": ["commit"],
  "additionalProperties": false,
  "properties": {
    "author": { "type": "string", "maxLength": 255, "minLength": 1 },
    "commit": { "type": "string", "maxLength": 64, "minLength": 1 },
    "message": { "type": "string", "maxLength": 280 },
    "ref": { "type": "string", "maxLength": 255, "minLength": 1 },
    "repo": { "type": "string", "maxLength": 255, "minLength": 1 },
    "url": { "type": "string", "maxLength": 2048, "pattern": "^https?://[^\\s]+(?![\\s\\S])" }
  }
}
```

| Field | Required | Meaning |
|---|---|---|
| `repo` | no | The repository, for example `acme/api`. |
| `ref` | no | The branch or tag. |
| `commit` | yes | The commit. |
| `author` | no | The commit's author. |
| `message` | no | The commit message, up to 280 characters. |
| `url` | no | An http or https link to the commit. |

```bash
mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.md/v1/source" \
  '{"repo": "acme/visits", "ref": "main", "commit": "a41c9e2", "author": "maria", "message": "Send waitlist emails", "url": "https://github.com/acme/visits/commit/a41c9e2"}' \
  --format json
```

### `md/v1/state_lock`

The state lock that a deployment held. Set on a deployment. Format: JSON. Widget name: `deployment.state_lock`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.massdriver.cloud/stash/md/v1/state_lock.json",
  "type": "object",
  "required": ["tool", "status"],
  "additionalProperties": false,
  "properties": {
    "holder": { "type": "string", "maxLength": 255, "minLength": 1 },
    "status": { "enum": ["acquired", "released", "force_unlocked"] },
    "tool": { "type": "string", "maxLength": 64, "minLength": 1 },
    "tool_version": { "type": "string", "maxLength": 64, "minLength": 1 }
  }
}
```

| Field | Required | Meaning |
|---|---|---|
| `tool` | yes | The tool, for example `opentofu`. |
| `tool_version` | no | The tool's version. |
| `status` | yes | `acquired`, `released`, or `force_unlocked`. |
| `holder` | no | Who holds the lock. |

```bash
mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.md/v1/state_lock" \
  '{"tool": "opentofu", "status": "released", "holder": "deployment"}' \
  --format json
```

### `md/v1/drift`

Whether an instance's real infrastructure matches its configuration. Set on an instance. Format: JSON. Widget name: `instance.drift`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.massdriver.cloud/stash/md/v1/drift.json",
  "type": "object",
  "required": ["status"],
  "additionalProperties": false,
  "properties": {
    "checked_at": { "type": "string", "format": "date-time" },
    "resources": { "type": "integer", "minimum": 0 },
    "status": { "enum": ["none", "detected", "unknown"] }
  }
}
```

| Field | Required | Meaning |
|---|---|---|
| `status` | yes | `none`, `detected`, or `unknown`. |
| `resources` | no | The number of resources that drifted. |
| `checked_at` | no | When drift was checked (RFC 3339). |

```bash
mass alpha stash set "$MASSDRIVER_INSTANCE_ID.md/v1/drift" \
  '{"status": "none", "resources": 0, "checked_at": "2026-11-27T20:03:24Z"}' \
  --format json
```

### `md/v1/release`

What runs on an instance now. Set on an instance. Format: JSON. Widget name: `instance.release`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.massdriver.cloud/stash/md/v1/release.json",
  "type": "object",
  "required": ["version"],
  "additionalProperties": false,
  "properties": {
    "deployed_at": { "type": "string", "format": "date-time" },
    "image": { "type": "string", "maxLength": 512, "minLength": 1 },
    "version": { "type": "string", "maxLength": 128, "minLength": 1 }
  }
}
```

| Field | Required | Meaning |
|---|---|---|
| `version` | yes | The version that runs. |
| `image` | no | The image that runs. |
| `deployed_at` | no | When it was deployed (RFC 3339). |

```bash
mass alpha stash set "$MASSDRIVER_INSTANCE_ID.md/v1/release" \
  '{"version": "2026.11.27-5", "image": "visits:a41c9e2", "deployed_at": "2026-11-27T20:03:24Z"}' \
  --format json
```
