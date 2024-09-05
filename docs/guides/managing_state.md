---
id: guides-managing-state
slug: /guides/managing-state
title: Managing OpenTofu and Terraform State in Massdriver
sidebar_label: Managing State
---

# Managing OpenTofu and Terraform State in Massdriver

## Overview

Massdriver now offers integrated state management for OpenTofu / Terraform through our HTTP State backend. This feature empowers teams to manage their infrastructure state directly within the platform, whether they're migrating existing setups from S3, Terraform Cloud, or Azure Blob Storage, or starting from scratch. Massdriver's state management is designed to simplify and streamline your workflow, providing flexibility and control.

Managing Terraform / OpenTofu state is a critical part of any infrastructure as code workflow. Proper state management ensures that your infrastructure is tracked, changes are applied consistently, and conflicts are avoided. With Massdriver, you have the flexibility to choose what works best for you: leverage our platform to handle state management seamlessly if you prefer not to manage it yourself, or retain full control by managing your state wherever you please. Whether you want a hands-off experience or need to integrate with your existing setup, Massdriver adapts to your workflow.

## Setting Up Your Environment

To get started with state management in Massdriver, follow these steps:

### 1. Configure Your Environment Variables

Set up your environment variables for authentication and state management:

```bash

export TF_HTTP_USERNAME=${MASSDRIVER_ORG_SLUG}
export TF_HTTP_PASSWORD=${MASSDRIVER_SERVICE_ACCOUNT_TOKEN}

# Your package friendly ID available from your details panel (without the four character suffix -xxxx)
export MASSDRIVER_PACKAGE_ID="YOUR-PACKAGE-SLUG"

# Massdriver supports putting multiple IaC tools into the same "bundle". 
# Put the name of the step your OpenTofu / Terraform is in here.
export MASSDRIVER_PACKAGE_STEP_NAME="the-step-name-in-your-package"

export TF_HTTP_ADDRESS="https://api.massdriver.cloud/state/${MD_PKG_SLUG}/${MASSDRIVER_PACKAGE_STEP_NAME}"
export TF_HTTP_LOCK_ADDRESS=${TF_HTTP_ADDRESS}
export TF_HTTP_UNLOCK_ADDRESS=${TF_HTTP_ADDRESS}
```

### 2. Initialize Your OpenTofu / Terraform Module

Create a new `backend.tf` file with the following content to configure the HTTP backend:

```bash
echo 'terraform {
  backend "http" {}
}' > backend.tf
```

Initialize your OpenTofu / Terraform module:

```bash
tofu init
```

### 3. Pull Existing State

If you need to pull your state to inspect or edit:

```bash
tofu init
tofu state pull > terraform.tfstate
```

### 5. Importing Resources into State

To import an existing resource into state, you can use the `tofu import` command. This command is useful when you have existing infrastructure that was not created using OpenTofu / Terraform, but you want to manage it using automation going forward.

The `tofu import` command allows you to specify the resource type and the resource ID. Importing a resource into state enables you to manage its lifecycle, apply changes, and track its state using commands and workflows.

1. Identify the resource to be imported.
2. Use the `tofu import` command to add the resource to your state:

   ```bash
   tofu import aws_instance.example i-1234567890abcdef0
   ```

3. Verify the resource has been imported:

   ```bash
   tofu state list
   ```

### 6. Removing resources from state

The `tofu state rm` command is used to remove a resource from the state. This command is useful when you want to delete a resource that was previously imported or created using OpenTofu / Terraform. However, it's important to note that if you remove a resource from the state, you should also update the corresponding code to avoid any conflicts or unintended changes.

```bash
tofu state rm aws_instance.example
```

## Migrating State from other TACOs or state backends



### Migrating State from S3

1. Pull the state from your S3 bucket:

   ```bash
   tofu state pull > terraform.tfstate

   # or
   # aws s3 cp s3://your-bucket-name/path/terraform.tfstate .
   ```

2. Push the state to Massdriver's state storage:

   Make sure that your OpenTofu / Terraform backend is configured for the HTTP backend:

   Replace `backend "s3"` with:

   ```hcl
   terraform {
     backend "http" {}
   }   
   ```

   ```bash
   tofu state push
   ```

3. Verify the state has been successfully migrated:

   ```bash
   tofu state list
   ```

### Migrating State from Terraform Cloud

1. Pull the state from Terraform Cloud:

   ```bash
   terraform login
   terraform state pull > terraform.tfstate
   ```

2. Push the state to Massdriver:

   Make sure that your OpenTofu / Terraform backend is configured for the HTTP backend:

   Replace `backend "remote"` or [cloud](https://developer.hashicorp.com/terraform/language/settings/backends/remote) with:

   ```hcl
   terraform {
     backend "http" {}
   }   
   ```

   ```bash
   tofu state push
   ```

3. Confirm the migration:

   ```bash
   tofu state list
   ```

### Migrating State from Azure Blob Storage

1. Download the state file from Azure Blob Storage:

   ```bash
   terraform state pull > terraform.tfstate

   # or 
   # az storage blob download --container-name your-container --name terraform.tfstate --file terraform.tfstate
   ```

2. Push the state to Massdriver:

   Make sure that your OpenTofu / Terraform backend is configured for the HTTP backend:

   Replace `backend "azurerm"` with:

   ```hcl
   terraform {
     backend "http" {}
   }   
   ```

   ```bash
   tofu state push
   ```

3. Verify the migration:

   ```bash
   tofu state list
   ```
