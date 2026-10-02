---
id: provisioners-overview
slug: /bundle-development/provisioners/overview
title: Provisioners Overview
sidebar_label: Overview
---

# Provisioner Specification

A **provisioner** is a Docker image designed to execute infrastructure-as-code (IaC) operations (e.g., `plan`, `provision`, and `decommission`) on a [Massdriver bundle](/concepts/bundles). Provisioners allow you to combine and package multiple tools to create powerful workflows for deploying and managing your bundles. Massdriver currently supports four official provisioners.

* [OpenTofu](/bundle-development/provisioners/opentofu)
* [Terraform](/bundle-development/provisioners/terraform)
* [Helm](/bundle-development/provisioners/helm)
* [Bicep](/bundle-development/provisioners/bicep)

:::note
Massdriver also supports the use of custom, private, provisioners in self-hosted installations. See our [documentation](/platform-operations/self-hosted/custom-provisioners) for more information.
:::

---

## Configuration

The `steps` block in the `massdriver.yaml` file specifies the steps to execute during a bundle deployment, and the provisioner to use for each step.

### Fields

- **`provisioner`**: **REQUIRED** Specifies the provisioner use (e.g., `terraform`, `opentofu`, `helm`, `bicep`).
- **`path`**: **REQUIRED** The relative path to the IaC for this step of the bundle.
- **`skip_on_delete`**: If set to `true`, the step will be skipped during the `decommission` action. This is useful for retaining resources like encryption keys.
- **`config`**: A block that allows custom configuration for the provisioner. Refer to the provisioner documention for a list of accepted values. Each field within the `config` block must be specified as `jq` formatted queries, run against the deployment context described in [The jq context](#the-jq-context).

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
      region: .dependencies.foo.specs.region
      resource_group: '@text "foo"'
      delete_resource_group: 'true'
```

### The jq context

Every `jq` expression in a `config` block, and in the `params.jq`, `connections.jq`, `envs.jq`, and `secrets.jq` templates, runs against the same object:

| Key | Holds |
|-----|-------|
| `.params` | The instance's parameters, plus `md_metadata` |
| `.dependencies` | The resources filling the bundle's dependency slots, keyed by slot name |
| `.resources` | The resources the bundle produces, keyed by slot name |
| `.id` | The instance identifier |

`.connections` and `.artifacts` are deprecated aliases for `.dependencies` and `.resources`. They hold the same data and still work, so existing bundles keep running, but new expressions should use the current names.

```yaml
config:
  # Preferred
  region: .dependencies.azure_credentials.specs.region

  # Deprecated alias, same value
  region: .connections.azure_credentials.specs.region
```

---

## Environment

Each bundle step will be executed in a isolated container. The bundle directory will be placed at `/massdriver/bundle`.

### Inputs

The following files are generated and placed at the specified path in the provisioner.

| File Path                       | Description                                     |
|---------------------------------|-------------------------------------------------|
| `/massdriver/params.json`        | Parameters from instance configuration          |
| `/massdriver/dependencies.json`  | The resources filling the bundle's dependencies |
| `/massdriver/connections.json`   | Deprecated. The same document as `dependencies.json` |
| `/massdriver/envs.json`          | Environment variables                           |
| `/massdriver/secrets.json`       | Secrets (in decrypted form)                     |
| `/massdriver/config.json`        | Provisioner configuration (from `config` block) |

`dependencies.json` and `connections.json` hold the same document. Both are written on every step, so a custom provisioner image can move to the new name whenever it is ready.

For more information about how a provisioner interacts with these files, refer to the provisioner-specific documentation.

### Environment Variables

The following environment variables are injected into the container and provide context about the bundle, deployment, and execution environment:

| Variable                          | Description                                                                    |
|-----------------------------------|--------------------------------------------------------------------------------|
| `MASSDRIVER_BUNDLE_ID`            | (Deprecated) Globally unique identifier for the bundle being deployed.                      |
| `MASSDRIVER_BUNDLE_NAME`          | The name of the bundle being deployed.                                         |
| `MASSDRIVER_BUNDLE_TYPE`          | (Deprecated) The type of the bundle (`application` or `infrastructure`).       |
| `MASSDRIVER_BUNDLE_VERSION`       | The version of the bundle being deployed.                                      |
| `MASSDRIVER_DEPLOYMENT_ACTION`    | Action being executed: `plan`, `provision`, or `decommission`.                 |
| `MASSDRIVER_DEPLOYMENT_ID`        | Unique identifier for the deployment operation.                                |
| `MASSDRIVER_INSTANCE_ID`          | Unique identifier for the instance being deployed (`api-prod-db`)                                |
| `MASSDRIVER_MANIFEST_ID`          | (Deprecated) Identifier for the component (legacy variable name; component was previously called manifest). |
| `MASSDRIVER_ORGANIZATION_ID`      | Identifier for the organization executing the deployment.                      |
| `MASSDRIVER_PACKAGE_ID`           | (Deprecated) Unique identifier for the instance associated with this deployment (legacy variable name). |
| `MASSDRIVER_PACKAGE_NAME`         | (Deprecated) The human-readable name of the instance, e.g. `ecomm-prod-api-0000` (legacy variable name). |
| `MASSDRIVER_STEP_PATH`            | Path of the current step in the bundle deployment process.                     |
| `MASSDRIVER_TARGET_MODE`          | (Deprecated) Deployment mode (`standard` or `preview`); legacy variable name preserved for backwards compatibility. |
| `MASSDRIVER_TOKEN`                | Authentication token for accessing Massdriver APIs or services.                |
| `MASSDRIVER_URL`                  | Base URL for interacting with Massdriver services.                             |

---

## Artifacts

Each provisioner supports the ability to publish artifacts or connection to other bundles. Please refer to the provisioner-specific documentation for more details.