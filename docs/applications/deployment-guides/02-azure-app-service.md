---
id: applications-deployment-guides
slug: /applications/deployment-guides/azure-app-service
title: Deploying To Azure App Service
sidebar_label: Azure App Service
---
Guide to using Azure App Service template.

1. Get the latest version of [Massdriver CLI](https://docs.massdriver.cloud/bundles/walk-through#download-the-massdriver-cli)
1. Set your `MASSDRIVER_API_KEY`  [here](https://docs.massdriver.cloud/bundles/walk-through#generate-massdriver-api-token)
1. Run `mass app template refresh` to refresh the list of application templates
1. Run `mass app new` to start building a new app
    1. Name your app
    1. Set a description
    1. Select the `azure-app-service` template
    1. Select all of the dependencies you&#39;ll need with your app (the template comes with `azure-service-principal` and `azure-virtual-network` connections by default)
    1. Name your dependencies
    1. Set output directory
1. Inside your new app directory is the `massdriver.yaml` file. Open it with your favorite code editor
    1. Modify `L4` for your org
    1. Add any environment variables you may need within the `env` block on `L9`
1. Add your application files/assets to the app directory
1. Once you&#39;ve finished making the changes needed, run `mass app publish` in the CLI to publish your application to your organization within the Massdriver dashboard
