---
id: fork-the-bundle
slug: /extend-the-platform/fork-the-bundle
title: How to fork a Massdriver bundle
sidebar_label: Fork the bundle!
---

<iframe width="560" height="315" src="https://www.youtube.com/embed/mjTZlOPdKhQ?si=F7tnQDqGaPVMF2pp" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

Forking a Massdriver bundle is useful to test contributions to official Massdriver bundles or to make changes to a bundle and publish as a private bundle in your Massdriver organization. This guide will walk you through the process of forking a Massdriver bundle and publishing it to your Massdriver organization.

## Forking a Massdriver bundle

1. To fork the bundle, click the `Fork` button in the top right corner of the bundle's GitHub repo
2. Select the organization you want to fork the bundle to, and select a name for the forked bundle's repo
3. To make changes to the bundle, clone the forked repo to your local machine and make the changes you want to make

## Contributing to a Massdriver bundle

1. Open a tracking issue to describe the change or fix you plan to implement
2. Make the changes to the bundle and push them to your forked repo
3. Click the `Contribute` button on your forked bundle's GitHub repo to open a PR to the Massdriver bundle repo
4. FIll in the pull request template and create the PR

## Publishing a forked bundle to your Massdriver organization

:::note

This step requires the use of the Massdriver CLI. If you haven't already, [install the Massdriver CLI](/cli/overview).

Local environment variables to export:
* Create a [Service Account](/platform/service-accounts) and export the `MASSDRIVER_API_KEY` environment variable to the value of your Service Account key.
* Copy your [Organization ID](/concepts/organizations) and export the `MASSDRIVER_ORG_ID` environment variable to the value of your Organization UUID.

:::

1. Make the changes to the bundle and push them to your forked repo
2. Using the Massdriver CLI, build the bundle and publish it to your Massdriver organization

```bash
mass bundle publish
```

3. Drag your bundle into the Massdriver UI to deploy it

Need continuous deployment? Check out the [GitHub Action](/ci-cd/github-action) to publish your bundle to your Massdriver organization.