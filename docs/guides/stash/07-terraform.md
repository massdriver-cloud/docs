---
id: guides-stash-terraform
slug: /guides/stash/terraform
title: Stash with Terraform
sidebar_label: Terraform
---

# Stash with Terraform

:::caution Alpha
This feature is alpha. Names, fields, and behavior can change or be removed at any time without notice.
:::

The [Massdriver Terraform provider](https://registry.terraform.io/providers/massdriver-cloud/massdriver/latest/docs) can write and read stash entries. You need provider version 2.8.0 or later. Version 2.8.0 is not released yet.

| Type | Name | What it does |
|---|---|---|
| Resource | `massdriver_stash_entry` | Writes one entry to a stash, and keeps it as your configuration says |
| Data source | `massdriver_stash_entry` | Reads one entry |
| Data source | `massdriver_stash_entries` | Lists the entries in one stash, with an optional `key_prefix` |

## Credentials

The provider reads its credentials from `MASSDRIVER_*` environment variables.

- **Outside a bundle**, such as in a CI pipeline, set `MASSDRIVER_API_KEY` and `MASSDRIVER_ORGANIZATION_ID`. Use a service account's access token, with `stash:view` and `stash:write`, and `stash:export` for sensitive values.
- **Inside a bundle deployment**, the provider signs in with the deployment's token. Massdriver sets `MASSDRIVER_DEPLOYMENT_ID` and `MASSDRIVER_TOKEN`. An empty `provider "massdriver" {}` block is enough. The token can read and write the stash of the deployment, and of its instance, environment, component, and project. When an API key is also set, the provider uses the API key for the stash.

## The `massdriver_stash_entry` resource

| Argument | Rules |
|---|---|
| `project`, `environment`, `component`, `instance`, `deployment` | Set exactly one. It names the stash. A deployment is its UUID. The others are identifiers, such as `billing-dev-app`. |
| `key` | Required. Letters, digits, and `_ . / -`, up to 255 characters. Keys that start with `md/` must match their [schema](/guides/stash/well-known-keys). |
| `value` | The value. It shows in plan output. |
| `sensitive_value` | The value of a sensitive entry. Massdriver encrypts it, and Terraform hides it in plan output. A key that starts with `md/` cannot be sensitive. |
| `format` | `TEXT` (the default) or `JSON`. For `JSON`, write the value with `jsonencode`. A change in key order or spaces does not show as a change. |
| `label` | A name for the entry. An entry with a label shows as a row on the [Metadata panels](/guides/annotations/metadata). A label is not encrypted. |
| `ttl` | Seconds until the entry expires. `0` keeps the entry until it is deleted. Each write starts the time again. |
| `immutable` | When `true`, the server refuses a second write to the key. |

Set exactly one of `value` or `sensitive_value`.

Know these rules before you use the resource:

- **A write replaces the whole entry.** Creating the resource overwrites an entry that already has the key.
- **Changing the scope or the key replaces the entry.**
- **TTL.** After an entry expires, the next plan shows it as missing, and the next apply writes it again. The API does not return the TTL, so a TTL that someone changes outside Terraform does not show as a change. Do not use Terraform for a value that must expire and stay gone. Write that value with [`mass alpha stash`](/guides/stash/cli) instead.
- **Immutable.** A change to any argument of an immutable entry deletes the entry and writes it again.
- **Do not use `create_before_destroy`.** The old and the new entry have the same key, so deleting the old entry deletes the new one.
- **Changes outside Terraform.** An entry that someone deletes outside Terraform is written again on the next apply.

### Import

The import ID is `<kind>:<scope-id>/<key>`. The kind is `project`, `environment`, `component`, `instance`, or `deployment`.

```bash
terraform import massdriver_stash_entry.links environment:billing-dev/md/v1/links
```

The API does not return `ttl`, or a sensitive value that you cannot read. When your configuration sets them, the next apply writes the entry again. For an immutable entry, that write deletes the entry first.

## The data sources

`massdriver_stash_entry` reads one entry. It returns `value`, `data` (a `JSON` value as a string for `jsondecode`), `format`, `label`, `immutable`, `sensitive`, `expires_at`, and `updated_at`. For a sensitive entry, `value` is empty and `sensitive_value` holds the value, when you have `stash:export` or a deployment token.

`massdriver_stash_entries` lists the entries in one stash, sorted by key. It returns `entries` and `keys`. Expired entries are not listed. The value of a sensitive entry is not listed. With `key_prefix`, it keeps only the keys that start with that text.

## Examples

### A labeled value on an instance

The value shows as a row on the instance's **Metadata** tab.

```hcl
resource "massdriver_stash_entry" "db_hostname" {
  instance = "billing-dev-db"
  key      = "db/hostname"
  value    = aws_db_instance.main.address
  label    = "Database host"
}
```

### Buttons in an environment header

The [`md/v1/links`](/guides/stash/well-known-keys#mdv1links) key shows one button for each link in the environment header.

```hcl
resource "massdriver_stash_entry" "links" {
  environment = "billing-dev"
  key         = "md/v1/links"
  format      = "JSON"
  value = jsonencode({
    links = [
      { label = "Runbook", url = "https://wiki.example.com/billing" },
      { label = "Shop", url = "https://shop.example.com" },
    ]
  })
}
```

### What runs on an instance, from a bundle

A bundle writes [`md/v1/release`](/guides/stash/well-known-keys#mdv1release) to its own instance. The instance's **Metadata** tab shows the version and the image. Inside a bundle deployment, the provider signs in with the deployment's token.

```hcl
provider "massdriver" {}

resource "massdriver_stash_entry" "release" {
  instance = "billing-dev-api"
  key      = "md/v1/release"
  format   = "JSON"
  value = jsonencode({
    version = var.app_version
    image   = "${var.image_repository}:${var.image_tag}"
  })
}
```

### Read a value that another bundle wrote

The database bundle writes `db/hostname` to its instance. The API bundle reads it.

```hcl
data "massdriver_stash_entry" "db_hostname" {
  instance = "billing-dev-db"
  key      = "db/hostname"
}

locals {
  db_hostname = data.massdriver_stash_entry.db_hostname.value
}
```

To read a JSON value as an object, use `jsondecode` on `data`:

```hcl
data "massdriver_stash_entry" "release" {
  instance = "billing-dev-api"
  key      = "md/v1/release"
}

locals {
  running_version = jsondecode(data.massdriver_stash_entry.release.data).version
}
```

A deployment's token can read the stash of its own instance, environment, component, project, and deployment. To read the stash of another instance, as in this example, also set `MASSDRIVER_API_KEY` to a token with `stash:view` on that instance. When both credentials are set, the provider uses the API key for the stash.
