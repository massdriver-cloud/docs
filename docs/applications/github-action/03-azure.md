---
id: applications-github-action-azure
slug: /applications/github-action/azure
title: Azure
sidebar_label: Azure
---

## Docker image push & deploy
The Massdriver CLI supports pushing images to an Azure Container Registry (ACR) and deploying them to Massdriver. This guide will walk you through the process of setting up a GitHub Action to push app changes to your ACR repository and deploy them to Massdriver.

:::note

Before getting started, you'll need:
- A Massdriver organization 
- A Massdriver [service account](/platform/service-accounts)
- The [Massdriver CLI](https://github.com/massdriver-cloud/massdriver-cli) installed

:::

### Set secrets and vars
Once you've published your application, you'll need to set the following secrets and vars in your GitHub repository:

| Name | Description | Type | Notes |
| --- | --- | --- | --- |
| `MASSDRIVER_ORG_ID` | Your Massdriver organization ID | secret | Your Organization ID can be found by hovering over your org logo in the sidebar |
| `MASSDRIVER_API_KEY` | Your Massdriver API key | secret | [Service Accounts](/platform/service-accounts) |
| `AUTHENTICATION_ARTIFACT_ID_AZURE` | The ID of the authentication artifact for your Azure Container Registry | secret | Browse to your organization [artifacts](https://app.massdriver.cloud/artifacts), open your credentials artifact, and copy the UUID in the browser URL |
| `IMAGE_REPO` | The name of your ACR repository | variable | Must be in `name/name` format. If it does not exist, it will be created for you |
| `PACKAGE_SLUG` | The slug of your Massdriver application package | variable | Hover over the name of your application in Massdriver to view the slug |
| `REGION` | The region where your ACR is located | variable | Must be a valid Azure region. For example: `eastus` |

### Publish your application
Before you can set up a GitHub Action to deploy your application, first you'll need to publish it to Massdriver and create a package. You can do this by following the [Getting Started](/applications/getting-started) guide.

After you publish your application, you'll need to create a package. You can do this by dragging your application out from the bundle bar in the Massdriver canvas. Fill in the values of your application and click **Deploy**.

### Params file
Next, we'll need to create a params file for our application. This file will be used by the GitHub Action workflow to update the image tag and update the configuration of your application.

To generate this file, in your terminal run the following command:

```bash
mass preview init <application-package-slug-id>
```

Hover over `Azure` and hit **enter** to select. Hit `s` to save. Hover over the name of your credential and hit **enter** to select. Hit `s` to save.

This will output a JSON file named `preview.json` in your current directory with the values of every package in the same target as your application. Use `cat preview.json` to view the contents of the file, and copy the JSON block for your application into a new file named `mass-app-params.json`. You can find an example params file below:

```json title=".github/workflows/mass-app-params.json"
{
  "application": {
    "health_check_path": "/health",
    "logs": {
      "disk_quota_mb": 50,
      "retention_period_days": 7
    },
    "maximum_worker_count": 3,
    "minimum_worker_count": 1,
    "sku_name": "P1v3",
    "zone_balancing": false
  },
  "dns": {
    "enable_dns": false
  },
  "image": {
    "registry": "massdriver.azurecr.io/test/repo",
    "tag": "IMAGE_TAG"
  },
  "monitoring": {
    "mode": "AUTOMATED"
  }
}
```

:::warning

Any changes to the values in this params file will override the values for your application in the Massdriver UI.

:::

Store `mass-app-params.json` in your GitHub repository in the `.github/workflows` directory.

### GitHub Action
:::note

This GitHub Action will create a new Azure Container Registry with the following name format: `massdriver<region>.azurecr.io`. The region will be the same as the region you set in the `REGION` variable. If the registry already exists, the action will use it.

:::

To set up the GitHub Action, create a new file named `mass-app-deploy.yaml` in the `.github/workflows` directory of your GitHub repository. You can use this workflow below:

```yaml title=".github/workflows/mass-app-deploy.yaml"
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
      - name: Checkout
        uses: actions/checkout@v3
      - name: Set outputs
        id: vars
        run: echo "sha_short=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT
      - name: Install Massdriver CLI
        uses: massdriver-cloud/actions/setup@v2.1
      - name: Build and Push - Azure
        run: mass image push ${{ vars.IMAGE_REPO }} -a ${{ secrets.AUTHENTICATION_ARTIFACT_ID_AZURE }} -r ${{ vars.REGION }} -t ${{ steps.vars.outputs.sha_short }}
      - name: Update Tag
        run: cat .github/workflows/mass-app-params.json | sed s/IMAGE_TAG/${{ steps.vars.outputs.sha_short }}/ > .github/workflows/mass-app-params-rendered.json
      - name: Configure Package
        run: mass package configure ${{ vars.PACKAGE_SLUG }} -f .github/workflows/mass-app-params-rendered.json
      - name: Deploy
        run: mass app deploy ${{ vars.PACKAGE_SLUG }}
```

You may need to modify the branch name in the `on` section of the workflow to match the branch you're using for your application.

When this GitHub Action runs, it will:
* Build and push your image to your ACR
* Update the tag in your params file
* Redeploy your application in Massdriver
