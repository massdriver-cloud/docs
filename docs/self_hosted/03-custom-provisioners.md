---
id: self-hosted-custom-provisioners
slug: /self-hosted/custom-provisioners
title: Custom Provisioners
sidebar_label: Custom Provisioners
---

A **provisioner** is a Docker image designed to execute infrastructure-as-code (IaC) operations (e.g., `plan`, `provision`, and `decommission`) on a [Massdriver bundle](/concepts/bundles). Custom provisioners allow users to extend and customize these infrastructure deployment capabilities beyond the official provisioners that Massdriver currently provides ([OpenTofu](/provisioners/02-opentofu.md), [Terraform](/provisioners/03-terraform.md), [Helm](/provisioners/04-helm.md), and [Bicep](/provisioners/05-bicep.md)). Custom provisioners are created and maintained by users to integrate additional tools, workflows, and processes specific to their organization's needs, receiving deployment data from Massdriver to perform deployment actions on your bundles.

:::info Self-Hosted Only

Custom provisioners are exclusively available in self-hosted Massdriver installations. This feature is not available in the managed cloud platform.

:::

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

## Creating a Custom Provisioner

This section will walk you through the process of creating a simple "noop" provisioner which will simply echo that provision is happening. This will give you a base for creating your own provisioners.

:::tip Examples

For more detailed and specific examples, you and refer to the Massdriver Official provisioners for [OpenTofu](https://github.com/massdriver-cloud/provisioner-opentofu), [Terrform](https://github.com/massdriver-cloud/provisioner-terraform), [Helm](https://github.com/massdriver-cloud/provisioner-helm) and [Bicep](https://github.com/massdriver-cloud/provisioner-bicep). You can also fork and customize these provisioners to fit your specific use case.

:::

### Step 1: Create the Docker Image

Start by creating a Dockerfile for your custom provisioner.

```Dockerfile
FROM ubuntu:24.04

# Install your required tools
RUN apt update && apt install -y ca-certificates jq adduser && \
    rm -rf /var/lib/apt/lists/*

# Create the working dir
RUN mkdir -p -m 777 /massdriver

# Add the Massdriver user (this is the default user provisioners will run as, if you prefer a different user you must customize your launch control configuration)
RUN adduser \
    --disabled-password \
    --gecos "" \
    --uid 10001 \
    massdriver
RUN chown -R massdriver:massdriver /massdriver

# Copy your entrypoint script - be sure to copy it to /usr/local/bin/entrypoint.sh
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Set the /massdriver directory as the default
WORKDIR /massdriver

# Drop privileges to created user
USER massdriver

# Set the entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
```

:::tip Entrypoint Location

Be sure to place the entrypoint script is executable and is placed somewhere in the `path` (`/usr/local/bin/entrypoint.sh` is always a good option)! The workflow orchestrator attempts to call `entrypoint.sh` when launching the provisioner container.

:::

### Step 2: Create the Entrypoint Script

Your entrypoint script handles the provisioner logic. When the provisioner container is created, Massdriver will place the bundle directory and several files in the container for use by the provisioner. Refer to the [provisioner overview documentation](/provisioners/01-overview.md#environment) for details on the files and environment variables.

```bash
#!/bin/bash
set -euo pipefail

# Create bash variables for Massdriver inputs
workdir="/massdriver"
params_path="$workdir/params.json"
connections_path="$workdir/connections.json"
config_path="$workdir/config.json"
envs_path="$workdir/envs.json"
secrets_path="$workdir/secrets.json"

# Navigate to the proper bundle directory for this setp
cd /massdriver/bundle/$MASSDRIVER_STEP_PATH

echo "Starting action: $MASSDRIVER_DEPLOYMENT_ACTION"

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

echo "Action $MASSDRIVER_DEPLOYMENT_ACTION completed successfully."
```

### Step 3: Build and Publish the Image

Build and push your custom provisioner to a container registry accessible by your Massdriver cluster:

```bash
# Build the image
docker build -t your-registry.com/provisioner-noop:v1.0.0 .

# Push to registry
docker push your-registry.com/provisioner-noop:v1.0.0
```

## Using Custom Provisioners in Bundles

Once your custom provisioner is built and published, use it in your bundle's `massdriver.yaml`. If applicable, you can add custom configuration values to the `config` block will will be placed in the `config.json` file at during bundle provisioning:

```yaml
steps:
  - path: src
    provisioner: your-registry.com/provisioner-noop:v1.0.0
    # config:
    #   foo: .params.foo
```

## Getting Help

For assistance with custom provisioners:

- Review the [Provisioner Overview](/provisioners/overview) documentation
- Join our [Slack community](https://join.slack.com/t/massdrivercommunity/shared_invite/zt-1smvckvdj-jVFpBG2jF5XiYzX2njDCWA)
- Contact your Massdriver support team for enterprise assistance

Custom provisioners unlock the full potential of your self-hosted Massdriver installation, enabling you to integrate any tool or workflow into your infrastructure deployment pipeline.

