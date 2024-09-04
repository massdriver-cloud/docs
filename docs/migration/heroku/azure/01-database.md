---
id: migration-heroku-azure-database
slug: /migration/heroku/azure/database
title: Database
sidebar_label: Database
---

<details>
<summary><h4>Postgres</h4></summary>

## Introduction

This guide walks you through migrating a Postgres database from Heroku to Azure using Massdriver, with an emphasis on using private network access to enhance security. We’ll use Azure’s services, and Massdriver will handle most of the infrastructure setup and orchestration.

## Prerequisites

Before starting, ensure you have the following:

- [Massdriver account](https://app.massdriver.cloud/register)
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#troubleshooting-the-heroku-cli)
- [Massdriver CLI](/docs/cli/00-overview.md)
- Azure Kubernetes Service (AKS) cluster up and running
- Azure Postgres database instance up and running

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

1. **Create a Backup of Your Heroku Postgres Database**:

   - Use the Heroku CLI to create a backup of your current database:

   ```bash
   heroku pg:backups capture --app <your-heroku-app-name>
   ```

   - Once the backup is complete, download it:

   ```bash
   heroku pg:backups:download --app <your-heroku-app-name>
   ```

2. **Verify the Backup**:

   - After downloading the backup (usually named `latest.dump`), verify its contents using the `pg_restore` command:

   ```bash
   pg_restore --list latest.dump
   ```

---

## Step 3: Configure Kubernetes Cluster on Azure

1. **Deploy Azure Kubernetes Service (AKS)**:

   - In Massdriver, deploy an AKS cluster using the appropriate bundle. Select the region to match your existing infrastructure and network settings.
   - Enable ingress controllers and DNS if necessary.

2. **Access the Kubernetes Cluster**:

   - Download the kubeconfig file from Massdriver and connect to the cluster from your local environment:

   ```bash
   export KUBECONFIG=<path-to-kubeconfig>
   kubectl get nodes
   ```

3. **Set Up a Jump Box Pod for Database Migration**:

   - Deploy a pod in AKS with the required tools (e.g., `psql`, `curl`, `Heroku CLI`). You can create a custom Docker image or use an existing Postgres Docker image.
   - Example `kubectl` command to deploy a jump box pod:

   ```bash
   kubectl run jumpbox --image=postgres --restart=Never -- bash
   ```

---

## Step 4: Migrate Database to Azure

1. **Prepare Kubernetes as a Jump Box**:

   - Once your jump box pod is running, `exec` into it:

   ```bash
   kubectl exec -it jumpbox -- bash
   ```

2. **Restore the Backup in the Azure Postgres Database**:

   - First, log into the Azure Postgres instance from the jump box using the credentials from Massdriver:

   ```bash
   psql -h <azure-postgres-host> -U <username> -d postgres
   ```

   - Now, run the restore command to import your Heroku backup:

   ```bash
   pg_restore --verbose --no-owner --host=<azure-postgres-host> --port=5432 --username=<username> --dbname=<database-name> latest.dump
   ```

   - Use the credentials provided by Massdriver, and be sure the private network access configuration is active to ensure secure communication between the database and the jump box.

3. **Verify the Migration**:

   - Once the migration is complete, connect to the Azure Postgres instance and verify that the data has been transferred correctly:

   ```bash
   psql -h <azure-postgres-host> -U <username> -d <database-name>
   ```

---

## Step 5: Clean Up and Final Configuration

1. **Remove Temporary Jump Box**:

   - Once you have verified that the migration is successful, clean up the jump box pod:

   ```bash
   kubectl delete pod jumpbox
   ```

2. **Update Application Environment**:
   - Update your application's environment variables in Azure with the new database credentials and ensure that the private network access settings are applied to the entire application stack.
   - Use Massdriver’s UI to inject these variables directly into your application bundles.

---

## Step 6: Set Up Continuous Integration for Future Deployments

1. **GitHub Actions for Database Migration**:

   - Automate future database migrations by adding a GitHub Action. This action can trigger the `pg_dump` command on Heroku and then restore the dump to Azure Postgres.
   - Example GitHub Action:

   ```yaml
   name: Database Migration

   on:
     push:
       branches:
         - main

   jobs:
     migrate-db:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout code
           uses: actions/checkout@v2

         - name: Install Heroku CLI
           run: curl https://cli-assets.heroku.com/install.sh | sh

         - name: Perform DB Backup on Heroku
           run: heroku pg:backups capture --app <your-heroku-app-name>

         - name: Download DB Backup
           run: heroku pg:backups:download --app <your-heroku-app-name>

         - name: Restore Backup to Azure Postgres
           run: pg_restore --verbose --no-owner --host=<azure-postgres-host> --port=5432 --username=<username> --dbname=<database-name> latest.dump
   ```

---

## Conclusion

You have now successfully migrated your database from Heroku to Azure using Massdriver. By leveraging Massdriver’s bundles, secure private network access, and Kubernetes as a jump box, this process can be streamlined, ensuring a secure and efficient database migration.

</details>
