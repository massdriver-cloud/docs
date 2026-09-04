---
id: resource-type-spec
slug: /bundle-development/dependencies-resources/resource-type-spec
title: Resource Type Specification
sidebar_label: Resource Type Spec
---

# Resource Type YAML Specification

This document outlines the `massdriver.yaml` format for authoring resource types. This format provides a more ergonomic authoring experience compared to writing raw JSON Schema, with support for referencing external files for instructions and export templates.

:::tip When to Use This Format
Use the `massdriver.yaml` format for every resource type. It is the format that supports versioning and publishing to your organization's catalog, and it keeps markdown instructions and Liquid templates in their own files. The raw JSON schema format it replaces is deprecated.
:::

## File Structure

A resource type using this format consists of a directory containing:

```
my-resource-type/
├── massdriver.yaml          # Main definition file
├── README.md                # Published with the artifact
├── CHANGELOG.md             # Published with the artifact
├── icon.svg                 # Published with the artifact
├── instructions/            # Onboarding instruction markdown files
│   ├── step1.md
│   └── step2.md
└── exports/                 # Export template files
    └── config.yaml.liquid
```

## Complete Specification

```yaml
# =============================================================================
# RESOURCE TYPE METADATA
# =============================================================================

# name (required)
# The unique identifier for this resource type within your organization.
# Must be lowercase with hyphens. This becomes part of the resource type's
# reference path: <org>/<name> (e.g., "acme/aws-rds-postgres")
name: my-resource-type-name

# version (required to publish)
# Semantic version of the resource type (MAJOR.MINOR.PATCH).
# The CLI publishes this as the artifact's tag in your organization's catalog.
# Publishing is immutable: a version that already exists cannot be republished.
version: 2.1.0

# label (required)
# Human-readable display name shown in the Massdriver UI.
# Used in dropdowns, connection labels, and the resource type selector.
label: My Resource Type Display Name

# icon (optional)
# URL to an icon representing this resource type.
# Displayed in the UI next to the resource type name.
# Can be an HTTPS URL or a data URL for embedded images.
icon: https://example.com/my-icon.svg

# =============================================================================
# UI CONFIGURATION
# =============================================================================

# ui (optional)
# Controls how this resource type appears and behaves in the Massdriver UI.
ui:
  # connectionOrientation (optional)
  # Controls how resources of this type appear on the canvas.
  # Values:
  #   - "link": Users can draw connection lines to/from resources of this type
  #   - "environmentDefault": Resources only appear as an environment default,
  #                           not as a connectable box on the canvas
  # You can configure both orientations independently for different user roles.
  # Example: SREs might draw lines to a shared K8s cluster while developers
  # only see it as an environment default.
  connectionOrientation: link

  # environmentDefaultGroup (optional)
  # Groups this resource type with others in an environment's defaults panel.
  # The group named "credentials" holds cloud credential types, which the UI
  # separates from the rest of an environment's defaults.
  environmentDefaultGroup: credentials

  # instructions (optional)
  # Onboarding instructions shown to users when they create resources of this
  # type. Each instruction becomes a step in the onboarding wizard.
  # Useful for guiding users through credential setup or complex configurations.
  instructions:
    # label: Tab/step title shown in the UI
    # path: Relative path to a markdown file containing the instruction content
    - label: Prerequisites
      path: ./instructions/prerequisites.md
    - label: Create Service Account
      path: ./instructions/create-service-account.md
    - label: Configure Access
      path: ./instructions/configure-access.md

# =============================================================================
# EXPORT TEMPLATES
# =============================================================================

# exports (optional)
# Define downloadable file formats for resource data. Users can download
# configuration files pre-populated with resource values (e.g., kubeconfig,
# database connection files).
exports:
  # downloadButtonText: Label for the download button in the UI
  # fileFormat: File extension for the downloaded file (yaml, json, env, etc.)
  # templatePath: Relative path to the Liquid template file
  # templateLang: Template language used (currently only "liquid" is supported)
  - downloadButtonText: Download Kubeconfig
    fileFormat: yaml
    templatePath: ./exports/kubeconfig.yaml.liquid
    templateLang: liquid

  - downloadButtonText: Download .env
    fileFormat: env
    templatePath: ./exports/dotenv.liquid
    templateLang: liquid

# =============================================================================
# JSON SCHEMA DEFINITION
# =============================================================================

# schema (required)
# The JSON Schema that defines the structure of resources of this type.
# This schema validates resource data and enables type-safe connections
# between bundles.
schema:
  # title (recommended)
  # Human-readable title for the schema
  title: My Resource Type

  # description (optional)
  # Detailed description of what this resource represents
  description: |
    Describes a connection to a managed database service including
    authentication credentials and infrastructure identifiers.

  # type (required)
  # Must be "object" for resource types
  type: object

  # additionalProperties (recommended)
  # Set to false to enforce strict schema validation
  additionalProperties: false

  # required (recommended)
  # List of required top-level properties
  required:
    - infrastructure
    - authentication

  # properties (required)
  # Define the structure of your resource data.
  # Common patterns include grouping by: infrastructure, authentication,
  # iam, cloud, specs, data
  properties:
    # infrastructure: Cloud resource identifiers (ARNs, IDs, regions)
    infrastructure:
      title: Infrastructure
      description: Cloud resource identifiers and metadata
      type: object
      required:
        - arn
        - region
      properties:
        arn:
          title: ARN
          description: Amazon Resource Name
          type: string
          pattern: "^arn:aws:[a-z0-9-]+:[a-z0-9-]*:[0-9]*:.+$"
          # Custom error message for pattern validation
          message:
            pattern: Must be a valid AWS ARN
        region:
          title: Region
          description: AWS region where the resource is deployed
          type: string

    # authentication: Credentials and connection details
    authentication:
      title: Authentication
      description: Connection credentials
      type: object
      required:
        - hostname
        - port
        - username
        - password
      properties:
        hostname:
          title: Hostname
          description: Database endpoint hostname
          type: string
        port:
          title: Port
          description: Database port number
          type: integer
          minimum: 1
          maximum: 65535
        username:
          title: Username
          description: Database username
          type: string
        password:
          title: Password
          description: Database password
          type: string
          # $md.sensitive: Mark fields containing secrets
          # Sensitive fields are masked in GET operations and treated
          # specially by the platform
          $md:
            sensitive: true

    # iam: Cloud IAM roles and permissions
    # Uses patternProperties for dynamic role names
    iam:
      title: IAM
      description: IAM roles and scopes for this resource
      type: object
      additionalProperties: false
      # Pattern-based properties for dynamic keys
      # Keys must be lowercase with underscores (e.g., "read", "write", "admin")
      patternProperties:
        "^[a-z]+[a-z_]*[a-z]$":
          type: object
          required:
            - role
            - scope
          properties:
            role:
              title: Role
              description: Cloud IAM role name
              type: string
              examples:
                - Data Reader
                - Data Writer
            scope:
              title: Scope
              description: Cloud resource identifier the role applies to
              type: string

    # cloud: Cloud provider metadata
    cloud:
      title: Cloud
      description: Cloud provider information
      type: object
      properties:
        provider:
          title: Provider
          description: Cloud provider name
          type: string
          enum:
            - aws
            - gcp
            - azure
        region:
          title: Region
          description: Cloud region
          type: string

    # specs: Resource specifications and configuration
    specs:
      title: Specs
      description: Resource specifications
      type: object
      properties:
        version:
          title: Version
          description: Software/service version
          type: string
        tier:
          title: Tier
          description: Service tier or instance type
          type: string

    # data: Application-specific data
    data:
      title: Data
      description: Additional resource data
      type: object
```

## Minimal Example

A minimal resource type with just the required fields:

```yaml
name: simple-credential
label: Simple Credential
icon: https://example.com/icon.png

schema:
  title: Simple Credential
  type: object
  required:
    - token
  properties:
    token:
      title: API Token
      type: string
      $md.sensitive: true
```

## Complete Example with All Features

A full-featured resource type for a database credential:

```yaml
name: postgres-database
label: PostgreSQL Database
icon: https://cdn.example.com/postgres-icon.svg

ui:
  connectionOrientation: link
  instructions:
    - label: Overview
      path: ./instructions/overview.md
    - label: Create Database
      path: ./instructions/create-database.md

exports:
  - downloadButtonText: Download Connection String
    fileFormat: txt
    templatePath: ./exports/connection-string.liquid
    templateLang: liquid
  - downloadButtonText: Download .env
    fileFormat: env
    templatePath: ./exports/dotenv.liquid
    templateLang: liquid

schema:
  title: PostgreSQL Database
  description: A PostgreSQL database connection resource
  type: object
  additionalProperties: false
  required:
    - infrastructure
    - authentication
  properties:
    infrastructure:
      title: Infrastructure
      type: object
      required:
        - arn
      properties:
        arn:
          title: ARN
          type: string
    authentication:
      title: Authentication
      type: object
      required:
        - hostname
        - port
        - username
        - password
        - database
      properties:
        hostname:
          title: Hostname
          type: string
        port:
          title: Port
          type: integer
          default: 5432
        username:
          title: Username
          type: string
        password:
          title: Password
          type: string
          $md:
            sensitive: true
        database:
          title: Database Name
          type: string
    iam:
      title: IAM
      type: object
      patternProperties:
        "^[a-z_]+$":
          type: object
          properties:
            role:
              type: string
            scope:
              type: string
```

### Instruction File Example

`./instructions/overview.md`:
```markdown
# PostgreSQL Database Setup

This resource represents a PostgreSQL database connection.

## Prerequisites

- Access to your cloud provider's RDS or database service
- Network connectivity to the database endpoint
- Database credentials with appropriate permissions
```

### Export Template Example

`./exports/connection-string.liquid`:
```liquid
postgresql://{{ artifact.authentication.username }}:{{ artifact.authentication.password }}@{{ artifact.authentication.hostname }}:{{ artifact.authentication.port }}/{{ artifact.authentication.database }}
```

`./exports/dotenv.liquid`:
```liquid
DATABASE_HOST={{ artifact.authentication.hostname }}
DATABASE_PORT={{ artifact.authentication.port }}
DATABASE_USER={{ artifact.authentication.username }}
DATABASE_PASSWORD={{ artifact.authentication.password }}
DATABASE_NAME={{ artifact.authentication.database }}
```

## Publishing

A resource type publishes to your organization's catalog as an OCI artifact, the same way a bundle does.

```bash
# Create the repository in the catalog
mass resource-type create aws-vpc

# Publish the version in massdriver.yaml
mass resource-type publish ./aws-vpc

# Pull a published version back down
mass resource-type pull aws-vpc@2.1.0
```

`mass resource-type publish` takes a directory containing a `massdriver.yaml`, or the `massdriver.yaml` itself, and defaults to the current directory.

The published artifact carries the `massdriver.yaml`, the readme, the changelog, the icon, and the instruction and export template files the `massdriver.yaml` references. Nothing else in the directory is included.

Publishing is immutable. Once a version exists it cannot be overwritten, so anything pinned to it keeps resolving to what it resolved to the first time.

### Versions and release channels

Resource types use the same version model as bundles: semantic versions, release channels, and per-environment pinning. A bundle names the versions it accepts in its `dependencies` and `resources` blocks, and Massdriver resolves the range at deploy time. See [Version Resolution](/bundle-development/dependencies-resources/version-resolution).

Each resource type also gets a repository in the OCI catalog, with the same access grants and attribute filters as a bundle repository.

### Referenced files must exist

`ui.instructions[].path` and `exports[].templatePath` point at files rather than carrying their content inline. A path that does not exist, or that resolves outside the resource type's directory, fails the publish. An incomplete artifact is never shipped.

### Publishing a raw JSON schema is deprecated

`mass resource-type publish` still accepts a raw JSON or YAML schema file, the format that predates `massdriver.yaml`, and prints a deprecation warning. That path will be removed in a future release.

A raw schema carries no version of its own. It is stored as the resource type's unversioned `0.0.0` document, cannot take part in versioning, and cannot be pulled back down.

`mass resource-type convert` migrates one:

```bash
mass resource-type convert ./my-resource-type.json
```

It writes a `massdriver.yaml` alongside the schema and pulls inlined instruction and export content back out into referenced files. A placeholder `version` is written into the output — set a real version before you publish.

Resource types that existed before this format were migrated in place and keep working.

## Referencing in Bundles

Once published, name the resource type and the versions you accept in a bundle's `massdriver.yaml`:

```yaml
# What the bundle consumes
dependencies:
  database:
    # Omit the org prefix for resource types in your own organization
    resource_type: postgres-database@~2
    required: true

# What the bundle produces for other bundles to consume
resources:
  database:
    resource_type: postgres-database@2.1.0
    required: true
```

A dependency accepts a range. A resource pins the single version it produces. See [Version Resolution](/bundle-development/dependencies-resources/version-resolution) for the accepted range forms.

## Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique identifier (lowercase, hyphens) |
| `version` | To publish | Semantic version, published as the artifact's tag |
| `label` | Yes | Display name in UI |
| `icon` | No | URL to icon image |
| `ui.connectionOrientation` | No | `"link"` or `"environmentDefault"` |
| `ui.environmentDefaultGroup` | No | Groups the type in an environment's defaults panel; `"credentials"` marks cloud credential types |
| `ui.instructions` | No | Array of onboarding steps |
| `ui.instructions[].label` | Yes | Step title |
| `ui.instructions[].path` | Yes | Path to markdown file |
| `exports` | No | Array of export templates |
| `exports[].downloadButtonText` | Yes | Download button label |
| `exports[].fileFormat` | Yes | Output file extension |
| `exports[].templatePath` | Yes | Path to template file |
| `exports[].templateLang` | Yes | Template language (`liquid`) |
| `schema` | Yes | JSON Schema definition |

## See Also

- [Resource Types Concept](/concepts/resources-and-types) - Understanding resource types
- [Version Resolution](/bundle-development/dependencies-resources/version-resolution) - How a version range picks a resource at deploy time
- [Custom Resource Type Guide](/guides/custom-resource-type) - JSON format and advanced customization
- [Massdriver Annotations](/bundle-development/schema-design/massdriver-annotations) - Special `$md` annotations
