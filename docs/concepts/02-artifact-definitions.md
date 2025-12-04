---
id: concepts-artifact-definitions
slug: /concepts/artifact-definitions
title: Artifact Definitions
sidebar_label: Artifact Definitions
---

# Understanding Artifact Definitions

Artifact definitions are JSON Schema-based contracts that define how infrastructure components can interact with each other in Massdriver. They serve as the foundation for connecting different infrastructure components and enabling seamless integration between them.

## Overview

Artifact definitions serve several key purposes:

1. **Contract Definition**: They define the contract between Infrastructure as Code (IaC) module executions/runs
2. **State Transit**: They enable state to be passed between different IaC tools
3. **Platform Extension**: They extend cloud support and UI capabilities of the platform
4. **Serialization**: They define how artifacts can be downloaded and serialized

## Usage

Artifact definitions are used to:

1. Define the structure of infrastructure components
2. Enable secure data transfer between components
3. Provide UI integration points
4. Define validation rules for connections
5. Enable type checking between connected components

## Structure

Every artifact definition must contain two top-level fields:

1. `data` (object): Contains data that will be encrypted-at-rest and is generally consider 'secret.'
2. `specs` (object): Contains specs about the artifact that was provisioned or imported, and can be searched and displayed in the UI.

### Example Structure

All artifact definitions must include top-level `data` and `specs` fields. You can define your own structure using JSON Schema.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema",
  "type": "object",
  "required": ["data", "specs"],
  "properties": {
    "data": {
      "type": "object",
      "properties": {
        // Data properties here
      }
    },
    "specs": {
      "type": "object",
      "properties": {
        // Spec properties here
      }
    }
  }
}
```

## Artifact Lifecycle and Connection Phases

The lifecycle of artifact connections spans from initial package linking to final data injection. Through distinct phases of type validation and data exchange, artifact definitions ensure type safety and data integrity across your deployment pipeline.

### Nominal Typing

When you connect two packages in the Massdriver UI, the system first checks if their artifact types are compatible—this is called **nominal typing**. Think of it like declaring variable types in programming: the system uses the artifact definition schemas to validate that the source and destination can be linked, even before any actual data is exchanged. Technically, when a downstream package is attached to an upstream package that hasn't yet emitted an artifact, the UI draws a dotted line to represent this "type-level" connection. The link is based solely on the artifact type definitions (the schema), similar to how class inheritance works in object-oriented programming—compatibility is determined by the type, not the data.

### Structural Matching

Once the upstream package completes provisioning and emits its artifact data, the connection moves from type-level to data-level validation—this is **structural matching**. At this point, the system checks that the actual artifact data produced matches the expected schema. If it does, the link becomes "connected" (shown as a solid line in the UI), and the real artifact data (like connection strings, security groups, etc.) is injected into the downstream package during deployment. This ensures that not only are the types compatible, but the actual data structure and content are valid and ready for use in your deployment pipeline.

### Linking Process
The connection lifecycle follows these steps:

1. When two manifests are linked on the canvas, the system validates that the artifact types are compatible
2. The connection is established when the source artifact's type matches the destination's expected type
3. The system ensures no cyclical links are created
4. Each destination field can only have one active link at a time

## Usage in massdriver.yaml

Artifact definitions are referenced in massdriver.yaml files under two main sections:

1. `:artifacts`: Defines the artifacts that a bundle can produce
2. `:connections`: Defines the artifacts that a bundle can consume

An example `massdriver.yaml` file for an RDS OpenTofu Module:
```yaml
# The database will require a network artifact to put the database in.
connections:
  required:
  - vpc
  properties:
    vpc:
      $ref: massdriver/aws-vpc

# The will emit an artifact with security group, db connection secrets, and iam policies
artifacts:
  required:
  - database
  properties:
    database:
      $ref: massdriver/aws-rds-postgres
```

For more information about bundle configuration, see [Bundle Configuration](/concepts/bundles).

## Schema Location

All JSON schemas are hosted at:
```
https://api.massdriver.cloud/artifact-definitions/ORG/NAME
```

## Best Practices

1. Always include both `data` and `specs` fields
2. Use clear, descriptive names for artifact types
3. Include proper validation rules in the schema
4. Document any special requirements or constraints

For a complete guide to creating artifact definitions, see [Creating Artifact Definitions](/guides/custom-artifact-definition). 
