---
id: guides-managing-state
slug: /guides/managing-state
title: Managing OpenTofu and Terraform State in Massdriver
sidebar_label: Managing State
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CodeBlock from '@theme/CodeBlock';

# Managing OpenTofu and Terraform State in Massdriver

## Overview

Massdriver now offers integrated state management for OpenTofu / Terraform through our HTTP State backend. This feature empowers teams to manage their infrastructure state directly within the platform, whether they're migrating existing setups from S3, Terraform Cloud, or Azure Blob Storage, or starting from scratch. Massdriver's state management is designed to simplify and streamline your workflow, providing flexibility and control.

Managing Terraform / OpenTofu state is a critical part of any infrastructure as code workflow. Proper state management ensures that your infrastructure is tracked, changes are applied consistently, and conflicts are avoided. With Massdriver, you have the flexibility to choose what works best for you: leverage our platform to handle state management seamlessly if you prefer not to manage it yourself, or retain full control by managing your state wherever you please. Whether you want a hands-off experience or need to integrate with your existing setup, Massdriver adapts to your workflow.

## Setting Up Your Environment

To get started with state management in Massdriver, follow these steps:

<Tabs>
<TabItem value="OpenTofu" label="OpenTofu" default>

### 1. Configure Your Environment Variables

Set up your environment variables for authentication and state management:

```bash

export TF_HTTP_USERNAME=${MASSDRIVER_ORG_SLUG}
export TF_HTTP_PASSWORD=${MASSDRIVER_SERVICE_ACCOUNT_TOKEN}

# Your package friendly ID available from your details panel (without the four character suffix -xxxx)
export MASSDRIVER_PACKAGE_ID="YOUR-PACKAGE-SLUG"

<<<<<<< HEAD

=======
>>>>>>> c93a0ae (rebase)
# Massdriver supports putting multiple IaC tools into the same "bundle".
# Put the name of the step your OpenTofu is in here.
export MASSDRIVER_PACKAGE_STEP_NAME="the-step-name-in-your-package"

export TF_HTTP_ADDRESS="https://api.massdriver.cloud/state/${MASSDRIVER_PACKAGE_ID}/${MASSDRIVER_PACKAGE_STEP_NAME}"
export TF_HTTP_LOCK_ADDRESS=${TF_HTTP_ADDRESS}
export TF_HTTP_UNLOCK_ADDRESS=${TF_HTTP_ADDRESS}
```

### 2. Initialize Your OpenTofu Module

Create a new `backend.tf` file with the following content to configure the HTTP backend:

```bash
echo 'terraform {
  backend "http" {}
}' > backend.tf
```

Initialize your OpenTofu module:

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

To import an existing resource into state, you can use the [`tofu import`](https://opentofu.org/docs/cli/import/) command. This command is useful when you have existing infrastructure that was not created using OpenTofu, but you want to manage it using automation going forward.

The [`tofu import`](https://opentofu.org/docs/cli/import/) command allows you to specify the resource type and the resource ID. Importing a resource into state enables you to manage its lifecycle, apply changes, and track its state using commands and workflows.

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

The [`tofu state rm`](https://opentofu.org/docs/cli/commands/state/rm/) command is used to remove a resource from the state. This command is useful when you want to delete a resource that was previously imported or created using OpenTofu. However, it's important to note that if you remove a resource from the state, you should also update the corresponding code to avoid any conflicts or unintended changes.

```bash
tofu state rm aws_instance.example
```

</TabItem>

<TabItem value="Terraform" label="Terraform">

### 1. Configure Your Environment Variables

Set up your environment variables for authentication and state management:

```bash

export TF_HTTP_USERNAME=${MASSDRIVER_ORG_SLUG}
export TF_HTTP_PASSWORD=${MASSDRIVER_SERVICE_ACCOUNT_TOKEN}

# Your package friendly ID available from your details panel (without the four character suffix -xxxx)
export MASSDRIVER_PACKAGE_ID="YOUR-PACKAGE-SLUG"

# Massdriver supports putting multiple IaC tools into the same "bundle".
# Put the name of the step your Terraform is in here.
export MASSDRIVER_PACKAGE_STEP_NAME="the-step-name-in-your-package"

<<<<<<< HEAD
export TF_HTTP_ADDRESS="https://api.massdriver.cloud/state/${MD_PKG_SLUG}/${MASSDRIVER_PACKAGE_STEP_NAME}"
=======
export TF_HTTP_ADDRESS="https://api.massdriver.cloud/state/${MASSDRIVER_PACKAGE_ID}/${MASSDRIVER_PACKAGE_STEP_NAME}"
>>>>>>> c93a0ae (rebase)
export TF_HTTP_LOCK_ADDRESS=${TF_HTTP_ADDRESS}
export TF_HTTP_UNLOCK_ADDRESS=${TF_HTTP_ADDRESS}
```

### 2. Initialize Your Terraform Module

Create a new `backend.tf` file with the following content to configure the HTTP backend:

```bash
echo 'terraform {
  backend "http" {}
}' > backend.tf
```

Initialize your Terraform module:

```bash
terraform init
```

### 3. Pull Existing State

If you need to pull your state to inspect or edit:

```bash
terraform init
terraform state pull > terraform.tfstate
```

### 5. Importing Resources into State

To import an existing resource into state, you can use the [`terraform import`](https://developer.hashicorp.com/terraform/cli/commands/import) command. This command is useful when you have existing infrastructure that was not created using Terraform, but you want to manage it using automation going forward.

The `terraform import` command allows you to specify the resource type and the resource ID. Importing a resource into state enables you to manage its lifecycle, apply changes, and track its state using commands and workflows.

1. Identify the resource to be imported.
2. Use the `terraform import` command to add the resource to your state:

```bash
terraform import aws_instance.example i-1234567890abcdef0
```

3. Verify the resource has been imported:

```bash
terraform state list
```

### 6. Removing resources from state

The [`terraform state rm`](https://developer.hashicorp.com/terraform/cli/commands/state/rm) command is used to remove a resource from the state. This command is useful when you want to delete a resource that was previously imported or created using Terraform. However, it's important to note that if you remove a resource from the state, you should also update the corresponding code to avoid any conflicts or unintended changes.

```bash
terraform state rm aws_instance.example
```

</TabItem>
</Tabs>

## Migrating State from other TACOs or state backends

<Tabs>
<TabItem value="S3" label="S3">

<Tabs>
<TabItem value="OpenTofu" label="OpenTofu">

1. Pull the state from your S3 bucket:

```bash
tofu state pull > terraform.tfstate

# or
# aws s3 cp s3://your-bucket-name/path/terraform.tfstate
```

2. Push the state to Massdriver's state storage:

Make sure that your OpenTofu backend is configured for the HTTP backend:

Replace `backend "s3"` with:

```terraform
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

</TabItem>

<TabItem value="Terraform" label="Terraform">

1. Pull the state from your S3 bucket:

```bash
terraform state pull > terraform.tfstate

# or
# aws s3 cp s3://your-bucket-name/path/terraform.tfstate
```

2. Push the state to Massdriver's state storage:

Make sure that your Terraform backend is configured for the HTTP backend:

Replace `backend "s3"` with:

```terraform
terraform {
  backend "http" {}
}
```

```bash
terraform state push
```

3. Verify the state has been successfully migrated:

```bash
terraform state list
```

</TabItem>
</Tabs>
</TabItem>

<TabItem value="Terraform Cloud" label="Terraform Cloud">

<Tabs>
<TabItem value="OpenTofu" label="OpenTofu">

1. Pull the state from Terraform Cloud:

```bash
terraform login
tofu state pull > terraform.tfstate
```

2. Push the state to Massdriver:

Make sure that your OpenTofu backend is configured for the HTTP backend:

Replace `backend "remote"` or [cloud](https://developer.hashicorp.com/terraform/language/settings/backends/remote) with:

```terraform
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

</TabItem>

<TabItem value="Terraform" label="Terraform">

1. Pull the state from Terraform Cloud:

```bash
terraform login
terraform state pull > terraform.tfstate
```

2. Push the state to Massdriver:

Make sure that your Terraform backend is configured for the HTTP backend:

Replace `backend "remote"` or [cloud](https://developer.hashicorp.com/terraform/language/settings/backends/remote) with:

```terraform
terraform {
  backend "http" {}
}
```

```bash
terraform state push
```

3. Confirm the migration:

```bash
terraform state list
```

</TabItem>
</Tabs>
</TabItem>

<TabItem value="Azure Blob Storage" label="Azure Blob Storage">

<Tabs>
<TabItem value="OpenTofu" label="OpenTofu">

1. Download the state file from Azure Blob Storage:

```bash
tofu state pull > terraform.tfstate

# or
# az storage blob download --container-name your-container --name terraform.tfstate --file terraform.tfstate
```

2. Push the state to Massdriver:

Make sure that your OpenTofu backend is configured for the HTTP backend:

Replace `backend "azurerm"` with:

```terraform
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

</TabItem>
<TabItem value="Terraform" label="Terraform">

1. Download the state file from Azure Blob Storage:

```bash
terraform state pull > terraform.tfstate

# or
# az storage blob download --container-name your-container --name terraform.tfstate --file terraform.tfstate
```

2. Push the state to Massdriver:

Make sure that your Terraform backend is configured for the HTTP backend:

Replace `backend "azurerm"` with:

```terraform
terraform {
  backend "http" {}
}
```

```bash
terraform state push
```

3. Verify the migration:

```bash
terraform state list
```

</TabItem>
</Tabs>
</TabItem>
</Tabs>
