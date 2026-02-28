---
id: bundle-templates
slug: /bundle-development/publishing/bundle-templates
title: Creating Bundle Templates
sidebar_label: Bundle Templates
---

Bundle templates are boilerplate projects that help you quickly scaffold new Massdriver bundles. This guide explains how to create and configure custom templates for your organization.

## Overview

Templates allow you to standardize how bundles are created across your organization. Each template is a directory containing a `massdriver.yaml` file with [Liquid templating](https://shopify.github.io/liquid/) support, along with any IaC files needed for the bundle.

## Directory Structure

A templates directory has a simple flat structure where each subdirectory is a template:

```
templates/
├── opentofu-module/
│   ├── massdriver.yaml
│   ├── operator.md
│   └── src/
│       ├── _providers.tf
│       └── main.tf
├── helm-chart/
│   ├── massdriver.yaml
│   └── chart/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
├── kubernetes-deployment/
│   ├── massdriver.yaml
│   └── src/
└── my-custom-template/
    ├── massdriver.yaml
    └── ...
```

Each template directory must contain a `massdriver.yaml` file at its root. This file will be rendered with user-provided values when creating a new bundle.

## Creating a Template

### 1. Create the Template Directory

```bash
mkdir -p my-templates/my-opentofu-bundle
cd my-templates/my-opentofu-bundle
```

### 2. Create the massdriver.yaml Template

The `massdriver.yaml` file uses Liquid templating to interpolate user-provided values. Here's a complete example:

```yaml
name: "{{ name }}"
description: "{{ description }}"
source_url: github.com/YOUR_ORG/{{ name }}
access: private

steps:
  - path: src
    provisioner: opentofu

# Parameters - use paramsSchema if importing from existing IaC
{%- if paramsSchema.size > 0 %}
{{ paramsSchema }}
{% else %}
params:
  examples:
    - __name: Development
      instance_type: t3.small
    - __name: Production
      instance_type: t3.large
  required:
    - instance_type
  properties:
    instance_type:
      type: string
      title: Instance Type
      description: EC2 instance type
      default: t3.small
{% endif %}

# Connections - populated from user selections
connections:
{%- if connections.size > 0 %}
  required:
  {%- for conn in connections %}
    - {{ conn.name -}}
  {% endfor %}
  properties:
  {%- for conn in connections %}
    {{ conn.name }}:
      $ref: {{ conn.artifact_definition -}}
  {% endfor %}
{% else %}
  properties: {}
{% endif %}

# Artifacts - define outputs your bundle produces
artifacts:
  properties: {}

# UI customization
ui:
  ui:order:
    - "*"
```

### Available Template Variables

| Variable | Description |
|----------|-------------|
| `{{ name }}` | Bundle name provided by user |
| `{{ description }}` | Bundle description provided by user |
| `{{ connections }}` | Array of connection objects with `name` and `artifact_definition` |
| `{{ paramsSchema }}` | YAML string of params imported from existing IaC |
| `{{ envs }}` | Map of environment variable templates from artifact definitions |

### 3. Add IaC Files

Create the infrastructure code in a `src/` directory (or appropriate location for your provisioner):

```bash
mkdir src
```

**src/main.tf**
```hcl
resource "aws_instance" "main" {
  ami           = var.ami
  instance_type = var.instance_type

  tags = var.md_metadata.default_tags
}
```

**src/_providers.tf**
```hcl
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
    massdriver = {
      source = "massdriver-cloud/massdriver"
    }
  }
}

provider "aws" {
  region = var.aws_authentication.data.arn
  assume_role {
    role_arn = var.aws_authentication.data.arn
  }
  default_tags {
    tags = var.md_metadata.default_tags
  }
}
```

### 4. Add an Operator Guide (Optional)

Create an `operator.md` file to provide documentation for bundle users:

```markdown
## {{ name }}

{{ description }}

### Configuration

Configure the instance type based on your workload requirements.

### Troubleshooting

Check CloudWatch logs for any deployment issues.
```

## Configuring the CLI

To use your templates directory, configure the Massdriver CLI with the path to your templates.

### Option 1: Environment Variable

```bash
export MD_TEMPLATES_PATH=/path/to/my-templates
```

### Option 2: Config File

Create or edit `~/.config/massdriver/config.yaml`:

```yaml
templates_path: /path/to/my-templates
```

:::tip
The environment variable takes precedence over the config file, making it easy to switch between template repositories for different projects.
:::

## Using Templates

Once configured, you can use your templates with the CLI:

### List Available Templates

```bash
mass bundle template list
```

Output:
```
Available templates:
  helm-chart
  kubernetes-deployment
  my-custom-template
  opentofu-module
```

### Create a New Bundle

```bash
mass bundle new
```

Or non-interactively:

```bash
mass bundle new \
  --name my-new-bundle \
  --template-name opentofu-module \
  --output-directory ./my-new-bundle \
  --connections aws_authentication=massdriver/aws-iam-role
```

## Template Best Practices

### 1. Include Cloud Credentials

Always include the appropriate cloud credential connection for your target cloud:

| Cloud | Artifact Definition | Suggested Name |
|-------|---------------------|----------------|
| AWS | `massdriver/aws-iam-role` | `aws_authentication` |
| GCP | `massdriver/gcp-service-account` | `gcp_authentication` |
| Azure | `massdriver/azure-service-principal` | `azure_service_principal` |

### 2. Use Configuration Presets

Include `examples` in your params to provide configuration presets:

```yaml
params:
  examples:
    - __name: Development
      instance_type: t3.small
      storage_size: 20
    - __name: Production
      instance_type: t3.large
      storage_size: 100
```

### 3. Organize by Use Case

Structure your templates directory by common use cases in your organization:

```
templates/
├── aws-lambda-api/       # API Gateway + Lambda
├── aws-ecs-service/      # ECS Fargate service
├── gcp-cloud-run/        # Cloud Run service
├── k8s-deployment/       # Generic Kubernetes deployment
└── internal-api/         # Your org's internal API pattern
```

### 4. Version Your Templates

Keep your templates in version control and tag releases:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Example: Complete OpenTofu Template

Here's a complete example of an OpenTofu template for an AWS S3 bucket:

**Directory structure:**
```
s3-bucket/
├── massdriver.yaml
├── operator.md
└── src/
    ├── _providers.tf
    ├── main.tf
    └── _variables.tf
```

**massdriver.yaml:**
```yaml
name: "{{ name }}"
description: "{{ description }}"
source_url: github.com/YOUR_ORG/{{ name }}
access: private

steps:
  - path: src
    provisioner: opentofu

params:
  examples:
    - __name: Development
      bucket_name: my-dev-bucket
      versioning_enabled: false
    - __name: Production
      bucket_name: my-prod-bucket
      versioning_enabled: true
  required:
    - bucket_name
  properties:
    bucket_name:
      type: string
      title: Bucket Name
      description: Name of the S3 bucket
    versioning_enabled:
      type: boolean
      title: Enable Versioning
      description: Enable versioning on the bucket
      default: false

connections:
  required:
    - aws_authentication
  properties:
    aws_authentication:
      $ref: massdriver/aws-iam-role

artifacts:
  required:
    - bucket
  properties:
    bucket:
      $ref: massdriver/aws-s3-bucket

ui:
  ui:order:
    - bucket_name
    - versioning_enabled
```

## Reference Templates

For more examples, see the [Massdriver Application Templates](https://github.com/massdriver-cloud/application-templates) repository, which contains templates for common deployment patterns across AWS, GCP, Azure, and Kubernetes.
