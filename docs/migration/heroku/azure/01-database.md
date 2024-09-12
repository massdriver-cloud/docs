---
id: migration-heroku-azure-database
slug: /migration/heroku/azure/database
title: Database
sidebar_label: Database
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CodeBlock from '@theme/CodeBlock';

## Introduction

This guide walks you through migrating a Postgres database from Heroku to Azure using Massdriver, with an emphasis on using private network access to enhance security. We’ll use Azure’s services, and Massdriver will handle most of the infrastructure setup and orchestration.

<iframe width="560" height="315" src="https://www.youtube.com/embed/YRTs2MYXEoM?si=shoKcDORIvidXQLD" title="Migrate from Heroku to Azure using Massdriver" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Prerequisites

Before starting, ensure you have the following:

- [Massdriver account](https://app.massdriver.cloud/register)
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#troubleshooting-the-heroku-cli)
- [Massdriver CLI](/docs/cli/00-overview.md)
- Azure Kubernetes Service (AKS) bundle up and running
- Azure database bundle up and running

---

## Step 1: Set Up Azure Infrastructure with Massdriver

We will start by configuring the Azure infrastructure using Massdriver.

1. **Create a Massdriver environment**:

   - Navigate to your Massdriver dashboard and create a new project if you don’t already have one. Create a new environment, naming it something appropriate for this migration (e.g., `staging`).

2. **Deploy a Private Virtual Network**:

   - In Massdriver, search for the Azure Virtual Network bundle and deploy it. This will provide network isolation for your infrastructure.
   - Choose a region, configure CIDR blocks, and other network settings.
   - Deploy the virtual network and wait for it to complete.

3. **Set Up an Azure Postgres Database**:
   - Using the Azure Postgres bundle in Massdriver, set up the database instance. Make sure it’s in the same region as your network.
   - Configure the resource group, database version (ensure it's compatible with your current Postgres version on Heroku), and enable private network access.
   - You may also enable automatic alarms and monitoring if needed.
   - Save and deploy the Postgres database.

---

## Step 2: Back Up Your Heroku Database

<Tabs>
<TabItem value="postgres" label="Postgres">

1. **Create a Backup of Your [Heroku Postgres](https://devcenter.heroku.com/categories/heroku-postgres) Database**:

- Set up env vars:

```bash
herokuappname=<your-heroku-app-name>
```

- Use the Heroku CLI to create a backup of your current database:

```bash
heroku pg:backups capture --app $herokuappname
```

- Once the backup is complete, download it:

```bash
heroku pg:backups:download --app $herokuappname
```

2. **Verify the Backup**:

- After downloading the backup (usually named `latest.dump`), verify its contents using the `pg_restore` command:

```bash
pg_restore --list latest.dump
```

</TabItem>

<TabItem value="mysql" label="MySQL">
</TabItem>

<TabItem value="mongodb" label="MongoDB">
</TabItem>

<TabItem value="mssql" label="MSSQL">

1. **Create a Backup of Your [MSSQL](https://devcenter.heroku.com/articles/mssql) Database**:

- Set up env vars:

```bash
herokuappname=<your-heroku-app-name>
rg=heroku-mssql-backup
location=westus
saname=herokumssqlbackup
containername=herokumssqlbackup
```

- Create an Azure Blob to store the backup:

```bash
az group create --name $rg --location $location
```

```bash
az storage account create --name $saname --resource-group $rg --location $location --sku Standard_LRS
```

```bash
az storage container create --account-name $saname --name $containername
```

```bash
az storage account show-connection-string --name $saname --resource-group $rg --output tsv
```

:::caution
The output of the `az storage account show-connection-string` command will output the entire connection string, however the MSSQL addon only requires the `DefaultEndpointsProtocol`, `AccountName`, `AccountKey`, and `EndpointSuffix` values. You can remove the rest of the connection string.
:::

- Access your MSSQL database addon on Heroku:

```bash
heroku addons:open mssql -a $herokuappname
```

- For each database you want to backup and restore, click on the database name and then click on the `Backup/Restore` link. Click on the `Using Your own Azure Blob` tab and then `Private Container`. Fill in the container name and connection string values from the previous steps, then click `Save`. Click `Create Backup` to start the backup process.

2. **Verify the Backup**:

- After the backup is complete, you can run the following to show the backup in your Azure Blob:

```bash
az storage blob list --account-name $saname --container-name $containername --output table
```

</TabItem>
</Tabs>

---

## Step 3: Configure Kubernetes Cluster on Azure

1. **Deploy Azure Kubernetes Service (AKS)**:

   - In Massdriver, deploy an AKS cluster using the appropriate bundle. Select the region to match your existing infrastructure and network settings.
   - Enable ingress controllers and DNS if necessary.

2. **Access the Kubernetes Cluster**:

   - Download the kubeconfig file from Massdriver and connect to the cluster by following this [guide](/docs/runbooks/kubernetes/01-access.md).

3. **Set Up a Jump Box Pod for Database Migration**:

   - Create a new file called `haiku-havoc-hero.yaml` with the following content:

<Tabs>
<TabItem value="postgres" label="Postgres">

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: haiku-havoc-hero
     namespace: default
   spec:
      containers:
         - name: postgres
           image: mclacore/haiku-havoc-hero:postgres-v1
           env:
             - name: POSTGRES_PASSWORD
               value: password
   ```

</TabItem>
<TabItem value="mysql" label="MySQL">

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: haiku-havoc-hero
     namespace: default
   spec:
      containers:
         - name: mysql
           image: mclacore/haiku-havoc-hero:mysql-v1
           env:
             - name: MYSQL_ROOT_PASSWORD
               value: password
   ```

</TabItem>
<TabItem value="mongodb" label="MongoDB">

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: haiku-havoc-hero
     namespace: default
   spec:
      containers:
         - name: mongo
           image: mclacore/haiku-havoc-hero:mongo-v1 
   ```

</TabItem>
<TabItem value="mssql" label="MSSQL">

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: haiku-havoc-hero
     namespace: default
   spec:
      containers:
         - name: mssql
           image: mclacore/haiku-havoc-hero:mssql-v1 
           env:
             - name: PATH
               value: "/opt/mssql-tools/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/tmp/google-cloud-sdk/bin"
   ```

</TabItem>
</Tabs>

:::note
The [`haiku-havoc-hero`](https://github.com/mclacore/haiku-havoc-hero) pod includes tools like `heroku`, `aws`, `az`, and `gcloud` by default. You can specify the specific database tooling you need in the manifest file.
:::

---

## Step 4: Migrate Database to Azure

1. **Use Kubernetes as a Jump Box**:

   - Once your jump box pod is running, `exec` into it:

   ```bash
   kubectl exec -it haiku-havoc-hero -c <container-name> -- bash
   ```

2. **Restore the Backup**:

<Tabs>
<TabItem value="postgres" label="Postgres">

- Setup your environment variables:

   ```bash
   herokuappname=<your-heroku-app-name>
   pgrg=<azure postgres resource group>
   pgname=<azure postgres name>
   database=<database-name>
   ```

- Log into Heroku with interactive (`-i`) mode and use your Heroku API key as the password:

   ```bash
   heroku login -i
   ```

- Download the backup from Heroku:

   ```bash
   heroku pg:backups:download --app $herokuappname
   ```

- Log into Azure CLI and set `FQDN` and `username` environment variables:

   ```bash
   az login
   ```

   ```bash
   fqdn=$(az postgres flexible-server show --resource-group $pgrg --name $pgname --query "fullyQualifiedDomainName" --output tsv)
   ```

   ```bash
   username=$(az postgres flexible-server show --resource-group $pgrg --name $pgname --query "administratorLogin" --output tsv)
   ```

- Restore the backup to Azure Postgres:

   ```bash
   pg_restore --verbose --no-owner -h $fqdn -U $username -d $database latest.dump
   ```

3. **Verify the Migration**:

   - Once the migration is complete, connect to the Azure Postgres instance and verify that the data has been transferred correctly:

   ```bash
   psql -h $fqdn -U $username -d $database -c "\dt"
   ```

</TabItem>
<TabItem value="mysql" label="MySQL">
</TabItem>
<TabItem value="mongodb" label="MongoDB">
</TabItem>
<TabItem value="mssq'" label="MSSQL">
</TabItem>
</Tabs>

---

## Step 5: Clean Up and Final Configuration

1. **Remove Temporary Jump Box**:

   - Once you have verified that the migration is successful, clean up the jump box pod:

   ```bash
   kubectl delete pod haiku-havoc-hero
   ```

2. **Update Application Environment**:

   - Check out our [guide](/docs/applications/02-create-application.md#environment-variable-examples) on setting up environment variables in your `massdriver.yaml` file for your application to connect to the new Azure Postgres database.
   - We also have a [video guide](https://www.youtube.com/watch?v=seRBnT-Axfw) on deplying a 3 tier web architecture on Azure with AKS that goes over setting up environment variables.

---

## Conclusion

You have now successfully migrated your database from Heroku to Azure using Massdriver. By leveraging Massdriver’s bundles, secure private network access, and Kubernetes as a jump box, this process can be streamlined, ensuring a secure and efficient database migration.
