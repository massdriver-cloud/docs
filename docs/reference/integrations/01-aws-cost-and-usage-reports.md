---
id: integrations-aws-cost-reports
slug: /reference/integrations/aws-cost-reports
title: AWS Cost and Usage Reports
sidebar_label: AWS Cost Reports
---

# AWS Cost and Usage Reports

The AWS Cost and Usage Reports integration enables Massdriver to collect detailed billing data from your AWS account, allowing you to track costs by package and resource.

## Prerequisites

- AWS account with billing access
- [OpenTofu](https://opentofu.org/) installed
- Permissions to create IAM users, S3 buckets, and CUR reports

## Setup

### Step 1: Clone the Integration Module

```bash
git clone https://github.com/massdriver-cloud/integrations.git
cd integrations/aws-cost-and-usage-reports
```

### Step 2: Apply the Module

```bash
tofu init
tofu plan
tofu apply
```

### Step 3: Retrieve Outputs

After applying, retrieve the configuration values:

```bash
tofu output -json massdriver_integration_config
```

This outputs:

```json
{
  "access_key_id": "AKIAIOSFODNN7EXAMPLE",
  "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "bucket_name": "massdriver-costs-a1b2c3d4",
  "region": "us-west-2"
}
```

### Step 4: Configure Massdriver

Provide the following values when configuring the integration in Massdriver:

| Field | Description | Source |
|-------|-------------|--------|
| Access Key ID | IAM user access key | `access_key_id` output |
| Secret Access Key | IAM user secret key | `secret_access_key` output |
| S3 Bucket Name | Where CUR reports are stored | `bucket_name` output |
| AWS Region | The AWS region where the S3 bucket is located | `region` output |

## Resources Created

The OpenTofu module creates:

| Resource | Name | Purpose |
|----------|------|---------|
| S3 Bucket | `massdriver-costs-{hash}` | Stores Cost and Usage Reports |
| S3 Bucket Policy | - | Allows AWS Billing to write reports |
| CUR Report | `massdriver-costs` | Daily cost report with resource-level details |
| IAM User | `massdriver-costs` | Dedicated user for Massdriver access |
| IAM Policy | `massdriver-costs-policy` | Minimal S3 read + tagging permissions |
| Access Key | - | Credentials for the IAM user |

## IAM Permissions

The IAM user has these minimal permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:HeadBucket"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::massdriver-costs-*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::massdriver-costs-*/*"
    },
    {
      "Effect": "Allow",
      "Action": ["tag:GetResources"],
      "Resource": "*"
    }
  ]
}
```

## Report Configuration

The CUR report is configured with:

- **Time Granularity**: Daily
- **Format**: CSV (text/csv)
- **Compression**: ZIP
- **Additional Schema Elements**: RESOURCES (resource-level details)
- **Report Versioning**: OVERWRITE_REPORT

:::note
Cost and Usage Reports can only be created in `us-east-1`, but the S3 bucket can be created in any AWS region. Specify the region where your bucket is located when configuring the integration.
:::

## Data Collection

Once enabled, Massdriver:

1. Authenticates using the IAM user credentials
2. Lists the S3 bucket for available reports
3. Downloads and parses the latest report
4. Aggregates costs by `md-package` tag
5. Stores daily and monthly cost data

Data is collected every 24 hours.

## Troubleshooting

### Enable fails with "access_denied"

The IAM user may not have the required permissions. Verify the OpenTofu module was applied successfully and the policy is attached.

### Enable fails with "bucket_not_found"

The S3 bucket doesn't exist or the IAM user doesn't have `s3:HeadBucket` permission. Verify the OpenTofu module was applied successfully.

### No cost data appears

- Verify resources have the `md-package` tag applied
- CUR reports take up to 24 hours to generate initially
- Check that the report is being written to the S3 bucket

## Cleanup

To remove the integration resources:

```bash
cd integrations/aws-cost-and-usage-reports
tofu destroy
```

:::warning
This will delete the S3 bucket and all stored reports. Cost data already collected by Massdriver will be retained.
:::
