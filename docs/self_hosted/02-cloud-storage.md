---
id: self-hosted-cloud-storage
slug: /self-hosted/cloud-storage
title: Using Cloud Storage for Massdriver
sidebar_label: Cloud Storage
---

Massdriver requires blob storage for several key functions:
- **OCI bundle repository and provisioning log storage** (the `massdriver` bucket)
- **Terraform/OpenTofu remote state storage** (the `state` bucket)

Argo Workflows also requires blob storage, but only for [**workflow artifact storage**](https://argo-workflows.readthedocs.io/en/latest/walk-through/artifacts/) (not to be confused with [Massdriver artifacts](../concepts/03-artifacts.md)).

By default, Massdriver installs and configures [Minio](https://www.min.io/) for all these use cases. However for **production** Massdriver installations, we strongly recommend using **cloud object storage** instead of the included MinIO instance. Cloud object storage provides higher durability, richer configuration options and easier data browsing and inspection.

:::warning Data Migration

Changing the blob storage backend **does NOT migrate existing data**.  
If you already have data in MinIO (bundles, OCI images, logs, Terraform/OpenTofu state) that you wish to preserve, you **must migrate it yourself** before switching storage backends. Examples using [`rclone`](https://rclone.org/) are provided below.

:::

## Supported Storage Backends

Massdriver supports the following external object storage backends:

- **MinIO** (default, installed with Massdriver)
- **Amazon S3**
- **Azure Blob Storage**
- **Google Cloud Storage (GCS)**

Each backend is accessed via [S3Proxy](https://github.com/gaul/s3proxy), which presents a consistent S3-compatible API to the Massdriver application.

---

## Amazon S3

Before beginning, be sure you've create 2 AWS S3 buckets - one for Massdriver, which stores deployment logs and Bundle/OCI data, and one for Terraform/OpenTofu state.

### Migrating Data

To migrate data from MinIO to S3, use the following commands

```bash
# In one terminal, port-forward to MinIO in order to access existing data
kubectl port-forward svc/massdriver-minio -n massdriver 9000

# In a separate terminal, perform the data transfer
export RCLONE_CONFIG_MINIO_TYPE=s3
export RCLONE_CONFIG_MINIO_PROVIDER=MinIO
export RCLONE_CONFIG_MINIO_ACCESS_KEY_ID=minioaccesskey
export RCLONE_CONFIG_MINIO_SECRET_ACCESS_KEY=miniosecretkey
export RCLONE_CONFIG_MINIO_ENDPOINT=http://localhost:9000
export RCLONE_CONFIG_MINIO_FORCE_PATH_STYLE=true

# AWS destination
export RCLONE_CONFIG_AWS_TYPE=s3
export RCLONE_CONFIG_AWS_PROVIDER=AWS
export RCLONE_CONFIG_AWS_REGION=<your AWS region>
export RCLONE_CONFIG_AWS_ENV_AUTH=true
export AWS_SDK_LOAD_CONFIG=1
export AWS_ACCESS_KEY_ID=<access key>
export AWS_SECRET_ACCESS_KEY=<secret key>

# Copy data
rclone copy MINIO:massdriver AWS:<massdriver bucket name> --ignore-checksum --size-only --progress
rclone copy MINIO:state AWS:<state bucket name> --ignore-checksum --size-only --progress
```

### Configuring S3Proxy with Access/Secret Keys

Once the data is successfully migrated, update your Helm values configuration to use S3 for storage.

```yaml
massdriver:
  blobStorage:
    type: s3

    massdriverBucket: <massdriver bucket name>
    stateBucket: <state bucket name>

    s3:
      region: <bucket region>
      accessKeyId: <AWS_ACCESS_KEY_ID>
      secretAccessKey: <AWS_SECRET_ACCESS_KEY>
```

### Configuring S3Proxy with EKS IRSA

S3 Proxy also supports using dynamic role binding via service accounts

```yaml
massdriver:
  blobStorage:
    type: s3

    massdriverBucket: <massdriver bucket name>
    stateBucket: <state bucket name>

    serviceAccount:
      annotations:
        eks.amazonaws.com/role-arn: arn:aws:iam::123456789000:role/your-iam-role

    s3:
      region: <bucket region>
```

---

## Azure Storage Account

Massdriver also supports using an Azure Storage Account via S3Proxy. Before you begin, make sure you've create a storage account, and have a `massdriver` container and a `state` container.

:::info Storage Account Type

Be sure you are using [Blob Storage](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction) as opposed to the [Data Lake Gen2](https://learn.microsoft.com/en-us/azure/storage/blobs/data-lake-storage-introduction) storage. If you receive the following errors while migrating data with `rclone`, it means you are using the Data Lake Gen2 storage:

```
RESPONSE 400: 400 Block blobs are not supported.
ERROR CODE: BlobTypeNotSupported
```

:::

### Migrating Data

To migrate data from MinIO to Azure, use the following commands.

```bash
# In one terminal, port-forward to MinIO in order to access existing data
kubectl port-forward svc/massdriver-minio -n massdriver 9000

# In a separate terminal, perform the data transfer
export RCLONE_CONFIG_MINIO_TYPE=s3
export RCLONE_CONFIG_MINIO_PROVIDER=MinIO
export RCLONE_CONFIG_MINIO_ACCESS_KEY_ID=minioaccesskey
export RCLONE_CONFIG_MINIO_SECRET_ACCESS_KEY=miniosecretkey
export RCLONE_CONFIG_MINIO_ENDPOINT=http://localhost:9000
export RCLONE_CONFIG_MINIO_FORCE_PATH_STYLE=true

# Azure destination (service principal auth)
export RCLONE_CONFIG_AZ_TYPE=azureblob
export RCLONE_CONFIG_AZ_ACCOUNT=<storage account name>
export RCLONE_CONFIG_AZ_CLIENT_ID=<AZURE_CLIENT_ID>
export RCLONE_CONFIG_AZ_CLIENT_SECRET=<AZURE_CLIENT_SECRET>
export RCLONE_CONFIG_AZ_TENANT=<AZURE_TENANT_ID>

# Create containers (only if they don't already exist)
rclone mkdir AZ:massdriver
rclone mkdir AZ:state

# Copy data
rclone copy MINIO:massdriver AZ:massdriver --ignore-checksum --size-only --progress
rclone copy MINIO:state AZ:state --ignore-checksum --size-only --progress
```

### Configuring S3Proxy with Azure Service Principal

Once the data is successfully migrated, update your Helm values configuration to use Azure for storage. Be sure the service principal has **Storage Blob Data Contributor** permissions for the storage account.

```yaml
massdriver:
  blobStorage:
    type: azureblob

    massdriverBucket: massdriver
    stateBucket: state

    azureblob:
      storageAccountName: <storage account name>
      clientId: <client id>
      clientSecret: <client secret>
      tenantId: <tenant id>
```

:::tip Container Names

The `massdriverBucket` and `stateBucket` values **must match the actual container names** in your Azure Storage Account. These containers must exist before configuring Massdriver to use them.

:::

### Configuring S3Proxy with Storage Account Key

If you prefer to use a Storage Account Key for authentication instead of a service principal, you can configure that as well.

```yaml
massdriver:
  blobStorage:
    type: azureblob

    azureblob:
      storageAccountName: <storage account name>
      storageAccountKey: <storage account key>
```

---

## Google Cloud Storage (GCS)

Massdriver supports GCS buckets via S3Proxy using the native GCS backend. Before you begin, make sure you have created two GCS buckets, one for Massdriver and one for the state storage.

### Migrating Data

To migrate data from MinIO to GCS, use the following commands.

```bash
# In one terminal, port-forward to MinIO in order to access existing data
kubectl port-forward svc/massdriver-minio -n massdriver 9000

# In a separate terminal, perform the data transfer
export RCLONE_CONFIG_MINIO_TYPE=s3
export RCLONE_CONFIG_MINIO_PROVIDER=MinIO
export RCLONE_CONFIG_MINIO_ACCESS_KEY_ID=minioaccesskey
export RCLONE_CONFIG_MINIO_SECRET_ACCESS_KEY=miniosecretkey
export RCLONE_CONFIG_MINIO_ENDPOINT=http://localhost:9000
export RCLONE_CONFIG_MINIO_FORCE_PATH_STYLE=true

# GCS destination
RCLONE_CONFIG_GCS_TYPE=googlecloudstorage
RCLONE_CONFIG_GCS_PROJECT_NUMBER=<gcp project>
RCLONE_CONFIG_GCS_SERVICE_ACCOUNT_FILE=<path to gcp credentials>

# Copy data
rclone copy MINIO:massdriver AZ:<massdriver bucket name> --ignore-checksum --size-only --progress
rclone copy MINIO:state AZ:<state bucket name> --ignore-checksum --size-only --progress
```

### Configuring S3Proxy with GCP Service Account

Once the data is successfully migrated, update your Helm values configuration to use GCS for storage.

```yaml
massdriver:
  blobStorage:
    type: gcs

    massdriverBucket: <massdriver bucket name>
    stateBucket: <state bucket name>

    gcs:
      serviceAccountEmail: <storage account email>
      privateKey: |-
        -----BEGIN PRIVATE KEY-----
        ...
        -----END PRIVATE KEY-----
```

:::tip Bucket Names

The `massdriverBucket` and `stateBucket` values **must match the actual GCS bucket names** you created in your GCP project. These buckets must exist before configuring Massdriver to use them.

:::

---

## Verifying Migration

After migrating your data and updating your Helm configuration, verify the migration was successful:

1. **Test Massdriver access:**
   - Deploy the updated Helm chart
   - Check s3proxy logs for successful connections: `kubectl logs -n massdriver deployment/massdriver-s3proxy`
   - Verify no authentication or permission errors in the logs

2. **Verify application functionality:**
   - Log into Massdriver and check that you can view the files of existing bundles
   - Check deployment logs and make sure that historical logs are visible
   - Execute a "plan" on a test package to confirm state is being properly being read

---

## Rollback Procedures

If you encounter issues after switching to cloud storage:

### Quick Rollback to MinIO

If you need to quickly revert to MinIO:

```yaml
massdriver:
  blobStorage:
    type: minio
```

Then upgrade your Helm release:
```bash
helm upgrade massdriver massdriver/massdriver -n massdriver -f custom-values.yaml
```

Your original MinIO data will still be available if you haven't deleted the MinIO PVCs.

### Common Issues and Solutions

**S3Proxy won't start / authentication errors:**
- Verify your credentials are correct
- For AWS: Check IAM role permissions include `s3:GetObject`, `s3:PutObject`, `s3:ListBucket`
- For Azure: Verify Service Principal has **Storage Blob Data Contributor** role
- For GCS: Ensure service account has **Storage Object Admin** permissions

**Missing data after migration:**
- Check s3proxy logs: `kubectl logs -n massdriver deployment/massdriver-s3proxy`
  - You may need to increase the log level to `debug`
- Verify bucket names match exactly between your values.yaml and cloud provider
- Confirm buckets exist and are in the correct region

---

## (OPTIONAL) Cleaning Up MinIO

:::warning

Argo Workflows depends on MinIO for artifact storage by default. If you wish to remove MinIO entirely, *make sure you update Argo Workflows to use another solution for artifact storage!!!**

:::

After successfully migrating to cloud storage and verifying everything works:

### Option 1: Leave MinIO Installed

By default Argo Workflows uses MinIO for short term workflow storage during deployments. MinIO doesn't consume significant resources, and is well suited for this task. If you wish to continue using MinIO for Argo Workflows, you can stop here as your migration is complete!

### Option 2: Disable MinIO but Keep Data

Disable the MinIO installation, but preserve the data as a backup:

```yaml
minio:
  enabled: false
```

This remove the MinIO statefulsets and configuration, but the Persistent Volume Claims (PVCs) will remain, preserving your data.

### Option 3: Completely Remove MinIO

To fully remove MinIO and reclaim storage, disable MinIO in the values.yaml

```yaml
minio:
  enabled: false
```

And delete the PVCs as well.

```bash
# Delete MinIO PVCs (this deletes all MinIO data permanently)
kubectl delete pvc -n massdriver -l app=minio

# Delete MinIO secrets
kubectl delete secret -n massdriver massdriver-minio
```

:::danger Data Loss Warning

Deleting MinIO PVCs is **permanent and irreversible**. Only do this after:
1. Confirming successful migration to cloud storage
2. Verifying Massdriver is functioning correctly with the new backend
3. Testing both read and write operations
4. Migrating Argo Workflows to a different solution for artifact storage
5. Keeping backups of critical data if needed

:::