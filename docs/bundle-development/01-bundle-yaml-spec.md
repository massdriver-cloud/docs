---
id: bundle-yaml-spec
slug: /bundle-development/bundle-yaml-spec
title: Bundle YAML Specification
sidebar_label: Bundle YAML Spec
---

# Bundle YAML Specification

This document provides a complete reference for the `massdriver.yaml` file format used to define bundles. Each field is documented with inline comments explaining its purpose, valid values, and usage patterns.

## Complete Specification

```yaml
# =============================================================================
# BUNDLE METADATA
# =============================================================================

# name (required)
# The bundle's unique identifier within your organization.
# When published, the full name becomes: <org-slug>/<name>
#
# Constraints:
#   - Pattern: ^[a-z][a-z0-9-]+[a-z0-9]$
#   - Length: 3-53 characters
#   - Must start with a lowercase letter
#   - Can contain lowercase letters, numbers, and hyphens
#   - Must end with a letter or number
name: my-bundle-name

# description (required)
# Human-readable description of the bundle's purpose.
# Displayed in the bundle catalog and registry.
#
# Constraints:
#   - Length: 10-1024 characters
description: |
  A managed PostgreSQL database with automated backups,
  high availability, and encryption at rest.

# version (recommended)
# Semantic version of the bundle (MAJOR.MINOR.PATCH).
# Enables versioning, rollbacks, and automatic upgrades.
# If omitted, defaults to "0.0.0" and disables versioning features.
#
# Format: Must match pattern ^\d+\.\d+\.\d+$
version: 1.2.3

# source_url (optional)
# Link to the bundle's source code repository.
# Helps users find documentation, report issues, and contribute.
source_url: https://github.com/my-org/my-bundle

# =============================================================================
# PROVISIONING STEPS
# =============================================================================

# steps (required)
# Defines the IaC modules to execute during deployment.
# Steps run in order during provision; reverse order during decommission.
# If omitted, defaults to a single Terraform step at path "src" (deprecated behavior).
steps:
  # First step: Infrastructure provisioning with OpenTofu
  - # path (required)
    # Relative path to the IaC module directory.
    # Must be a single subdirectory name (not nested, not ".").
    #
    # Pattern: ^[a-zA-Z0-9][a-zA-Z0-9_-]*$
    path: terraform

    # provisioner (required)
    # The provisioner to use for this step.
    #
    # Available provisioners:
    #   - opentofu      - OpenTofu (recommended for new projects)
    #   - opentofu:1.10 - OpenTofu with specific version
    #   - terraform     - HashiCorp Terraform
    #   - helm          - Kubernetes Helm charts
    #   - bicep         - Azure Bicep templates
    #
    # Provisioner documentation:
    #   - OpenTofu:   /bundle-development/provisioners/opentofu
    #   - Terraform:  /bundle-development/provisioners/terraform
    #   - Helm:       /bundle-development/provisioners/helm
    #   - Bicep:      /bundle-development/provisioners/bicep
    #
    # Self-hosted instances can add custom provisioners.
    # See: /platform-operations/self-hosted/custom-provisioners
    provisioner: opentofu

    # skip_on_delete (optional, default: false)
    # If true, this step is skipped during decommission.
    # Use for resources that should persist (e.g., encryption keys, backups).
    skip_on_delete: false

    # config (optional)
    # Provisioner-specific configuration.
    # Values can be static or JQ expressions referencing params/dependencies.
    #
    # JQ expressions start with "." and can reference:
    #   - .params.<field>                    - Bundle parameters
    #   - .dependencies.<name>               - Dependency resources
    #   - .dependencies.<name>.<path>        - Dependency resource fields
    config:
      # OpenTofu/Terraform config options:
      #   json: boolean              - Enable JSON output (default: false)
      #   checkov.enable: boolean    - Run Checkov scans (default: true)
      #   checkov.quiet: boolean     - Only show failures (default: true)
      #   checkov.halt_on_failure: boolean - Fail deploy on violations (default: false)
      checkov:
        enable: true
        quiet: true
        # JQ expression: halt on failure only in production
        halt_on_failure: '.params.md_metadata.default_tags["md-environment"] == "prod"'

  # Second step: Helm chart deployment
  - path: chart
    provisioner: helm
    skip_on_delete: true
    config:
      # Helm config options:
      #   namespace: string     - Kubernetes namespace
      #   release_name: string  - Helm release name
      #   atomic: boolean       - Rollback on failure
      #   wait: boolean         - Wait for resources
      #   timeout: string       - Timeout duration
      namespace: .params.namespace
      release_name: .params.release_name

  # Third step: Bicep deployment (Azure)
  - path: bicep
    provisioner: bicep
    config:
      # Bicep config options:
      #   region: string              - Azure region
      #   resource_group: string      - Resource group name
      #   delete_resource_group: bool - Delete RG on decommission
      region: .dependencies.azure_credentials.region
      resource_group: '@text "my-resource-group"'
      delete_resource_group: 'true'

# =============================================================================
# PARAMETERS (User Inputs)
# =============================================================================

# params (required)
# JSON Schema defining user-configurable parameters.
# Parameters become IaC input variables at deployment time.
#
# This is where your JSON Schema definition begins for building the
# configuration form UI. The schema controls:
#   - What fields appear in the form
#   - Field types, validation rules, and constraints
#   - Default values and enum options
#   - Conditional field visibility
#
# Supports full JSON Schema draft-07 features plus Massdriver extensions ($md.*).
# JSON Schema Cheat Sheet: /bundle-development/schema-design/overview
# Massdriver Annotations:  /bundle-development/schema-design/massdriver-annotations
params:
  # examples (optional)
  # Preset configurations users can select in the UI.
  # Each example populates all parameter fields at once.
  # Use __name for the preset label shown in the dropdown.
  examples:
    - __name: Development
      instance_type: small
      storage_gb: 20
      backup_retention_days: 7
      high_availability: false
    - __name: Production
      instance_type: large
      storage_gb: 500
      backup_retention_days: 30
      high_availability: true

  # required (optional)
  # List of parameter names that must be provided.
  required:
    - database_name
    - instance_type

  # properties (required)
  # Parameter definitions using JSON Schema.
  properties:
    # Simple string parameter with validation
    database_name:
      type: string
      title: Database Name
      description: Name for the database instance
      # Pattern validation with custom error message
      pattern: "^[a-z][a-z0-9-]{2,30}$"
      message:
        pattern: Must be 3-31 chars, lowercase alphanumeric with hyphens
      # Massdriver extension: make field immutable after creation
      $md.immutable: true

    # Enum parameter (dropdown in UI)
    instance_type:
      type: string
      title: Instance Type
      description: Compute size for the database
      enum:
        - small
        - medium
        - large
        - xlarge
      default: medium

    # Integer parameter with constraints
    storage_gb:
      type: integer
      title: Storage (GB)
      description: Allocated storage in gigabytes
      minimum: 20
      maximum: 16384
      default: 100

    # Boolean parameter
    high_availability:
      type: boolean
      title: High Availability
      description: Enable multi-AZ deployment for failover
      default: false

    # Nested object parameter
    backup:
      type: object
      title: Backup Configuration
      required:
        - retention_days
      properties:
        retention_days:
          type: integer
          title: Retention Days
          minimum: 1
          maximum: 365
          default: 7
        window:
          type: string
          title: Backup Window
          description: Preferred backup window (UTC)
          pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]-([01]?[0-9]|2[0-3]):[0-5][0-9]$"
          default: "03:00-04:00"

    # Array parameter
    allowed_cidrs:
      type: array
      title: Allowed CIDRs
      description: IP ranges allowed to connect
      items:
        type: string
        pattern: "^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$"
      default: []

    # Conditional field using dependencies
    engine_version:
      type: string
      title: Engine Version
      enum:
        - "14"
        - "15"
        - "16"
      default: "15"

  # dependencies (optional)
  # Conditional logic: show fields based on other field values.
  # This is the JSON Schema `dependencies` keyword scoped to params —
  # not the bundle's top-level `dependencies` block below.
  dependencies:
    high_availability:
      oneOf:
        - properties:
            high_availability:
              const: true
            # Show replica count only when HA is enabled
            replica_count:
              type: integer
              title: Read Replicas
              minimum: 1
              maximum: 5
              default: 1
        - properties:
            high_availability:
              const: false

# =============================================================================
# DEPENDENCIES (Input Resources)
# =============================================================================

# dependencies (optional)
# Declares the resources this bundle consumes from other bundles.
# Dependencies enable type-safe infrastructure composition.
# Most bundles declare at least a cloud credential dependency.
#
# Each entry maps a dependency name to a resource type reference.
# Replaces the deprecated `connections` block (see Legacy Format below).
# JQ expressions reference dependencies as .dependencies.<name>
# (e.g. .dependencies.vpc.infrastructure.arn).
dependencies:
  # VPC dependency - required network infrastructure
  vpc:
    # resource_type (required)
    # The resource type this dependency accepts, with an optional
    # version constraint after "@".
    #
    # Formats:
    #   - resource-type-name               - Resource type from your organization
    #   - resource-type-name@1.2.3         - Exact version
    #   - resource-type-name@~1            - Any 1.x.x release
    #   - resource-type-name@~1.2          - Any 1.2.x release
    #   - resource-type-name@latest        - Latest release
    #   - other-org/resource-type-name@~1  - Resource type from another organization
    resource_type: aws-vpc@~1

    # required (required)
    # Whether this dependency must be connected before the bundle
    # can be deployed.
    required: true

  # Cloud credentials dependency
  credentials:
    resource_type: aws-iam-role@~1
    required: true

  # Optional dependency (required: false)
  monitoring:
    resource_type: datadog-agent@~2
    required: false

# =============================================================================
# RESOURCES (Outputs)
# =============================================================================

# resources (optional)
# Declares the resources this bundle produces. These outputs can be
# consumed as dependencies by other bundles.
# Replaces the deprecated `artifacts` block (see Legacy Format below).
resources:
  database:
    # resource_type (required)
    # The resource type and version this bundle produces, in the form
    # name@version (e.g. postgresql-authentication@1.0.0).
    resource_type: postgresql-authentication@1.0.0

    # required (required)
    # Whether this resource is always created by the bundle.
    required: true

  # Conditionally-created resource (required: false)
  read_replica:
    resource_type: postgresql-authentication@1.0.0
    required: false

# =============================================================================
# UI SCHEMA
# =============================================================================

# ui (required, may be empty: `ui: {}`)
# Controls how the configuration form renders in the Massdriver UI.
# Follows React JSON Schema Form (RJSF) UI Schema specification.
# See: https://react-jsonschema-form.readthedocs.io/en/docs/api-reference/uiSchema/
ui:
  # ui:order - Control field ordering
  # Use "*" to place remaining fields at that position
  ui:order:
    - database_name
    - instance_type
    - storage_gb
    - backup
    - high_availability
    - "*"

  # Field-specific UI configuration
  database_name:
    # ui:help - Help text shown below the field
    ui:help: Choose a unique name. Cannot be changed after creation.

  storage_gb:
    # ui:widget - Custom widget for the field
    # Common widgets: updown, range, textarea, password, hidden
    ui:widget: updown

  backup:
    # ui:options - Widget-specific options
    ui:options:
      collapsed: true  # Start collapsed in UI

  allowed_cidrs:
    # Array item configuration
    items:
      ui:placeholder: "10.0.0.0/8"

# =============================================================================
# APPLICATION CONFIGURATION (for application bundles)
# =============================================================================

# app (optional)
# Configuration for bundles deploying application workloads.
# Defines how to inject secrets, environment variables, and IAM policies.
#
# The app block is processed by the terraform-massdriver-application module,
# which parses your massdriver.yaml and provides outputs for secrets,
# environment variables, dependencies, and policies.
#
# Module:   https://github.com/massdriver-cloud/terraform-massdriver-application
# Registry: https://registry.terraform.io/modules/massdriver-cloud/application/massdriver
app:
  # envs (optional)
  # Map environment variable names to JQ expressions.
  # Expressions can reference params (.params.<field>) and
  # dependencies (.dependencies.<name>).
  #
  # Variable names must match: ^[a-zA-Z_][a-zA-Z0-9_]*$
  envs:
    # Extract values from dependencies
    DATABASE_HOST: .dependencies.database.authentication.hostname
    DATABASE_PORT: .dependencies.database.authentication.port | tostring
    DATABASE_NAME: .dependencies.database.authentication.database
    DATABASE_USER: .dependencies.database.authentication.username

    # Extract values from params
    LOG_LEVEL: .params.log_level
    ENVIRONMENT: .params.md_metadata.default_tags["md-environment"]

    # Transform and combine values
    DATABASE_URL: >-
      "postgresql://" + .dependencies.database.authentication.username +
      "@" + .dependencies.database.authentication.hostname +
      ":" + (.dependencies.database.authentication.port | tostring) +
      "/" + .dependencies.database.authentication.database

    # Static values (use @text for literals)
    APP_NAME: '@text "my-application"'

  # secrets (optional)
  # Define secrets the application requires.
  # Users set secret values via the Massdriver UI or CLI.
  #
  # Secret names must match: ^[A-Za-z_][A-Za-z0-9_]*$
  secrets:
    DATABASE_PASSWORD:
      # required (default: false)
      # Whether this secret must be provided before deployment
      required: true
      title: Database Password
      description: Password for database authentication

    API_KEY:
      required: false
      title: External API Key
      description: API key for third-party service integration

    SERVICE_ACCOUNT_JSON:
      required: true
      # json (default: false)
      # If true, the secret value is parsed as JSON
      json: true
      title: Service Account Credentials
      description: GCP service account key in JSON format
```

## Minimal Example

A minimal bundle with just the required fields:

```yaml
name: simple-bucket
description: A simple S3 bucket for file storage
version: 1.0.0

steps:
  - path: src
    provisioner: opentofu

params:
  required:
    - bucket_name
  properties:
    bucket_name:
      type: string
      title: Bucket Name
      pattern: "^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$"

dependencies:
  aws_credentials:
    resource_type: aws-iam-role@~1
    required: true

resources:
  bucket:
    resource_type: aws-s3-bucket@1.0.0
    required: true

ui: {}
```

## Infrastructure Bundle Example

A complete infrastructure bundle for a managed database:

```yaml
name: aws-rds-postgres
description: Managed PostgreSQL on AWS RDS with automated backups and encryption
version: 2.1.0
source_url: https://github.com/my-org/aws-rds-postgres

steps:
  - path: src
    provisioner: opentofu
    config:
      checkov:
        enable: true
        halt_on_failure: '.params.md_metadata.default_tags["md-environment"] == "prod"'

params:
  examples:
    - __name: Development
      instance_class: db.t3.micro
      storage_gb: 20
      multi_az: false
    - __name: Production
      instance_class: db.r6g.large
      storage_gb: 500
      multi_az: true
  required:
    - database_name
    - instance_class
  properties:
    database_name:
      type: string
      title: Database Name
      pattern: "^[a-z][a-z0-9_]{2,62}$"
      $md.immutable: true
    instance_class:
      type: string
      title: Instance Class
      enum:
        - db.t3.micro
        - db.t3.small
        - db.r6g.large
        - db.r6g.xlarge
    storage_gb:
      type: integer
      title: Storage (GB)
      minimum: 20
      maximum: 16384
      default: 100
    multi_az:
      type: boolean
      title: Multi-AZ
      default: false

dependencies:
  vpc:
    resource_type: aws-vpc@~1
    required: true
  aws_authentication:
    resource_type: aws-iam-role@~1
    required: true

resources:
  database:
    resource_type: postgresql-authentication@1.0.0
    required: true

ui:
  ui:order:
    - database_name
    - instance_class
    - storage_gb
    - multi_az
    - "*"
```

## Application Bundle Example

A bundle for deploying a containerized application:

```yaml
name: containerized-api
description: Deploy a containerized API to Kubernetes
version: 1.0.0

steps:
  - path: helm
    provisioner: helm
    config:
      namespace: .params.namespace
      release_name: .params.release_name

params:
  required:
    - image
    - namespace
  properties:
    image:
      type: object
      title: Container Image
      required:
        - repository
        - tag
      properties:
        repository:
          type: string
          title: Repository
        tag:
          type: string
          title: Tag
          default: latest
    namespace:
      type: string
      title: Namespace
      default: default
    release_name:
      type: string
      title: Release Name
    replicas:
      type: integer
      title: Replicas
      minimum: 1
      maximum: 10
      default: 2
    port:
      type: integer
      title: Container Port
      default: 8080

dependencies:
  kubernetes_cluster:
    resource_type: kubernetes-cluster@~1
    required: true
  database:
    resource_type: postgresql-authentication@~1
    required: true

resources:
  service:
    resource_type: kubernetes-service@1.0.0
    required: false

app:
  envs:
    DATABASE_HOST: .dependencies.database.authentication.hostname
    DATABASE_PORT: .dependencies.database.authentication.port | tostring
    DATABASE_NAME: .dependencies.database.authentication.database
    DATABASE_USER: .dependencies.database.authentication.username
    PORT: .params.port | tostring
  secrets:
    DATABASE_PASSWORD:
      required: true
      title: Database Password
    API_SECRET_KEY:
      required: true
      title: API Secret Key

ui:
  ui:order:
    - image
    - namespace
    - replicas
    - port
    - "*"
```

## Legacy Format: `connections` and `artifacts`

Older bundles declare inputs and outputs as JSON Schema blocks named `connections` and `artifacts`:

```yaml
connections:
  required:
    - vpc
  properties:
    vpc:
      $ref: aws-vpc

artifacts:
  required:
    - database
  properties:
    database:
      $ref: postgresql-authentication
```

This format is **deprecated**:

- The CLI prints a deprecation warning when it encounters `connections` or `artifacts` and will ask you to migrate to `dependencies` and `resources`.
- The legacy format does not support versioned resource types (`name@version`).
- A bundle cannot mix formats: setting both `connections` and `dependencies`, or both `artifacts` and `resources`, is an error.

To migrate, convert each `properties` entry into a named entry with `resource_type` (adding a version constraint), and convert the `required` list into per-entry `required: true`/`required: false` flags.

## Field Reference

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Bundle identifier (3-53 chars, lowercase with hyphens) |
| `description` | `string` | Human-readable description (10-1024 chars) |
| `params` | `object` | JSON Schema for user parameters |
| `ui` | `object` | RJSF UI schema for form customization (may be empty: `ui: {}`) |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `version` | `string` | `0.0.0` | Semantic version (MAJOR.MINOR.PATCH) |
| `source_url` | `string` | - | Link to source repository |
| `steps` | `array` | Single terraform step | Provisioning steps |
| `dependencies` | `object` | - | Resources this bundle depends on (replaces deprecated `connections`) |
| `resources` | `object` | - | Resources this bundle produces (replaces deprecated `artifacts`) |
| `app` | `object` | - | Application configuration (envs, secrets, policies) |

### Dependency and Resource Fields

Each entry in `dependencies` and `resources` is a named object with:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resource_type` | `string` | Yes | Resource type reference: `name`, `name@version`, or `org/name@version`. Dependencies accept version constraints (`@1.2.3`, `@~1`, `@~1.2`, `@latest`); resources pin the version they produce. |
| `required` | `boolean` | Yes | For dependencies: must be connected before deploying. For resources: always created by the bundle. |

### Step Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | `string` | Yes | Path to IaC module directory |
| `provisioner` | `string` | Yes | Provisioner to use |
| `skip_on_delete` | `boolean` | No | Skip during decommission |
| `config` | `object` | No | Provisioner-specific config (supports JQ) |

### App Fields

| Field | Type | Description |
|-------|------|-------------|
| `envs` | `object` | Environment variables (JQ expressions) |
| `secrets` | `object` | Secret definitions for secure values |

## See Also

- [Bundles Concept](/concepts/bundles) - Understanding bundles
- [Provisioners Overview](/bundle-development/provisioners/overview) - Available provisioners
- [Massdriver Annotations](/bundle-development/schema-design/massdriver-annotations) - `$md.*` extensions
- [Resource Types](/concepts/resources-and-types) - Dependency contracts
- [Bundle Meta Schema](https://api.massdriver.cloud/json-schemas/bundle.json) - Validation schema
