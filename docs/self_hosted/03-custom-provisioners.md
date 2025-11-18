---
id: self-hosted-custom-provisioners
slug: /self-hosted/custom-provisioners
title: Custom Provisioners
sidebar_label: Custom Provisioners
---

Custom provisioners allow users to extend and customize the infrastructure deployment capabilities of the Massdriver platform. While Massdriver currently provides four official provisioners ([OpenTofu](/provisioners/02-opentofu.md), [Terraform](/provisioners/03-terraform.md), [Helm](/provisioners/04-helm.md), and [Bicep](/provisioners/05-bicep.md)), custom provisioners enable you to integrate additional tools, workflows, and processes that are specific to your organization's needs.

:::info Self-Hosted Only

Custom provisioners are exclusively available in self-hosted Massdriver installations. This feature is not available in the managed cloud platform.

:::

## What Are Custom Provisioners?

A **provisioner** is a Docker image designed to execute infrastructure-as-code (IaC) operations (e.g., `plan`, `provision`, and `decommission`) on a [Massdriver bundle](/concepts/bundles). Custom provisioners are created and mainted by users to , custom provisioners receive deployment data from Massdriver and perform deployment actions such as `plan`, `provision`, and `decommission` operations on your bundles.

## Why Create Custom Provisioners?

Organizations typically create custom provisioners for several key reasons:

### 🔧 **IaC Support**
Add support for infrastructure-as-code tools not covered by the official provisioners:
- Pulumi
- AWS CDK
- Azure Resource Manager (ARM) templates
- CloudFormation
- Ansible
- Custom internal tooling

### 🛡️ **Tooling Integration**
Embed the tooling for security, compliance, monitoring or governance into your deployment pipeline:
- Snyk vulnerability scanning
- Checkov policy-as-code validation
- Custom security auditing tools
- Compliance reporting systems

### 📊 **Operational Integration**
Integrate with your organization's operational systems:
- CMDB updates
- Monitor system configuration
- Service catalog registration
- Cost tracking and reporting

## How Custom Provisioners Work

Custom provisioners follow the same execution model as official provisioners:

1. **Bundle Preparation**: Massdriver prepares the bundle and deployment context
2. **Container Execution**: Your custom provisioner container is launched
3. **Data Injection**: Massdriver injects deployment data and environment variables
4. **Action Execution**: Your provisioner executes the requested action
5. **Result Processing**: Massdriver processes outputs and artifacts

## Creating a Custom Provisioner

::: tip Examples

You can refer to the existing Massdriver Official provisioners for [OpenTofu](https://github.com/massdriver-cloud/provisioner-opentofu), [Terrform](https://github.com/massdriver-cloud/provisioner-terraform), [Helm](https://github.com/massdriver-cloud/provisioner-helm) and [Bicep](https://github.com/massdriver-cloud/provisioner-bicep) of some of the steps below.

:::

### Step 1: Create the Docker Image

Start by creating a Dockerfile for your custom provisioner.

```dockerfile
FROM alpine:3.22

# Install your required tools
RUN apk add --no-cache \
    bash \
    curl \
    jq \
    python3 \
    py3-pip

# Install your specific tooling
RUN pip3 install pulumi pulumi-aws

# Copy your entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
```

### Step 2: Create the Entrypoint Script

Your entrypoint script handles the provisioner logic:

```bash
#!/bin/bash
set -e

# Read Massdriver inputs
PARAMS=$(cat /massdriver/params.json)
CONNECTIONS=$(cat /massdriver/connections.json)
CONFIG=$(cat /massdriver/config.json)

# Navigate to bundle directory
cd /massdriver/bundle

case "$MASSDRIVER_DEPLOYMENT_ACTION" in
  "plan")
    echo "Planning deployment..."
    # Implement your plan logic
    ;;
  "provision")
    echo "Provisioning resources..."
    # Implement your provision logic
    ;;
  "decommission")
    echo "Decommissioning resources..."
    # Implement your decommission logic
    ;;
  *)
    echo "Unknown action: $MASSDRIVER_DEPLOYMENT_ACTION"
    exit 1
    ;;
esac
```

### Step 3: Handle Massdriver Data

#### Bundle Directory and Input Files

When the provisioner container is created, Massdriver will place the bundle directory and several files in the container for use by the provisioner. Refer to the [provisioner overview documentation](/provisioners/01-overview.md#inputs) for details on the files and their locations.

```bash
# Example usage of files
cd /massdriver/bundle/$MASSDRIVER_BUNDLE_STEP
cp /massdriver/params.json params.auto.tfvars.json
cp /massdriver/connections.json connections.auto.tfvars.json
tofu init
```

#### Environment Variables

Your provisioner also receives [environment variables](/provisioners/overview#environment-variables) with deployment context:

```bash
# Example usage of environment variables
echo "Deploying bundle: $MASSDRIVER_BUNDLE_ID"
echo "Package name: $MASSDRIVER_PACKAGE_NAME"
echo "Action: $MASSDRIVER_DEPLOYMENT_ACTION"
```

### Step 4: Build and Publish the Image

Build and push your custom provisioner to a container registry accessible by your Massdriver cluster:

```bash
# Build the image
docker build -t your-registry.com/custom-provisioner:v1.0.0 .

# Push to registry
docker push your-registry.com/custom-provisioner:v1.0.0
```

## Using Custom Provisioners in Bundles

Once your custom provisioner is built and published, use it in your bundle's `massdriver.yaml`:

```yaml
steps:
  - path: src
    provisioner: your-registry.com/custom-provisioner:v1.0.0
    config:
      foo: .params.foo
```

## Advanced Examples

### Security Scanning Provisioner

```dockerfile
FROM alpine:3.22

RUN apk add --no-cache bash curl jq
RUN wget -O /usr/local/bin/snyk https://github.com/snyk/snyk/releases/download/v1.1064.0/snyk-alpine
RUN chmod +x /usr/local/bin/snyk

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
```

```bash
#!/bin/bash
# entrypoint.sh for security scanner
set -e

cd /massdriver/bundle

case "$MASSDRIVER_DEPLOYMENT_ACTION" in
  "plan"|"provision")
    echo "Running security scan..."
    snyk iac test . --severity-threshold=high
    
    # Update CMDB
    REGION=$(jq -r '.region' /massdriver/config.json)
    curl -X POST https://cmdb.yourorg.com/api/deployments \
      -H "Content-Type: application/json" \
      -d "{\"bundle_id\": \"$MASSDRIVER_BUNDLE_ID\", \"region\": \"$REGION\"}"
    ;;
  "decommission")
    echo "Cleaning up CMDB entry..."
    curl -X DELETE "https://cmdb.yourorg.com/api/deployments/$MASSDRIVER_BUNDLE_ID"
    ;;
esac
```

### Pulumi Provisioner

```dockerfile
FROM pulumi/pulumi:latest

RUN apt-get update && apt-get install -y jq curl
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
```

```bash
#!/bin/bash
# entrypoint.sh for Pulumi
set -e

cd /massdriver/bundle

# Set up Pulumi configuration from Massdriver params
STACK_NAME=$(jq -r '.stack_name' /massdriver/config.json)
pulumi stack select "$STACK_NAME" || pulumi stack init "$STACK_NAME"

case "$MASSDRIVER_DEPLOYMENT_ACTION" in
  "plan")
    pulumi preview
    ;;
  "provision")
    pulumi up --yes
    ;;
  "decommission")
    pulumi destroy --yes
    ;;
esac
```

## Best Practices

### 🔒 **Security**
- Use minimal base images to reduce attack surface
- Scan your provisioner images for vulnerabilities
- Handle secrets securely and never log them
- Use read-only file systems where possible

### 📝 **Error Handling**
- Implement proper exit codes (0 for success, non-zero for failure)
- Provide clear, actionable error messages
- Log important steps for debugging
- Handle network timeouts and retries

### 🎯 **Performance**
- Keep images as small as possible
- Cache dependencies appropriately
- Implement timeouts for long-running operations
- Consider parallel execution where safe

### 🔄 **Maintenance**
- Version your provisioner images
- Document configuration options
- Provide examples and documentation
- Test with different deployment scenarios

## Troubleshooting

### Common Issues

**Image Pull Errors**
- Verify your Kubernetes cluster can access the registry
- Check image tags and ensure they exist
- Validate registry credentials are configured

**Permission Errors**
- Ensure the provisioner runs with appropriate user permissions
- Check file system permissions in the container
- Validate Kubernetes service account permissions

**Configuration Issues**
- Verify jq queries in the `config` block are valid
- Check that required parameters are provided
- Ensure JSON structure matches expectations

### Debugging Tips

1. **Test Locally**: Run your provisioner container locally with sample data
2. **Check Logs**: Use `kubectl logs` to view provisioner execution logs
3. **Validate Inputs**: Print input JSON files during development
4. **Step Through Actions**: Test each deployment action independently

## Getting Help

For assistance with custom provisioners:

- Review the [Provisioner Overview](/provisioners/overview) documentation
- Join our [Slack community](https://join.slack.com/t/massdrivercommunity/shared_invite/zt-1smvckvdj-jVFpBG2jF5XiYzX2njDCWA)
- Contact your Massdriver support team for enterprise assistance

Custom provisioners unlock the full potential of your self-hosted Massdriver installation, enabling you to integrate any tool or workflow into your infrastructure deployment pipeline.

