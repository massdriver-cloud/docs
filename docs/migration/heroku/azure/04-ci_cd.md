---
id: migration-heroku-azure-cicd
slug: /migration/heroku/azure/cicd
title: CI/CD
sidebar_label: CI/CD
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Introduction

This guide explains how to migrate your CI/CD pipeline from Heroku to Massdriver, including continuous integration (CI) and continuous deployment (CD) to Azure services.

## Prerequisites

- Your application code must be hosted in version control in a public or private repository, e.g. GitHub or Azure Repos.

---

## Step 1: Continuous Integration (CI)

<Tabs>
<TabItem value="GitHub Actions" label="GitHub Actions">

1. Copy the following link and replace `<org/username>` and `<repo-name>` with your GitHub organization or username and repository name:

    ```markdown
    https://github.com/<org/username>/<repo-name>/actions/new?category=continuous-integration
    ```

2. Open the link in your browser. You will be presented with available workflows for continuous integration based on your application's runtime environment.

3. Click `Configure` on the workflow that best suits your application's requirements (Node.js, Python, Go, etc.).

4. Customize the workflow file as needed and then click `Commit changes` to add it to your repository's `.github/workflows` directory.

</TabItem>
<TabItem value="Azure DevOps" label="Azure DevOps">

1. Select the Continuous Integration template desired for your runtime.

2. Review the YAML pipeline file and click `Save and run` to save the pipeline to your repository and run it.

</TabItem>
</Tabs>

---

## Step 2: Continuous Deployment (CD)

To deploy your application in Massdriver, we need a workflow that builds and pushes your Docker image to Azure Container Registry, publishes changes to your application bundle, updates the image tag in your application manifest, and redeploys the application in the Massdriver platform.

<Tabs>
<TabItem value="GitHub Actions" label="GitHub Actions">

1. Create a new workflow file in your repository's `.github/workflows` directory. For example, `.github/workflows/massdriver-deploy.yml`:

   ```yaml
   name: Deploy to Massdriver
   on:
     push:
       branches: [main]

   jobs:
     push_and_deploy:
       runs-on: ubuntu-latest
       env:
         MASSDRIVER_ORG_ID: ${{ secrets.MASSDRIVER_ORG_ID }}
         MASSDRIVER_API_KEY: ${{ secrets.MASSDRIVER_API_KEY }}
       steps:
         - uses: actions/checkout@v4
         - name: Install Massdriver CLI
           uses: massdriver-cloud/actions@v4
         - name: Push Image
           uses: massdriver-cloud/actions/image_push@v4
           with:
             namespace: ${{ vars.NAMESPACE }}
             image-name: ${{ vars.IMAGE_NAME }}
             artifact: ${{ secrets.MASSDRIVER_ARTIFACT_ID }}
             region: ${{ vars.REGION }}
             image-tag: ${{ github.sha }}
             build-context: ./ # path to Dockerfile
         - name: Publish Bundle 
           uses: massdriver-cloud/actions/bundle_publish@v4
           with:
             build-directory: ./massdriver # path to massdriver config directory, contains massdriver.yaml
         - name: Set Image Version 
           uses: massdriver-cloud/actions/app_patch@v4
           with:
             project: <insert-project-abbreviation-here>
             env: <insert-environment-abbreviation-here>
             manifest: <insert-manifest-abbreviation-here>
             set: |
               .image.tag = "${{ github.sha }}"
         - name: Deploy App
           uses: massdriver-cloud/actions/app_deploy@v4
           with:
             project: <insert-project-abbreviation-here>
             env: <insert-environment-abbreviation-here>
             manifest: <insert-manifest-abbreviation-here>
   ```

2. Replace the placeholders in the workflow file as needed, then save and commit the changes to your repository.

</TabItem>
<TabItem value="Azure DevOps" label="Azure DevOps">

1. Create a new pipeline and select where your code is, then select your repository. When selecting a template, select `Starter Pipeline`, then use this code as a template for your pipeline:

   ```yaml
   trigger:
     branches:
       include:
       - main

   pool:
     vmImage: 'ubuntu-latest'

   variables:
     MASSDRIVER_ORG_ID: $(MASSDRIVER_ORG_ID)
     MASSDRIVER_API_KEY: $(MASSDRIVER_API_KEY)

   stages:
   - stage: DeployToMassdriver
     jobs:
     - job: push_and_deploy
       steps:
       - checkout: self

       - task: mass-cli-install@0
         displayName: 'Install Massdriver CLI'

       - task: mass-image-push@0
         displayName: 'Push Image'
         inputs:
           namespace: $(NAMESPACE)
           imageName: $(IMAGE_NAME)
           artifact: $(MASSDRIVER_ARTIFACT_ID)
           region: $(REGION)
           imageTag: $(Build.SourceVersion) # Sets image tag to git commit sha
           buildContext: './' # Path to Dockerfile

       - task: mass-bundle-publish@0
         displayName: 'Publish Bundle'
         inputs:
           buildDirectory: './massdriver' # Path to massdriver.yaml file

       - task: mass-app-patch@0
         displayName: 'Set Image Version'
         inputs:
           project: <insert-project-name-here>
           env: <insert-environment-name-here>
           manifest: <insert-manifest-name-here>
           set: '.image.tag="$(Build.SourceVersion)"'

       - task: mass-app-deploy@0
         displayName: 'Deploy App'
         inputs:
           project: <insert-project-name-here>
           env: <insert-environment-name-here>
           manifest: <insert-manifest-name-here>
   ```

2. Replace the placeholders in the pipeline file as needed, then save and run the pipeline.

</TabItem>
</Tabs>
