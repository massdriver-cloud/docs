# Azure Cost Management Exports

The Azure Cost Management Exports integration enables Massdriver to collect detailed billing data from your Azure subscription, allowing you to track costs by package and resource.

## Prerequisites

- Azure subscription with Cost Management access
- [OpenTofu](https://opentofu.org/) or Terraform installed
- Permissions to create resource groups, storage accounts, and service principals

## Setup

### Step 1: Clone the Integration Module

```bash
git clone https://github.com/massdriver-cloud/integrations.git
cd integrations/azure-cost-management-exports
```

### Step 2: Authenticate with Azure

```bash
az login
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

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
  "tenant_id": "abc123-...",
  "subscription_id": "def456-...",
  "client_id": "ghi789-...",
  "client_secret": "***",
  "storage_account_name": "mdcostsa1b2c3d4",
  "container_name": "massdriver-costs-a1b2c3d4"
}
```

### Step 5: Configure Massdriver

Provide the following values when configuring the integration in Massdriver:

| Field | Description | Source |
|-------|-------------|--------|
| Tenant ID | Your Azure AD tenant | `tenant_id` output |
| Subscription ID | Azure subscription to monitor | `subscription_id` output |
| Client ID | Service principal application ID | `client_id` output |
| Client Secret | Service principal secret | `client_secret` output |
| Storage Account Name | Where cost exports are stored | `storage_account_name` output |
| Container Name | Blob container for exports | `container_name` output |

## Resources Created

The OpenTofu module creates:

| Resource | Name | Purpose |
|----------|------|---------|
| Resource Group | `massdriver-costs-{hash}` | Contains cost management resources |
| Storage Account | `mdcosts{hash}` | Stores cost export files |
| Blob Container | `massdriver-costs-{hash}` | Container for export CSV files |
| Cost Export | `massdriver-costs` | Daily cost export schedule |
| Azure AD Application | `massdriver-cost-reader` | App registration for Massdriver |
| Service Principal | - | Identity for Massdriver access |
| Role Assignment | Storage Blob Data Reader | Read access to cost exports |

## Service Principal Permissions

The service principal is granted minimal read-only access:

- **Role**: `Storage Blob Data Reader`
- **Scope**: The storage account containing cost exports

This follows the principle of least privilege - Massdriver can only read the exported cost data.

## Export Configuration

The cost export is configured with:

- **Type**: ActualCost (not forecasted)
- **Timeframe**: MonthToDate
- **Granularity**: Daily
- **Format**: CSV
- **Schedule**: Daily recurrence

:::note
All resources are created in the `eastus` region. Cost exports include all resources across all regions in the subscription.
:::

## Data Collection

Once enabled, Massdriver:

1. Authenticates using the service principal credentials
2. Lists blobs in the cost export container
3. Downloads the latest export CSV
4. Parses and aggregates costs by `md-package` tag
5. Stores daily and monthly cost data

Data is collected every 24 hours.

## Troubleshooting

### Enable fails with "access_denied"

The service principal may not have the correct role assignment. Verify the Storage Blob Data Reader role is assigned to the storage account.

### Enable fails with "container_not_found"

The blob container doesn't exist. Verify the OpenTofu module was applied successfully and the container name matches.

### No cost data appears

- Verify resources have the `md-package` tag applied
- Cost exports take up to 24 hours to generate initially
- Check the Azure portal to confirm exports are being written

### Authentication errors

- Verify the client secret hasn't expired
- Confirm the service principal is in the correct tenant
- Check that the subscription ID matches

## Cleanup

To remove the integration resources:

```bash
cd integrations/azure-cost-management-exports
tofu destroy
```

:::warning
This will delete the storage account and all stored exports. Cost data already collected by Massdriver will be retained.
:::
