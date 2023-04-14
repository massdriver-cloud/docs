---
id: bundles-github-action
slug: /bundles/github-action
title: Publishing with GitHub Actions
sidebar_label: Publishing with GitHub Actions
---

This guide will walk you through the process of setting up a GitHub Action to build and publish your bundle to your Massdriver organization.

:::note

Before getting started, you'll need:
- A Massdriver account
- A Massdriver [service account](/platform/service-accounts)

:::

## Set secrets

| Name | Description | Type | Notes |
| --- | --- | --- | --- |
| `MASSDRIVER_ORG_ID` | Your Massdriver organization ID | secret | Copy your [Organization ID](/concepts/organizations#find-your-organization-id) |
| `MASSDRIVER_API_KEY` | Your Massdriver API key | secret | Create a [Service Account](/platform/service-accounts) |

## Workflow file

To set up the GitHub Action, create a new file named `publish.yaml` in the `.github/workflows` directory of your GitHub repository. You can use this workflow below as a starting point:

```yaml title=".github/workflows/publish.yaml"
name: Publish to Massdriver
on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    env:
      MASSDRIVER_ORG_ID: ${{ secrets.MASSDRIVER_ORG_ID }}
      MASSDRIVER_API_KEY: ${{ secrets.MASSDRIVER_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - name: Install Massdriver CLI
        uses: massdriver-cloud/actions@v4
      - name: Publish Bundle 
        uses: massdriver-cloud/actions/bundle_publish@v4
        with:
          build-directory: ./ # path to massdriver config directory, contains massdriver.yaml
```

This example is configured to trigger on pushes to the repository's `main` branch. Be sure to update the trigger to match your branching and git workflow process.

:::note

If your `massdriver.yaml` file is in a subdirectory, you can update the `build-directory` to point to that directory. For example, if your `massdriver.yaml` file is in the `./bundle` directory, you can set the `build-directory` to `./bundle`.

:::

View the Massdriver GitHub Actions on the [GitHub Marketplace](https://github.com/marketplace/actions/massdriver-actions).