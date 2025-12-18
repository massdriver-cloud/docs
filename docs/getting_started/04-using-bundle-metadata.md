---
id: getting-started-using-bundle-metadata
slug: /getting-started/using-bundle-metadata
title: Using Bundle Deployment Metadata
sidebar_label: Using Bundle Deployment Metadata
---

Welcome to part 4 of the Massdriver getting started guide! In the previous guide, you learned how to [create your own bundle](03-creating-bundles.md). Now you'll learn how to leverage Bundle Deployment Metadata (`md_metadata`) that Massdriver automatically injects into every bundle deployment.

## What You'll Learn

By the end of this guide, you'll understand:

✅ **What `md_metadata` is** - Automatically injected deployment context  
✅ **Resource naming patterns** - Using `name_prefix` for consistent naming  
✅ **Tagging strategies** - Applying default tags to all resources  
✅ **Conditional logic** - Environment-specific behavior using metadata  
✅ **Observability integration** - Sending alarms to Massdriver  
✅ **Package context** - Using deployment timestamps and status

## What is md_metadata?

Bundle Deployment Metadata (`md_metadata`) is automatically injected by Massdriver into every bundle deployment. It provides context about the package, target environment, and deployment configuration without requiring you to pass these values as parameters.

**Key benefits:**
- **Eliminates redundant parameters** - No need to ask users for project, environment, or package names
- **Consistent naming** - Standardized resource naming across all deployments
- **Automatic tagging** - Built-in tags for cost tracking and resource organization
- **Deployment context** - Timestamps and status information for conditional logic

**Important**: `md_metadata` should never contain sensitive information. It only contains non-sensitive metadata that is safe to expose to bundle execution environments.

## Accessing md_metadata

The way you access `md_metadata` depends on your provisioner:

- **Terraform/OpenTofu**: Available as `var.md_metadata`
- **JQ expressions** (in provisioner configs): Available as `.params.md_metadata`

## Complete Example

Here's a complete, real-world example showing how to use `md_metadata` in a Terraform/OpenTofu bundle:

```hcl
# md_metadata is automatically injected by Massdriver - no need to declare it in your variables
# It contains: name_prefix, default_tags, observability, target, and package info

# Use name_prefix for consistent resource naming
resource "aws_s3_bucket" "logs" {
  bucket = "${var.md_metadata.name_prefix}-logs"  # e.g., "my-project-prod-my-package-logs"
}

# Apply default tags to all resources (includes managed-by, md-project, md-target, etc.)
resource "aws_instance" "app" {
  ami           = "ami-12345"
  instance_type = "t3.medium"
  
  # Merge default tags with custom tags
  tags = merge(
    var.md_metadata.default_tags,  # { managed-by = "massdriver", md-project = "...", md-target = "prod", ... }
    {
      Name = "${var.md_metadata.name_prefix}-app"
      Component = "application"
    }
  )
}

# Use tags for conditional logic (e.g., enable stricter checks in production)
locals {
  is_production = var.md_metadata.default_tags["md-target"] == "production"
  enable_backups = var.md_metadata.default_tags["md-target"] != "test"
}

# Use observability webhook for alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.md_metadata.name_prefix}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 80
  
  # Send alarms to Massdriver
  alarm_actions = [var.md_metadata.observability.alarm_webhook_url]
}

# Access package metadata for deployment context
locals {
  package_age_days = floor(
    (time() - timeadd(var.md_metadata.package.created_at, "0s")) / 86400
  )
  is_first_deployment = var.md_metadata.package.previous_status == null
}
```

**In JQ expressions** (for provisioner configs):

```yaml
steps:
  - path: src
    provisioner: opentofu:1.10
    config:
      # Only halt on security scan failures in production
      checkov:
        enable: true
        halt_on_failure: '.params.md_metadata.default_tags["md-target"] == "prod"'
      
      # Use name prefix for workspace naming
      workspace: '.params.md_metadata.name_prefix'
```

## md_metadata Structure

The `md_metadata` object contains the following fields:

### `name_prefix`

**Type**: `string`  
**Source**: `package.name_prefix`

The name prefix for the package. This incorporates the project, target (environment), and manifest slugs, providing a unique identifier for all resources created by this package.

**Example**: `"my-project-prod-my-package"`

**Use case**: Resource naming to ensure uniqueness and traceability.

```hcl
resource "aws_s3_bucket" "logs" {
  bucket = "${var.md_metadata.name_prefix}-logs"
}
```

### `default_tags`

**Type**: `object` (map of string key-value pairs)

Default tags that should be applied to all resources created by the bundle. These tags help with resource organization, cost tracking, and compliance.

**Tags included**:
- `managed-by`: Always set to `"massdriver"`
- `md-project`: The project slug (`package.target.project.slug`)
- `md-target`: The target (environment) slug (`package.target.slug`)
- `md-manifest`: The manifest slug (`package.manifest.slug`)
- `md-package`: The package name prefix (`package.name_prefix`)

**Use case**: Apply consistent tagging across all resources.

```hcl
resource "aws_instance" "app" {
  tags = merge(
    var.md_metadata.default_tags,
    {
      Name = "${var.md_metadata.name_prefix}-app"
    }
  )
}
```

### `observability`

**Type**: `object`

Observability configuration for the package, including alarm webhook endpoints.

#### `observability.alarm_webhook_url`

**Type**: `string`  
**Source**: Generated webhook URL for the target's alarm endpoint

The webhook URL where bundles can send alarm notifications. This endpoint is specific to the target and allows bundles to report alarms back to Massdriver.

**Use case**: Integrate CloudWatch alarms or other monitoring systems with Massdriver.

```hcl
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_actions = [var.md_metadata.observability.alarm_webhook_url]
  # ... other alarm configuration
}
```

### `target`

**Type**: `object`

Target (legacy name for Environment) information for the deployment.

#### `target.contact_email`

**Type**: `string`  
**Source**: `package.target.project.organization.owner.email`

The email address of the organization owner associated with the target. This can be used for notifications or contact information in your infrastructure.

**Use case**: Include contact information in resource tags or notifications.

```hcl
resource "aws_sns_topic" "alerts" {
  display_name = "Alerts for ${var.md_metadata.target.contact_email}"
}
```

### `package`

**Type**: `object`

Package metadata providing time and status context for the deployment.

#### `package.created_at`

**Type**: `string` (ISO 8601 datetime)  
**Source**: `package.created_at`

When the package was originally created.

#### `package.updated_at`

**Type**: `string` (ISO 8601 datetime)  
**Source**: `package.updated_at`

When the package was last updated.

#### `package.deployment_enqueued_at`

**Type**: `string` (ISO 8601 datetime)  
**Source**: `DateTime.utc_now()` at deployment time

When the current deployment was enqueued. This timestamp is set at deployment time, not package update time.

#### `package.previous_status`

**Type**: `string`  
**Source**: `package.status` before deployment

The status of the package before this deployment was initiated. Useful for detecting state transitions (e.g., from "healthy" to "deploying").

**Use case**: Conditional logic based on deployment history.

```hcl
locals {
  is_first_deployment = var.md_metadata.package.previous_status == null
  was_healthy = var.md_metadata.package.previous_status == "healthy"
}
```

## Common Use Cases

### Resource Naming

Use `name_prefix` to ensure consistent resource naming across your infrastructure:

```hcl
resource "aws_s3_bucket" "logs" {
  bucket = "${var.md_metadata.name_prefix}-logs"
}

resource "aws_instance" "app" {
  tags = {
    Name = "${var.md_metadata.name_prefix}-app"
  }
}
```

### Tagging Resources

Apply default tags to all resources for better organization and cost tracking:

```hcl
resource "aws_instance" "app" {
  tags = merge(
    var.md_metadata.default_tags,
    {
      Name = "${var.md_metadata.name_prefix}-app"
      Component = "application"
    }
  )
}
```

### Conditional Logic Based on Environment

Use tags to implement environment-specific behavior:

```hcl
locals {
  is_production = var.md_metadata.default_tags["md-target"] == "production"
  enable_backups = var.md_metadata.default_tags["md-target"] != "test"
}

resource "aws_db_instance" "database" {
  backup_retention_period = local.enable_backups ? 30 : 7
  # ... other configuration
}
```

**In JQ expressions** (for provisioner configs):

```yaml
steps:
  - path: src
    provisioner: opentofu:1.10
    config:
      checkov:
        enable: true
        halt_on_failure: '.params.md_metadata.default_tags["md-target"] == "prod"'
```

### Alarm Integration

Send alarms to Massdriver using the provided webhook URL:

```hcl
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.md_metadata.name_prefix}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 80
  
  alarm_actions = [var.md_metadata.observability.alarm_webhook_url]
}
```

### Deployment Context

Use package metadata to make decisions based on deployment history:

```hcl
locals {
  is_first_deployment = var.md_metadata.package.previous_status == null
  package_age_days = floor(
    (time() - timeadd(var.md_metadata.package.created_at, "0s")) / 86400
  )
}

# Only create migration job on first deployment
resource "kubernetes_job" "migrations" {
  count = local.is_first_deployment ? 1 : 0
  # ... migration configuration
}
```

## Best Practices

1. **Always use `name_prefix` for resource naming** - Don't ask users for project/environment names as parameters
2. **Apply `default_tags` to all resources** - Enables cost tracking and resource organization
3. **Use tags for conditional logic** - Check `md-target` for environment-specific behavior instead of parameters
4. **Leverage `alarm_webhook_url`** - Integrate monitoring with Massdriver's alarm system
5. **Use package metadata sparingly** - Most use cases don't need deployment timestamps, but they're available when needed

## Next Steps

Now that you understand how to use Bundle Deployment Metadata, you can:

- **Refactor existing bundles** - Replace manual parameters with `md_metadata` fields
- **Create new bundles** - Design bundles that leverage automatic metadata injection
- **Implement observability** - Integrate alarms with Massdriver's monitoring system

For a complete reference of the `md_metadata` structure, see the [Identifier Constraints](/concepts/identifier-constraints#bundle-deployment-metadata) documentation.

## Related Documentation

- [Creating Your Own Bundle](03-creating-bundles.md) - Previous guide in this series
- [Identifier Constraints](/concepts/identifier-constraints) - Reference documentation including `md_metadata` structure
- [Bundles](/concepts/bundles) - Overview of bundles and their structure


