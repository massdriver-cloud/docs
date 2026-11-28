---
id: guides-stash-recipes
slug: /guides/stash/recipes
title: Stash Recipes
sidebar_label: Recipes
---

# Stash Recipes

:::caution Alpha
This feature is alpha. Names, fields, and behavior can change or be removed at any time without notice.
:::

These recipes use the [`mass alpha stash` commands](/guides/stash/cli). In a provisioner, `MASSDRIVER_DEPLOYMENT_ID` holds the deployment's UUID. For short examples, such as passing a value between steps, keeping a value for a set time, and running a step once, see [Use cases](/guides/stash#use-cases).

## Record deployment stats

Write a JSON entry with a label. It shows in the **Deployment metadata** section of the deployment's details, with one tile for each field.

```bash
mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.stats" \
  "$(jq -n '{duration_s: 412, changed: 3}')" \
  --format json --label "Deployment stats"
```

## Show traffic on the canvas

Write `md/v1/traffic` on the instance that sends the traffic, once a minute, from a scheduled job. The [traffic widget](/guides/annotations/widgets#traffic) shows on every line that leaves the instance. Set a TTL so that the widget goes away when your job stops writing.

```bash
mass alpha stash set "billing-dev-app.md/v1/traffic" \
  '{"rps": 240, "errors_5m": 2, "p95_ms": 180}' \
  --format json --ttl 180
```

## Sync metrics with stash-sync

The [`stash-sync` automation](https://github.com/massdriver-cloud/massdriver-automations/tree/main/automations/stash-sync) reads metrics on an interval and writes them to stash entries. It runs in your cloud, with your credentials.

- **Sources:** AWS CloudWatch metrics and alarms, and Prometheus queries.
- **Presets:** `aws-rds-connections`, `aws-alb-traffic`, `aws-alarm-health`, and `prometheus-traffic` each fill one `md/` key with no queries to write.
- **Rules:** a rule writes one entry, or one field of a JSON entry, from a query or a fixed value.
- **Simulate mode:** writes changing values from a scenario, with no cloud access. The scenarios are `steady`, `incident`, `postgres-cutover`, and `rollout`. Use it for demos and tests.

Every write sets a TTL of three intervals. When the automation stops, its entries expire and their widgets go away. See the README for the configuration and the permissions that its service account needs.
