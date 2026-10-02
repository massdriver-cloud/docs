---
id: concepts-resources-and-types
slug: /concepts/resources-and-types
title: Resources & Resource Types
sidebar_label: Resources & Resource Types
---

## Overview

**Resources** are structured outputs produced by [bundles](/concepts/bundles) that represent cloud resources and their configuration. **Resource Types** are JSON Schema-based contracts that define what data a resource contains and how it can connect to other infrastructure components.

Together, they enable type-safe composition of infrastructure — one bundle's outputs become another bundle's inputs through a validated contract.

> **Naming note:** Resource Type was previously called "Artifact Definition", and Resource was previously called "Artifact". The new names disambiguate Massdriver's API from the OCI registry's notion of artifacts.

## How Resources Work

When a PostgreSQL bundle provisions a database, it produces a resource containing connection details. An application bundle can then consume this resource as a connection, automatically receiving the correct database hostname, port, and credentials — all validated against the resource type schema.

**Example PostgreSQL Resource**:
```json
{
  "authentication": {
    "hostname": "db.example.com",
    "port": 5432,
    "username": "app_user",
    "password": "secret_value"
  },
  "infrastructure": {
    "arn": "arn:aws:rds:us-west-2:123456789012:db:mydb",
    "region": "us-west-2"
  }
}
```

## Resource Types

Resource types serve as contracts between infrastructure components:

1. **Contract Definition**: Define the schema for what data a resource contains
2. **Type Safety**: Ensure only compatible components can connect
3. **Cross-Tool State Transit**: Enable state to pass between Terraform, Helm, Bicep, etc.
4. **Sensitive Data Protection**: Mark fields with `$md.sensitive` for automatic masking

**Example Resource Type**:
```json
{
  "type": "object",
  "title": "PostgreSQL Database",
  "properties": {
    "authentication": {
      "type": "object",
      "properties": {
        "hostname": { "type": "string" },
        "port": { "type": "integer" },
        "password": {
          "type": "string",
          "$md.sensitive": true
        }
      }
    }
  }
}
```

## Resource Origins

### Provisioned Resources
Created automatically when a bundle deploys:
- Associated with a specific instance
- Identified by: `{project}-{environment}-{component}.{field}`
- Automatically updated on redeployment
- Lifecycle tied to the source instance

### Imported Resources
Created manually for external resources:
- Cloud authentication (AWS IAM roles, GCP service accounts)
- Existing resources not managed by Massdriver
- Identified by UUID
- Independent lifecycle

## Connection Lifecycle

1. **Nominal Typing**: When you connect components in the UI, the system validates resource type compatibility
2. **Structural Matching**: Once provisioned, the actual data is validated against the schema
3. **Data Injection**: During deployment, resource data is injected into the consuming bundle

## Resource types are versioned

A resource type is a published artifact, not a loose schema. It is authored as a `massdriver.yaml`, published to a repository in your organization's catalog, and pinned by version — the same model bundles use.

Every resource type has:

- A semantic version and release channels
- A repository in the OCI catalog, with the same access grants and attribute filters as a bundle repository
- Immutable published versions. Once a version exists it cannot be overwritten

```bash
mass resource-type create aws-vpc
mass resource-type publish ./aws-vpc
mass resource-type pull aws-vpc@2.1.0
```

Versioning the resource type versions the contract between bundles. Adding a required field to a payload that three bundles consume is a breaking change to all three, and a major version bump is how the platform is told so.

## Usage in massdriver.yaml

A bundle names the resource types it consumes under `dependencies` and the ones it produces under `resources`, each with the versions it accepts:

```yaml
# What the bundle consumes
dependencies:
  vpc:
    resource_type: aws-vpc@~1
    required: true

# What the bundle produces
resources:
  database:
    resource_type: postgresql-authentication@1.0.0
    required: true
```

A dependency accepts a range and Massdriver resolves it at deploy time. A resource pins the single version it produces. See [Version Resolution](/bundle-development/dependencies-resources/version-resolution).

> `connections` and `artifacts` are the previous names for these blocks. They still work and publish with a warning, but a slot declared that way carries no version range and takes part in no version checks.

## Best Practices

- Mark sensitive fields with `$md.sensitive` for automatic masking
- Group related properties logically (authentication, infrastructure, iam)
- Use descriptive field names that indicate what the resource represents
- Design resource types for reuse across multiple bundles

## Related Documentation

- [Bundle YAML Specification](/bundle-development/bundle-yaml-spec) - Connection and resource configuration
- [Resource Type Specification](/bundle-development/dependencies-resources/resource-type-spec) - Complete schema reference
- [Version Resolution](/bundle-development/dependencies-resources/version-resolution) - How a version range picks a resource at deploy time
- [Resource Types Repository](https://github.com/massdriver-cloud/artifact-definitions) - Standard resource types
- [Massdriver Annotations](/bundle-development/schema-design/massdriver-annotations) - `$md.sensitive` and other extensions
