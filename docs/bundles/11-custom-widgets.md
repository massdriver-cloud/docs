---
id: bundles-custom-widgets-and-fields
slug: /bundles/custom-widgets-and-fields
title: Custom Widgets & Fields
sidebar_label: Custom Widgets & Fields
---

Massdriver's `RJSF Form` component is a wrapper enhancing RJSF's Mui `ThemedForm`. This wrapper allows us to provide custom widgets, fields, error messages, and ajv formData sanitization to the basic `ThemedForm` functionality.

## Implementation Pattern

When implementing a `Custom Widget/Field`, you must define both the `schema` and the `uiSchema`. The way custom Widgets/Fields work in RJSF, you must take the `name` of the `property` defined in the `schema`, and use the `uiSchema` to pair that `property` with a custom Widget/Field. Some custom Widgets/Fields also allow/require additional external props to be passed to the Widget/Field through the uiSchema.

### Schema & UiSchema Pairing

Here is an example of using the `schema` and `uiSchema` to display a custom `ContainerRepositoriesDropdown` `field`:


```yaml title="schema"
type: object
title: Filtered Container Repositories & DNS Zones schema
description: A dummy schema to show how to filter the dnsZones and container repositories
  widgets.
properties:
  containerRepositories: # <-- This is where you define the property name
    type: string
    title: Container Repositories
    description: A list of Container Repositories configured with massdriver.
```

```yaml title="uiSchema"
containerRepositories: # <-- Use the name defined in the properties object. If it is a nested property, follow the same path here
  ui:field: "containerRepositoriesDropdown" # <-- Here we define the ui:field and match it to the name given to our custom field
```

:::note

For any custom Widget/Field, setting the `property type` does not matter. Set it to `string`, to have a basic text field render if there is any issue with the `schema/uiSchema`.

:::

#### Nested/Array Schema & uiSchema Pairing

It is also possible to use `Custom Widgets/Fields` in nested `properties`. If a property is nested, just be sure to follow the same `schema` path in the `uiSchema`. For example, if the property in the `schema` is nested under `personalInformation/name/lastName`, then you would follow that same path in the `uiSchema`.

:::note

For `array fields`, you must also specify nesting under the `items` property. An example can be seen below.

:::

Here is an example:

```yaml title="schema"
type: object
title: Nested custom fields/widgets example
description: A dummy schema to show how to render custom fields/widgets in nested
  properties.
properties:
  personalInformation:
    type: object
    title: Enter your personal information
    description: Your personal information that will be associated with your new account.
    properties:
      name:
        type: object
        title: Name
        properties:
          firstName:
            type: string
            title: First Name
          lastName:
            type: string
            title: Last Name
      hobbies:
        type: array
        title: A list of your hobbies
        items:
          type: object
          properties:
            hobby:
              type: string
              title: One of your hobbies

```

```yaml title="uiSchema"
personalInformation: # We have nested down under 'personalInformation/name/lastName' to change this specific property's field.
  name:
    lastName:
      ui:field: slug
  hobbies: # We have nested down under 'personalInformation/hobbies/items/hobby' to change this specific property's field.
    items: # Array fields like this require you to nest under their 'items' property as well.
      hobby:
        ui:field: slug
```

### Custom Error Messages

Massdriver's `RJSF Form` also provides support for custom error messages. You can provide custom error messages via the `schema` by adding a `message` object under a defined property. Inside that `messages` object, you can match any number of constraints defined inside that property (`minLength`, `pattern`, etc.) to a string containing the custom error message. That custom error message will then be used in place of the default RJSF message.

Here is an example of a `schema` with a custom error message for a regex `pattern`:

```yaml
$schema: http://json-schema.org/draft-07/schema
type: object
title: Custom Error Messages Example
description: A Description.
required:
- name
properties:
  name:
    type: string
    title: Name
    description: A user friendly name.
    pattern: "^(?:[a-z0-9]+(?:-[a-z0-9]+)*/)*[a-z0-9]+(?:-[a-z0-9]+)*$" # Here we define the regex pattern constraint
    message: # When an invalid name is submitted, the custom error below will be rendered in place of the default
      pattern: Invalid name. Should only contain lowercase letters, numbers, dashes and forward slashes.
```

# Glossary

:::note

All custom Widgets/Fields have their **Component Name** in `PascalCase` and their **Identifying Name** (the one used in the `uiSchema`) in `camelCase`. Example: `ContainerRepositoriesDropdown` is the component name and `containerRepositoriesDropdown` is the identifying name used in the `uiSchema`.

:::

## Widgets

**There are no custom Widgets available currently.**

## Fields

### Data Conversion Field

The `ConversionFieldData` is a TextField that converts whatever units the user submits to the base units defined in the `uiSchema`. The TextField has a Select Menu adjacent to it where the user can select what units they want to be submitting.  For example, say you have a ConversionFieldData that takes the input as bytes. A user can choose to submit `2 megabytes`, which would automatically be turned into `1000000 bytes` in the `formData`. Pass a specific `unit` (`Bytes`, `KiB`, `KB`, `MiB`, `MB`, `GiB`, or `GB`) externally via the `uiSchema` to control what the user input gets converted into in the `formData`.

:::note

Do not update the `unit` value in the `uiSchema` once this field is exposed to a user. If the user has previously saved data, changing the `unit` value in the `uiSchema` will alter the user's saved data in unpredictable ways.

:::

**Props**

External props passed through the `uiSchema`


| Name         |  Required    |  Type       |    Default  |   Example  | Description |
| ------------ | -----------  | ----------- | ----------- | -----------| ----------- |
| unit         |  True        | string      |   undefined | `Bytes`, `KiB`, `KB`, `MiB`, `MB`, `GiB`, or `GB` **DEPRICATED:** `Kibibytes`, `Kilobytes`, `Mebibytes`, `Megabytes`, `Gibibytes`, or `Gigabytes`  | A string that decides what unit of measurement the user input gets converted into in the `formData`. |


**Example**
```yaml title="schema"
type: object
title: Conversion Field schema
description: Testing Conversion Fields.
required:
- data
properties:
  data:
    type: integer
    title: Data in Bytes Field
    description: A mock field for Data conversion.
```

```yaml title="uiSchema"
data:
  ui:field: conversionFieldData # Necessary to render the custom field
  unit: Bytes # A necessary prop that decides what unit of measurement the user data gets converted into in the formData. In this case, "Bytes"
```


### Time Conversion Field

The `ConversionFieldTime` is a TextField that converts whatever units the user submits to the base units defined in the `uiSchema`. The TextField has a Select Menu adjacent to it where the user can select what units they want to be submitting.  For example, say you have a ConversionFieldTime that takes the input as milliseconds. A user can choose to submit `2 minutes`, which would automatically be turned into `120000 milliseconds` in the `formData`. Pass a specific `unit` (`Milliseconds`, `Seconds`, `Minutes`, `Hours`, or `Days`) externally via the `uiSchema` to control what the user input gets converted into in the `formData`.

:::note

Do not update the `unit` value in the `uiSchema` once this field is exposed to a user. If the user has previously saved data, changing the `unit` value in the `uiSchema` will alter the user's saved data in unpredictable ways.

:::

**Props**

External props passed through the `uiSchema`

| Name         |  Required    |  Type       |    Default  |   Example  | Description |
| ------------ | -----------  | ----------- | ----------- | -----------| ----------- |
| unit         |  True        | string      |   undefined | `Milliseconds`, `Seconds`, `Minutes`, `Hours`, or `Days`  | A string that decides what unit of measurement the user input gets converted into in the `formData`. |

**Example**
```yaml title="schema"
type: object
title: Conversion Field schema
description: Testing Conversion Fields.
required:
- duration
properties:
  duration:
    type: integer
    title: Duration in Milliseconds Field
    description: A mock field for Time conversion.
```

```yaml title="uiSchema"
duration:
  ui:field: conversionFieldTime
  unit: Milliseconds
```

### DNS Zones

The `DnsZonesDropdown` is an asynchronous dropdown field that queries for and populates with an organization's DNS Zones currently connected with Massdriver. Once selected, the DNS Zone's `cloudProviderId` will be added to the `formData`. This dropdown also supports external filtering via a `cloud` type. Pass a specific `cloud` (`aws`, `gcp`, or `azure`) externally via the `uiSchema` to control what the `DnsZonesDropdown` displays.

**Props**

External props passed through the `uiSchema`

| Name         |  Required    |  Type       |    Default  |   Example  | Description |
| ------------ | -----------  | ----------- | ----------- | -----------| ----------- |
| cloud        |  False       | string      |   undefined | `aws`, `gcp`, `azure`  | A string that, if provided, constrain the contents of the field by cloud type. |


**Example**
```yaml title="schema"
type: object
title: Dns Zones schema
description: An example schema that shows the dnsZonesDropdown field implementation.
properties:
  dnsZones:
    type: string
    title: DNS Zones
    description: A list of DNS Zones configured with massdriver.
```

```yaml title="uiSchema"
dnsZones:
  ui:field: dnsZonesDropdown
  cloud: azure
```

### Supported Cloud Locations (Regions)

The `SupportedCloudLocationsDropdown` is an asynchronous dropdown field that queries for and populates with all the supported locations given a specific cloud. Once selected, the plaintext `location` will be added to the `formData`.

Most of the time, you will be fine passing a given cloud provider as the `cloudService` (`aws`, `gcp`, `azure`). Only pass something else if the thing you are implementing has differing locations from the default list of locations supported by that cloud provider. If this is the case, be sure to reach out for support first as the `cloudService` that you are trying to implement may not be supported in the `cloudLocations` query yet.

**Props**
External props passed through the `uiSchema`

| Name         |  Required    |  Type       |    Default  |   Example  | Description |
| ------------ | -----------  | ----------- | ----------- | -----------| ----------- |
| cloudService |  True        | string      |   undefined |`aws`, `gcp`, `azure`, `ECR`, `GAR`, etc.| A string that is used in the query to get all the supported locations for a specific cloud. |


**Example**
```yaml title="schema"
type: object
title: Locations schema
description: An example schema that shows the supportedCloudLocationsDropdown field
  implementation.
properties:
  locations:
    type: string
    title: Locations
    description: A list of supported locations for this cloud service.
```

```yaml title="uiSchema"
locations:
  ui:field: supportedCloudLocationsDropdown
  cloudService: ECR
```

### Artifact Credentials

The `FilteredArtifactCredentialsDropdown` is an asynchronous dropdown field that queries for and populates with all the supported `Credential Artifact Definitions` configured with Massdriver given a `cloudType` (`massdriver/aws-iam-role`, `massdriver/gcp-service-account`, etc.). Once selected, the `id` for the `Credential Artifact Definition` will be added to the `formData`.

**Props**

External props passed through the `uiSchema`

| Name         |  Required    |  Type       |    Default  |   Example  | Description |
| ------------ | -----------  | ----------- | ----------- | -----------| ----------- |
| cloudType    |  True        | string      |   undefined |`massdriver/aws-iam-role`, `massdriver/gcp-service-account`, etc.| A string that is used in the query to get all the `Credential Artifact Definitions` for a specific cloud. |


**Example**

```yaml title="schema"
type: object
title: Credentials schema
description: An example schema that shows the filteredArtifactCredentialsDropdown
  field implementation.
properties:
  artifactId:
    type: string
    title: Credential
    description: A list of the Credential Artifact Definitions for the given cloudType.
    default: ''
```

```yaml title="uiSchema"
artifactId:
  ui:field: filteredArtifactDefinitionsDropdown
  cloudType: massdriver/aws-iam-role
```

### Slug

The `Slug` field is an enhanced `TextField` that displays `startAdornment` (prefix). Once typed, **only the plaintext that the user typed** will be added to the `formData`. The startAdornment is ignored.

**Props**

External props passed through the `uiSchema`

| Name         |  Required    |  Type       |    Default  |   Example  | Description |
| ------------ | -----------  | ----------- | ----------- | -----------| ----------- |
| slugPrefix   |  True        | string      |   undefined |`myproj-dev-`| A string that is used as the `startAdornment` for the `TextField`. |


**Example**
```yaml title="schema"
type: object
title: Slug schema
description: An example schema that shows the slug field implementation.
properties:
  slug:
    type: string
    minLength: 1
    maxLength: 7
    pattern: "^[a-z0-9]+$"
    title: Abbreviation
    description: An abbreviation for the item you are creating.
    message:
      pattern: Abbreviation must be a short string containing only lower case letters
        a-z and numbers 0-9
    examples:
    - ecomm
    - clketl

```

```yaml title="uiSchema"
slug:
  ui:field: slug
  slugPrefix: myproj-dev-
```

### Dropzone

The `Dropzone` field is a file dropzone. Once a file is added, the parsed `binary string` for that file will be added to the `formData`.

**Props**

External props passed through the `uiSchema`

>**None**


**Example**
```yaml title="schema"
type: object
title: Dropzone schema
description: An example schema that shows the dropzone field implementation.
properties:
  dropzone:
    type: string
    title: File Dropzone
    description: A file dropzone.

```

```yaml title="uiSchema"
dropzone:
  ui:field: dropzone
```

### Generic Field

The `GenericField` is a placeholder field that is used for **development purposes**. It can be used in the place of any other custom field and will render a block of information including the `name` of the property and the sections of both the `schema` and the `uiSchema` pertaining to that property. As there is no interactivity with the user, it will not change the `formData`.

**Props**
External props passed through the `uiSchema`

The `GenericField` can be passed any props. As it is used as a placeholder, the best practice is to pass the props that the real field you want to render will display.

For example, if you want to render a `SupportedCloudLocationsDropdown` and are using the `GenericField` as a placeholder, be sure to pass in `cloudService`. You can then see the `uiSchema` thanks to the `GenericWidget` and ensure that the proper data is being passed via the uiSchema.

**Example**
```yaml title="schema"
type: object
title: Mocked SupportedCloudLocationsDropdown using GenericField schema
description: An example schema that shows how to mock the SupportedCloudLocationsDropdown field using the GenericField implementation.
properties:
  locations:
    type: string
    title: Locations
    description: A list of supported locations for this cloud service.
```

```yaml title="uiSchema"
locations:
  ui:field: genericField # This will render the GenericField and let you look into the schema/uiSchema to ensure the correct information is being passed to the field.
  cloudService: ECR # A required prop that is used to decide which cloud's supported locations are being queried for. In this case, "ECR" (essentially AWS Locations)
```
