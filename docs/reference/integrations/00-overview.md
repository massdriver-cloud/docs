---
id: integrations-overview
slug: /reference/integrations/overview
title: Integrations
sidebar_label: Overview
---

# Integrations

Massdriver integrations connect your cloud accounts to enable cost tracking, resource monitoring, and other platform features.

## Available Integrations

### Cost Management

| Integration | Cloud Provider | Description |
|-------------|----------------|-------------|
| [AWS Cost and Usage Reports](./aws-cost-reports) | AWS | Collect detailed billing data from AWS using Cost and Usage Reports |
| [Azure Cost Management Exports](./azure-cost-management) | Azure | Collect cost data from Azure using Cost Management Exports |

## How Integrations Work

1. **Provision Cloud Resources** - Run the OpenTofu module provided for each integration to create the necessary cloud resources (storage, reports, IAM roles)
2. **Configure Integration** - Provide the outputs from OpenTofu to Massdriver via the API or UI
3. **Enable Integration** - Massdriver validates access to your resources and begins collecting data
4. **Automated Collection** - Data is collected automatically on a daily schedule

## Prerequisites

All integrations require:

- An active Massdriver organization
- Access to your cloud provider account with permissions to create resources
- [OpenTofu](https://opentofu.org/) or Terraform installed locally

## OpenTofu Modules

Each integration has an OpenTofu module available in the [Massdriver Integrations repository](https://github.com/massdriver-cloud/integrations). These modules create all necessary cloud resources with minimal permissions following the principle of least privilege.
