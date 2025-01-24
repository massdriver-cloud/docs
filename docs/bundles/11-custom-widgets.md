---
id: bundles-custom-widgets-and-fields
slug: /bundles/custom-widgets-and-fields
title: Custom Widgets & Fields
sidebar_label: Custom Widgets & Fields
---

Massdriver's `RJSF Form` component is a wrapper enhancing RJSF's MUI `ThemedForm`. This wrapper allows us to provide custom widgets, fields, error messages, and AJV formData sanitization to the basic `ThemedForm` functionality.

## Implementation Pattern

When implementing a `Custom Widget/Field`, you must define both the `schema` and the `uiSchema`. The way custom Widgets/Fields work in RJSF, you must take the `name` of the `property` defined in the `schema`, and use the `uiSchema` to pair that `property` with a custom Widget/Field. Some custom Widgets/Fields also allow/require additional external props to be passed to the Widget/Field through the uiSchema.

### Schema & UiSchema Pairing

Here is an example, using the `schema` and `uiSchema` to display a custom `DnsZonesDropdown` `field`:

```yaml title="schema"
type: object
title: DNS Zones schema
description: A dummy schema to show how to use custom fields.
properties:
  dnsZones: # <-- This is where you define the property name
    type: string
    title: DNS Zones
    description: A list of DNS Zones configured with Massdriver.
```

```yaml title="uiSchema"
dnsZones: # <-- Use the name defined in the properties object. If it is a nested property, follow the same path here
  ui:field: 'dnsZonesDropdown' # <-- Here we define the ui:field and match it to the name given to our custom field
```

:::note

For any custom Widget/Field, setting the `property type` does not matter. Set it to `string` to have a basic text field render if there is any issue with the `schema/uiSchema`.

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
description:
  A dummy schema to show how to render custom fields/widgets in nested
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
    description: A user-friendly name.
    pattern: '^(?:[a-z0-9]+(?:-[a-z0-9]+)*/)*[a-z0-9]+(?:-[a-z0-9]+)*$' # Here we define the regex pattern constraint
    message: # When an invalid name is submitted, the custom error below will be rendered in place of the default
      pattern: Invalid name. Should only contain lowercase letters, numbers, dashes and forward slashes.
```

# Glossary

:::note

All custom Widgets/Fields have their **Component Name** in `PascalCase` and their **Identifying Name** (the one used in the `uiSchema`) in `camelCase`. Example: `DnsZonesDropdown` is the component name and `dnsZonesDropdown` is the identifying name used in the `uiSchema`.

:::

## Widgets

**There are currently no custom Widgets available.**

## Fields

### Data Conversion Field

The `ConversionFieldData` is a TextField that converts whatever units the user submits to the base units defined in the `uiSchema`. The TextField has a Select Menu adjacent to it where the user can select what units they want to be submitting. For example, say you have a ConversionFieldData that takes the input as bytes. A user can choose to submit `2 megabytes`, which would automatically be turned into `1000000 bytes` in the `formData`. Pass a specific `unit` (`Bytes`, `KiB`, `KB`, `MiB`, `MB`, `GiB`, or `GB`) externally via the `uiSchema` to control what the user input gets converted into in the `formData`.

:::note

Do not update the `unit` value in the `uiSchema` once this field is exposed to a user. If the user has previously saved data, changing the `unit` value in the `uiSchema` will alter the user's saved data in unpredictable ways.

:::

**Props**

External props passed through the `uiSchema`

| Name | Required | Type   | Default   | Example                                                                                                                                           | Description                                                                                          |
| ---- | -------- | ------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| unit | True     | string | undefined | `Bytes`, `KiB`, `KB`, `MiB`, `MB`, `GiB`, or `GB` **DEPRECATED:** `Kibibytes`, `Kilobytes`, `Mebibytes`, `Megabytes`, `Gibibytes`, or `Gigabytes` | A string that decides what unit of measurement the user input gets converted into in the `formData`. |

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
  unit: Bytes # A necessary prop that decides what unit of measurement the user data gets converted into in the formData (in this case, "Bytes")
```

### Time Conversion Field

The `ConversionFieldTime` is a TextField that converts user-submitted units into the base units defined in the `uiSchema`. The TextField has a Select Menu adjacent to it where the user can select what units they want to be submitting. For example, say you have a ConversionFieldTime that takes the input as milliseconds: A user can choose to submit `2 minutes`, which would automatically be turned into `120000 milliseconds` in the `formData`. Pass a specific `unit` (`Milliseconds`, `Seconds`, `Minutes`, `Hours`, or `Days`) externally via the `uiSchema` to control what the user input gets converted into in the `formData`.

:::note

Do not update the `unit` value in the `uiSchema` once this field is exposed to a user. If the user has previously saved data, changing the `unit` value in the `uiSchema` will alter the user's saved data in unpredictable ways.

:::

**Props**

External props passed through the `uiSchema`

| Name | Required | Type   | Default   | Example                                                  | Description                                                                                          |
| ---- | -------- | ------ | --------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| unit | True     | string | undefined | `Milliseconds`, `Seconds`, `Minutes`, `Hours`, or `Days` | A string that decides what unit of measurement the user input gets converted into in the `formData`. |

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

| Name  | Required | Type   | Default   | Example               | Description                                                                     |
| ----- | -------- | ------ | --------- | --------------------- | ------------------------------------------------------------------------------- |
| cloud | False    | string | undefined | `aws`, `gcp`, `azure` | A string that, if provided, constrains the contents of the field by cloud type. |

**Example**

```yaml title="schema"
type: object
title: Dns Zones schema
description: An example schema that shows the dnsZonesDropdown field implementation.
properties:
  dnsZones:
    type: string
    title: DNS Zones
    description: A list of DNS Zones configured with Massdriver.
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

| Name         | Required | Type   | Default   | Example                                   | Description                                                                                 |
| ------------ | -------- | ------ | --------- | ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| cloudService | True     | string | undefined | `aws`, `gcp`, `azure`, `ECR`, `GAR`, etc. | A string that is used in the query to get all the supported locations for a specific cloud. |

**Example**

```yaml title="schema"
type: object
title: Locations schema
description:
  An example schema that shows the supportedCloudLocationsDropdown field
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

### Azure Instance Types

The `InstanceTypesDropdown` is an asynchronous dropdown field that queries for and populates a list of supported instance types for a region in Azure. In order to do that, an argument must be supplied that informs Massdriver how to find
the region, either by way of connections or params schemas.

**Props**

External props passed through the `uiSchema`

| Name    | Required | Type   | Default   | Example                                                                       | Description                                                                                               |
| ------- | -------- | ------ | --------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| query   | True     | string | undefined | `connections.azure_virtual_network.specs.azure.region`, `params.region`, etc. | A string that is used in the query to get all the `supported instance types` for a specific Azure region. |
| service | True     | string | undefined | `Microsoft.DBforPostgreSQL`                                                   | A string that is used in the query to get all the `supported instance types` for a specific Azure region. |

**Example**

```yaml title="schema"
type: object
title: Sku
description: An example schema that shows the InstanceTypesDropdown
  field implementation.
properties:
  sku_name:
    type: string
    title: Name
    description: Name of the desired Azure Sku.
    default: ''
  region:
    type: string
    title: Region
    descripton: 'The region to deploy to'
    default: ''
```

```yaml title="uiSchema"
sku_name:
  ui:field: InstanceTypesDropdown
  query: connections.azure_virtual_network.specs.azure.region
  service: Microsoft.DBforPostgreSQL
```

### Dropzone

The `Dropzone` field is a file dropzone. Once a file is added, the parsed `binary string` for that file will be added to the `formData`.

**Props**

External props passed through the `uiSchema`

> **None**

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

### Versioning Dropdown

The `versioningDropdown` field is used to restrict users abilities to change versions. By providing it a list of versions, the field will automatically sort the versions in descending order. Once a user has chosen a version and provisioned their infrastructure, the field will block them from changing to certain versions. By default, the field will block users from downgrading. You can also set an `upgradeConstraint` and a `downgradeConstraint` via the `uiSchema`.

These constraints can have the following values:

- `all` - Disables all versions
- `none` - Disables no versions
- `minor` Disables all but minor versions

**Props**

External props passed through the `uiSchema`

| Name                | Required | Type   | Default | Example                | Description                                        |
| ------------------- | -------- | ------ | ------- | ---------------------- | -------------------------------------------------- |
| upgradeConstraint   | false    | string | `none`  | `all`, `none`, `minor` | A constraint on the ability to upgrade versions.   |
| downgradeConstraint | false    | string | `all`   | `all`, `none`, `minor` | A constraint on the ability to downgrade versions. |

**Example**

```yaml title="schema"
type: object
title: Example Infrastructure Schema
description: An example schema that shows the versioningDropdown implementation
properties:
  version:
    title: Version
    description: The server version.
    type: string
    enum:
      - '4.2'
      - '4.0'
      - '3.6'
      - '3.2'
      - '3.0'
```

```yaml title="uiSchema"
version:
  ui:field: versioningDropdown
  upgradeConstraint: all # Blocks the user from being able to upgrade
  downgradeConstraint: minor # Only allows the user to downgrade minor versions
```

### Deploy-Locked Dropdown

The `deployLockedDropdown` is a select menu that disabled specific items once the infrastructure has been deployed. Provide an ordered list to the field via the `schema` and provide a `disableType` to the `uiSchema` of either `higher`, `lower`, or an object specifying both `higher` and `lower` parameters. The field will initially allow the user to select any of the values. Once a value is selected and the package is deployed, the dropdown will disable values depending on the provided `disableType`.

- If you supply `disableType` with `higher`, then all values higher in the list than the current value will be disabled.
- If you supply `disableType` with `lower`, then all values lower in the list than the current value will be disabled.
- If you supply `disableType` with an object, then all values outside of the supplied range will be disabled. (ie. `{higher: 2, lower: 2}` will allow the user to select two values above and below the current value.)
  - Supplying an object containing a value of true will disable all values for that "side". (ie. `{higher: 2, lower: true}` will allow the user to select two values above the current and nothing else.)
  - Supplying an object missing a key will enable all values for that "side". (ie. `{higher: 2}` will allow the user to select two values above the current, or any value lower than it.)

**Props**

External props passed through the `uiSchema`

| Name        | Required | Type                         | Default | Example                                    | Description                                                                            |
| ----------- | -------- | ---------------------------- | ------- | ------------------------------------------ | -------------------------------------------------------------------------------------- |
| disableType | false    | `lower`, `higher`, or object | `lower` | `lower`, `higher`, `{lower: 2, higher: 2}` | Determines what dropdown items should be accessible once the package has been deployed |

**Example**

```yaml title="schema"
type: object
title: Deploy-Locked Dropdown Example
description: An example schema that shows the deployLockedDropdown field implementation.
properties:
  deployLockedDropdown:
    type: string
    title: Deploy-Locked Dropdown
    description: A dropdown that will disable values once the package is deployed.
    enum:
      - '64 GB'
      - '32 GB'
      - '16 GB'
      - '8 GB'
      - '4 GB'
      - '2 GB'
```

```yaml title="uiSchema"
deployLockedDropdown:
  ui:field: deployLockedDropdown
  disableType: lower
```

```yaml title="uiSchema"
deployLockedDropdown:
  ui:field: deployLockedDropdown
  disableType:
    higher: 2
    lower: true
```
