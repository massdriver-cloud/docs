---
id: provisioners-bicep
slug: /bundle-development/provisioners/bicep
title: Bicep Provisioner
sidebar_label: Bicep
---

# Bicep Provisioner

[Massdriver](https://www.massdriver.cloud/) provisioner for managing resources with [Bicep](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/). You can view the GitHub repository for this provisioner [here](https://github.com/massdriver-cloud/provisioner-bicep).

## Structure

This provisioner expects the `path` to contain a single bicep file named `template.bicep`. While other files may exists in the directory, this `template.bicep` file will be what is used for provisioning and managing the Azure resources.

## Tooling

The following tools are included in this provisioner:

* [Checkov](https://www.checkov.io/): Included to scan bicep templates for common policy and compliance violations.

## Configuration

The following configuration options are available:

| Configuration Option | Type | Default | Description |
|-|-|-|-|
| `azure_authentication` | object | `.connections.azure_authentication` | Azure authentication fields. Values set here override those resolved from the auth connection on a per-field basis. See [Authentication](#authentication). |
| `azure_authentication.client_id` | string | | Azure client (application) ID. |
| `azure_authentication.client_secret` | string | | Azure client secret. Setting this selects service principal (secret) authentication. |
| `azure_authentication.tenant_id` | string | | Azure tenant ID. |
| `azure_authentication.subscription_id` | string | (identity default) | Subscription to deploy into. If unset, the authenticated identity's default subscription is used. |
| `location` | string | `"eastus"` | Azure region to deploy template resources into. Falls back to `region` if `location` is not set. |
| `scope` | string | `"group"` | Sets the [Azure Resource Manager deployment scope](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/deploy-cli#deployment-scope). Currently supports `group` and `sub`. For more information, refer to the [Deployment Scope](#deployment-scope) section. |
| `show_output` | boolean | `false` | Prints the full deployment stack output on success and failure. Disabled by default as the output may contain secrets. |
| `action_on_unmanage` | string | `"deleteAll"` | Fate of managed resources when removed from the template or on decommission. See [Deployment Stacks](#deployment-stacks). |
| `deny_settings_mode` | string | `"none"` | Protection against changes to managed resources made outside the stack. See [Deployment Stacks](#deployment-stacks). |
| `resource_group` | string | (instance name) | Specifies the resource group name. Defaults to the Massdriver instance name if not specified. Only applies to steps with scope `group`. |
| `create_resource_group` | boolean | `true` | Determines whether the resource group will be created during provisioning. If this is set to `false`, the resource group must already exist in Azure. Only applies to steps with scope `group`. |
| `delete_resource_group` | boolean | `true` | Determines whether the resource group will be deleted during decommissioning. Only applies to steps with scope `group`. |
| `checkov.enable` | boolean |  `true` | Enables Checkov policy evaluation. If `false`, Checkov will not be run. |
| `checkov.quiet` | boolean |  `true` | Only display failed checks if `true` (adds the `--quiet` flag). |
| `checkov.halt_on_failure` | boolean |  `false` | Halt provisioning run and mark deployment as failed on a policy failure (removes the `--soft-fail` flag). |

### Authentication

The simplest way to authenticate is to provide an `azure_authentication` connection. The provisioner reads the credential fields directly from it, expecting the following structure:

```json
{
    "client_id": "00000000-0000-0000-0000-000000000000",
    "client_secret": "<client secret>",
    "tenant_id": "00000000-0000-0000-0000-000000000000",
    "subscription_id": "00000000-0000-0000-0000-000000000000"
}
```

If you don't have a resource type that matches this structure — or you want to override specific values — set them in the `config.azure_authentication` block instead. Config values are applied as an overlay on top of the connection on a per-field basis, so you can supply the entire credential through config, or override just a single field (such as `subscription_id`) while the rest comes from the connection.

:::note
The `.connections.azure_service_principal.data` block is also read as a legacy authentication source for backwards compatibility. This pattern is deprecated and will be removed in a future release — bundles using it should migrate to an `azure_authentication` connection.
:::

Once the credential fields are resolved, the provisioner selects an authentication method automatically. The table below is evaluated **in priority order, top to bottom**: the first method whose condition matches is used. For example, if both `client_secret` and a workload identity token are present, service principal authentication takes precedence.

| Method | Selected when | Required fields |
|-|-|-|
| Service principal (secret) | `client_secret` is set | `client_id`, `client_secret`, `tenant_id` |
| [Workload identity](https://learn.microsoft.com/en-us/azure/aks/workload-identity-overview) | the `AZURE_FEDERATED_TOKEN_FILE` environment variable is present (injected by the AKS workload identity webhook) | `client_id`, `tenant_id` — from config/connection or the webhook's injected env vars |
| Managed identity (user-assigned) | only `client_id` is set | `client_id` |
| Managed identity (system-assigned) | none of the above match | none |

`subscription_id` is independent of the method above: when provided it sets the active subscription, otherwise the authenticated identity's default subscription is used.

### Deployment Scope

[Azure Resource Manager supports 4 deployment scopes](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/deploy-cli#deployment-scope): [resource group](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/deploy-to-resource-group?tabs=azure-cli), [subscription](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/deploy-to-subscription?tabs=azure-cli), [management group](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/deploy-to-management-group?tabs=azure-cli) and [tenant](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/deploy-to-tenant?tabs=azure-cli). The default scope is `group` for Azure resource group. Review the configuration settings to determine the valid and required settings for each scope.

### Deployment Stacks

This provisioner manages resources using [Azure deployment stacks](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/deployment-stacks), which track the resources defined by `template.bicep` as a single managed unit. Two settings control stack behavior: [`action_on_unmanage`](#action_on_unmanage) and [`deny_settings_mode`](#deny_settings_mode).

#### `action_on_unmanage`

What happens to managed resources when they are removed from the template or the stack is deleted. One of `deleteAll` (default), `deleteResources`, or `detachAll`. Review the [Azure documentation](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/deployment-stacks?tabs=azure-powershell#control-detachment-and-deletion) for more information about this setting.

:::tip
Because decommissioning deletes the stack with `action_on_unmanage` applied, `detachAll` leaves the underlying Azure resources in place rather than deleting them. Use the default `deleteAll` if you want decommissioning to fully remove resources.
:::

#### `deny_settings_mode`

Protection applied to managed resources to block changes made outside the stack. One of `none` (default), `denyDelete`, or `denyWriteAndDelete`. Review the [Azure documentation](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/deployment-stacks?tabs=azure-powershell#protect-managed-resources) for more information about this setting.

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

## Resources

After every provision, this provider will scan the template directory for files matching the pattern `resource_<name>.jq` (or the legacy `artifact_<name>.jq` prefix, still supported for backwards compatibility). If a file matching either pattern is present, it will be used as a JQ template to render and publish a Massdriver resource. The inputs to the JQ template will be a JSON object with the params, connections, envs, secrets and [Bicep outputs](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/outputs?tabs=azure-powershell) as top level fields. The `outputs` field is copied directly from the output of the Bicep command. These output fields have the same format mentioned in the above Inputs section, where the value of the output is nested underneath a `value` block. This is something to be aware of when referencing the values in a Bicep output. You'll see this pattern reflected in the examples below.

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

To demonstrate, let's say there is an Azure Storage Account bundle with a single param (`region`), a single connection (`azure_authentication`), and a single resource (`storage_account`). The `massdriver.yaml` would be similar to:


```yaml massdriver.yaml
params:
  required:
    - region
  properties:
    region:
      type: string

connections:
  required:
    - azure_authentication
  properties:
    azure_authentication:
      $ref: azure-service-principal

artifacts:
  required:
    - storage_account
  properties:
    storage_account:
      $ref: azure-storage-account-blob
```

Since the resource is named `storage_account` a file named `artifact_storage_account.jq` would need to be in the template directory and the provisioner would use this file as a JQ template, passing the params, connections and outputs to it. There are two approaches to building the resource structure:
1. Fully render the resource in the Bicep output
2. Build the resource structure using the JQ template

Here are examples of each approach.

#### Fully Render as Bicep Output

If you choose to fully render the resource in a Bicep output, it would be similar to:

```bicep
param region string

resource storageAccount 'Microsoft.Storage/storageAccounts@2021-04-01' = {
  ...
}

output artifact_storage_account object = {
    infrastructure: {
        ari: storageAccount.id
        endpoint: storageAccount.properties.primaryEndpoints.blob
    }
    security: {}
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
        "azure_authentication": {
            "client_id": "00000000-1111-2222-3333-444444444444",
            "client_secret": "s0mes3cr3tv@lue",
            "subscription_id": "00000000-1111-2222-3333-444444444444",
            "tenant_id": "00000000-1111-2222-3333-444444444444"
        }
    },
    "envs": {},
    "secrets": {},
    "outputs": {
        "artifact_storage_account": {
            "infrastructure": {
                "ari": "/subscriptions/00000000-1111-2222-3333-444444444444/resourceGroups/resource-group-name/providers/Microsoft.Storage/storageAccounts/storageaccountname",
                "endpoint": "https://storageaccountname.blob.core.windows.net/"
            },
            "security": {},
            "specs": {
                "azure": {
                    "region": "eastus"
                }
            }
        }
    }
}
```

Thus, the `artifact_storage_account.jq` file would simply be:

```jq artifact_storage_account.jq
.outputs.artifact_storage_account
```

#### Build Resource in JQ Template

Alternatively, you can build the resource structure using the JQ template. This approach is best if you are attempting to minimize changes to your Bicep template. With this approach, you would need to output the storage account ID and endpoint.

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
        "azure_authentication": {
            "client_id": "00000000-1111-2222-3333-444444444444",
            "client_secret": "s0mes3cr3tv@lue",
            "subscription_id": "00000000-1111-2222-3333-444444444444",
            "tenant_id": "00000000-1111-2222-3333-444444444444"
        }
    },
    "envs": {},
    "secrets": {},
    "outputs": {
        "storageAccountEndpoint": "https://storageaccountname.blob.core.windows.net/",
        "storageAccountId": "/subscriptions/00000000-1111-2222-3333-444444444444/resourceGroups/resource-group-name/providers/Microsoft.Storage/storageAccounts/storageaccountname"
    }
}
```

Now the resource structure must be built through the `artifact_storage_account.jq` template:

```jq artifact_storage_account.jq
{
    "infrastructure": {
        "ari": .outputs.storageAccountId,
        "endpoint": .outputs.storageAccountEndpoint
    },
    "security": {},
    "specs": {
        "azure": {
            "region": .params.region
        }
    }
}
```