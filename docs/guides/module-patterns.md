---
id: guides-module-patterns
slug: /guides/module-patterns
title: Mapping Terraform and OpenTofu Module Patterns to Massdriver
sidebar_label: Module Patterns
---

If your team has an existing library of Terraform or OpenTofu modules — naming utilities, diagnostic configurations, RBAC helpers, VM extensions, and other shared modules — this guide explains how each pattern maps to Massdriver and where your modules should live after migration.

This guide assumes you're familiar with [bundles](/concepts/bundles), [artifacts](/concepts/artifacts), and [connections](/concepts/connections). If you're new to these concepts, start with the [getting started guides](/getting-started/deploying-first-bundle).

## The Migration Map

Before diving into each pattern, here's the quick reference:

| Traditional Module Pattern | Massdriver Pattern | What Happens to the Module |
|---|---|---|
| **Naming / tagging utilities** | Eliminated by [`md_metadata`](/getting-started/using-bundle-metadata) | Delete it |
| **Shared child modules** (IAM, secrets, firewall) | Child modules in your catalog under `modules/` | Move it |
| **Decorator modules** (diagnostics, extensions) | Child modules baked into bundles or standalone bundles with connections | Move or promote it |
| **Meta / org config** (Entra, DNS, SSO, Policy) | Full standalone bundles | Promote it |

## Pattern 1: Naming and Tagging Utilities

**These go away entirely.**

If you have OpenTofu or Terraform modules that generate consistent resource names, apply standard tags, or enforce naming conventions, Massdriver replaces them with [`md_metadata`](/getting-started/using-bundle-metadata) — a context object automatically injected into every bundle deployment.

:::tip Entire Module Categories Can Disappear

This is one of the most immediate wins when migrating to Massdriver. Your naming module, your tagging module, and any "context" modules that pass around project/environment/team identifiers are all replaced by a single built-in mechanism.

:::

### What md_metadata provides

- **`name_prefix`** — A unique, consistent identifier in the format `{project-slug}-{target-slug}-{manifest-slug}-{suffix}` (e.g., `ecomm-prod-api-abc1`). Use this everywhere you previously concatenated project, environment, and app names.
- **`default_tags`** — Standard tags automatically applied to every deployment, including `managed-by`, `md-project`, `md-target`, `md-manifest`, and `md-package`.

### Before and after

**Before** — Your bundle calls a naming utility module:

```hcl
module "naming" {
  source      = "git::https://github.com/your-org/terraform-modules.git//naming"
  project     = var.project_name
  environment = var.environment
  app_name    = var.app_name
}

resource "azurerm_storage_account" "main" {
  name     = module.naming.storage_account_name
  tags     = module.naming.default_tags
  # ...
}
```

**After** — Massdriver injects the context automatically:

```hcl
resource "azurerm_storage_account" "main" {
  # Azure storage account names: lowercase alphanumeric only, no hyphens
  name     = replace("${var.md_metadata.name_prefix}sa", "-", "")
  tags     = var.md_metadata.default_tags
  # ...
}
```

No module call. No variables for project, environment, or app name. No git submodule. The naming parameters are removed from the bundle's `params` in `massdriver.yaml`, which means developers never see them in the configuration form — eliminating an entire class of misconfiguration.

For the full reference on `md_metadata` fields, see [Using Bundle Deployment Metadata](/getting-started/using-bundle-metadata).

## Pattern 2: Shared Child Modules

**These stay as modules, but move into your catalog.**

Child modules are the building blocks you call from inside other modules. Common examples include:

- **IAM / RBAC helpers** — Modules that create role assignments, service principals, or managed identities
- **Secret processors** — Modules that fetch secrets from Key Vault or Secrets Manager and expose them
- **Firewall rule builders** — Modules that open network access based on connection data
- **Provider configuration** — Modules that configure cloud provider authentication

These modules don't need to become bundles because they don't represent independently deployable infrastructure. They're implementation details of a bundle.

### Where to put them

Store shared child modules in your [massdriver-catalog](https://github.com/massdriver-cloud/massdriver-catalog) repository under a `modules/` directory, organized by IaC tool:

```
massdriver-catalog/
├── artifact-definitions/
├── bundles/
│   ├── azure-storage-account/
│   ├── azure-cognitive-search/
│   └── ...
└── modules/
    ├── opentofu/
    │   ├── azure-diagnostic-settings/
    │   ├── azure-role-assignment/
    │   └── azure-keyvault-secret-reader/
    ├── terraform/
    │   └── ...
    ├── charts/
    │   └── ...
    ├── bicep/
    │   └── ...
    └── cloudformation/
        └── ...
```

Any bundle in the catalog can reference these modules using relative paths:

```hcl
module "role_assignment" {
  source = "../../../modules/opentofu/azure-role-assignment"

  principal_id = azurerm_user_assigned_identity.main.principal_id
  role_name    = "Storage Blob Data Reader"
  scope        = azurerm_storage_account.main.id
}
```

### How connections supercharge child modules

The real power of this pattern comes from combining child modules with Massdriver [connections](/concepts/connections). When a bundle declares a connection, it receives the full artifact data from another bundle — including infrastructure IDs, IAM policies, authentication details, and network configuration.

Consider a bundle for a VM-based API that needs access to a PostgreSQL database. The database artifact includes everything the child module needs:

```yaml title="massdriver.yaml"
connections:
  required:
    - database
  properties:
    database:
      $ref: postgresql
```

Inside the bundle, a shared child module processes that connection:

```hcl
module "postgres_access" {
  source = "../../../modules/opentofu/azure-postgres-artifact"

  # The connection artifact provides everything needed
  postgres_artifact = var.database

  # The identity to grant access to
  principal_id = azurerm_user_assigned_identity.app.principal_id
}
```

The child module handles fetching secrets from Key Vault, creating the IAM role assignment, and opening the firewall — all codified once by your security team and reused by every bundle that needs database access.

This pattern means that many of your existing "utility" modules — RBAC helpers, firewall managers, secret fetchers — become artifact processors that live once in your catalog and get called from any bundle that declares the right connection.

## Pattern 3: Decorator Modules

**These either get baked into bundles or become standalone bundles.**

Decorator modules attach configuration to existing resources without creating new independent infrastructure. Azure diagnostic settings are the canonical example: they don't "return" anything useful, they just ensure that a resource sends logs and metrics to the right place.

Other examples:
- **Azure diagnostic settings** — Attach log/metric forwarding to any resource
- **VM extensions** — Install monitoring agents, custom scripts, or security tools
- **Resource locks** — Prevent accidental deletion of critical resources
- **Backup policies** — Attach backup configuration to databases or VMs

### Option A: Bake into the resource bundle

If the decorator is **mandatory for every instance** of a resource (e.g., every storage account must have diagnostic settings), make it a child module called from within the resource bundle:

```hcl title="bundles/azure-storage-account/src/main.tf"
resource "azurerm_storage_account" "main" {
  name                = replace("${var.md_metadata.name_prefix}sa", "-", "")
  resource_group_name = var.resource_group_name
  # ...
}

module "diagnostics" {
  source = "../../../modules/opentofu/azure-diagnostic-settings"

  target_resource_id         = azurerm_storage_account.main.id
  log_analytics_workspace_id = var.log_analytics.data.infrastructure.workspace_id
}
```

This guarantees compliance — there's no way to deploy the storage account without diagnostics.

### Option B: Standalone bundle with connections

If the decorator is **optional or varies by environment** (e.g., production VMs get a security extension but dev VMs don't), make it a standalone bundle that takes a connection to the resource it decorates:

```yaml title="massdriver.yaml"
schema: draft-07
name: azure-vm-monitoring-extension
description: Attaches Azure Monitor Agent to a virtual machine

connections:
  required:
    - virtual_machine
  properties:
    virtual_machine:
      $ref: your-org/azure-virtual-machine

params:
  properties:
    collection_interval:
      type: integer
      title: Collection Interval (seconds)
      default: 60
      minimum: 10
      maximum: 300

steps:
  - path: src
    provisioner: opentofu
```

:::important

A bundle doesn't need to produce artifacts to be useful. Decorator bundles exist purely to consume connections and provision side-effect resources. This is a valid and supported pattern in Massdriver.

:::

This approach gives you per-environment flexibility: in production, connect the monitoring extension to the VM. In development, leave it disconnected.

### Which option to choose

| Consideration | Bake In (Option A) | Standalone (Option B) |
|---|---|---|
| Always required? | Yes | No, varies by environment |
| Needs its own lifecycle? | No | Yes (update independently) |
| Different teams manage it? | No | Yes |
| Needs its own audit trail? | No | Yes |

## Pattern 4: Meta and Organizational Config

**These become full standalone bundles.**

Meta config modules manage cross-cutting organizational resources that don't belong to any single application. Examples include:

- **SSO / Entra ID Apps** — SAML/OIDC configurations for SaaS integrations
- **DNS zones and records** — Domain management
- **Automation / service accounts** — Shared service principals or email accounts
- **Organizational groups** — Azure AD groups, AWS Organizations OUs
- **Azure Policy assignments** — Governance rules applied across subscriptions
- **Management Groups** — Azure management group hierarchies
- **Resource Locks** — Subscription-level deletion protection
- **Budgets and cost alerts** — Cloud spending controls

These should be designed as full bundles because they benefit from:

- **Audit trail** — Every change is tracked as a versioned deployment
- **Rollback** — Revert to a previous configuration instantly
- **Ephemeral testing** — Test an Entra App configuration change in a preview environment before applying to production
- **Operator guides** — Documentation lives alongside the bundle in `operator.md`, so the team managing Entra knows exactly what other systems depend on it
- **Connections** — Other bundles can depend on these resources. An Entra App bundle could produce an artifact that application bundles consume for SSO configuration

:::tip DNS as a Connection

DNS zone management is a common case where the meta config pattern intersects with connections. Design your DNS zone as a bundle that produces an artifact, then set it as an [environment default](/guides/sharing-infrastructure#using-environment-defaults). Bundles on that canvas can consume the DNS zone artifact to manage their own records — meaning your application bundles are trusted to manage their domains within the zone for that environment.

:::

### Example: Entra ID Application Bundle

```yaml title="massdriver.yaml"
schema: draft-07
name: azure-entra-app
description: Manages an Azure Entra ID application registration for SSO integration

params:
  required:
    - display_name
    - redirect_uris
  properties:
    display_name:
      type: string
      title: Application Display Name
    redirect_uris:
      type: array
      title: Redirect URIs
      items:
        type: string
        format: uri
    token_lifetime_minutes:
      type: integer
      title: Token Lifetime (minutes)
      default: 60
      minimum: 5
      maximum: 1440

connections:
  required:
    - azure_service_principal
  properties:
    azure_service_principal:
      $ref: azure-service-principal

artifacts:
  properties:
    entra_app:
      $ref: your-org/azure-entra-application
```

Now when someone needs to update SSO settings, they configure it through the bundle — with validation, audit trail, and the ability to test the change in a preview environment first.

## What's Next?

- [Creating a Bundle from an OpenTofu Module](/guides/bundle-from-opentofu) — Step-by-step conversion of a single module
- [Bootstrap Your Platform](/guides/bootstrap-platform) — Model your entire platform architecture before implementing
- [Custom Artifact Definitions](/guides/custom-artifact-definition) — Create the contracts that connect your bundles
- [Using Bundle Deployment Metadata](/getting-started/using-bundle-metadata) — Full reference for `md_metadata`
- [Sharing Infrastructure](/guides/sharing-infrastructure) — Environment defaults and remote references

## Need Help?

- [Community Slack](https://join.slack.com/t/massdrivercommunity/shared_invite/zt-1sxag35w2-eYw7gatS1hwlH2y8MCmwXA)
