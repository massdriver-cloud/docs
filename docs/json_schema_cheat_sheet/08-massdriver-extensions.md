---
id: json-schema-cheatsheet-massdriver-extensions
slug: /json-schema-cheat-sheet/massdriver-extensions
title: Massdriver Extensions
sidebar_label: Massdriver Extensions
---

Massdriver extends JSON Schema with custom annotations to add powerful infrastructure-specific functionality to your bundle forms. These extensions provide safety features and dynamic data binding that make your infrastructure bundles more robust and user-friendly.

## `$md.immutable` - Preventing Destructive Changes

The `$md.immutable` extension marks fields that cannot be changed after initial deployment. This prevents accidental modifications that could trigger resource recreation or cause downtime.

### Use Cases

- **Network CIDR blocks** - Changing VPC CIDR ranges typically requires recreating the entire network
- **Database names** - Many cloud databases cannot be renamed after creation
- **Resource identifiers** - Fields that serve as unique identifiers for cloud resources
- **Encryption keys** - Key identifiers that cannot be changed without data loss

### Example

```yaml
title: Database Configuration
type: object
properties:
  database_name:
    title: Database Name
    description: Cannot be changed after creation
    type: string
    $md.immutable: true
  cidr_block:
    title: VPC CIDR Block
    description: Changing this will recreate the VPC
    type: string
    pattern: "^(?:[0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$"
    $md.immutable: true
  instance_class:
    title: Instance Class
    description: This can be changed without recreation
    type: string
    enum:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
```

## `$md.enum` - Dynamic Dropdowns from Connected Resources

The `$md.enum` extension creates dynamic dropdown lists populated from data in connected artifacts. This eliminates hardcoded values and ensures your forms always show current, valid options.

### How It Works

When you deploy infrastructure, Massdriver tracks the outputs (artifacts) from each bundle. The `$md.enum` extension uses [JQ queries](https://jqlang.github.io/jq/) to extract specific data from these connected artifacts and present them as dropdown options.

### Configuration Properties

- **`connection`** - Name of the connection to query for options
- **`options`** - JQ filter to extract available values from the artifact
- **`value`** _(optional)_ - JQ formatter for the actual values (defaults to ".")
- **`label`** _(optional)_ - JQ formatter for display labels (defaults to value formatter)

### Use Cases

#### Available Regions from Cloud Credentials

Connect to AWS/Azure/GCP credentials and dynamically populate regions:

```yaml
title: Deployment Configuration
type: object
properties:
  region:
    title: Deployment Region
    type: string
    $md.enum:
      connection: aws_authentication
      options: .specs.allowedRegions
      label: "split(\"-\") | map(ascii_upcase) | join(\" \")"
      value: "."
```

This transforms `us-west-2` into the label "US WEST 2" while keeping the actual value as `us-west-2`.

#### Database Instances from RDS Cluster

Select from available database instances in a connected RDS cluster:

```yaml
title: Application Configuration
type: object
properties:
  target_database:
    title: Target Database
    type: string
    $md.enum:
      connection: postgres_cluster
      options: .data.instances[].identifier
```

#### Subnets from VPC Connection

Choose from available subnets in a connected VPC:

```yaml
title: Network Configuration
type: object
properties:
  subnet_ids:
    title: Subnets
    type: array
    items:
      type: string
      $md.enum:
        connection: vpc
        options: .data.infrastructure.subnets[]
        value: .id
        label: "\(.name) (\(.availability_zone))"
```

#### Security Groups and Policies

Populate security policies from connected security artifacts:

```yaml
title: Security Configuration
type: object
properties:
  security_policy:
    title: Security Policy
    type: string
    $md.enum:
      connection: security_baseline
      options: .data.security.iam | keys
```

### Multi-Select Arrays

You can use `$md.enum` with array fields for multi-select dropdowns:

```yaml
title: Multi-Region Deployment
type: object
properties:
  regions:
    title: Target Regions
    type: array
    items:
      type: string
      $md.enum:
        connection: aws_authentication
        options: .specs.allowedRegions
        label: "split(\"-\") | map(ascii_upcase) | join(\" \")"
```

### Best Practices

1. **Meaningful Labels** - Use the `label` formatter to create human-readable options
2. **Error Handling** - Test your JQ queries to ensure they handle missing data gracefully
3. **Connection Dependencies** - Ensure the referenced connection is required in your `connections` schema
4. **Data Validation** - Consider adding additional validation beyond the enum options

### JQ Query Tips

- Use `.data` and `.specs` to access artifact data
- Array access: `.data.instances[]` iterates over all instances
- Object keys: `.data.security.iam | keys` gets all policy names
- String manipulation: `split("-") | map(ascii_upcase) | join(" ")` for formatting
- Conditional access: `.data.instances // []` provides fallback for missing data

## Combining Extensions

You can use both extensions together when appropriate:

```yaml
title: Complete Example
type: object
properties:
  target_region:
    title: Target Region
    description: Must be an allowed region for this credential
    type: string
    $md.immutable: true    
    $md.enum:
      connection: cloud_credentials
      options: .specs.allowedRegions
      label: "split(\"-\") | map(ascii_upcase) | join(\" \")"
```

These Massdriver extensions make your infrastructure bundles safer and more user-friendly by preventing dangerous changes and automatically populating valid options from your actual cloud resources. 
