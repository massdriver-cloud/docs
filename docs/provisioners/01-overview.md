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







# Provisioner Specification

A **provisioner** is a Docker image designed to execute infrastructure-as-code (IaC) operations (e.g., `plan`, `provision`, and `decommission`) on a [Massdriver bundle](https://docs.massdriver.cloud/concepts/bundles). Provisioners allow you to combine and package multiple tools to create powerful workflows for deploying and managing your bundles. Massdriver currently supports four official provisioners.

* OpenTofu
* Terraform
* Helm
* Bicep

:::note
Massdriver also supports the use of custom, private, provisioners for our customers. Please contact us for more information.

---

## Environment

### Bundle Structure

Upon execution, the Massdriver bundle is unzipped and placed in the container at:

`/massdriver/bundle`

- Permissions: `0700`

### Inputs

The provisioner relies on the following input files, which are dynamically fetched and placed in the container by the Lifecycle Controller (LC):

| File Path                       | Description                                                                 |
|---------------------------------|-----------------------------------------------------------------------------|
| `/massdriver/params.json`       | Parameters provided for the deployment, specific to the bundle.            |
| `/massdriver/connections.json`  | Connection data representing relationships with other bundles or services. |
| `/massdriver/envs.json`         | Environment variables to inject runtime configuration.                     |
| `/massdriver/secrets.json`      | Secrets required for sensitive configurations or access.                   |

### Environment Variables

The following environment variables are injected into the container and provide context about the bundle, deployment, and execution environment:

| Variable                          | Description                                                                    |
|-----------------------------------|--------------------------------------------------------------------------------|
| `MASSDRIVER_BUNDLE_ID`            | Globally unique identifier for the bundle being deployed.                      |
| `MASSDRIVER_BUNDLE_TYPE`          | The type of the bundle (`application` or `infrastructure`).                    |
| `MASSDRIVER_DEPLOYMENT_ACTION`    | Action being executed: `plan`, `provision`, or `decommission`.                 |
| `MASSDRIVER_DEPLOYMENT_ID`        | Unique identifier for the deployment operation.                                |
| `MASSDRIVER_MANIFEST_ID`          | Identifier for the specific manifest file in the bundle.                       |
| `MASSDRIVER_ORGANIZATION_ID`      | Identifier for the organization executing the deployment.                      |
| `MASSDRIVER_PACKAGE_ID`           | Unique identifier for the package associated with this deployment.             |
| `MASSDRIVER_PACKAGE_NAME`         | The human-readable name of the package (`proj-env-manifest-0000`)              |
| `MASSDRIVER_STEP_PATH`            | Path of the current step in the bundle deployment process.                     |
| `MASSDRIVER_TARGET_MODE`          | Target mode for the deployment (`standard` or `preview`).                      |
| `MASSDRIVER_TOKEN`                | Authentication token for accessing Massdriver APIs or services.                |
| `MASSDRIVER_URL`                  | Base URL for interacting with Massdriver services.                             |

---

## Provisioner Configuration

Each step of a bundle requires a provisioner configuration. This configuration specifies the IaC tool to be used and the corresponding settings for the step.

### Fields

- **`provisioner`**: Specifies the IaC tool to use (e.g., `terraform`, `opentofu`, `helm`, `bicep`).
- **`path`**: The relative path to the IaC code for this step of the bundle.
- **`skip_on_delete`**: If set to `true`, the step will be skipped during the `decommission` action. This is useful for retaining resources like encryption keys.
- **`config`**: A block that allows custom configuration for the provisioner. Fields within the `config` block must be specified as `jq` formatted queries, using `params` and `connections` as inputs.

### Example

```yaml
steps:

  - path: src
    provisioner: opentofu

  - path: chart
    provisioner: helm
    skip_on_delete: true
    config:
      namespace: .params.namespace
      release_name: .params.provisioner.release_name

  - path: another
    provisioner: bicep
    skip_on_delete: true
    config:
      region: .connections.foo.specs.region
      resource_group: @text 'foo'
      delete_resource_group: true
