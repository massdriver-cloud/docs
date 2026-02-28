---
id: schema-design-validation-patterns
slug: /bundle-development/schema-design/validation-patterns
title: JSON Schema Validation Patterns
sidebar_label: Validation Patterns
---

This page covers common JSON Schema patterns for building robust bundle parameter schemas. For Massdriver-specific extensions like `$md.immutable` and `$md.enum`, see [Massdriver Annotations](./massdriver-annotations).

## Human-readable Enum Labels

Display human-readable labels in dropdowns while submitting machine-readable values. Use `oneOf` with `const` and `title`:

```yaml
properties:
  color:
    title: Favorite Color
    type: string
    oneOf:
      - title: Red
        const: "#ff0000"
      - title: Green
        const: "#00ff00"
      - title: Blue
        const: "#0000ff"
```

## Immutable Fields

Prevent field changes after provisioning using `$md.immutable`. Useful for fields that would cause resource recreation:

```yaml
properties:
  cidr:
    title: CIDR Range
    $md.immutable: true
    type: string
```

:::note
Supported on top-level properties and nested properties within objects. See [Massdriver Annotations](./massdriver-annotations) for complete documentation.
:::

## Range Exclusion

Exclude specific values from a range using `not`:

```yaml
properties:
  range:
    title: Zero or between 10 and 1000
    type: integer
    minimum: 0
    maximum: 1000
    not:
      minimum: 1
      maximum: 9
```

## Conditional Fields

### Conditionally Requiring Fields

Require a field only when another field is set using `dependencies`:

```yaml
properties:
  billing:
    title: Billing
    type: object
    properties:
      name:
        type: string
      credit_card:
        type: number
      address:
        type: string
    required:
      - name
    dependencies:
      credit_card:
        - address
```

### Conditionally Displaying Fields

Show fields only when conditions are met by placing conditional fields under `dependencies`:

```yaml
properties:
  billing:
    title: Billing
    type: object
    properties:
      name:
        type: string
      credit_card:
        type: number
    required:
      - name
    dependencies:
      credit_card:
        properties:
          address:
            type: string
        required:
          - address
```

### Boolean-based Conditionals

Use `oneOf` within `dependencies` to handle boolean toggles:

```yaml
stream:
  type: object
  title: "DynamoDB Streams"
  description: "Enable DynamoDB stream emission"
  dependencies:
    enabled:
      oneOf:
        - properties:
            enabled:
              const: true
            view_type:
              type: string
              default: NEW_IMAGE
              enum:
                - KEYS_ONLY
                - NEW_IMAGE
                - OLD_IMAGE
                - NEW_AND_OLD_IMAGES
          required:
            - view_type
        - properties:
            enabled:
              const: false
  properties:
    enabled:
      type: boolean
      default: false
      title: "Enabled?"
```

### Enum-based Conditionals

Show different fields based on enum selection:

```yaml
capacity:
  type: object
  title: "Capacity"
  dependencies:
    billing_mode:
      oneOf:
        - properties:
            billing_mode:
              const: PROVISIONED
            read_capacity:
              type: integer
              title: "Read Capacity"
              minimum: 1
              maximum: 3000
            write_capacity:
              type: integer
              title: "Write Capacity"
              minimum: 1
              maximum: 1000
          required:
            - read_capacity
            - write_capacity
        - properties:
            billing_mode:
              const: PAY_PER_REQUEST
```

For more complex conditionals, see JSON Schema [if-then-else](https://json-schema.org/understanding-json-schema/reference/conditionals.html#if-then-else).

## Property Reuse with YAML Anchors

Use YAML anchors (`&`) and references (`*`) to DRY up repetitive schemas.

### Defining Anchors

```yaml
ValidIndexDataTypes: &valid_index_data_types
  oneOf:
    - title: String
      const: "S"
    - title: Number
      const: "N"
    - title: Binary
      const: "B"

PartitionKeyProperties: &partition_key_properties
  partition_key:
    type: string
    title: "Partition Key"
    $md.immutable: true
  partition_key_type:
    type: string
    title: "Partition Key Type"
    $md.immutable: true
    <<: *valid_index_data_types

SortKeyProperties: &sort_key_properties
  sort_key:
    type: string
    title: "Sort Key"
    $md.immutable: true
  sort_key_type:
    type: string
    title: "Sort Key Type"
    $md.immutable: true
    <<: *valid_index_data_types
```

### Using References

The `<<` operator (YAML merge key) injects anchor properties into the current context, similar to JavaScript's spread operator:

```yaml
primary_index:
  type: object
  title: "Primary Index"
  dependencies:
    type:
      oneOf:
        - properties:
            type:
              const: "compound"
            <<: [*partition_key_properties, *sort_key_properties]
          required:
            - partition_key
            - partition_key_type
            - sort_key
            - sort_key_type
        - properties:
            type:
              const: "simple"
            <<: *partition_key_properties
          required:
            - partition_key
            - partition_key_type
  properties:
    type:
      type: string
      title: "Type"
      default: simple
      $md.immutable: true
      enum:
        - simple
        - compound
```

## Sets (User-defined Keys)

For IaC provisioning that requires unique identifiers, use `propertyNames` with `additionalProperties` to let users define map keys:

```yaml
type: object
propertyNames:
  pattern: "^[a-z0-9]+$"
additionalProperties:
  type: object
  properties:
    model:
      type: string
    make:
      type: string
    year:
      type: string
  required:
    - model
    - make
    - year
```

Users will be prompted to enter a unique identifier for each item added.

## Custom Validation Messages

Provide human-friendly error messages for complex patterns using the `message` field:

```yaml
read_capacity:
  type: integer
  title: "Read Capacity"
  minimum: 1
  maximum: 3000
  message:
    minimum: "must be larger than 1."
    maximum: "must be less than 3000."
```

This is especially useful for complex regex patterns:

```yaml
grn:
  type: string
  title: "GCP Resource Name (GRN)"
  description: "Resource identifier provided by GCP"
  examples:
    - "projects/my-project/global/networks/my-global-network"
    - "projects/my-project/regions/us-west2/subnetworks/my-subnetwork"
  pattern: "^projects\\/[a-z0-9-]+\\/[a-z]+\\/[a-z0-9-]+(?:\\/[a-zA-Z0-9-_.]+){0,6}$"
  message:
    pattern: "The provided GRN does not follow the expected pattern. See the examples for valid GRNs."
```

## See Also

- [Massdriver Annotations](./massdriver-annotations) - `$md.*` extensions for immutability, dynamic enums, and more
- [Bundle YAML Specification](/bundle-development/bundle-yaml-spec) - Complete bundle reference
- [JSON Schema Specification](https://json-schema.org/specification.html) - Official JSON Schema docs
