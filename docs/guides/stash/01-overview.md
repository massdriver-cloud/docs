---
id: guides-stash-overview
slug: /guides/stash
title: Stash
sidebar_label: Overview
---

# Stash

:::caution Alpha
This feature is alpha. Names, fields, and behavior can change or be removed at any time without notice.
:::

The stash keeps small values about your infrastructure next to the project, environment, component, instance, or deployment they describe. People, the Massdriver UI, the CLI, automations, and later deployment steps can all read them.

Each project, environment, component, instance, and deployment has its own stash. A stash holds key and value entries, such as `db/hostname` = `billing-dev.cluster-abc.us-east-1.rds.amazonaws.com` or `md/v1/health` = `healthy`. Massdriver keeps an entry until you delete it or until it expires.

## Who writes to the stash

| Writer | How it signs in | Example |
|---|---|---|
| A provisioner during a deployment | The deployment's token. Massdriver sets it in every step. | A Terraform step records the database host for a later step. |
| A CI job or a script | A service account's access token, with [`mass alpha stash`](/guides/stash/cli) or the [GraphQL API](/guides/stash/api) | A release job records the version that it deployed. |
| An automation | A service account's access token | The [`stash-sync` automation](/guides/stash/recipes#sync-metrics-with-stash-sync) copies CloudWatch and Prometheus metrics into widget keys. |
| A person | Your own login, with the CLI or the API | You set a maintenance banner on an environment. |

## Who reads the stash

| Reader | What it reads |
|---|---|
| The Metadata panels in the UI | Entries that have a label. See [Metadata](/guides/annotations/metadata). |
| Automatic widgets in the UI | Well-known `md/v1/` keys. See [Well-known keys](/guides/stash/well-known-keys). |
| Notes and widgets that you pin | Any key that you choose. See [Annotations](/guides/annotations). |
| Later deployment steps | Any entry in the stashes that the deployment's token can read |
| Event destinations | `stash_entry.set` and `stash_entry.deleted` events. See [Events](#events). |
| Other automations and scripts | Any entry that their service account can read |

## Use cases

### Pass a value between deployment steps

One step writes a value to the deployment's stash. A later step reads it.

```bash
mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.db/hostname" "$DB_HOST"
DB_HOST=$(mass alpha stash get "$MASSDRIVER_DEPLOYMENT_ID.db/hostname")
```

### Record what a deployment did

Write the result of each step to a well-known deployment result key. The deployment's details show a **Results** section, and the instance's **Metadata** tab shows the latest results.

```bash
mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.md/v1/changes/$MASSDRIVER_STEP_PATH" \
  '{"tool": "opentofu", "add": 2, "change": 3, "destroy": 0}' --format json
mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.md/v1/cost_estimate" \
  '{"tool": "infracost", "currency": "USD", "monthly_before": 41.20, "monthly_after": 41.58}' --format json
```

### Show live health, usage, and traffic on the canvas

Write `md/v1/health`, `md/v1/usage`, or `md/v1/traffic` on an instance. A status dot, a usage bar, or traffic on its lines shows on the canvas for everyone with `stash:view`. Set a TTL so that the widget goes away when the writer stops.

```bash
mass alpha stash set billing-dev-app.md/v1/health degraded --ttl 600
mass alpha stash set billing-dev-app.md/v1/traffic '{"rps": 240, "errors_5m": 2, "p95_ms": 180}' --format json --ttl 600
```

### Put runbook and product links in an environment's header

Write `md/v1/links` on the environment. Each link is a button in the environment header.

```bash
mass alpha stash set billing-dev.md/v1/links \
  '{"links": [{"label": "Runbook", "url": "https://wiki.example.com/billing"}, {"label": "Shop", "url": "https://shop.example.com"}]}' \
  --format json
```

### Show a banner for a maintenance window

Write `md/v1/banner` on the environment with a TTL that ends with the window. The banner goes away when the entry expires.

```bash
mass alpha stash set billing-dev.md/v1/banner \
  '{"message": "Database upgrade from 22:00 to 23:00 UTC", "level": "warning"}' \
  --format json --ttl 7200
```

### Mark a one-time task as done

An immutable entry cannot be set again until it expires or is deleted. The write fails when the key already has a value, so a step can use it to run only once.

```bash
if mass alpha stash set "$MASSDRIVER_DEPLOYMENT_ID.migrations/ran" true --immutable; then
  ./run-migrations.sh
fi
```

### Keep a value for a set time

Set a TTL in seconds. The entry is deleted when the time ends. Compute the value again when it is missing.

```bash
AMI=$(mass alpha stash get billing-dev-app.ami-id) || {
  AMI=$(./find-latest-ami.sh)
  mass alpha stash set billing-dev-app.ami-id "$AMI" --ttl 86400
}
```

### Keep a secret that a later step needs

A sensitive entry is encrypted with your organization's key. Only callers with `stash:export` and the deployment's own token can read the value. It never shows in events, notes, or widgets.

```bash
terraform output -raw kubeconfig | mass alpha stash set billing-dev.kubeconfig - --sensitive
```

## How it works

- **Stashes do not inherit.** A key on an environment is not visible from the stash of its instances or deployments. To read it, read the environment's stash.
- **A set replaces the whole entry.** The value, format, label, TTL, and flags all come from the new write. A setting that you leave out goes back to its default.
- **TTL.** An entry with a TTL expires after that many seconds. An expired entry is not returned.
- **Immutable.** An immutable entry cannot be set again until it expires or is deleted. You can delete it.
- **Sensitive.** A sensitive value is encrypted. It is masked for callers without `stash:export`. It is never sent in events and never available to notes or widgets.
- **Labels.** An entry with a label shows as a row on the Metadata panels. A label is not encrypted.
- **Well-known keys.** Keys that start with `md/` are reserved. The server checks each `md/` write against the key's schema. See [Well-known keys](/guides/stash/well-known-keys).
- **Permissions.** `stash:view`, `stash:write`, and `stash:export` control who can read, write, and read sensitive values. See [Permissions](#permissions).
- **Events.** Each set and delete sends an event. See [Events](#events).

## Entries

| Field | Rules |
|---|---|
| Key | Letters, digits, and the characters `_`, `.`, `/`, and `-`. Up to 255 characters. |
| Value | Always a string. Massdriver returns it exactly as written. It cannot contain the null character. |
| Format | `TEXT` (the default) or `JSON`. A `JSON` value must be a JSON object. The API also returns a `JSON` value parsed, in the `data` field. |
| Label | Optional. A name for the entry, up to 255 characters. |
| TTL | Optional. Seconds until the entry expires, up to 315360000 (10 years). An expired entry is deleted soon after it expires. Without a TTL, the entry stays until you delete it. |
| Immutable | Optional. When true, the key cannot be set again until the entry expires or is deleted. An immutable write fails when the key already has a value. |
| Sensitive | Optional. When true, the value is encrypted with your organization's key. A well-known `md/` key cannot be sensitive. |

## Limits

| Limit | Default | Setting for self-hosted installations |
|---|---|---|
| Value size | 65536 bytes | `MD_STASH_MAX_VALUE_BYTES` |
| Keys in one stash | 1000 | `MD_STASH_MAX_KEYS_PER_SCOPE` |

Expired entries do not count toward the key limit.

## Permissions

The stash has its own [access control](/platform-operations/security/access-control) actions.

| Action | Lets you |
|---|---|
| `stash:view` | Read entries, without sensitive values, and subscribe to their changes |
| `stash:write` | Set and delete entries |
| `stash:export` | Read sensitive values |

Each action is checked against the entity that holds the entries: the project, environment, component, or instance. A deployment's entries belong to its instance. Conditions on that entity's attributes apply. `stash:view` does not come with `project:view`. Grant it on its own.

A deployment's own credentials do not use these actions. A deployment can read and write the stash of that deployment and of its instance, environment, component, and project.

## Events

Each set and delete sends an event. An entry that expires sends no event.

- The `projectEvents`, `environmentEvents`, `instanceEvents`, and `deploymentEvents` subscriptions send an `AlphaStashEntryEvent`. Which subscriptions get it depends on the entity that holds the entry.
- The audit log and [event destinations](/platform-operations/event-destinations) get `stash_entry.set` and `stash_entry.deleted` events.
- A sensitive entry never includes its value in an event.

| Stash | Subscriptions |
|---|---|
| Project | `projectEvents` |
| Environment | `projectEvents`, `environmentEvents` |
| Component | `projectEvents` |
| Instance | `environmentEvents`, `instanceEvents` |
| Deployment | `environmentEvents`, `instanceEvents`, `deploymentEvents` |

The [`alphaStashEvents`](/guides/stash/api#alphastashevents) subscription also sends sets and deletes for a project and one environment.

## Where stash values show

| Place | What shows |
|---|---|
| The **Metadata** tab of an instance | The instance's widgets, its latest deployment results, and its labeled entries |
| The deployment's details | A **Results** section and a **Deployment metadata** section with the deployment's labeled entries |
| The **Metadata** card on the project overview | The project's labeled entries |
| The canvas and the environment header | Automatic widgets from `md/v1/` keys, and widgets and notes that you pin |
| The notice bell in the app header | Notices when a project or environment is created |

These places update when a stash value changes. You do not need to reload the page. An entry that expires does not send an update. The UI removes it when its time ends.

## Next

- [Well-known keys](/guides/stash/well-known-keys)
- [For provisioners](/guides/stash/provisioners)
- [CLI](/guides/stash/cli)
- [GraphQL API](/guides/stash/api)
- [Recipes](/guides/stash/recipes)
- [Annotations](/guides/annotations): notes and widgets that show stash values in the UI
