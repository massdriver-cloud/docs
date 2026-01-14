# AWS Cost and Usage Reports

The AWS Cost and Usage Reports integration enables Massdriver to collect detailed billing data from your AWS account, allowing you to track costs by package and resource.

## Prerequisites

- AWS account with billing access
- [OpenTofu](https://opentofu.org/) or Terraform installed
- Permissions to create IAM roles, S3 buckets, and CUR reports

## Setup

### Step 1: Clone the Integration Module

```bash
git clone https://github.com/massdriver-cloud/integrations.git
cd integrations/aws-cost-and-usage-reports
```

### Step 2: Configure Variables

Create a `terraform.tfvars` file:

```hcl
massdriver_aws_account_id = "YOUR_MASSDRIVER_ACCOUNT_ID"
```

Contact Massdriver support for your `massdriver_aws_account_id` value.

### Step 3: Apply the Module

```bash
tofu init
tofu plan
tofu apply
```

### Step 4: Retrieve Outputs

After applying, retrieve the configuration values:

```bash
tofu output -json massdriver_integration_config
```

This outputs:

```json
{
  "iam_role_arn": "arn:aws:iam::123456789012:role/massdriver-cur-reader",
  "external_id": "abc123-def456-...",
  "bucket_name": "massdriver-costs-a1b2c3d4"
}
```

### Step 5: Configure Massdriver

Provide the following values when configuring the integration in Massdriver:

| Field | Description | Source |
|-------|-------------|--------|
| IAM Role ARN | The role Massdriver assumes to read reports | `iam_role_arn` output |
| External ID | Security token for role assumption | `external_id` output |
| S3 Bucket Name | Where CUR reports are stored | `bucket_name` output |

## Resources Created

The OpenTofu module creates:

| Resource | Name | Purpose |
|----------|------|---------|
| S3 Bucket | `massdriver-costs-{hash}` | Stores Cost and Usage Reports |
| S3 Bucket Policy | - | Allows AWS Billing to write reports |
| CUR Report | `massdriver-costs` | Daily cost report with resource-level details |
| IAM Role | `massdriver-cur-reader` | Cross-account role for Massdriver |
| IAM Policy | `massdriver-cur-reader-policy` | Minimal S3 read + tagging permissions |

## IAM Permissions

The IAM role grants Massdriver these minimal permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
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
Cost and Usage Reports can only be created in `us-east-1`. The S3 bucket is also created in this region.
:::

## Data Collection

Once enabled, Massdriver:

1. Assumes the IAM role using the external ID
2. Lists the S3 bucket for available reports
3. Downloads and parses the latest report
4. Aggregates costs by `md-package` tag
5. Stores daily and monthly cost data

Data is collected every 24 hours.

## Troubleshooting

### Enable fails with "access_denied"

The IAM role trust policy may not include the correct Massdriver AWS account ID. Verify the `massdriver_aws_account_id` variable and re-apply.

### Enable fails with "bucket_not_found"

The S3 bucket doesn't exist or the IAM role doesn't have `s3:ListBucket` permission. Verify the OpenTofu module was applied successfully.

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
