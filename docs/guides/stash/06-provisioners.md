---
id: guides-stash-provisioners
slug: /guides/stash/provisioners
title: Stash for Provisioners
sidebar_label: For Provisioners
---

# Stash for Provisioners

:::caution Alpha
This feature is alpha. Names, fields, and behavior can change or be removed at any time without notice.
:::

A provisioner can write values to the stash while a deployment runs. The Massdriver UI shows them with no setup.

| You write | It shows as |
|---|---|
| An entry with a label, on the deployment | A row in **Deployment metadata** in the deployment's details |
| An entry with a label, on the instance | A row in the instance's **Metadata** tab |
| An entry with a label, on the project | A row in the **Metadata** card on the project page |
| A [well-known key](/guides/stash/well-known-keys) | A [widget](/guides/annotations/widgets), or a deployment result in the deployment's details and the instance's **Metadata** tab |
| Any entry | A value that a person can show in a [note](/guides/annotations/notes) |

An entry without a label is stored, and you can read it. It does not show as a metadata row.

For how people see these values in the UI, see [Annotations](/guides/annotations). For the reference of every well-known key, see [Well-known keys](/guides/stash/well-known-keys).

## Sign in from a provisioner

In a deployment, `mass alpha stash` signs in with the deployment's token. You do not need an API key. Massdriver sets these variables in every provisioner step:

| Variable | Use |
|---|---|
| `MASSDRIVER_DEPLOYMENT_ID` | The deployment's UUID. Use it as the scope of the deployment's stash: `"$MASSDRIVER_DEPLOYMENT_ID.<key>"`. |
| `MASSDRIVER_INSTANCE_ID` | The instance's identifier, such as `billing-dev-app`. Use it as the scope of the instance's stash. |
| `MASSDRIVER_STEP_PATH` | The path of the current bundle step. Use it in keys that hold one value for each step. |
| `MASSDRIVER_DEPLOYMENT_ACTION` | `plan`, `provision`, or `decommission`. |
| `MASSDRIVER_TOKEN` | The deployment's token. The CLI reads it. |

The token can read and write the stash of its deployment, and of the deployment's instance, environment, component, and project.

## Commands

```bash
# A text entry with a label shows as a metadata row
mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.duration_s" 142 --label "Apply duration (s)"

# A JSON entry shows one tile for each top-level field
mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.plan" '{"add": 2, "change": 3, "destroy": 0}' --format json --label "Plan"

# An entry with a TTL is deleted after that many seconds
mass alpha stash set "$MASSDRIVER_INSTANCE_ID.md/v1/traffic" '{"rps": 240, "errors_5m": 2, "p95_ms": 180}' --format json --ttl 600

# An immutable entry cannot be set again. Use it to mark that a step already ran.
mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.migrations/ran" true --immutable

# Read a value in a later step
mass alpha stash get "$MASSDRIVER_DEPLOYMENT_ID.plan"

# List the entries in one stash
mass alpha stash list "$MASSDRIVER_DEPLOYMENT_ID"
```

A value of `-` reads the value from standard input:

```bash
tofu show -json plan.out \
  | jq -c '{add: [.resource_changes[] | select(.change.actions == ["create"])] | length}' \
  | mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.plan" - --format json
```

Do not put secrets in labels. A label is not encrypted. `--sensitive` encrypts a value and hides it from people without `stash:export`. A well-known `md/` key cannot be sensitive.

## Widgets

The `md/v1/health`, `md/v1/usage`, and `md/v1/traffic` keys on the instance, and the `md/v1/banner` and `md/v1/links` keys on the environment, show [widgets](/guides/annotations/widgets) on the canvas. Health, usage, and traffic show live data. A provisioner can set a first value, for example `md/v1/health` = `healthy` after a successful apply. A metrics job, such as the [`stash-sync` automation](/guides/stash/recipes#sync-metrics-with-stash-sync), keeps the values current.

```bash
mass alpha stash set "$MASSDRIVER_INSTANCE_ID.md/v1/health" healthy
```

## Deployment results

A provisioner can write the result of each step to [well-known deployment result keys](/guides/stash/well-known-keys#deployment-results). Each key has the same shape for every tool.

```bash
# How this step ran
mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.md/v1/step/$MASSDRIVER_STEP_PATH" \
  '{"tool": "opentofu", "action": "apply", "status": "succeeded", "duration_s": 142}' \
  --format json

# What the apply changed
mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.md/v1/changes/$MASSDRIVER_STEP_PATH" \
  '{"tool": "opentofu", "add": 2, "change": 3, "destroy": 0}' \
  --format json

# What runs on the instance now
mass alpha stash set "$MASSDRIVER_INSTANCE_ID.md/v1/release" \
  '{"version": "2026.11.27-5", "image": "visits:a41c9e2"}' \
  --format json
```

Most result keys are set on the deployment. `md/v1/drift` and `md/v1/release` are set on the instance. You do not write a deployment's results to the instance as well. A read of the instance's widgets also returns the results of its latest deployment.

The results show in a **Results** section in the deployment's details, and in a card on the instance's **Metadata** tab. A warning badge shows on the instance node on the canvas when a step failed, a compliance result is blocking, a scan found critical or high vulnerabilities, or drift is detected. See [Where results show](/guides/stash/well-known-keys#where-results-show).
