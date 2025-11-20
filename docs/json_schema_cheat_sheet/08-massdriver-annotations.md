---
id: json-schema-cheatsheet-massdriver-annotations
slug: /json-schema-cheat-sheet/massdriver-annotations
title: Massdriver Custom Annotations
sidebar_label: Massdriver Annotations
---

Massdriver extends JSON Schema with custom annotations prefixed with `$md.` to provide platform-specific functionality. These annotations enhance bundle configuration with features like immutability enforcement, dynamic enums from connected resources, and selective parameter copying between environments.

## `$md.immutable`

### Use Case

Prevents modification of critical infrastructure parameters after initial provisioning that would cause resource recreation or breaking changes. Common examples include VPC CIDR blocks, database identifiers, or storage bucket names that cannot be changed without destroying and recreating the resource.

### Problem Solved

- **Prevents accidental destruction**: Guards against configuration changes that would trigger resource recreation
- **Enforces infrastructure stability**: Ensures critical infrastructure parameters remain stable across deployments
- **Improves user experience**: Clearly indicates to users which fields cannot be changed after initial creation

### Behavior

When a package is provisioned, fields marked with `$md.immutable: true` are transformed to read-only fields in the UI. For packages that haven't been provisioned yet, these fields remain editable.

:::note
This annotation is currently supported on top-level properties and nested properties within objects.
:::

### Example

```yaml
title: VPC Configuration
type: object
required:
  - cidr
  - name
properties:
  cidr:
    title: CIDR Range
    description: IP address range for the VPC (cannot be changed after creation)
    type: string
    pattern: "^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$"
    $md.immutable: true
  name:
    title: VPC Name
    type: string
    $md.immutable: true
  enable_dns:
    title: Enable DNS
    description: This can be toggled after creation
    type: boolean
    default: true
```

### Technical Details

Internally, `$md.immutable` is transformed to the JSON Schema standard `readOnly` property when the package is in a provisioned state. The transformation only applies to packages that have been deployed at least once.

---

## `$md.enum`

### Use Case

Creates dynamic dropdown options based on data from connected artifacts. This allows users to select from available resources in their connected infrastructure, such as:
- Selecting a specific database instance from a connected database cluster
- Choosing a subnet from a connected VPC
- Picking an IAM role from a connected security artifact
- Selecting a topic from a connected messaging service

### Problem Solved

- **Dynamic configuration**: Provides real-time options based on actual infrastructure state rather than static values
- **Reduces configuration errors**: Users select from valid options instead of manually typing resource identifiers
- **Improves discoverability**: Users can see what resources are available in their connected infrastructure
- **Type-safe selections**: Ensures users select valid resources that exist in their environment

### Configuration

The `$md.enum` annotation expects a map with the following properties:

| Property | Required | Description |
|----------|----------|-------------|
| `connection` | Yes | Name of the connection artifact to query |
| `options` | Yes | JQ filter to extract available options from the artifact data |
| `value` | No | JQ formatter for option values (defaults to `.`) |
| `label` | No | JQ formatter for option labels (defaults to `value` formatter) |

### Example: Simple Array of Strings

Select a database instance name from a connected PostgreSQL cluster:

```yaml
title: Database Configuration
type: object
required:
  - database_instance
connections:
  required:
    - postgres_cluster
  properties:
    postgres_cluster:
      $ref: massdriver/postgresql-authentication
properties:
  database_instance:
    title: Database Instance
    description: Select the database instance to connect to
    type: string
    $md.enum:
      connection: postgres_cluster
      options: .data.instances[]
```

**How it works:**
- Queries the `postgres_cluster` connection artifact
- Extracts instance names using the JQ filter `.data.instances[]`
- Creates a dropdown with each instance as both the value and label

### Example: Complex Objects with Custom Labels

Select a subnet with human-readable labels:

```yaml
title: Network Configuration
type: object
required:
  - subnet_id
connections:
  required:
    - vpc
  properties:
    vpc:
      $ref: massdriver/aws-vpc
properties:
  subnet_id:
    title: Subnet
    description: Select the subnet for resource deployment
    type: string
    $md.enum:
      connection: vpc
      options: .data.infrastructure.subnets[]
      value: .id
      label: '"\(.name) - \(.cidr) (\(.availability_zone))"'
```

**How it works:**
- Queries the `vpc` connection artifact
- Iterates over subnets using `.data.infrastructure.subnets[]`
- Extracts the subnet ID as the value: `.id`
- Creates a formatted label: `"Private Subnet 1 - 10.0.1.0/24 (us-east-1a)"`

### Example: IAM Policies

Select an IAM policy from a connected security artifact:

```yaml
title: Security Configuration
type: object
required:
  - iam_policy
connections:
  required:
    - security
  properties:
    security:
      $ref: massdriver/aws-iam-role
properties:
  iam_policy:
    title: IAM Policy
    description: Select the IAM policy to attach
    type: string
    $md.enum:
      connection: security
      options: .data.security.iam | keys
      value: .
      label: .
```

### Error Handling

If the connection is not found or the JQ query is invalid, Massdriver will display an error option in the dropdown:
- `"ERROR: Connection not found: <connection_name>"`
- `"ERROR: Invalid JQ query: <query>"`

These errors help developers identify configuration issues during bundle development.

### Technical Details

The `$md.enum` extension:
1. Finds the specified connection by the `package_field` name
2. Executes the JQ `options` filter against the connection's artifact data
3. For each result, applies the `value` and `label` formatters
4. Generates a JSON Schema `oneOf` array with `const` (value) and `title` (label) pairs
5. Removes the `$md.enum` annotation from the final schema

---

## `$md.copyable`

### Use Case

Controls which parameters should be copied when duplicating package configuration between environments (e.g., from production to staging). This is particularly useful for:
- Excluding environment-specific secrets (passwords, API keys, tokens)
- Preventing sensitive data from being duplicated across environments
- Allowing safe configuration reuse while maintaining security boundaries

### Problem Solved

- **Security**: Prevents accidental exposure of production secrets in lower environments
- **Environment isolation**: Ensures environment-specific credentials remain isolated
- **Configuration reuse**: Allows copying common configuration while excluding sensitive fields
- **Workflow efficiency**: Enables quick environment setup without manual field-by-field copying

### Behavior

When using the `copyPackageParams` GraphQL mutation to copy configuration from one package to another:
- Fields with `$md.copyable: false` are **excluded** from the copy
- Fields with `$md.copyable: true` or without the annotation (default) are **included**
- The annotation works recursively through nested objects
- Overrides can still be applied to non-copyable fields during the copy operation

### Example: Database Configuration

```yaml
title: Database Configuration
type: object
required:
  - name
  - size
  - admin_password
properties:
  name:
    title: Database Name
    type: string
    # Copyable by default - will be copied from prod to staging
  size:
    title: Instance Size
    type: string
    enum: ["small", "medium", "large"]
    # Copyable by default - staging might override to "small"
  admin_password:
    title: Admin Password
    type: string
    format: password
    $md.copyable: false  # Never copy passwords between environments
  database:
    title: Database Settings
    type: object
    properties:
      username:
        title: Username
        type: string
        # Copyable - same username across environments is fine
      password:
        title: Database Password
        type: string
        format: password
        $md.copyable: false  # Don't copy nested passwords either
      host:
        title: Database Host
        type: string
        # Copyable - might be overridden per environment
      port:
        title: Port
        type: number
        default: 5432
        # Copyable - usually the same across environments
```

### Example: API Configuration with Secrets

```yaml
title: API Configuration
type: object
properties:
  api_endpoint:
    title: API Endpoint
    type: string
    # Copyable - staging will override with staging endpoint
  rate_limit:
    title: Rate Limit
    type: number
    default: 1000
    # Copyable - same limit for all environments
  api_key:
    title: API Key
    type: string
    format: password
    $md.copyable: false  # Each environment needs its own API key
  secret_token:
    title: Secret Token
    type: string
    format: password
    $md.copyable: false  # Never share tokens between environments
  timeout:
    title: Request Timeout (seconds)
    type: number
    default: 30
    # Copyable - operational setting can be shared
```

### Using copyPackageParams

The `copyPackageParams` GraphQL mutation respects the `$md.copyable` annotation:

```graphql
mutation CopyFromProdToStaging {
  copyPackageParams(
    organizationId: "org-123"
    srcPackageId: "pkg-prod-database"
    destPackageId: "pkg-staging-database"
    overrides: {
      name: "staging-database"
      size: "small"
      database: {
        host: "staging-db.example.com"
        password: "new-staging-password"
      }
    }
  ) {
    result {
      id
      params
    }
    errors {
      message
      path
    }
  }
}
```

**What gets copied:**
- ✅ `name` is overridden to "staging-database"
- ✅ `size` is overridden to "small"
- ✅ `database.username` is copied from production
- ✅ `database.host` is overridden to staging host
- ✅ `database.port` is copied from production (default value)
- ❌ `admin_password` is **excluded** (not copied, override required)
- ❌ `database.password` is **excluded** but set via override

### Technical Details

The `$md.copyable` annotation:
- Defaults to `true` if not specified
- Is evaluated recursively for nested objects
- Only affects the `copyPackageParams` operation
- Does not prevent direct editing or setting of these fields
- Works at any level of nesting in the params schema

### Best Practices

1. **Mark all secrets as non-copyable**: passwords, API keys, tokens, certificates
2. **Consider environment-specific values**: endpoints, hostnames, resource IDs
3. **Allow copying of operational settings**: timeouts, retry counts, feature flags
4. **Use overrides for environment-specific values** when copying between environments
5. **Test your copy workflow** to ensure secrets don't leak between environments

---

## Using Multiple Annotations Together

You can combine these annotations for powerful configuration patterns:

```yaml
title: Production Database
type: object
required:
  - identifier
  - admin_password
connections:
  required:
    - vpc
  properties:
    vpc:
      $ref: massdriver/aws-vpc
properties:
  identifier:
    title: Database Identifier
    description: Unique identifier for the database (cannot be changed)
    type: string
    pattern: "^[a-z][a-z0-9-]*$"
    $md.immutable: true
    # Copyable by default, but user must provide unique identifier
  
  subnet_id:
    title: Subnet
    description: Select the subnet for database deployment
    type: string
    $md.enum:
      connection: vpc
      options: .data.infrastructure.private_subnets[]
      value: .id
      label: '"\(.name) (\(.availability_zone))"'
    # Copyable - staging might use different subnet
  
  admin_password:
    title: Admin Password
    description: Master password for the database
    type: string
    format: password
    $md.immutable: true  # Cannot change after creation
    $md.copyable: false  # Never copy passwords between environments
```

This example demonstrates:
- **`$md.immutable`** on identifier: Prevents renaming after creation
- **`$md.enum`** on subnet: Dynamic subnet selection from VPC
- **`$md.immutable` + `$md.copyable: false`** on password: Secure and stable

