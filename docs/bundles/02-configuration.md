---
id: bundles-configuration
slug: /bundles/configuration
title: Bundle Configuration
sidebar_label: Overview
---

The `massdriver.yaml` file contains metadata for publishing a Massdriver bundle to the Massdriver package manager as well as configuration for controlling the UI interface.

**`massdriver.yaml` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**name**|`string`|The name of the bundle. This will be prefixed with your organization name upon publishing.| &#10003; Yes|
|**schema**|`string`|The JSON Schema used to define the bundle.| &#10003; Yes|
|**description**|`string`|A description of the bundles.| &#10003; Yes|
|**ref**|`string`|Link to the bundle source code.| &#10003; Yes|
|**access**|`string`|The access level of the bundle. Private will only be available to the organization it is published under.| &#10003; Yes|
|**type**|`string`|The type of bundle: infrastructure (legacy term: bundle) or application.| &#10003; Yes|
|**params**|`object`| draft-07 JSON Schema describing input parameters for the bundle.| &#10003; Yes|
|**connections**|`object`|draft-07 JSON Schema describing input connections for this bundle. Determines which artifacts from other bundles this bundle depends on.| &#10003; Yes|
|**artifacts**|`object`|draft-07 JSON Schema describing cloud resources created by this bundle that are available to be used as input connections to other bundles. See: https://github.com/massdriver-cloud/artifact-definitions| &#10003; Yes|
|**ui**|`object`|RJSF UI Schema for advanced control over the UI. See https://react-jsonschema-form.readthedocs.io/en/docs/api-reference/uiSchema/#uischema| &#10003; Yes|

Additional properties are not allowed.

### massdriver.yaml.name

The name of the bundle. This will be prefixed with your organization name upon publishing.

* **Type**: `string`
* **Required**: No
* **Pattern**: `^[a-z][a-z0-9-]+[a-z0-9]$`
* **Minimum Length**`: >= 3`
* **Maximum Length**`: <= 53`

### massdriver.yaml.schema

The JSON Schema used to define the bundle.

* **Type**: `string`
* **Required**:  &#10003; Yes
* **Allowed values**:
    * `"draft-07"`

### massdriver.yaml.description

A description of the bundles.

* **Type**: `string`
* **Required**:  &#10003; Yes
* **Minimum Length**`: >= 10`
* **Maximum Length**`: <= 1024`

### massdriver.yaml.ref

Link to the bundle source code.

* **Type**: `string`
* **Required**:  &#10003; Yes
* **Format**: uri

### massdriver.yaml.access

The access level of the bundle. Private will only be available to the organization it is published under.

* **Type**: `string`
* **Required**:  &#10003; Yes
* **Allowed values**:
    * `"public"`
    * `"private"`

### massdriver.yaml.type

The type of bundle: infrastructure (legacy term: bundle) or application.

* **Type**: `string`
* **Required**:  &#10003; Yes
* **Allowed values**:
    * `"bundle"`
    * `"application"`

### massdriver.yaml.params

Input parameters for the bundle.

* **Type**: `any`
* **Required**:  &#10003; Yes

### massdriver.yaml.connections

Input connections for this bundle. Determines which artifacts from other bundles this bundle depends on.

* **Type**: `any`
* **Required**:  &#10003; Yes

### massdriver.yaml.artifacts

Cloud resources created by this bundle that are available to be used as input connections to other bundles. See: https://github.com/massdriver-cloud/artifact-definitions

* **Type**: `any`
* **Required**:  &#10003; Yes

### massdriver.yaml.ui

RJSF UI Schema for advanced control over the UI. See https://react-jsonschema-form.readthedocs.io/en/docs/api-reference/uiSchema/#uischema

* **Type**: `object`
* **Required**:  &#10003; Yes
