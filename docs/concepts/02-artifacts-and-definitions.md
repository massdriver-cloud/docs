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

## Usage in massdriver.yaml

```yaml
# Bundle consumes a VPC resource
connections:
  required:
    - vpc
  properties:
    vpc:
      $ref: aws-vpc

# Bundle produces a database resource
artifacts:
  required:
    - database
  properties:
    database:
      $ref: postgresql-authentication
```

> The bundle spec keys (`connections`, `artifacts`) retain their original names so existing `massdriver.yaml` files keep building. The bundle spec is moving to `resources` over time.

## Best Practices

- Mark sensitive fields with `$md.sensitive` for automatic masking
- Group related properties logically (authentication, infrastructure, iam)
- Use descriptive field names that indicate what the resource represents
- Design resource types for reuse across multiple bundles

## Related Documentation

- [Bundle YAML Specification](/bundle-development/bundle-yaml-spec) - Connection and resource configuration
- [Resource Type Specification](/bundle-development/connections-artifacts/artifact-definition-spec) - Complete schema reference
- [Resource Types Repository](https://github.com/massdriver-cloud/artifact-definitions) - Standard resource types
- [Massdriver Annotations](/bundle-development/schema-design/massdriver-annotations) - `$md.sensitive` and other extensions
