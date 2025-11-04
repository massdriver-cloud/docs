---
id: concepts-identifier-constraints
slug: /concepts/identifier-constraints
title: Identifier Constraints Reference
sidebar_label: Identifier Constraints
---

This document describes the validation constraints and naming conventions for all identifier resources in Massdriver. These constraints are important for organizational design, naming standards, and deployment strategies.

## Table of Contents

- [Organization](#organization)
- [Project](#project)
- [Environment (Target)](#environment-target)
- [Manifest](#manifest)
- [Package](#package)
- [Bundle](#bundle)
- [Artifact Definition](#artifact-definition)
- [Artifact](#artifact)

---

## Organization

**Identifier Field:** `slug`

### Constraints

- **Pattern:** `^[a-z0-9-]+$`
  - Lowercase letters, numbers, and hyphens only
  - No underscores or other special characters
- **Length:** Minimum 2 characters, maximum 64 characters
- **Uniqueness:** Must be globally unique across all organizations

### Examples

✅ **Valid:**
- `acme-corp`
- `engineering-team`
- `my-org-123`

❌ **Invalid:**
- `AcmeCorp` (uppercase letters)
- `my_org` (underscores not allowed)
- `admin` (reserved slug)
- `a` (too short, minimum 2 characters)

---

## Project

**Identifier Field:** `slug`

Projects are collections of manifests that compose an application or architecture. Project slugs are **immutable** once created.

### Constraints

- **Pattern:** `^[a-z][a-z0-9]{0,6}$`
  - Must start with a lowercase letter
  - Can contain lowercase letters and numbers
  - No hyphens or special characters
- **Length:** Minimum 1 character, maximum 7 characters
- **Uniqueness:** Unique within an organization
- **Immutability:** Once created, the slug cannot be changed

### Examples

✅ **Valid:**
- `webapp`
- `api`
- `data1`

❌ **Invalid:**
- `web-app` (hyphens not allowed)
- `WebApp` (uppercase letters not allowed)
- `1webapp` (must start with a letter)
- `verylongname` (exceeds 7 character limit)

---

## Environment (Target)

**Identifier Field:** `slug`

Environments represent named scopes for secrets and deployments within a project. **Note:** This resource was previously called "Target" and may occasionally be referenced that way for backwards compatibility - both terms refer to the same resource. Environment slugs are **immutable** once created.

**Identifier Format:** Environments use hierarchical slugs for API access. The full identifier format is `{project-slug}-{environment-slug}` (e.g., `web-prod`). You can use this hierarchical format in API calls, similar to how projects and packages are referenced.

### Constraints

- **Pattern:** `^[a-z][a-z0-9]{0,6}$`
  - Must start with a lowercase letter
  - Can contain lowercase letters and numbers
  - No hyphens or special characters
- **Length:** Minimum 1 character, maximum 7 characters
- **Uniqueness:** Unique within a project
- **Immutability:** Once created, the slug cannot be changed

### Examples

✅ **Valid:**
- `prod`
- `staging`
- `dev1`

❌ **Invalid:**
- `prod-env` (hyphens not allowed)
- `Prod` (uppercase letters not allowed)
- `1dev` (must start with a letter)
- `production` (exceeds 7 character limit)

---

## Manifest

**Identifier Field:** `slug`

A Manifest represents a bundle with a specific purpose or context within a project. For example, a Redis bundle might be added to a project multiple times, once for "caching" and once for "sessions" - each instance would be a separate manifest. Manifest slugs are **immutable** once created.

### Constraints

- **Pattern:** `^[a-z][a-z0-9]{0,11}$`
  - Must start with a lowercase letter
  - Can contain lowercase letters and numbers
  - No hyphens or special characters
- **Length:** Minimum 1 character, maximum 12 characters
- **Uniqueness:** Unique within a project
- **Immutability:** Once created, the slug cannot be changed

### Examples

✅ **Valid:**
- `redis`
- `database`
- `api-server`

❌ **Invalid:**
- `redis-cluster` (hyphens not allowed)
- `Redis` (uppercase letters not allowed)
- `verylongmanifestname` (exceeds 12 character limit)

---

## Package

**Identifier Field:** `slug` (composite identifier)

A Package is a deployed instance of a manifest within a specific environment. It contains the configuration parameters and deployment state for that bundle in that environment.

**Identifier Format:** The package slug is a composite identifier: `{project-slug}-{environment-slug}-{manifest-slug}` (e.g., `web-prod-api`). Use this format as the package ID in API calls.

### Constraints

- **Slug Format:** `{project-slug}-{environment-slug}-{manifest-slug}`
  - Example: `web-prod-api`
  - Total length: 7 + 7 + 12 + 2 hyphens = 28 characters maximum
- **Uniqueness:** Unique combination of environment and manifest within a project
- **API Access:** Use the composite slug format (`proj-env-manifest`) as the package ID in API calls

### Examples

✅ **Valid Package:**
- Project slug: `web`
- Environment slug: `prod`
- Manifest slug: `api`
- Package slug (ID): `web-prod-api`
- API access: Use `web-prod-api` as the package ID

### Name Prefix

The `name_prefix` is a read-only field that extends the package slug with a 4-character suffix: `{project-slug}-{environment-slug}-{manifest-slug}-{suffix}` (e.g., `web-prod-api-abc1`). Use `name_prefix` in your Infrastructure as Code (IaC) to name resources. The suffix is automatically generated and cannot be set directly.

---

## Bundle

**Identifier Field:** `name`

**Important Note:** Bundle names are the OCI repository name. The full bundle identifier is the repository name plus a version tag (e.g., `my-bundle:1.0.0`). The full repository path is `{organization-slug}/{bundle-name}`.

### Constraints

- **Pattern:** `^[a-z][a-z0-9-]+[a-z0-9]$`
  - Must start with a lowercase letter
  - Can contain lowercase letters, numbers, and hyphens
  - Must end with a lowercase letter or number
  - Cannot end with a hyphen
- **Length:** Minimum 3 characters, maximum 53 characters
- **Uniqueness:** Unique within an organization

### Examples

✅ **Valid:**
- `redis-cluster`
- `postgres-db`
- `web-app-backend`

❌ **Invalid:**
- `Redis-Cluster` (uppercase letters)
- `redis-` (cannot end with hyphen)
- `-redis` (cannot start with hyphen)
- `re` (too short, minimum 3 characters)

---

## Artifact Definition

**Identifier Field:** `name`

Artifact definition names define the types of artifacts that can be created and managed. They follow an organization-scoped naming pattern.

### Constraints

- **Pattern:** `[a-z0-9-]+\/[a-z0-9-]+`
  - Must contain a forward slash (`/`) separating two parts
  - Format: `organization-slug/artifact-type-name`
  - The artifact type name part (after the slash) must match: `^[a-z0-9-]{3,100}$`
- **Length:** 
  - Organization part: Follows organization slug constraints
  - Artifact type name part: Minimum 3 characters, maximum 100 characters
- **Uniqueness:** The artifact type name must be unique within your organization

### Examples

✅ **Valid:**
- `acme-corp/vpc-network`
- `my-org/custom-database`
- `engineering/docker-registry`

❌ **Invalid:**
- `vpc-network` (missing slash)
- `acme-corp/VPC` (uppercase in artifact type name)
- `acme-corp/vp` (artifact type name too short, minimum 3 characters)

---

## Artifact

**Identifier Field:** `identifier`

Artifacts have different identifier formats depending on whether they were provisioned through Massdriver or imported.

### Constraints

**For Provisioned Artifacts:**
- **Format:** `{package.name_prefix}-{field}`
- **Package name_prefix:** `{project-slug}-{environment-slug}-{manifest-slug}-{suffix}`
- **Required Fields:**
  - `name`: Display name for the artifact
  - `field`: Must be unique within a package, must match the field name defined in the bundle's artifact definition, cannot be changed after creation
  - `specs`: Artifact specifications
  - `data`: Artifact data

**For Imported Artifacts:**
- **Format:** UUID
- **Required Fields:**
  - `name`: Display name for the artifact
  - `specs`: Artifact specifications
  - `data`: Artifact data

### Examples

✅ **Valid Provisioned Artifact:**
- Package name_prefix: `web-prod-api-abc1`
- Field: `database`
- Artifact identifier: `web-prod-api-abc1-database`

✅ **Valid Imported Artifact:**
- Artifact identifier: `123e4567-e89b-12d3-a456-426614174000`

---

## Hierarchical Slug Identifiers

Many resources use hierarchical slug identifiers for API access:

- **Project:** `{project-slug}` (e.g., `web`)
- **Environment:** `{project-slug}-{environment-slug}` (e.g., `web-prod`)
- **Manifest:** `{manifest-slug}` (scoped within project)
- **Package:** `{project-slug}-{environment-slug}-{manifest-slug}` (e.g., `web-prod-api`)

Use these hierarchical identifiers to reference resources in API calls.

---

## Summary Table

| Resource | Identifier Field | Pattern | Min Length | Max Length | Scope | Notes |
|----------|-----------------|---------|------------|------------|-------|-------|
| Organization | `slug` | `^[a-z0-9-]+$` | 2 | 64 | Global | Reserved slugs excluded |
| Bundle | `name` | `^[a-z][a-z0-9-]+[a-z0-9]$` | 3 | 53 | Organization | Must start/end with alphanumeric |
| Artifact Definition | `name` | `[a-z0-9-]+\/[a-z0-9-]+` | 3 | 100 | Organization | Format: `org/type-name` |
| Artifact | `identifier` | Computed | N/A | N/A | Organization | `{package.name_prefix}-{field}` for provisioned, UUID for imported |
| Project | `slug` | `^[a-z][a-z0-9]{0,6}$` | 1 | 7 | Organization | Immutable |
| Environment (Target) | `slug` | `^[a-z][a-z0-9]{0,6}$` | 1 | 7 | Project | Immutable, hierarchical ID: `proj-env` |
| Manifest | `slug` | `^[a-z][a-z0-9]{0,11}$` | 1 | 12 | Project | Immutable |
| Package | `slug` | `{proj}-{env}-{manifest}` | N/A | 28 | Project | Hierarchical slug used as ID, includes suffix in name_prefix |

