---
id: bundles-github-action
slug: /bundles/github-action
title: Publishing with GitHub Actions
sidebar_label: Publishing with GitHub Actions
---

Publishing bundles from GitHub Actions when your CI passes is pretty straightforward.

You'll need a [Service Account key](/platform/service-accounts) and to add the following GitHub Actions YAML file:


```yaml title=".github/workflows/publish.yaml"
name: Publish to Massdriver
on:
  push:
    tags:
      - "release-*"

jobs:
  publish_to_massdriver:
    name: Build and publish
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Download massdriver cli
        uses: dsaltares/fetch-gh-release-asset@0.0.8
        with:
          repo: "massdriver-cloud/massdriver-cli"
          file: "^mass-.*-linux-amd64\\.tar\\.gz$"
          regex: true

      - name: Publish
        env:
          MASSDRIVER_API_KEY: ${{ secrets.MASSDRIVER_SERVICE_ACCOUNT_KEY }}
        run: tar -xzf mass-*.tar.gz -C /usr/local/bin && rm -rf mass-*.tar.gz .git* && mass bundle build && mass bundle publish
```
