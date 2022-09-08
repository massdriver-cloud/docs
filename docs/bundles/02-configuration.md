---
id: bundles-configuration
slug: /bundles/configuration
title: Bundle Configuration
sidebar_label: Configuration
---

The `massdriver.yaml` file contains metadata for publishing a Massdriver bundle to the Massdriver package manager as well as configuration for controlling the UI interface.

**`massdriver.yaml` Properties**:

|   |Type|Description|Required|
|---|---|---|---|
|**name**|`string`|The name of the bundle. This will be prefixed with your organization name upon publishing.| &#10003; Yes|
|**schema**|`string`|The JSON Schema used to define the bundle.| &#10003; Yes|
|**description**|`string`|A description of the bundles.| &#10003; Yes|
|**source_url**|`string`|Link to the bundle source code.| &#10003; Yes|
|**access**|`string`|The access level of the bundle. Private will only be available to the organization it is published under.| &#10003; Yes|
|**type**|`string`|The type of bundle: infrastructure (legacy term: bundle) or application.| &#10003; Yes|
|**params**|`object`| draft-07 JSON Schema describing input parameters for the bundle.| &#10003; Yes|
|**connections**|`object`|draft-07 JSON Schema describing input connections for this bundle. Determines which artifacts from other bundles this bundle depends on.| &#10003; Yes|
|**artifacts**|`object`|draft-07 JSON Schema describing cloud resources created by this bundle that are available to be used as input connections to other bundles. See: https://github.com/massdriver-cloud/artifact-definitions| &#10003; Yes|
|**ui**|`object`|RJSF UI Schema for advanced control over the UI. See https://react-jsonschema-form.readthedocs.io/en/docs/api-reference/uiSchema/#uischema| &#10003; Yes|

Additional properties are not allowed.

### Bundle Name

The name of the bundle. This will be prefixed with your organization name upon publishing.

* **Type**: `string`
* **Required**: No
* **Pattern**: `^[a-z][a-z0-9-]+[a-z0-9]$`
* **Minimum Length**`: >= 3`
* **Maximum Length**`: <= 53`

### Bundle Schema

The JSON Schema used to define the bundle.

* **Type**: `string`
* **Required**:  &#10003; Yes
* **Allowed values**:
    * `"draft-07"`

### Bundle Description

A description of the bundle.

* **Type**: `string`
* **Required**:  &#10003; Yes
* **Minimum Length**`: >= 10`
* **Maximum Length**`: <= 1024`

### Bundle Ref

Link to the bundle source code.

Note: `ref` is a legacy term in Massdriver and will likely change in the future.

* **Type**: `string`
* **Required**:  &#10003; Yes
* **Format**: uri

### Bundle Access

The access level of the bundle. Private bundles will only be accessible by the organization it is published under.

* **Type**: `string`
* **Required**:  &#10003; Yes
* **Allowed values**:
    * `"public"`
    * `"private"`

### Bundle Type

The type of bundle: infrastructure (legacy term: bundle) or application.

* **Type**: `string`
* **Required**:  &#10003; Yes
* **Allowed values**:
    * `"bundle"`
    * `"application"`

### Bundle Params

Input parameters for the bundle. These will be converted to input variables for your IaC module.

* **Type**: `any`
* **Required**:  &#10003; Yes

### Bundle Connections

Input connections for this bundle. Determines which artifacts from other bundles this bundle depends on. These will be converted to input variables for your IaC module.

* **Type**: `any`
* **Required**:  &#10003; Yes

### Bundle Artifacts

Cloud resources created by this bundle that are available to be used as input connections to other bundles. See: https://github.com/massdriver-cloud/artifact-definitions

* **Type**: `any`
* **Required**:  &#10003; Yes

### Bundle UI

RJSF UI Schema for advanced control over the UI. See https://react-jsonschema-form.readthedocs.io/en/docs/api-reference/uiSchema/#uischema

* **Type**: `object`
* **Required**:  &#10003; Yes


#### Widgets & Fields

:::note

WIP: https://github.com/massdriver-cloud/massdriver-bundle-preview/wiki/RJSF-Widgets-&-Fields

:::

## Example `massdriver.yaml` Files

* [AWS RDS MySQL](https://github.com/massdriver-cloud/aws-rds-mysql/blob/main/massdriver.yaml)
* [Timescale DB](https://github.com/massdriver-cloud/k8s-timescale-db/blob/main/massdriver.yaml)
* [AWS SQS Pub/Sub Subscription](https://github.com/massdriver-cloud/aws-sqs-pubsub-subscription/blob/main/massdriver.yaml)
