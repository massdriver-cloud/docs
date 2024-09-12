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

## Prerequisites

Before starting, ensure you have the following:

- [Massdriver account](https://app.massdriver.cloud/register)
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#troubleshooting-the-heroku-cli)
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

## Step 2: Back Up Your Database

<Tabs>
<TabItem value="postgres" label="Heroku Postgres">

1. **Create a Backup of Your [Heroku Postgres](https://devcenter.heroku.com/categories/heroku-postgres) Database**:

   - Set up your environment variables (modify as needed):

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

<TabItem value="stackheromysql" label="Stackhero for MySQL">

Coming soon...

</TabItem>

<TabItem value="rocketmongodb" label="ObjectRocket for MongoDB">

Coming soon...

</TabItem>

<TabItem value="mssql" label="MSSQL">

1. **Create a Backup of Your [MSSQL](https://devcenter.heroku.com/articles/mssql) Database**:

   - Set up your environment variables (modify as needed):

   ```bash
   herokuappname=<your-heroku-app-name>
   location=westus
   saname=herokumssqlbackup
   containername=herokumssqlbackup
   ```

   - Create an Azure Blob to store the backup:

   ```bash
   az group create --name $saname --location $location
   ```

   ```bash
   az storage account create --name $saname --resource-group $saname --location $location --sku Standard_LRS
   ```

   ```bash
   az storage container create --account-name $saname --name $containername
   ```

   ```bash
   az storage account show-connection-string --name $saname --resource-group $saname --output tsv
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

4. **Deploy the Jump Box Pod**:

   ```bash
   kubectl apply -f haiku-havoc-hero.yaml
   ```

---

## Step 4: Migrate Database to Azure

<Tabs>
<TabItem value="postgres" label="Postgres">

1. **Use Kubernetes as a Jump Box**:

   - Once your jump box pod is running, `exec` into it:

   ```bash
   kubectl exec -it haiku-havoc-hero -c postgres -- bash
   ```

2. **Restore the Backup to Azure Postgres**:

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

1. **Use Kubernetes as a Jump Box**:

   - Once your jump box pod is running, `exec` into it:

   ```bash
   kubectl exec -it haiku-havoc-hero -c mysql -- bash
   ```

2. **Create a backup using mysqldump**:

   - Set up your environment variables (modify as needed):

   ```bash
   username=<mysql-username>
   password=<mysql-password>
   database=<database-name>
   mysqlserver=<azure-mysql-server>
   mysqlrg=<azure-mysql-resource-group>
   azureusername=<azure-mysql-username> # can be fetched from database artifact
   azurepassword=<azure-mysql-password> # can be fetched from database artifact
   ```

   - Create the backup file:

   ```bash
   mysqldump -u $username -p$password $database > backup.sql
   ```

:::note
There is no space between `-p` and the password.
:::

3. **Restore the Backup to Azure MySQL**:

   - Restore the backup to Azure MySQL:

   ```bash
   mysql -h $mysqlserver.mysql.database.azure.com -u $azureusername -p$azurepassword $database < backup.sql
   ```

4. **Verify the Migration**:

   - Once the migration is complete, connect to the Azure MySQL instance and verify that the data has been transferred correctly:

   ```bash
   mysql -h $mysqlserver.mysql.database.azure.com -u $azureusername -p$azurepassword $database -e "SHOW TABLES;"
   ```

</TabItem>
<TabItem value="mongodb" label="MongoDB">

1. **Use Kubernetes as a Jump Box**:

   - Once your jump box pod is running, `exec` into it:

   ```bash
   kubectl exec -it haiku-havoc-hero -c mongo -- bash
   ```

2. **Create a backup using mongodump**:

   - Set up your environment variables (modify as needed):

   ```bash
   mongohost=<mongodb-host>
   mongoport=27017
   username=<mongodb-username>
   password=<mongodb-password>
   database=<database-name>
   collection=importedQuery
   cosmosrg=<azure-cosmos-resource-group>
   cosmosname=<azure-cosmos-name>
   ```

   - Create a BSON data dump of your database:

   ```bash
   mongodump --host $mongohost:$mongoport --username $username \
      --password $password --db $database \
      --collection $collection --ssl --out mongodump
   ```

   This should create a `mongodump` directory with the BSON data dump.

3. **Restore the Backup to Azure MongoDB**:

   - Restore the BSON data dump to Azure Cosmos DB Mongo:

   ```bash
   mongorestore --host $mongohost:$mongoport --authenticationDatabase admin \
      -u $username -p $password --db $database \
      --collection $collection --writeConcern="{w:0}" \
      --ssl mongodump/$database/query.bson
   ```

4. **Verify the Migration**:

   - Once the migration is complete, connect to the Azure CosmosDB Mongo instance and verify that the data has been transferred correctly:

   ```bash
   az cosmosdb mongodb collection list --resource-group $cosmosrg --account-name $cosmosname --database-name $database
   ```

   ```bash
   az cosmosdb mongodb collection show --resource-group $cosmosrg --account-name $cosmosname --database-name $database --name $collection
   ```

</TabItem>
<TabItem value="mssq'" label="MSSQL">

:::note

#### Limitations

- Azure SQL Managed Instance does not currently support migrating a database into an instance database from a bacpac file using Azure CLI. To import into a SQL managed instance, use SQL Server Management Studio or [SQLPackage](https://learn.microsoft.com/en-us/azure/azure-sql/database/database-import?view=azuresql&tabs=azure-cli#use-sqlpackage).
- Importing to a database in elastic pool isn't supported. You can import data into a single database and then move the database to an elastic pool.

:::

<details>
<summary>If your database is <b>larger than 150GB</b>, read this!</summary>

The machines processing import/export requests submitted through portal or CLI need to store the bacpac file as well as temporary files generated by **Data-Tier Application Framework (DacFX)**. The disk space required varies significantly among DBs with same size and can take up to **three times** of the database size. Machines running the import/export request only have 450GB local disk space. As result, some requests might fail with `There is not enough space on the disk` error. In this case, the workaround is to run [SQLPackage](https://learn.microsoft.com/en-us/azure/azure-sql/database/database-import?view=azuresql&tabs=azure-cli#use-sqlpackage) on a machine with enough local disk space. When importing/exporting databases larger than 150GB, use SqlPackage to avoid this issue.

</details>

1. **Use Kubernetes as a Jump Box**:

   - Once your jump box pod is running, `exec` into it:

   ```bash
   kubectl exec -it haiku-havoc-hero -c mssql -- bash
   ```

2. **Restore the Backup to Azure Postgres**:

   - Log into Azure CLI:

   ```bash
   az login
   ```

   - Setup your environment variables:

   ```bash
   saname=herokumssqlbackup
   containername=herokumssqlbackup
   mysqlserver=<azure-mysql-server>
   mysqlrg=<azure-mysql-resource-group>
   database=<database-name>
   username=<azure-mysql-username> # can be fetched from database artifact
   password=<azure-mysql-password> # can be fetched from database artifact
   sakey=$(az storage account keys list --account-name $saname --resource-group $saname --query "[0].value" -o tsv)
   ```

   - Import the backup to Azure SQL database:

   ```bash
   az sql db import --resource-group $mysqlrg -u $username -p $password \
      --server $mysqlserver --name $database \
      --storage-key-type "StorageAccessKey" --storage-key $saykey \
      --storage-uri "https://$saname.blob.core.windows.net/$containername/<backup-name>.bacpac"
   ```

3. **Verify the Migration**:

   - Once the migration is complete, connect to the Azure SQL instance and verify that the data has been transferred correctly:

   ```bash
   az sql db list --resource-group $mysqlrg --server $mysqlserver
   ```

   ```bash
   az sql db show --resource-group $mysqlrg --server $mysqlserver --name $database
   ```

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
