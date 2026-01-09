---
id: concepts-artifacts
slug: /concepts/artifacts
title: Artifacts
sidebar_label: Artifacts
---

## Overview

**Artifacts** are structured outputs produced by [bundles](/concepts/bundles) that represent cloud resources and their configuration. They serve as the _output_ of infrastructure provisioning and the _input_ connections to downstream bundles, enabling type-safe composition of infrastructure components.

Artifacts are the bridge between bundles—they allow one bundle's outputs to become another bundle's inputs, creating a composable infrastructure architecture where complex systems are built by connecting simple, reusable components.

## Artifacts Enable Infrastructure Composition

Artifacts solve a fundamental challenge in infrastructure management: how to safely pass state and configuration between different infrastructure components, often written in different tools (Terraform, Helm, Bicep, etc.), while maintaining type safety and security.

Instead of manually copying connection strings, credentials, and resource identifiers between components, artifacts provide a standardized, validated contract. When a PostgreSQL bundle provisions a database, it produces a `postgresql` artifact containing connection details. An application bundle can then consume this artifact as a connection, automatically receiving the correct database hostname, port, and credentials—all validated against the artifact definition schema.

## Artifact Structure

Think of an [artifact definition](/concepts/artifact-definitions) as a class in object-oriented programming—it defines the schema and validation rules. An artifact is like an instance of that class—it's the actual data about a specific piece of infrastructure you've provisioned.

Each artifact definition describes what data its artifacts will contain. For example:

- A **PostgreSQL artifact** might include connection credentials, IAM policies, database metadata, and secret manager references
- A **Kubernetes cluster artifact** might include kubeconfig data, API endpoints, and cluster version info
- An **S3 bucket artifact** might include bucket ARNs, IAM policies to access it, and region information

You decide what goes in your artifacts based on what downstream bundles need to connect and interact with that infrastructure.

**Example PostgreSQL Artifact**:
```json
{
  "authentication": {
    "hostname": "db.example.com",
    "port": 5432,
    "username": "app_user",
    "password": "secret_value",
    "ssl": true
  },
  "infrastructure": {
    "arn": "arn:aws:rds:us-west-2:123456789012:db:mydb",
    "region": "us-west-2"
  },
  "iam": {
    "role_arn": "arn:aws:iam::123456789012:role/db-access-role",
    "policy": "{...}"
  }
}
```

### Sensitive Data Protection

You can mark specific fields as sensitive in your artifact definition using `$md.sensitive: true`. These fields will be automatically masked as `[SENSITIVE]` when you view artifacts in the UI or query them via the API. When you actually need the real values (like when deploying a bundle that connects to that database), use the `downloadArtifact` operation. All artifact data is encrypted at rest and in transit.

See [Massdriver Annotations](/json-schema-cheat-sheet/massdriver-annotations) for details on sensitive field masking.

## Artifact Origins

Artifacts can be created in two ways, each with different characteristics and use cases:

### Provisioned Artifacts

**Origin**: Created automatically by [deployments](/concepts/deployments) during infrastructure provisioning

Provisioned artifacts are the most common type. They are automatically created when a bundle successfully deploys and produces outputs defined in its `artifacts` section.

**Characteristics**:
- Created by deployments during the provisioning process
- Associated with a specific [package](/concepts/packages) and bundle field
- Identified by package slug (project-environment-manifest) + field name
- Automatically updated when the package is redeployed
- Can only be updated or deleted by deployments
- Lifecycle is tied to the package that created them

**Example**: When a PostgreSQL bundle deploys, it creates a provisioned artifact with `field: "postgresql"` containing the database connection details.

### Imported Artifacts

**Origin**: Created manually or via API for external resources or cloud authentication

Imported artifacts represent resources that exist outside of Massdriver's provisioning system. They are typically used for:

- **Existing cloud resources**: Resources created outside Massdriver that need to be referenced
- **Cloud authentication**: AWS IAM roles, GCP service accounts, Azure managed identities
- **External services**: Third-party APIs, managed services not provisioned by Massdriver
- **Manual configuration**: Resources managed through other tools or processes

**Characteristics**:
- Created by service accounts or deployments via API
- Not associated with a package (no `package_id`)
- Identified by their UUID
- Can be updated or deleted by service accounts or deployments
- Independent lifecycle from packages

**Example**: An imported artifact might represent an existing AWS IAM role that was created manually and needs to be referenced by multiple bundles.

## Artifact Lifecycle

### Creation

Artifacts are created in different ways depending on their origin:

**Provisioned Artifacts**:
1. A bundle is deployed to an environment
2. The bundle's IaC code executes (Terraform, Helm, etc.)
3. Upon successful completion, the bundle outputs artifact data using the `massdriver_artifact` resource or provisioner-specific mechanisms
4. Massdriver validates the artifact data against the artifact definition schema
5. The artifact is stored, encrypted, and made available to other packages

**Imported Artifacts**:
1. A user or service account creates an artifact via the Massdriver API or UI
2. The artifact type (artifact definition) is specified
3. The artifact data and specs are provided
4. Massdriver validates against the artifact definition schema
5. The artifact is stored and made available for connections

### Connection and Consumption

Once an artifact exists, it can be connected to packages:

1. **Type Validation**: When a package is linked to an artifact in the UI, Massdriver first validates that the artifact's type matches the package's connection schema (nominal typing)
2. **Connection Establishment**: If types match, a connection is created linking the artifact to the package's connection field
3. **Data Injection**: During deployment, the artifact's data is injected into the package's IaC execution context
4. **Access Control**: Only packages with valid connections can access the artifact's encrypted data

### Updates

**Provisioned Artifacts**:
- Automatically updated when the source package is redeployed
- Only the `name` field can be manually updated (metadata only)
- Data and specs are managed by the deployment process

**Imported Artifacts**:
- Can be updated via API or UI
- All fields (`name`, `data`, `specs`) can be updated
- Updates are validated against the artifact definition schema

### Deletion

**Provisioned Artifacts**:
- Can only be deleted by deployments (when the source package is decommissioned)
- Deletion is blocked if other packages have active connections to the artifact
- Automatically deleted when the source package is removed

**Imported Artifacts**:
- Can be deleted by service accounts or deployments
- Deletion is blocked if packages have active connections
- Must be manually removed

## Artifact Identification

Artifacts are identified differently based on their origin:

### Provisioned Artifacts

Identified by: `{project-slug}-{environment-slug}-{manifest-slug}-{artifact_field}`

Combines the project, environment, and manifest slugs with the artifact field name.

**Example**: 
- Project: `api`
- Environment: `prod`
- Manifest: `database`
- Artifact field: `instance`
- **Artifact identifier**: `api-prod-database-instance`

**Another example**:
- Project: `api`, Environment: `prod`, Manifest: `database`
- Artifact field: `authentication`
- **Artifact identifier**: `api-prod-database-authentication`

This format provides:
- Human-readable, meaningful identifiers
- Stable identifiers across package redeployments
- Support for IaC tools that don't maintain state
- Clear association with the source package

### Imported Artifacts

Identified by: UUID

**Format**: `{uuid}`

**Example**: `123e4567-e89b-12d3-a456-426614174000`

Imported artifacts use UUIDs because they already have stable external identities and don't need the package-based naming convention.

### Artifact ID

Every artifact also has a system-generated UUID (`id`) that can be used for programmatic access. To find an artifact's ID:

1. Navigate to `Artifacts` in the sidebar
2. Select the artifact you want to reference
3. Click `Copy Artifact ID` in the top right corner of the artifact's page

## How Artifacts Enable Bundle Composition

Artifacts are the foundation of Massdriver's composable infrastructure model. They enable bundles to work together through a type-safe contract system:

### Type-Safe Connections

When you connect two packages in the Massdriver UI, the system validates compatibility using artifact definitions:

1. **Nominal Typing**: The system checks if the source artifact's type matches the destination connection's expected type, even before any data exists
2. **Structural Matching**: Once the artifact is provisioned, the system validates that the actual data structure matches the schema
3. **Prevention of Invalid Connections**: You cannot connect incompatible artifact types (e.g., a `postgresql` artifact to a `redis` connection)

### Cross-Tool State Transfer

Artifacts enable state to be passed between different IaC tools:

- **Terraform → Helm**: A Terraform bundle can provision infrastructure and produce an artifact that a Helm bundle consumes
- **OpenTofu → Bicep**: State can flow between different cloud providers and tools
- **Any → Any**: The artifact system provides a universal interface for state transfer

### Automatic Configuration

Artifacts enable automatic application configuration:

- **Environment Variables**: Artifact data can be mapped to environment variables using JQ expressions
- **Secrets Injection**: Credentials from artifacts are automatically injected as secrets

### Dependency Management

Artifacts enforce proper dependency ordering:

- **Required Connections**: Bundles can require specific artifacts, preventing deployment until dependencies are met
- **Visual Dependencies**: The UI shows artifact connections as visual links, making infrastructure dependencies clear
- **Deployment Ordering**: Massdriver automatically determines deployment order based on artifact dependencies

## Artifact Definitions

Artifacts must conform to an [artifact definition](/concepts/artifact-definitions), which is a JSON Schema that defines:

- The structure and properties of the artifact
- Validation rules and constraints
- Sensitive field annotations
- UI display configuration

Artifact definitions ensure that:
- All artifacts of the same type have consistent structure
- Type safety is enforced at connection time
- Invalid data is rejected before deployment

See [Artifact Definitions](/concepts/artifact-definitions) for detailed information about creating and using artifact definitions.

## Best Practices

### Sensitive Data Management

**Use `$md.sensitive` for sensitive fields**:
- Credentials, passwords, API keys
- Private endpoints and connection strings
- IAM policies and tokens
- Any information that should be masked

**Organize your artifact structure**:
- Group related properties logically (e.g., `authentication`, `infrastructure`, `iam`)
- Use clear, descriptive field names
- Include metadata useful for filtering and searching
- Document expected values and formats

This approach enables:
- Secure storage with automatic field masking
- Flexible schema design matching your needs
- Compliance with security best practices

### Artifact Naming

**For Provisioned Artifacts**:
- Use descriptive field names in your bundle's `artifacts` section
- The artifact name should clearly indicate what resource it represents
- Remember the field name becomes part of the artifact identifier (e.g., `api-prod-database-instance`)

**For Imported Artifacts**:
- Use clear, descriptive names that indicate the artifact's purpose
- Include context about the resource type and environment
- Follow organizational naming conventions

### Artifact Reusability

- **Design artifact definitions for reuse**: Create artifact definitions that can be used by multiple bundles
- **Standardize on common types**: Use Massdriver's standard artifact definitions when possible
- **Document artifact contracts**: Clearly document what data each artifact provides

### Connection Management

- **Use required connections**: Mark connections as required when the bundle cannot function without them
- **Validate early**: The type system prevents invalid connections, but also validate in your IaC code
- **Handle missing artifacts**: Design bundles to gracefully handle optional connections

### Security Considerations

- **Principle of least privilege**: Only include the minimum necessary data in artifacts
- **Encryption**: All artifact data is encrypted at rest—never log or expose artifact data
- **Access control**: Be aware that any package with a connection can access the artifact's data
- **Secret rotation**: Plan for secret rotation when designing artifact schemas

## Examples

### PostgreSQL Database Artifact

A PostgreSQL bundle produces an artifact with connection details:

```json
{
  "authentication": {
    "hostname": "prod-db.region.rds.amazonaws.com",
    "port": 5432,
    "username": "app_user",
    "password": "secret_password",
    "database": "myapp_prod",
    "ssl": true
  },
  "iam": {
    "role_arn": "arn:aws:iam::123456789012:role/rds-access",
    "policy": "{\"Version\":\"2012-10-17\",\"Statement\":[...]}"
  },
  "aws": {
    "region": "us-west-2",
    "account_id": "123456789012"
  },
  "database": {
    "engine": "postgresql",
    "version": "15.2",
    "instance_class": "db.r6g.xlarge"
  },
  "tags": {
    "Environment": "production",
    "Team": "platform"
  }
}
```

### Kubernetes Cluster Artifact

A Kubernetes cluster bundle produces an artifact with cluster connection details:

```json
{
  "authentication": {
    "kubeconfig": "kubeconfig_content",
    "server": "https://cluster.example.com",
    "certificate_authority_data": "ca_data"
  },
  "service_account": {
    "name": "massdriver-sa",
    "namespace": "default",
    "token": "secret_token"
  },
  "kubernetes": {
    "version": "1.28",
    "provider": "eks"
  },
  "aws": {
    "region": "us-west-2"
  },
  "cluster": {
    "node_count": 3,
    "node_instance_type": "m5.large"
  }
}
```

### S3 Bucket Artifact

An S3 bucket bundle produces an artifact with bucket details:

```json
{
  "bucket": {
    "name": "my-app-logs-prod",
    "arn": "arn:aws:s3:::my-app-logs-prod",
    "region": "us-west-2",
    "versioning": true,
    "encryption": "AES256",
    "lifecycle_rules": true
  },
  "iam": {
    "policy": "{\"Version\":\"2012-10-17\",\"Statement\":[...]}",
    "role_arn": "arn:aws:iam::123456789012:role/s3-access"
  },
  "aws": {
    "region": "us-west-2",
    "account_id": "123456789012"
  },
  "tags": {
    "Purpose": "application-logs",
    "Environment": "production"
  }
}
```

## Related Documentation

- [Artifact Definitions](/concepts/artifact-definitions) - Learn about the schemas that define artifact structure
- [Bundles](/concepts/bundles) - Understand how bundles produce and consume artifacts
- [Connecting Bundles](/getting-started/connecting-bundles) - Step-by-step guide to using artifacts
- [Custom Artifact Definitions](/guides/custom-artifact-definition) - Create your own artifact definitions
- [Artifact Definitions Repository](https://github.com/massdriver-cloud/artifact-definitions) - Browse standard artifact types
