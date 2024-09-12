---
id: migration-heroku-azure-app
slug: /migration/heroku/azure/app
title: App
sidebar_label: App
---

## Introduction

This guide walks you through migrating an application from Heroku to Azure Kubernetes Service (AKS) using Massdriver, with an emphasis on using private network access to enhance security. We’ll use Azure’s services, and Massdriver will handle most of the infrastructure setup and orchestration.

## Prerequisites

Before starting, ensure you have the following:

- [Mass CLI](/docs/cli/00-overview.md)
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
- [Docker](https://docs.docker.com/get-docker/)
- [Massdriver account](https://app.massdriver.cloud/register)
- A deployed Azure Kubernetes Service (AKS) cluster

---

## Step 1: Create a Dockerfile

It’s hard to provide a general guide on how to dockerize a Heroku app, as it depends on the app's structure and dependencies. However, here are some general tips that might help you:

1. Use `docker init` in your app directory to generate a custom `Dockerfile` for your app.
2. Use a `.dockerignore` file to exclude unnecessary files and directories from the Docker image.
3. Use a build cache to speed up the build process.
4. Build and test your Docker image locally before pushing it to a registry.

For a detailed video on getting started with Dockerizing an application, check out:
<iframe width="560" height="315" src="https://www.youtube.com/embed/1Guuaf5JTr0?si=KGSaAZteZLKrD3_V" title="Best Practices for Containerizing Web Apps with Docker" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

---

## Step 2: Build and Test the Docker Image

1. **Set up some environment variables to make the process easier**:

   ```bash
   imageName="<your-image-name>" # e.g. my-app
   namespace="<your-namespace>" # e.g. my-image-namespace
   location="westus" # set this to your preferred Azure region
   mdArtifactId="<your artifact id>" # https://docs.massdriver.cloud/concepts/artifacts#artifact-id
   ```

2. **Build the Docker image**:

   ```bash
   docker build -t $imageName .
   ```

3. **Run the Docker image locally to test it**:

   ```bash
   docker run -p 8080:8080 $imageName
   ```

4. **Browse to `http://localhost:8080` to see your app running**.

---

## Step 3: Create a Massdriver application bundle

1. **Setup the Mass CLI environment variables noted [here](/docs/cli/00-overview.md#setup).**

2. **Generate a new application template**:

   - Run the following command and follow the prompts:

   ```bash
   mass bundle new
   ```

3. **Add your environment variables to the `massdriver.yaml` file**:

   - Review the example below of how to configure environment variables in the `massdriver.yaml` file:

   ```yaml
   app:
     envs:
        LOG_LEVEL: .params.configuration.log_level
        MONGO_DSN: .connections.mongo_authentication.data.authentication.username + ":" + .connections.mongo_authentication.data.authentication.password + "@" + .connections.mongo_authentication.data.authentication.hostname + ":" + (.connections.mongo_authentication.data.authentication.port|tostring)
     policies:
        - .connections.storage_account.data.security.iam.read_write
     secrets:
        OPENAI_API_KEY:
          required: true
          title: OpenAI API Key
          description: The API key for OpenAI that gives me sketchy life advice
   ```

   - For more information about how to configure these environment variables, refer to our [examples](/docs/applications/02-create-application.md#environment-variable-examples) or [video walkthrough](https://www.youtube.com/watch?v=seRBnT-Axfw).

4. **Publish your application bundle to Massdriver**:

   ```bash
   mass bundle publish
   ```

5. **View your application bundle in Massdriver**:

   - Browse to <https://app.massdriver.cloud> and log in.
   - In the `Bundle Catalog`, search for your application bundle.
   - Drag it out to the canvas to start configuring your application.
   - If you want to implement DNS, be sure [add DNS](/docs/dns/01-dns-zones.md) and configure it based on your domain registrar, then enable DNS for AKS first.
   - **Don't deploy yet**!!

## Step 4: Push the Docker Image to Azure Container Registry

1. **Build and push your image to ACR**:

   ```bash
   mass image push $namespace/$imageName --region $location --artifact $mdArtifactId --tag latest
   ```

2. **Copy output from the previous command and paste in `Repository` field in your application bundle configuration in Massdriver**.

3. **Set the `Tag` field to `latest`**.

---

## Step 5: Deploy and Test

1. **Deploy your application bundle in Massdriver**:

   - Click the `Deploy` button in the bottom of your bundle configuration.

2. **Access your application**:

   - Set up `kubectl` and `kubeconfig` to access your AKS cluster by following this [guide](/docs/runbooks/kubernetes/01-access.md).
   - Run the following commands to view your application's status:

   ```bash
   kubectl get pods
   kubectl describe pod <pod-name>
   kubectl logs <pod-name>
   ```

   - If you experience any issues, refer to the [troubleshooting guide](/docs/runbooks/kubernetes/02-troubleshoot.md).
