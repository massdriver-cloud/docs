---
id: artifact-definition-yaml-spec
slug: /guides/artifact-definition-yaml-spec
title: Artifact Definition YAML Specification
sidebar_label: Artifact Definition YAML Spec
---

# Artifact Definition YAML Specification

This document outlines the `massdriver.yaml` format for authoring artifact definitions. This format provides a more ergonomic authoring experience compared to writing raw JSON Schema, with support for referencing external files for instructions and export templates.

:::tip When to Use This Format
Use the `massdriver.yaml` format when creating new artifact definitions. It separates concerns by keeping markdown instructions and Liquid templates in their own files, making definitions easier to read and maintain.
:::

## File Structure

An artifact definition using this format consists of a directory containing:

```
my-artifact-definition/
├── massdriver.yaml          # Main definition file
├── instructions/            # Onboarding instruction markdown files
│   ├── step1.md
│   └── step2.md
└── exports/                 # Export template files
    └── config.yaml.liquid
```

## Complete Specification

```yaml
# =============================================================================
# ARTIFACT DEFINITION METADATA
# =============================================================================

# name (required)
# The unique identifier for this artifact definition within your organization.
# Must be lowercase with hyphens. This becomes part of the artifact's reference
# path: <org>/<name> (e.g., "acme/aws-rds-postgres")
name: my-artifact-name

# label (required)
# Human-readable display name shown in the Massdriver UI.
# Used in dropdowns, connection labels, and the artifact type selector.
label: My Artifact Display Name

# icon (optional)
# URL to an icon representing this artifact type.
# Displayed in the UI next to the artifact name.
# Can be an HTTPS URL or a data URL for embedded images.
icon: https://example.com/my-icon.svg

# =============================================================================
# UI CONFIGURATION
# =============================================================================

# ui (optional)
# Controls how this artifact type appears and behaves in the Massdriver UI.
ui:
  # connectionOrientation (optional)
  # Controls how artifacts of this type appear on the canvas.
  # Values:
  #   - "link": Users can draw connection lines to/from this artifact
  #   - "environmentDefault": Artifact only appears as an environment default,
  #                           not as a connectable box on the canvas
  # You can configure both orientations independently for different user roles.
  # Example: SREs might draw lines to a shared K8s cluster while developers
  # only see it as an environment default.
  connectionOrientation: link

  # environmentDefaultGroup (optional)
  # Makes this artifact type available as an environment default under the
  # specified group. Environment defaults are shared resources (credentials,
  # networks, DNS zones) that can be automatically connected to bundles.
  #
  # Common groups:
  #   - "credentials" (special): Appears on the credentials page and enables
  #                              Massdriver to fetch credentials for workflows
  #   - "networking": Network-related defaults (VPCs, subnets)
  #   - "dns": DNS zones and records
  #   - Any custom name that makes sense for your organization
  environmentDefaultGroup: credentials

  # instructions (optional)
  # Onboarding instructions shown to users when they create artifacts of this
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
# Define downloadable file formats for artifact data. Users can download
# configuration files pre-populated with artifact values (e.g., kubeconfig,
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
# The JSON Schema that defines the structure of artifacts of this type.
# This schema validates artifact data and enables type-safe connections
# between bundles.
schema:
  # $schema (recommended)
  # JSON Schema version. Use draft-07 for compatibility.
  $schema: http://json-schema.org/draft-07/schema

  # title (recommended)
  # Human-readable title for the schema
  title: My Artifact Type

  # description (optional)
  # Detailed description of what this artifact represents
  description: |
    Describes a connection to a managed database service including
    authentication credentials and infrastructure identifiers.

  # type (required)
  # Must be "object" for artifact definitions
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
  # Define the structure of your artifact data.
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
      description: Additional artifact data
      type: object
```

## Minimal Example

A minimal artifact definition with just the required fields:

```yaml
name: simple-credential
label: Simple Credential
icon: https://example.com/icon.png

schema:
  $schema: http://json-schema.org/draft-07/schema
  title: Simple Credential
  type: object
  required:
    - token
  properties:
    token:
      title: API Token
      type: string
      $md:
        sensitive: true
```

## Complete Example with All Features

A full-featured artifact definition for a database credential:

```yaml
name: postgres-database
label: PostgreSQL Database
icon: https://cdn.example.com/postgres-icon.svg

ui:
  connectionOrientation: link
  environmentDefaultGroup: databases
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
  $schema: http://json-schema.org/draft-07/schema
  title: PostgreSQL Database
  description: A PostgreSQL database connection artifact
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

This artifact represents a PostgreSQL database connection.

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

Publish your artifact definition using the Massdriver CLI:

```bash
mass definition publish ./path/to/massdriver.yaml
```

The CLI will:
1. Read and parse the `massdriver.yaml` file
2. Inline the content from instruction and export template files
3. Build the JSON Schema format expected by the API
4. Validate against the artifact definition meta-schema
5. Publish to your organization

## Referencing in Bundles

Once published, reference your artifact definition in bundle `massdriver.yaml` files:

```yaml
# In a bundle's massdriver.yaml
artifacts:
  required:
    - database
  properties:
    database:
      # Omit org prefix for definitions in your own organization
      $ref: postgres-database
      # Or use fully qualified name: acme/postgres-database

connections:
  required:
    - database
  properties:
    database:
      $ref: postgres-database
```

## Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique identifier (lowercase, hyphens) |
| `label` | Yes | Display name in UI |
| `icon` | No | URL to icon image |
| `ui.connectionOrientation` | No | `"link"` or `"environmentDefault"` |
| `ui.environmentDefaultGroup` | No | Group name for environment defaults |
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

- [Artifact Definitions Concept](/concepts/artifact-definitions) - Understanding artifact definitions
- [Custom Artifact Definition Guide](/guides/custom-artifact-definition) - JSON format and advanced customization
- [Massdriver Annotations](/json-schema-cheat-sheet/massdriver-annotations) - Special `$md` annotations
