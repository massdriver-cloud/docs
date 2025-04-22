---
id: provisioners-overview
slug: /provisioners/overview
title: Provisioners Overview
sidebar_label: Overview
---

# Provisioner Specification

A **provisioner** is a Docker image designed to execute infrastructure-as-code (IaC) operations (e.g., `plan`, `provision`, and `decommission`) on a [Massdriver bundle](/concepts/bundles). Provisioners allow you to combine and package multiple tools to create powerful workflows for deploying and managing your bundles. Massdriver currently supports four official provisioners.

* [OpenTofu](/provisioners/opentofu)
* [Terraform](/provisioners/terraform)
* [Helm](/provisioners/helm)
* [Bicep](/provisioners/bicep)

:::note
Massdriver also supports the use of custom, private, provisioners for our customers. Please contact us for more information.
:::

---

## Configuration

The `steps` block in the `massdriver.yaml` file specifies the steps to execute during a bundle deployment, and the provisioner to use for each step.

### Fields

- **`provisioner`**: **REQUIRED** Specifies the provisioner use (e.g., `terraform`, `opentofu`, `helm`, `bicep`).
- **`path`**: **REQUIRED** The relative path to the IaC for this step of the bundle.
- **`skip_on_delete`**: If set to `true`, the step will be skipped during the `decommission` action. This is useful for retaining resources like encryption keys.
- **`config`**: A block that allows custom configuration for the provisioner. Refer to the provisioner documention for a list of accepted values. Each field within the `config` block must be specified as `jq` formatted queries, using `params` and `connections` as inputs.

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
      resource_group: '@text "foo"'
      delete_resource_group: 'true'
```

---

## Environment

Each bundle step will be executed in a isolated container. The bundle directory will be placed at `/massdriver/bundle`.

### Inputs

The following files are generated and placed at the specified path in the provisioner.

| File Path                       | Description                                                                 |
|---------------------------------|-----------------------------------------------------------------------------|
| `/massdriver/params.json`       | Parameters provided for the deployment, specific to the bundle.            |
| `/massdriver/connections.json`  | Connection data representing relationships with other bundles or services. |
| `/massdriver/envs.json`         | Environment variables to inject runtime configuration.                     |
| `/massdriver/secrets.json`      | Secrets required for sensitive configurations or access.                   |

For more information about how a provisioner interacts with these files, refer to the provisioner-specific documentation.

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

## Artifacts

Each provisioner supports the ability to publish artifacts or connection to other bundles. Please refer to the provisioner-specific documentation for more details.