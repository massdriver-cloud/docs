---
id: identifier-constraints
slug: /reference/identifier-constraints
title: Identifier Constraints Reference
sidebar_label: Identifier Constraints
---

This document describes the validation constraints and naming conventions for every identifiable resource in Massdriver. These constraints matter for organizational design, naming conventions, and deployment strategies.

## Table of Contents

- [Organization](#organization)
- [Project](#project)
- [Environment](#environment)
- [Component](#component)
- [Instance](#instance)
- [Bundle / OCI Repo](#bundle--oci-repo)
- [Resource Type](#resource-type)
- [Resource](#resource)
- [Bundle Deployment Metadata](#bundle-deployment-metadata)

---

## Organization

**Identifier Field:** `id`

### Constraints

- **Pattern:** lowercase alphanumeric only (a-z, 0-9)
- **Length:** Maximum 20 characters
- **Uniqueness:** Globally unique across all organizations
- **Immutability:** Once created, the identifier cannot be changed

### Examples

✅ **Valid:**
- `acmecorp`
- `engineering`
- `myorg123`

❌ **Invalid:**
- `AcmeCorp` (uppercase letters)
- `my-org` (hyphens not allowed)
- `my_org` (underscores not allowed)

---

## Project

**Identifier Field:** `id`

Projects are the blueprints of an application or architecture. Project identifiers are the **first segment** of every entity identifier inside the project, and they are **immutable** once created.

### Constraints

- **Pattern:** lowercase alphanumeric only (a-z, 0-9)
- **Length:** Maximum 20 characters
- **Uniqueness:** Unique within an organization
- **Immutability:** Once created, the identifier cannot be changed

### Examples

✅ **Valid:**
- `ecomm`
- `webapp`
- `data1`

❌ **Invalid:**
- `web-app` (hyphens not allowed)
- `WebApp` (uppercase letters)
- `1webapp` (must start with a letter)

---

## Environment

**Identifier Field:** `id`

An environment is a named scope inside a project where deployments and secrets live. The environment identifier is the **second segment** of every instance identifier inside the project. Environment identifiers are **immutable** once created.

> **Naming note:** Environment was previously called "Target". The new term aligns with the UI; some legacy `md_metadata` keys still use the old name (see below).

### Constraints

- **Pattern:** lowercase alphanumeric only (a-z, 0-9)
- **Length:** Maximum 20 characters
- **Uniqueness:** Unique within a project
- **Immutability:** Once created, the identifier cannot be changed

### Examples

✅ **Valid:**
- `prod`
- `staging`
- `dev1`

❌ **Invalid:**
- `prod-env` (hyphens not allowed)
- `Prod` (uppercase letters)
- `1dev` (must start with a letter)

---

## Component

**Identifier Field:** `id`

A component is a bundle attached to a project's blueprint with a specific purpose. For example, a Redis bundle might be added to a project twice — once as `caching` and once as `sessions` — each is a separate component. Component identifiers are the **third segment** of every instance identifier and are **immutable** once created.

> **Naming note:** Component was previously called "Manifest".

### Constraints

- **Pattern:** lowercase alphanumeric only (a-z, 0-9)
- **Length:** Maximum 20 characters
- **Uniqueness:** Unique within a project
- **Immutability:** Once created, the identifier cannot be changed

### Examples

✅ **Valid:**
- `redis`
- `database`
- `apiserver`

❌ **Invalid:**
- `redis-cluster` (hyphens not allowed)
- `Redis` (uppercase letters)

---

## Instance

**Identifier Field:** `id` (composite identifier)

An **instance** is a component as it exists in a specific environment. It carries the configuration parameters and deployment state for that bundle in that environment.

> **Naming note:** Instance was previously called "Package".

**Identifier Format:** The instance identifier is composed of its parents: `{project}-{environment}-{component}` (e.g., `ecomm-prod-api`). Use this composite identifier as the instance ID in API calls.

### Constraints

- **Format:** `{project}-{environment}-{component}`
  - Example: `ecomm-prod-api`
  - Max length: 20 + 20 + 20 + 2 hyphens = 62 characters
- **Uniqueness:** Each `{environment, component}` combination produces exactly one instance per project
- **API Access:** Use the composite identifier (e.g., `ecomm-prod-api`) to reference an instance in API calls

### Example

- Project: `ecomm`
- Environment: `prod`
- Component: `api`
- Instance ID: `ecomm-prod-api`

### Name Prefix

The `name_prefix` is a read-only field that extends the instance identifier with a 4-character suffix: `{project}-{environment}-{component}-{suffix}` (e.g., `ecomm-prod-api-abc1`). Use `name_prefix` in your Infrastructure as Code (IaC) to name resources. The suffix is generated automatically and cannot be set directly.

---

## Bundle / OCI Repo

**Identifier Field:** `id` (the OCI repository name)

Bundles are published to an OCI repository. The repository name is the bundle identifier; specific releases are addressed with a version tag (e.g., `aws-aurora-postgres:1.0.0`). The full repository path is `{organization}/{repo}`.

### Constraints

- **Pattern:** lowercase letters, numbers, dashes, and underscores
- **Length:** Maximum 53 characters
- **Uniqueness:** Unique within an organization
- **Immutability:** Once created, the repo name cannot be changed

### Examples

✅ **Valid:**
- `aws-aurora-postgres`
- `redis-cluster`
- `web-app-backend`

❌ **Invalid:**
- `Aws-Aurora` (uppercase letters)
- `redis-` (cannot end with hyphen)
- `re` (too short)

---

## Resource Type

**Identifier Field:** `name`

A resource type defines the schema for the resources a bundle produces. Names follow an organization-scoped pattern.

> **Naming note:** Resource Type was previously called "Artifact Definition".

### Constraints

- **Pattern:** `{organization}/{resource-type-name}`
  - Two parts separated by a forward slash
  - The name part matches `^[a-z0-9-]{3,100}$`
- **Length:** name part is 3 – 100 characters; the organization part follows the organization-id rules
- **Uniqueness:** The name part is unique within your organization

### Examples

✅ **Valid:**
- `acmecorp/vpc-network`
- `myorg/custom-database`
- `engineering/docker-registry`

❌ **Invalid:**
- `vpc-network` (missing slash / org)
- `acmecorp/VPC` (uppercase in name part)
- `acmecorp/vp` (name part too short)

---

## Resource

**Identifier Field:** `id`

> **Naming note:** Resource was previously called "Artifact". The rename disambiguates Massdriver resources from OCI artifacts.

Resources have different identifier shapes depending on whether they were provisioned by Massdriver or imported.

### Constraints

**Provisioned Resources** (emitted by a deployment):
- **Format:** `{instance.name_prefix}-{field}` — e.g., `ecomm-prod-api-abc1-database`
- The `field` segment is unique within an instance and matches the field name declared in the bundle's resource type. It cannot change after creation.

**Imported Resources** (registered manually):
- **Format:** UUID — e.g., `123e4567-e89b-12d3-a456-426614174000`

### Examples

✅ **Provisioned:**
- Instance `name_prefix`: `ecomm-prod-api-abc1`
- Field: `database`
- Resource id: `ecomm-prod-api-abc1-database`

✅ **Imported:**
- `123e4567-e89b-12d3-a456-426614174000`

---

## Hierarchical identifiers

Many entities use hierarchical identifiers built from their parents:

- **Project:** `{project}` (e.g., `ecomm`)
- **Environment:** `{project}-{environment}` (e.g., `ecomm-prod`)
- **Component:** `{component}` (scoped within project)
- **Instance:** `{project}-{environment}-{component}` (e.g., `ecomm-prod-api`)
- **Provisioned resource:** `{instance.name_prefix}-{field}` (e.g., `ecomm-prod-api-abc1-database`)

Use these identifiers to reference entities in API calls.

---

## Summary Table

| Resource | Identifier | Pattern | Min Length | Max Length | Scope | Notes |
|---|---|---|---|---|---|---|
| Organization | `id` | lowercase a-z 0-9 | 1 | 20 | Global | Immutable |
| Project | `id` | lowercase a-z 0-9 | 1 | 20 | Organization | Immutable |
| Environment | `id` | lowercase a-z 0-9 | 1 | 20 | Project | Immutable; previously "Target" |
| Component | `id` | lowercase a-z 0-9 | 1 | 20 | Project | Immutable; previously "Manifest" |
| Instance | `id` | `{proj}-{env}-{component}` | N/A | 62 | Project | Composite; previously "Package" |
| Bundle / OCI Repo | `id` | lowercase, digits, `-`, `_` | 3 | 53 | Organization | OCI repo name |
| Resource Type | `name` | `{org}/[a-z0-9-]{3,100}` | 3 | 100 | Organization | Previously "Artifact Definition" |
| Resource | `id` | computed | N/A | N/A | Organization | Provisioned: `{instance.name_prefix}-{field}`. Imported: UUID |

---

## Bundle Deployment Metadata

When bundles are deployed, Massdriver automatically injects `md_metadata` into the deployment context. The shape below is preserved for backward compatibility — many of the keys still use the legacy nouns (`target`, `package`, `manifest`) even though the new terminology is Environment, Instance, and Component.

The `md_metadata` object contains:

- `name_prefix`: the instance name prefix (incorporates project, target, and manifest slugs in the legacy key shape)
- `default_tags`: standard tags including `md-project`, `md-environment`, `md-component`, and `md-instance`
- `observability`: alarm webhook URL for the environment
- `target`: environment information including contact email (legacy key — same data as the environment)
- `package`: instance metadata with timestamps and status (legacy key — same data as the instance)

This metadata is available to every bundle deployment and can be used for resource naming, tagging, conditional logic, and observability integration.

**Example `md_metadata` object:**

```json
{
  "name_prefix": "ecomm-prod-database-1j39",                 // Instance name prefix
  "default_tags": {                                          // Default tags to apply to your cloud resources
    "managed-by": "massdriver",
    "md-project": "ecomm",                                   // Project id
    "md-environment": "prod",                                // Environment id
    "md-component": "database",                              // Component id
    "md-instance": "ecomm-prod-database"                     // Instance id
  },
  "observability": {
    "alarm_webhook_url": "https://api.massdriver.cloud/alarms/<env-id>/<alarm-token>"
  },
  "target": {                                                // Legacy key — environment info
    "contact_email": "admin@example.com"
  },
  "package": {                                               // Legacy key — instance metadata
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:45:00Z",
    "deployment_enqueued_at": "2024-01-20T15:00:00Z",
    "previous_status": "provisioned"
  }
}
```

For complete details on using `md_metadata` in your bundles, see [Using Bundle Deployment Metadata](/getting-started/using-bundle-metadata).
