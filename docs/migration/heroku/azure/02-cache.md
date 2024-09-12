---
id: migration-heroku-azure-cache
slug: /migration/heroku/azure/cache
title: Cache
sidebar_label: Cache
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Introduction

This guide walks you through migrating a Redis cache from Heroku to Azure using Massdriver, with an emphasis on using private network access to enhance security. We’ll use Azure’s services, and Massdriver will handle most of the infrastructure setup and orchestration.

## Prerequisites

Before starting, ensure you have the following:

- [redis-cli](https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/)
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
- Azure Cache for Redis deployed with **Premium**, **Enterprise**, or **Enterprise Flash** tiers ([Supported tiers for import/export](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/cache-how-to-import-export-data#which-tiers-support-importexport))
- Azure Kubernetes Service (AKS) cluster within the same virtual network as the Azure Cache for Redis instance

---

## Step 1: Set Up Azure Infrastructure with Massdriver

If you haven't done so already from the [database](./01-database.md) guide, we will start by configuring the Azure infrastructure using Massdriver.

1. **Create a Massdriver environment**:

   - Navigate to your Massdriver dashboard and create a new project if you don’t already have one. Create a new environment, naming it something appropriate for this migration (e.g., `staging`).

2. **Deploy a Private Virtual Network**:

   - In Massdriver, search for the Azure Virtual Network bundle and deploy it. This will provide network isolation for your infrastructure.
   - Choose a region, configure CIDR blocks, and other network settings.
   - Deploy the virtual network and wait for it to complete.

3. **Set Up an Azure Cache for Redis**:
   - Using the Azure Cache for Redis bundle in Massdriver, set up the cache instance (**Premium or Enterprise SKU**). Make sure it’s in the same region as your network.
   - Configure the resource group, redis version (ensure it's compatible with your current Redis version on Heroku), and enable private network access.
   - You may also enable automatic alarms and monitoring if needed.
   - Save and deploy the Redis cache.

---

## Step 2: Create a Backup of Redis

<Tabs>
<TabItem value="herokuredis" label="Heroku Redis">

1. **Log into Heroku CLI**:

    ```bash
    heroku login
    ```

2. **Fetch the Heroku Redis credentials**:

    ```bash
    heroku redis:credentials -a <app-name>
    ```

3. **Create a backup of the Heroku Redis instance**:

    ```bash
    redis-cli -h <host> -p <port> -a <password> --rdb dump.rdb
    ```

   :::note
   If you are using a tier higher than `Mini`, you may need to add `--tls --insecure` to the command.
   :::

</TabItem>
<TabItem value="stackheroredis" label="Stackhero for Redis">

Coming soon...

</TabItem>
</Tabs>

---

## Step 3: Upload Backup to Azure Storage

Migrating your Redis cache data to Azure requires the use of page or block blobs in Azure Storage.

### Create a Storage Account

1. **Setup environment variables**:

   ```bash
   accountName="herokutoazure"
   accountRg="herokutoazure"
   containerName="herokutoazure"
   blobName="herokutoazure"
   location="eastus"
   ```

2. **Log into Azure CLI**:

   ```bash
   az login
   ```

3. **Set your Azure subscription**:

   ```bash
   az account set --subscription <subscription-id>
   ```

4. **Create a resource group and a storage account**:

   ```bash
   az group create --name $accountRg --location $location
   az storage account create --name $accountName --resource-group $accountRg --location $location --sku Standard_LRS
   ```

5. **Create a container**:

   ```bash
   az storage container create --name $containerName --account-name $accountName
   ```

---

## Step 4: Upload the RDB File to Azure Storage

1. **Upload the Redis dump file to Azure storage**:

   ```bash
   az storage blob upload --account-name $accountName --container-name $containerName --name $blobName --file dump.rdb
   ```

2. **Generate the SAS (Shared Access Signature) URL for the blob**:

   ```bash
   # Linux:
   end=$(date -u -d "60 minutes" '+%Y-%m-%dT%H:%MZ')

   # MacOS:
   end=$(date -u -v+60M '+%Y-%m-%dT%H:%MZ')
   ```

   ```bash
   az storage blob generate-sas --account-name $accountName --container-name $containerName --name $blobName --permissions r --expiry $end
   ```

   :::caution
   Set an expiry date for the SAS URL to ensure the data is not accessible after migration.
   :::

---

## Step 5: Configure Kubernetes Cluster on Azure

1. **Deploy Azure Kubernetes Service (AKS)**:

   - In Massdriver, deploy an AKS cluster using the appropriate bundle. Select the region to match your existing infrastructure and network settings.
   - Enable ingress controllers and DNS if necessary.

2. **Access the Kubernetes Cluster**:

   - Download the kubeconfig file from Massdriver and connect to the cluster by following this [guide](/docs/runbooks/kubernetes/01-access.md).

3. **Set Up a Jump Box Pod for Cache Migration**:

   - Create a new file called `haiku-havoc-hero.yaml` with the following content:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: haiku-havoc-hero
     namespace: default
   spec:
     containers:
       - name: redis
         image: mclacore/haiku-havoc-hero:redis-v1
   ```

   :::info
   [haiku-havoc-hero](https://github.com/mclacore/haiku-havoc-hero) is a simple Docker image that deploys a Redis container packed with toos like `redis-cli`, `heroku`, `aws cli`, `az cli`, `gcloud cli`, and more. Designed to make your migration from Heroku to the cloud as smooth as possible.
   :::

4. **Deploy the pod**:

   ```bash
   kubectl apply -f haiku-havoc-hero.yaml
   ```

---

## Step 6: Import data from Azure Storage to Azure Cache for Redis using AKS

1. **Set up your environment variables (modify as needed)**:

   ```bash
   cacheRg="<resource-group>"
   cacheName="<cache-name>"
   ```

3. **Exec into the pod**:

   ```bash
   kubectl exec -it haiku-havoc-hero -c redis -- sh
   ```

4. **Import the data from Azure Storage into Azure Cache for Redis**:

<Tabs>
<TabItem value="premium" label="Premium">

   ```bash
   az redis import --name $cacheName --resource-group $cacheRg --files $sasUrl
   ```

</TabItem>
<TabItem value="enterprise" label="Enterprise">

   ```bash
   az redisenterprise database import --cluster-name $cacheName --resource-group $cacheRg --sas-uris $sasUrl
   ```

</TabItem>
</Tabs>

---

## Step 7: Verify and Clean Up

1. **Verify the import by connecting to the Azure Cache for Redis instance using `redis-cli`**:

   ```bash
   redis-cli -h <cache-name>.redis.cache.windows.net -p 6380 -a <password> --tls --insecure
   ```

2. **Check that the keys have been imported**:

   ```bash
   keys *
   ```

3. **Once verified, delete the jump box pod**:

   ```bash
   kubectl delete pod haiku-havoc-hero
   ```

---

## Conclusion

You have successfully migrated your Redis cache from Heroku to Azure Cache for Redis while ensuring data security through private network access using Massdriver.
