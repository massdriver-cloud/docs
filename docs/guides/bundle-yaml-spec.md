---
id: bundle-yaml-spec
slug: /guides/bundle-yaml-spec
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

# schema (optional)
# The JSON Schema version used for params, connections, and artifacts schemas.
# Currently only "draft-07" is supported.
schema: draft-07

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
    #   - OpenTofu:   /provisioners/opentofu
    #   - Terraform:  /provisioners/terraform
    #   - Helm:       /provisioners/helm
    #   - Bicep:      /provisioners/bicep
    #
    # Self-hosted instances can add custom provisioners.
    # See: /self-hosted/custom-provisioners
    provisioner: opentofu

    # skip_on_delete (optional, default: false)
    # If true, this step is skipped during decommission.
    # Use for resources that should persist (e.g., encryption keys, backups).
    skip_on_delete: false

    # config (optional)
    # Provisioner-specific configuration.
    # Values can be static or JQ expressions referencing params/connections.
    #
    # JQ expressions start with "." and can reference:
    #   - .params.<field>                    - Bundle parameters
    #   - .connections.<name>                - Connection artifacts
    #   - .connections.<name>.data.<path>    - Artifact data
    #   - .connections.<name>.specs.<path>   - Artifact specs
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
        halt_on_failure: '.params.md_metadata.default_tags["md-target"] == "prod"'

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
      region: .connections.azure_credentials.specs.region
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
# JSON Schema Cheat Sheet: /json-schema-cheat-sheet/overview
# Massdriver Annotations:  /json-schema-cheat-sheet/massdriver-annotations
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
  # Conditional logic: show fields based on other field values
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
# CONNECTIONS (Input Artifacts)
# =============================================================================

# connections (required)
# JSON Schema defining artifacts this bundle consumes from other bundles.
# Connections enable type-safe infrastructure composition.
#
# Each connection must reference an artifact definition using $ref.
# Artifact definitions define the contract for infrastructure types.
connections:
  # required (optional)
  # List of connections that must be provided.
  required:
    - vpc
    - credentials

  # properties (required)
  # Connection definitions.
  properties:
    # VPC connection - required network infrastructure
    vpc:
      # $ref (required for connections)
      # Reference to an artifact definition.
      #
      # Formats:
      #   - artifact-name               - Artifact from your organization
      #   - other-org/artifact-name     - Artifact from another organization
      $ref: aws-vpc
      title: VPC
      description: The VPC where the database will be deployed

    # Cloud credentials connection
    credentials:
      $ref: aws-iam-role
      title: AWS Credentials
      description: IAM role for provisioning resources

    # Optional connection (not in required list)
    monitoring:
      $ref: datadog-agent
      title: Monitoring
      description: Optional Datadog agent for metrics

# =============================================================================
# ARTIFACTS (Outputs)
# =============================================================================

# artifacts (required)
# JSON Schema defining artifacts this bundle produces.
# Artifacts can be consumed as connections by other bundles.
#
# Each artifact must reference an artifact definition using $ref.
artifacts:
  # required (optional)
  # List of artifacts that will always be produced.
  required:
    - database

  # properties (required)
  # Artifact definitions.
  properties:
    database:
      # $ref (required for artifacts)
      # Reference to the artifact definition schema.
      $ref: postgresql-authentication
      title: PostgreSQL Database
      description: Connection details for the provisioned database

    # Additional artifact example
    read_replica:
      $ref: postgresql-authentication
      title: Read Replica
      description: Connection details for read replica (if enabled)

# =============================================================================
# UI SCHEMA
# =============================================================================

# ui (optional)
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
# The app block is processed by the massdriver-application Terraform module,
# which handles cloud-agnostic IAM identity creation, policy binding, and
# environment variable injection for your application workloads.
#
# Module: https://github.com/massdriver-cloud/terraform-modules/tree/main/massdriver-application
app:
  # envs (optional)
  # Map environment variable names to JQ expressions.
  # Expressions can reference params and connections.
  #
  # Variable names must match: ^[a-zA-Z_][a-zA-Z0-9_]*$
  envs:
    # Extract values from connections
    DATABASE_HOST: .connections.database.data.authentication.hostname
    DATABASE_PORT: .connections.database.data.authentication.port | tostring
    DATABASE_NAME: .connections.database.data.authentication.database
    DATABASE_USER: .connections.database.data.authentication.username

    # Extract values from params
    LOG_LEVEL: .params.log_level
    ENVIRONMENT: .params.md_metadata.default_tags["md-target"]

    # Transform and combine values
    DATABASE_URL: >-
      "postgresql://" + .connections.database.data.authentication.username +
      "@" + .connections.database.data.authentication.hostname +
      ":" + (.connections.database.data.authentication.port | tostring) +
      "/" + .connections.database.data.authentication.database

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

  # policies (deprecated)
  # Use $md.enum in params schema instead for dynamic IAM policy selection.
  # See: https://docs.massdriver.cloud/json-schema-cheat-sheet/massdriver-annotations
  #
  # JQ expressions referencing IAM policies from params or connections.
  policies:
    - .connections.s3_bucket.data.security.iam.read
    - .connections.database.data.security.iam.write
```

## Minimal Example

A minimal bundle with just the required fields:

```yaml
schema: draft-07
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

connections:
  required:
    - aws_credentials
  properties:
    aws_credentials:
      $ref: aws-iam-role

artifacts:
  required:
    - bucket
  properties:
    bucket:
      $ref: aws-s3-bucket
```

## Infrastructure Bundle Example

A complete infrastructure bundle for a managed database:

```yaml
schema: draft-07
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
        halt_on_failure: '.params.md_metadata.default_tags["md-target"] == "prod"'

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

connections:
  required:
    - vpc
    - aws_authentication
  properties:
    vpc:
      $ref: aws-vpc
      title: VPC
    aws_authentication:
      $ref: aws-iam-role
      title: AWS Credentials

artifacts:
  required:
    - database
  properties:
    database:
      $ref: postgresql-authentication
      title: PostgreSQL Database

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
schema: draft-07
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

connections:
  required:
    - kubernetes_cluster
    - database
  properties:
    kubernetes_cluster:
      $ref: kubernetes-cluster
      title: Kubernetes Cluster
    database:
      $ref: postgresql-authentication
      title: PostgreSQL Database

artifacts:
  properties:
    service:
      $ref: kubernetes-service
      title: Kubernetes Service

app:
  envs:
    DATABASE_HOST: .connections.database.data.authentication.hostname
    DATABASE_PORT: .connections.database.data.authentication.port | tostring
    DATABASE_NAME: .connections.database.data.authentication.database
    DATABASE_USER: .connections.database.data.authentication.username
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

## Field Reference

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `schema` | `string` | JSON Schema version (`draft-07`) |
| `name` | `string` | Bundle identifier (3-53 chars, lowercase with hyphens) |
| `description` | `string` | Human-readable description (10-1024 chars) |
| `params` | `object` | JSON Schema for user parameters |
| `connections` | `object` | JSON Schema for input artifacts |
| `artifacts` | `object` | JSON Schema for output artifacts |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `version` | `string` | `0.0.0` | Semantic version (MAJOR.MINOR.PATCH) |
| `source_url` | `string` | - | Link to source repository |
| `steps` | `array` | Single terraform step | Provisioning steps |
| `ui` | `object` | - | RJSF UI schema for form customization |
| `app` | `object` | - | Application configuration (envs, secrets, policies) |

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
| `policies` | `array` | IAM policy references (deprecated) |

## See Also

- [Bundles Concept](/concepts/bundles) - Understanding bundles
- [Provisioners Overview](/provisioners/overview) - Available provisioners
- [Massdriver Annotations](/json-schema-cheat-sheet/massdriver-annotations) - `$md.*` extensions
- [Artifact Definitions](/concepts/artifact-definitions) - Connection contracts
- [Bundle Meta Schema](https://api.massdriver.cloud/json-schemas/bundle.json) - Validation schema
