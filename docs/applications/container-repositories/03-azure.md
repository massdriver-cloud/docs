---
id: applications-container-repositories-azure
slug: /applications/container-repositories/azure
title: Azure
sidebar_label: Azure
---

## Docker image push & deploy

### GitHub Action

```yaml title="mass-app-deploy.yaml"
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
        run: mass image push testrepo -a ${{ secrets.AUTHENTICATION_ARTIFACT_ID_AZURE }} -r westus -t ${{ steps.vars.outputs.sha_short }}
      # Deploy
      - name: Update Tag
        run: cat mass-app-params.json | sed s/IMAGE_TAG/${{ steps.vars.outputs.sha_short }}/ > mass-app-params-rendered.json
      - name: Publish
        run: mass app publish local-dev-test-0001
      - name: Configure Package
        run: mass package configure local-dev-test-0001 -f mass-app-params-rendered.json
      # this requires a massdriver.yaml file, we might not want that
      - name: Deploy
        run: mass app deploy local-dev-test-0001
```

### Params file
```json title="mass-app-params.json"
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
  "docker": {
    "image": "bloby",
    "registry": "massdrivercloud",
    "tag": "IMAGE_TAG"
  },
  "monitoring": {
    "mode": "AUTOMATED"
  }
}
```