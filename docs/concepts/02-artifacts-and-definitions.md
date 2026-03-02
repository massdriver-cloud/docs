---
id: concepts-artifacts-and-definitions
slug: /concepts/artifacts-and-definitions
title: Artifacts & Definitions
sidebar_label: Artifacts & Definitions
---

## Overview

**Artifacts** are structured outputs produced by [bundles](/concepts/bundles) that represent cloud resources and their configuration. **Artifact definitions** are JSON Schema-based contracts that define what data artifacts contain and how they can connect to other infrastructure components.

Together, they enable type-safe composition of infrastructure—one bundle's outputs become another bundle's inputs through a validated contract.

## How Artifacts Work

When a PostgreSQL bundle provisions a database, it produces an artifact containing connection details. An application bundle can then consume this artifact as a connection, automatically receiving the correct database hostname, port, and credentials—all validated against the artifact definition schema.

**Example PostgreSQL Artifact**:
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

## Artifact Definitions

Artifact definitions serve as contracts between infrastructure components:

1. **Contract Definition**: Define the schema for what data artifacts contain
2. **Type Safety**: Ensure only compatible components can connect
3. **Cross-Tool State Transit**: Enable state to pass between Terraform, Helm, Bicep, etc.
4. **Sensitive Data Protection**: Mark fields with `$md.sensitive` for automatic masking

**Example Artifact Definition**:
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

## Artifact Origins

### Provisioned Artifacts
Created automatically when a bundle deploys:
- Associated with a specific package
- Identified by: `{project}-{environment}-{manifest}.{field}`
- Automatically updated on redeployment
- Lifecycle tied to the source package

### Imported Artifacts
Created manually for external resources:
- Cloud authentication (AWS IAM roles, GCP service accounts)
- Existing resources not managed by Massdriver
- Identified by UUID
- Independent lifecycle

## Connection Lifecycle

1. **Nominal Typing**: When you connect packages in the UI, the system validates artifact type compatibility
2. **Structural Matching**: Once provisioned, the actual data is validated against the schema
3. **Data Injection**: During deployment, artifact data is injected into the consuming bundle

## Usage in massdriver.yaml

```yaml
# Bundle consumes a VPC artifact
connections:
  required:
    - vpc
  properties:
    vpc:
      $ref: massdriver/aws-vpc

# Bundle produces a database artifact
artifacts:
  required:
    - database
  properties:
    database:
      $ref: massdriver/postgresql-authentication
```

## Best Practices

- Mark sensitive fields with `$md.sensitive` for automatic masking
- Group related properties logically (authentication, infrastructure, iam)
- Use descriptive field names that indicate what the resource represents
- Design artifact definitions for reuse across multiple bundles

## Related Documentation

- [Bundle YAML Specification](/bundle-development/bundle-yaml-spec) - Connection and artifact configuration
- [Artifact Definition Specification](/bundle-development/connections-artifacts/artifact-definition-spec) - Complete schema reference
- [Artifact Definitions Repository](https://github.com/massdriver-cloud/artifact-definitions) - Standard artifact types
- [Massdriver Annotations](/bundle-development/schema-design/massdriver-annotations) - `$md.sensitive` and other extensions
