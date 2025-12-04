---
id: concepts-bundles
slug: /concepts/bundles
title: Bundles
sidebar_label: Bundles
---

A **bundle** is a reusable, versioned definition of cloud infrastructure or application components. It encapsulates infrastructure-as-code (IaC) modules, their configuration schemas, dependencies, outputs, deployment logic, and policy-as-code into a single, composable unit.

Bundles solve a fundamental problem in cloud infrastructure management: how to create, share, and compose infrastructure components while maintaining type safety, security, and operational best practices. Instead of managing raw IaC code and ad-hoc configuration, bundles provide a structured contract that defines:

- **What inputs are required** (parameters and connections)
- **What outputs are produced** (artifacts)
- **How to deploy** (provisioning steps)
- **How to configure applications** (secrets, environment variables, IAM policies)
- **What policies are enforced** (policy-as-code validations)

## The Problem Bundles Solve

Modern teams struggle with complex cloud setups, slow provisioning, and DevOps bottlenecks. Traditional IaC workflows require developers to author Terraform, Helm, or other infrastructure code, push to Git, and wait for CI pipelines to execute—a process that leads to long code review cycles and a steep learning curve for those not deeply familiar with cloud internals. This slows down innovation and creates friction between fast-moving development needs and the safeguards of operations.

Many organizations attempt to implement self-service infrastructure via ad-hoc scripts or internal platforms, but these typically demand significant engineering effort (e.g., building custom frontends and backends) or still rely on heavy gatekeeping in CI/CD. The result is inconsistent practices, misconfigurations, and "shadow IT" where developers bypass official processes, causing configuration drift and compliance issues.

Bundles address these challenges by providing a safe self-service framework that lets operations teams encode best practices, security policies, and cloud architecture patterns into ready-to-use modules, while developers get a simple interface to deploy what they need. This means developers can move fast without breaking things, because guardrails are built-in. By eliminating unnecessary red tape and providing an easier interface than even cloud consoles, bundles make the compliant path the path of least resistance—preventing configuration drift and errors at the source.

## Bundle Principles

### Bundle-Centric Architecture

Bundles encapsulate best practices, validations, policies, and artifact contracts so mistakes can't propagate downstream. When you use a bundle, you're not just deploying code—you're deploying a complete, validated configuration that has been tested and proven.

### Proactive Guardrails

Invalid, insecure, or out-of-policy configurations are impossible to express. Issues are prevented up front rather than caught in review. The bundle schema validates all inputs before deployment begins.

### Pipeline-Free Automation

Ephemeral, on-demand workflows replace permanent IaC pipelines, eliminating pipeline sprawl and the maintenance burden that comes with it. Each deployment is a fresh execution based on the bundle definition.

### Type-Safe Infrastructure Composition

Artifact schemas and connection contracts ensure components are compatible before they're ever deployed. You can't connect a PostgreSQL database to a component expecting a Redis connection—the system validates compatibility at design time.

### The Compliant Path is the Easiest Path

Developers get a simple, visual, self-service workflow that naturally adheres to ops policies and standards. The bundle enforces compliance by design.

### Environment Consistency by Design

Every environment is created from the same validated bundle definitions conceptually, eliminating drift and configuration divergence. While environments may use different bundle versions, they all follow the same bundle structure and validation rules, with environment-specific parameter values.

### Single-Purpose Design

A Massdriver bundle typically serves a single purpose rather than abstracting an entire cloud service. Instead of generic modules like `AWS RDS`, bundles are designed around the use case a software engineer is looking for, like `AWS RDS MySQL`. In Massdriver, we advise against bundles like 'S3 Bundle' and instead suggest bundles like 'S3 Logging Bucket' or 'CDN' (using S3 & CloudFront). This approach ensures bundles are composable, maintainable, and aligned with actual engineering needs.

### Bring Your Own IaC

Use Terraform, OpenTofu, Helm, Bicep, or any other IaC tool. Massdriver adds guardrails, validation, and orchestration without locking you into a DSL. Your IaC code remains in your repositories, under your control.

### No Lock-In

Infrastructure runs in your cloud accounts, bundles are open specifications, and you retain full ownership of IaC code and state. Bundles are stored in OCI-compatible registries and can be used independently of the platform.

## Bundle Structure

A bundle is defined by a `massdriver.yaml` file that follows the bundle specification. This file contains all the metadata, schemas, and configuration needed to deploy and operate the bundle.

## Required Fields

### `name`

**Type**: `string`  
**Pattern**: `^[a-z][a-z0-9-]+[a-z0-9]$`  
**Length**: 3-53 characters

The repository name of the bundle. When published, this is scoped with your organization's slug as a prefix (e.g., `my-org/postgresql-database`). The full scoped name is used to identify the bundle in the registry.

**Example**:
```yaml
name: postgresql-database
```

### `description`

**Type**: `string`  
**Length**: 10-1024 characters

A human-readable description of what the bundle does. This appears in the registry and helps users understand the bundle's purpose.

**Example**:
```yaml
description: A managed PostgreSQL database with automated backups and high availability
```

### `schema`

**Type**: `string`  
**Enum**: `["draft-07"]`

The JSON Schema version used to define the bundle. Currently, only `draft-07` is supported.

**Example**:
```yaml
schema: draft-07
```

### `params`

**Type**: JSON Schema object (draft-07)  
**Required**: Must have a `properties` object

Input parameters for the bundle. These define the configuration values that users must provide when deploying the bundle. Parameters are converted to input variables for your IaC module.

Each parameter is defined using JSON Schema, allowing for rich validation, types, defaults, and conditional logic.

#### Using JSON Schema Examples for Presets

JSON Schema's `examples` array at the root of your params schema creates preset configurations that users can select in the UI. Each example object should include a `__name` field for the preset label, along with the parameter values.

**Example**:
```yaml
params:
  examples:
    - __name: Development
      database_name: dev-db
      instance_size: small
      backup_retention_days: 7
    - __name: Production
      database_name: prod-db
      instance_size: large
      backup_retention_days: 30
  properties:
    database_name:
      type: string
      title: Database Name
    instance_size:
      type: string
      enum: [small, medium, large]
    backup_retention_days:
      type: integer
      minimum: 1
      maximum: 365
```

When users configure a package, they can select a preset from the dropdown to populate all parameter values at once, then customize as needed.

**Example**:
```yaml
params:
  required:
    - database_name
    - instance_size
  properties:
    database_name:
      type: string
      title: Database Name
      description: The name of the database to create
      pattern: ^[a-z][a-z0-9-]+$
    instance_size:
      type: string
      title: Instance Size
      enum:
        - small
        - medium
        - large
      default: medium
```

Parameters support all JSON Schema features including:
- Type validation (string, number, integer, boolean, object, array)
- Enums and oneOf/anyOf/allOf
- Pattern matching for strings
- Min/max constraints for numbers
- Conditional logic with `dependencies`
- References to remote schemas for building guardrail (UI/validation) component catalogs with `$ref`
<!-- TODO: add a docs page on using $ref and designing a schema catalog for sharing commoon validations -->

Massdriver extends JSON Schema with custom annotations prefixed with `$md.` to provide platform-specific functionality. These annotations enhance bundle configuration with features like immutability enforcement, dynamic enums from connected resources, and selective parameter copying between environments. See the [Massdriver Custom Annotations](https://docs.massdriver.cloud/json-schema-cheat-sheet/massdriver-annotations) documentation for details.

### `connections`

**Type**: JSON Schema object (draft-07)  
**Required**: Must have a `properties` object

Input connections define which artifacts from other bundles this bundle depends on. Connections enable type-safe composition of infrastructure components.

Each connection property must reference an artifact definition using `$ref`. Artifact definitions define the contract (schema) for a type of cloud resource, ensuring that only compatible artifacts can be connected. See [Artifact Definitions](https://docs.massdriver.cloud/concepts/artifact-definitions) for more information.

**Example**:
```yaml
connections:
  required:
    - kubernetes_cluster
  properties:
    kubernetes_cluster:
      $ref: massdriver/kubernetes-cluster
      title: Kubernetes Cluster
      description: The cluster where this application will be deployed
    database:
      $ref: massdriver/postgresql-authentication
      title: PostgreSQL Database
      description: The database to connect to
```

When a bundle is deployed, the connection values are populated from artifacts produced by other bundles in the same project. The system validates that:
1. The artifact type matches the connection's artifact definition
2. The artifact is available in the target environment
3. All required connections are provided

### `artifacts`

**Type**: JSON Schema object (draft-07)  
**Required**: Must have a `properties` object

Output artifacts define the cloud resources created by this bundle that are available to be used as input connections to other bundles.

Each artifact property must reference an artifact definition using `$ref`. The artifact definition specifies the schema for the data and specs that the artifact will contain.

**Example**:
```yaml
artifacts:
  properties:
    database:
      $ref: massdriver/postgresql-authentication
      title: PostgreSQL Database
      description: The provisioned database connection details
```

Artifacts are produced when the bundle is successfully deployed. They contain:
- **`data`**: Secure, encrypted connection details (credentials, endpoints, etc.)
- **`specs`**: Public metadata for filtering and display (region, tags, etc.)

Artifacts enable bundles to be composed together. For example, a PostgreSQL bundle produces a `postgresql-authentication` artifact that can be consumed by an application bundle requiring a database connection.

See the [artifact definitions repository](https://github.com/massdriver-cloud/artifact-definitions) for available artifact types.

### `ui`

**Type**: `object`  
**Additional Properties**: `true`

The UI schema provides advanced control over how the bundle's configuration form is rendered in the Massdriver UI. It follows the [React JSON Schema Form (RJSF) UI Schema](https://react-jsonschema-form.readthedocs.io/en/docs/api-reference/uiSchema/) specification.

**Common use cases**:
- Reordering fields
- Grouping related fields
- Hiding fields conditionally
- Customizing field widgets
- Adding help text and instructions

**Example**:
```yaml
ui:
  ui:order:
    - database_name
    - instance_size
    - backup_retention
    - "*"  # All other fields
  instance_size:
    ui:help: Choose based on expected load. Small is suitable for development.
  backup_retention:
    ui:widget: updown
```

## Optional Fields

### `source_url`

**Type**: `string`

A link to the bundle's source code repository. This helps users find the bundle's code, report issues, and contribute improvements.

**Example**:
```yaml
source_url: https://github.com/my-org/my-bundle
```

### `steps`

**Type**: `array` of step objects

The steps that will be run in the deployment pipeline for this bundle. Steps are executed in order, and each step can use a different provisioner (Terraform, Helm, kubectl, etc.).

**Step Object Properties**:
- **`path`** (required): The path to the step's code or configuration. Must be a single subdirectory (not nested, not `.`). Pattern: `^[a-zA-Z0-9][a-zA-Z0-9_-]*$`
- **`provisioner`** (required): The provisioner to use. See the [Provisioners Overview](https://docs.massdriver.cloud/provisioners/overview) for available provisioners and their configuration options.
- **`config`** (optional): Provisioner-specific configuration. Values can use JQ expressions to query params and connections dynamically. See [Provisioner Configuration](https://docs.massdriver.cloud/provisioners/overview#configuration) for details.

**Example**:
```yaml
steps:
  - path: terraform
    provisioner: terraform
    config:
      workspace: production
  - path: helm
    provisioner: helm
    config:
      namespace: .params.namespace
      releaseName: .params.name
```

The `config` field supports JQ expressions that can reference:
- `.params.*` - Bundle parameters
- `.connections.*` - Connection artifacts
- `.connections.*.data.*` - Artifact data
- `.connections.*.specs.*` - Artifact specs

**Example with JQ expressions**:
```yaml
steps:
  - path: src
      provisioner: opentofu:1.10
      config:
        checkov: 
          enable: '.params.tags.ENVIRONMENT != "test"'
          halt_on_failure: '.params.tags.ENVIRONMENT == "prod"'
```

### `app`

**Type**: `object`

Application configuration for bundles that deploy application workloads. This section defines how to configure the deployed application with secrets, environment variables, and IAM policies.

#### `app.secrets`

**Type**: `object`  
**Property Names**: Must match pattern `^[A-Za-z_][A-Za-z0-9_]*$`

Defines secrets that the application requires. Secrets are encrypted at rest and injected into the application at runtime. Defining secrets in the bundle also enables a secrets management interface on the application's package, allowing users to securely set and manage these values through the Massdriver UI or CLI.

**Secret Properties**:
- **`required`** (boolean, default: `false`): Whether this secret must be provided
- **`json`** (boolean, default: `false`): Whether the secret value should be parsed as JSON
- **`title`** (string): Human-readable name for the secret
- **`description`** (string): Explanation of what the secret is used for

**Example**:
```yaml
app:
  secrets:
    DATABASE_PASSWORD:
      required: true
      title: Database Password
      description: Password for the database connection
    API_KEY:
      required: false
      json: true
      title: API Key Configuration
```

#### `app.envs`

**Type**: `object`  
**Property Names**: Must match pattern `^[a-zA-Z_][a-zA-Z0-9_]*$`

Maps bundle parameters and connection values to environment variables using JQ expressions. Environment variables are injected into the application container or runtime.

**Example**:
```yaml
app:
  envs:
    DATABASE_HOST: .connections.database.data.authentication.hostname
    DATABASE_PORT: .connections.database.data.authentication.port | tostring
    LOG_LEVEL: .params.log_level
    API_URL: .connections.api_gateway.data.endpoint
```

JQ expressions unify the configuration interface to your parameters. They can drive environment variables, IaC variables, and other configuration values by querying params and connections instead of hardcoding:

- Extract values from params: `.params.param_name`
- Extract values from connections: `.connections.connection_name.data.path` or `.connections.connection_name.specs.path`
- Transform values: `| tostring`, `| join(",")`
- Query nested data: `.connections.database.data.authentication.hostname`

This approach ensures your configuration stays dynamic and adapts to your infrastructure, rather than requiring manual updates when values change.

#### `app.policies`

**Type**: `array` of strings  
**Pattern**: `^\\.[a-zA-Z0-9._-]*$`  
**Status**: Deprecated

> **Note**: The `app.policies` field is deprecated. Use `$md.enum` in your parameter schemas instead to create dynamic IAM policy selection from connected artifacts. See [Massdriver Custom Annotations](https://docs.massdriver.cloud/json-schema-cheat-sheet/massdriver-annotations) for details on `$md.enum`.

Maps param and connection values to IAM permissions and policies for the application. Policies are JQ expressions that reference bundle parameters or connections to generate IAM policy documents.

**Example**:
```yaml
app:
  policies:
    - .params.iam_policy
    - .connections.s3_bucket.data.iam_policy
```

Policies are evaluated at deployment time and attached to the application's execution role or service account.

## Bundle Lifecycle

### Development

1. **Create** a bundle repository with your IaC code using the Massdriver CLI, or start from a template in the [Bundle Template Library](https://www.massdriver.cloud/templates). These templates are designed to be used as a starting point for your infrastructure and application needs, providing proven patterns with best practices built-in.
2. **Define** the `massdriver.yaml` file with schemas and configuration
3. **Test** using the Development Releases feature: publish to a development release and grid test your plans and scans against ephemeral real "test" infrastructure. Spin the resources down at the end. Test common scenarios by writing the IaC and the policy-as-code, ensuring your bundle works correctly before publishing a stable release.

### Publishing

1. **Publish** a versioned bundle to the Massdriver registry. Stable semantic version releases automatically upgrade all active infrastructure modules when they pass plans and scans, automating most day-2 IaC upgrade maintenance.

### Deployment

1. **Add** the bundle to an environment canvas from the bundle sidebar when viewing a project
2. **Configure** parameters and connections with proactive guardrails ensuring valid, secure configurations
3. **Deploy** to an environment
4. **Get back to writing software** - Your infrastructure is provisioned in minutes, not days. No waiting for CI pipelines, no manual approvals, no context switching between tools.

## Best Practices

### Schema Design

Design your schemas to enforce proactive guardrails that stop invalid inputs before deployment. Use JSON Schema's validation features to constrain values more strictly than basic Terraform variable validation:

- Use descriptive titles and descriptions for all fields
- Mark fields as required only when necessary
- Provide sensible defaults where possible
- Use enums for constrained choices
- Leverage JSON Schema's conditional logic for complex forms

**Example: Constrained Instance Sizes**
```yaml
instance_size:
  type: string
  enum: [small, medium, large]
  # Prevents invalid sizes like "xlarge" or "tiny"
```

**Example: Pattern Validation for Resource Names**
```yaml
database_name:
  type: string
  pattern: '^[a-z][a-z0-9-]{2,30}$'
  # Enforces lowercase, alphanumeric with hyphens, prevents leading numbers
```

**Example: Range Constraints with Exclusions**
```yaml
port:
  type: integer
  minimum: 1024
  maximum: 65535
  # Prevents using privileged ports (< 1024) or invalid port numbers
```

### Artifact Definitions

- Create custom artifact definitions for organization-specific resources
- Keep artifact schemas focused—separate data (secure) from specs (public). The `data` field contains encrypted artifact data (credentials, connection strings) accessible only to authorized packages. The `specs` field contains metadata (region, tags) visible in the UI for filtering and display without exposing sensitive information.

### Steps and Provisioners

- Keep steps focused and single-purpose
- Use JQ expressions in step configs for dynamic values. JQ expressions can query params and connections to build dynamic workflow steps. For instance, you can conditionally enable features like `halt_on_failure` based on environment or other parameters:

```yaml
steps:
  - path: src
    provisioner: opentofu:1.10
    config:
      checkov:
        enable: true
        halt_on_failure: '.params.md_metadata.default_tags["md-target"] == "prod"'
```

This example enables Checkov security scanning and only halts on failure in production environments.
- Test steps independently when possible
- Document provisioner-specific requirements

### Application Configuration

- Use environment variables for non-sensitive configuration. Use JQ expressions and query params/connections to extract data instead of hardcoding and copy-pasting values. This keeps your configuration dynamic and maintainable.
- Use secrets for sensitive data (credentials, API keys)
- Use JQ expressions to transform connection data into the format your application expects

### UI Schema

The UI schema follows the [React JSON Schema Form (RJSF) UI Schema](https://react-jsonschema-form.readthedocs.io/en/docs/api-reference/uiSchema/) specification. Here are some common examples:

**Field Ordering**:
```yaml
ui:
  ui:order:
    - database_name
    - instance_size
    - "*"  # All other fields
```

**Field Help Text**:
```yaml
ui:
  instance_size:
    ui:help: Choose based on expected load. Small is suitable for development.
```

**Widget Customization**:
```yaml
ui:
  backup_retention:
    ui:widget: updown
  port:
    ui:widget: updown
```

## Examples

### PostgreSQL Bundle

```yaml
schema: draft-07
name: postgresql-database
description: A managed PostgreSQL database with automated backups

params:
  required:
    - database_name
    - instance_size
  properties:
    database_name:
      type: string
      title: Database Name
      pattern: ^[a-z][a-z0-9-]+$
    instance_size:
      type: string
      title: Instance Size
      enum: [small, medium, large]
      default: medium

connections:
  properties:
    vpc:
      # This $ref references an artifact definition—the contract between two IaC modules.
      # It validates and passes data between them.
      $ref: my-org/aws-vpc
      title: VPC
      description: The VPC where the database will be deployed

artifacts:
  properties:
    database:
      # This $ref references an artifact definition—the contract between two IaC modules.
      # It validates and passes data between them.
      $ref: my-org/postgres
      title: PostgreSQL Database

steps:
  - path: terraform
    provisioner: terraform

ui:
  ui:order:
    - database_name
    - instance_size
    - "*"
```

### Application Bundle (Web Service)

```yaml
schema: draft-07
name: web-service
description: A containerized web service

params:
  required:
    - image
    - port
  properties:
    image:
      type: object
      title: Container Image
      required: [repository, tag]
      properties:
        repository:
          type: string
          title: Repository
        tag:
          type: string
          title: Tag
          default: latest
    port:
      type: integer
      title: Port
      minimum: 1
      maximum: 65535
      default: 8080

connections:
  required:
    - kubernetes_cluster
    - database
  properties:
    kubernetes_cluster:
      $ref: massdriver/kubernetes-cluster
    database:
      $ref: massdriver/postgresql-authentication

artifacts:
  properties:
    service:
      $ref: massdriver/kubernetes-service
      title: Kubernetes Service

app:
  envs:
    DATABASE_HOST: .connections.database.data.authentication.hostname
    DATABASE_PORT: .connections.database.data.authentication.port | tostring
    PORT: .params.port | tostring
  secrets:
    DATABASE_PASSWORD:
      required: true
      title: Database Password

steps:
  - path: helm
    provisioner: helm
    config:
      namespace: default
      releaseName: .params.name

ui:
  ui:order:
    - image
    - port
    - "*"
```

## Related Documentation

- [Artifact Definitions](https://github.com/massdriver-cloud/artifact-definitions) - Standard artifact types
- [React JSON Schema Form UI Schema](https://react-jsonschema-form.readthedocs.io/en/docs/api-reference/uiSchema/) - UI customization reference
- [JSON Schema Specification](https://json-schema.org/specification.html) - Schema validation reference
- [JQ Manual](https://stedolan.github.io/jq/manual/) - JQ expression syntax

