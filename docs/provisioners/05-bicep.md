---
id: provisioners-bicep
slug: /provisioners/bicep
title: Bicep Provisioner
sidebar_label: Bicep
---

# Bicep Provisioner

[Massdriver](https://www.massdriver.cloud/) provisioner for managing resources with [Bicep](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/).

## Structure

This provisioner expects the `path` to contain a single bicep file named `template.bicep`. While other files may exists in the directory, this `template.bicep` file will be what is used for provisioning and managing the Azure resources.

## Tooling

The following tools are included in this provisioner:

* [Checkov](https://www.checkov.io/): Included to scan bicep templates for common policy and compliance violations.

## Configuration

The following configuration options are available:

| Configuration Option | Type | Default | Description |
|-|-|-|-|
| `azure_service_principal` | object | `.connections.azure_service_principal` | `jq` path to a `massdriver/azure-service-principal` connection for authentication to Azure |
| `region` | string | `"eastus"` | Azure region to deploy template resources into. Defaults to `"eastus"`. |
| `resource_group` | string | (package name) | Specifies the resource group name. Defaults to the Massdriver package name if not specified. |
| `complete` | boolean | `true` | Sets the [Azure Resource Manager deployment mode](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/deployment-modes) to "Complete" (sets the `--mode Complete` flag). If this is set to `false`, deployment mode will be "Incremental". Only applies to steps with scope `group`. For more information, refer to the [Deployment Mode](#deployment-mode) section |
| `create_resource_group` | boolean | `true` | Determines whether the resource group will be created during provisioning. If this is set to `false`, the resource group must already exist in Azure. |
| `delete_resource_group` | boolean | `true` | Determines whether the resource group will be deleted during decommissioning. |
| `checkov.enable` | boolean |  `true` | Enables Checkov policy evaluation. If `false`, Checkov will not be run. |
| `checkov.quiet` | boolean |  `true` | Only display failed checks if `true` (adds the `--quiet` flag). |
| `checkov.halt_on_failure` | boolean |  `false` | Halt provisioning run and mark deployment as failed on a policy failure (removes the `--soft-fail` flag). |

### Deployment Mode

[Azure Resource Manager supports 2 deployment modes](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/deployment-modes) for the resource group deployment scope: Incremental and Complete. It is important to understand the benefits and drawbacks to each approach and how they impact bundle design and deployment.

#### Complete

In [Complete](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/deployment-modes#complete-mode) mode, Resource Manager deletes resources that exist in the resource group but aren't specified in the bicep template. This feature imparts full resource lifecycle management (including cleanup) into the bicep template. However, if two bicep templates are deployed to the same resource group then "Complete" mode will cause each deployment to delete the other template's resources since the other template's resource declarations don't exist in the current template. For this reason, Massdriver **strongly** recommends designing bundles to each have their own resource group and use deployment mode "Complete". This approach prevents accidental deletions across bundles, while retaining full lifecycle management.

#### Incremental

In [Incremental](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/deployment-modes#incremental-mode) mode, Resource manager will only ever create resources, never deleting them. This allows a bicep template to share a resource group without deleting resources from other templates. However, this also means that the lifecycle of resources isn't fully managed by the bicep template: only creations are managed, not deletions. This requires the user to manually clean up resources that are no longer needed (or specified in the template). It also means the "decommission" action in Massdriver effectively performs no action in Azure besides deleting the deployment group entry, leaving all resources to be cleaned up by the user.

## Inputs

Bicep [accepts parameters in JSON format](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/parameter-files?tabs=JSON). However, Bicep expects the parameters to have a specific structure, where top level keys are unchanged, but the values are nested under a `value` key. For example, the following JSON object:

```json
{
    "foo": "bar",
    "baz": {
        "nested": "field"
    }
}
```

Needs to be changed to:

```json
{
    "foo": {
        "value": "bar"
    },
    "baz": {
        "value": {
            "nested": "field"
        }
    }
}
```

This restructuring is performed automatically by the provisioner on params and connections before passing them to Bicep.

In order to view the structure of the params and connections fields you can run `mass bundle build` with the Massdriver CLI, and it will append Bicep parameter definitions to the end of the `template.bicep` file with full type expressions. If modifications to fields are required, use Bicep [`variables`](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/variables) to manipulate the values as needed.

## Artifacts

After every provision, this provider will scan the template directory for files matching the pattern `artifact_<name>.jq`. If a file matching this pattern is present, it will be used as a JQ template to render and publish a Massdriver artifact. The inputs to the JQ template will be a JSON object with the params, connections, envs, secrets and [Bicep outputs](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/outputs?tabs=azure-powershell) as top level fields. The `outputs` field is copied directly from the output of the Bicep command. These output fields have the same format mentioned in the above Inputs section, where the value of the output is nested underneath a `value` block. This is something to be aware of when referencing the values in a Bicep output. You'll see this pattern reflected in the examples below.

```json
{
    "params": {
        ...
    },
    "connections": {
        ...
    },
    "envs": {
        ...
    },
    "secrets": {
        ...
    },
    "outputs": {
        ...
    }
}
```

To demonstrate, let's say there is a Azure Storage Account bundle with a single param (`region`), a single connection (`azure_service_principal`), and a single artifact (`storage_account`). The `massdriver.yaml` would be similar to:


```yaml massdriver.yaml
params:
  required:
    - region
  properties:
    region:
      type: string

connections:
  required:
    - azure_service_principal
  properties:
    azure_service_principal:
      $ref: massdriver/azure-service-principal

artifacts:
  required:
    - storage_account
  properties:
    storage_account:
      $ref: massdriver/azure-storage-account-blob
```

Since the artifact is named `storage_account` a file named `artifact_storage_account.jq` would need to be in the template directory and the provisioner would use this file as a JQ template, passing the params, connections and outputs to it. There are two approaches to building the proper artifact structure:
1. Fully render the artifact in the Bicep output
2. Build the artifact structure using the JQ template

Here are examples of each approach.

#### Fully Render as Bicep Output

If you choose to fully render the artifact in a Bicep output, it would be similar to:

```bicep
param region string

resource storageAccount 'Microsoft.Storage/storageAccounts@2021-04-01' = {
  ...
}

output artifact_storage_account object = {
    data:  {
        infrastructure: {
            ari: storageAccount.id
            endpoint: storageAccount.properties.primaryEndpoints.blob
        }
        security: {}
    }
    specs: {
        azure: {
            region: region
        }
    }
}
```

In this case, the input to the `artifact_storage_account.jq` template file would be:

```json
{
    "params": {
        "region": "eastus"
    },
    "connections": {
        "azure_service_principal": {
            "data": {
                "client_id": "00000000-1111-2222-3333-444444444444",
                "client_secret": "s0mes3cr3tv@lue",
                "subscription_id": "00000000-1111-2222-3333-444444444444",
                "tenant_id": "00000000-1111-2222-3333-444444444444"
            }
        }
    },
    "envs": {},
    "secrets": {},
    "outputs": {
        "artifact_storage_account": {
            "value": {
                "data": {
                    "infrastructure": {
                        "ari": "/subscriptions/00000000-1111-2222-3333-444444444444/resourceGroups/resource-group-name/providers/Microsoft.Storage/storageAccounts/storageaccountname",
                        "endpoint": "https://storageaccountname.blob.core.windows.net/"
                    },
                    "security": {}
                },
                "specs": {
                    "azure": {
                        "region": "eastus"
                    }
                }
            }
        }
    }
}
```

Thus, the `artifact_storage_account.jq` file would simply be:

```jq artifact_storage_account.jq
.outputs.artifact_storage_account.value
```

#### Build Artifact in JQ Template

Alternatively, you can build the artifact structure using the JQ template. This approach is best if you are attempting to minimize changes to your Bicep template. With this approach, you would need to output the storage account ID and endpoint.

```bicep
resource storageAccount 'Microsoft.Storage/storageAccounts@2021-04-01' = {
  ...
}

output storageAccountId string = storageAccount.id
output storageAccountEndpoint string = storageAccount.properties.primaryEndpoints.blob
```

In this case, the input to the `artifact_storage_account.jq` template file would be:

```json
{
    "params": {
        "region": "eastus"
    },
    "connections": {
        "azure_service_principal": {
            "data": {
                "client_id": "00000000-1111-2222-3333-444444444444",
                "client_secret": "s0mes3cr3tv@lue",
                "subscription_id": "00000000-1111-2222-3333-444444444444",
                "tenant_id": "00000000-1111-2222-3333-444444444444"
            }
        }
    },
    "envs": {},
    "secrets": {},
    "outputs": {
        "storageAccountEndpoint": {
            "type": "String",
            "value": "https://storageaccountname.blob.core.windows.net/"
        },
        "storageAccountId": {
            "type": "String",
            "value": "/subscriptions/00000000-1111-2222-3333-444444444444/resourceGroups/resource-group-name/providers/Microsoft.Storage/storageAccounts/storageaccountname"
        }
    }
}
```

Now the artifact structure must be built through the `artifact_storage_account.jq` template:

```jq artifact_storage_account.jq
{
    "data":  {
        "infrastructure": {
            "ari": .outputs.storageAccountId.value,
            "endpoint": .outputs.storageAccountEndpoint.value
        },
        "security": {}
    },
    "specs": {
        "azure": {
            "region": .params.region
        }
    }
}
```