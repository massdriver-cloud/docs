---
id: guides-stash-cli
slug: /guides/stash/cli
title: Stash CLI
sidebar_label: CLI
---

# Stash CLI

:::caution Alpha
This feature is alpha. Names, fields, and behavior can change or be removed at any time without notice.
:::

The `mass stash` commands are not in a released version of `mass` yet. They will be available in a future `mass` release.

| Command | What it does |
|---|---|
| `mass stash get <scope>.<key>` | Prints the value |
| `mass stash set <scope>.<key> <value>` | Sets the value |
| `mass stash delete <scope>.<key>` | Deletes the entry |
| `mass stash list <scope>` | Lists the entries in one stash |

## Addresses

An address is `<scope>.<key>`. The first `.` ends the scope, so a key can contain more dots. For example, in `billing-dev-app.schema.version`, the scope is `billing-dev-app` and the key is `schema.version`.

The scope is an identifier. Its shape tells the kind of entity:

| Scope | Kind |
|---|---|
| `billing` | Project |
| `billing-dev` | Environment or component |
| `billing-dev-app` | Instance |
| A UUID | Deployment |

An environment and a component have the same shape. The CLI looks up both. When both exist, add a prefix to choose one: `env:billing-app` or `component:billing-app`. The prefixes `project:`, `env:`, `environment:`, `component:`, `instance:`, and `deployment:` are always accepted.

## get

Prints the value exactly as it is stored, with no trailing newline. A sensitive value is printed only for callers who can write its stash. Other callers get an error.

```bash
DB_HOST=$(mass stash get "billing-dev-app.db/hostname")
```

With `-o json`, it prints the whole entry: the value, the label, the format, the flags, and the expiry.

```bash
mass stash get "billing-dev-app.stats" -o json | jq .data.changed
```

## set

```bash
mass stash set <scope>.<key> <value> [flags]
```

| Flag | Meaning |
|---|---|
| `--format` | `text` (the default) or `json`. A `json` value must be a JSON object. |
| `--label` | A name for the entry, up to 255 characters. It is not encrypted. |
| `--ttl` | Delete the entry this many seconds after the write. |
| `--immutable` | Keep the first value. Later writes fail. |
| `--sensitive` | Encrypt the value and hide it from callers who cannot write the stash. |

Each set replaces the whole entry, including the label, the format, the TTL, and the flags.

A value of `-` reads the value from standard input. Every byte is kept, including a trailing newline.

```bash
terraform output -raw kubeconfig | mass stash set "billing-dev.kubeconfig" - --sensitive
```

## delete

Asks you to type the key to confirm. Use `--force` (`-f`) in scripts to skip the question. Any other answer cancels the delete and exits with code 0.

```bash
mass stash delete "billing-dev-app.ami-id" --force
```

## list

Lists the entries in one stash. A sensitive value shows as `(sensitive)` unless you can write the stash. Use `-o json` for JSON output.

```bash
mass stash list billing-dev
mass stash list "$MASSDRIVER_DEPLOYMENT_ID" -o json | jq -r '.[].key'
```

## Inside a deployment

In a provisioner, `mass stash` signs in with the deployment's token (`MASSDRIVER_DEPLOYMENT_ID` and `MASSDRIVER_TOKEN`) when no API key is set. That token can read and write the stash of its deployment and of the deployment's instance, environment, component, and project.

```bash
mass stash set "$MASSDRIVER_DEPLOYMENT_ID.db/hostname" "$DB_HOST" --label "Database hostname"
```
