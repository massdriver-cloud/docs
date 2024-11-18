---
id: provisioners-overview
slug: /provisioners/overview
title: Provisioners Overview
sidebar_label: Overview
---

Provisioners are a packaged set of tools designed to provision, plan and decommision resources from a bundle. Each provisioner is built on top of a common Infrastructure-as-Code tool, such as Terraform, OpenTofu, Helm and Bicep.

Each step in a bundle will use a provisioner to manage the resources defined in the bundle step. For more information, refer to the `steps` block of bundle configuration.

# Specification

### Environment Variables

The following environment variables are set while the provisioner is executing.

| Name | Description |
|-|-|
| `MASSDRIVER_BUNDLE_ID` | Globally unique ID of the bundle |
| `MASSDRIVER_BUNDLE_TYPE` | Bundle type (`application` or `infrastructure`) |
| `MASSDRIVER_DEPLOYMENT_ACTION` | Provisioner action (`provision`, `plan` or `decomission`) |
| `MASSDRIVER_DEPLOYMENT_ID` | Globally unique ID of the deployment |
| `MASSDRIVER_MANIFEST_ID` | Globally unique ID of the manifest |
| `MASSDRIVER_ORGANIZATION_ID` | Globally unique ID of the organization |
| `MASSDRIVER_PACKAGE_ID` | Globally unique ID of the package |
| `MASSDRIVER_PACKAGE_NAME` | Full package name, with project, environment, manifest and random suffix |
| `MASSDRIVER_STEP_PATH` | Bundle path being deployed |
| `MASSDRIVER_TARGET_MODE` | Deployment target mode (`standard` or `preview`) |
| `MASSDRIVER_TOKEN` | Secure token for authenticating to the Massdriver API |
| `MASSDRIVER_URL` | Massdriver URL |
