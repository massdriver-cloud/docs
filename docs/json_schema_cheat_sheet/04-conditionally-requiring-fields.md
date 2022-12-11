---
id: json-schema-cheatsheet-conditional-fields
slug: /json-schema-cheat-sheet/conditional-fields
title: Conditional Fields
sidebar_label: Conditional Fields
---

Fields in JSON Schema can be conditionally required and/or displayed.

### Conditionally Requiring Fields

Sometimes fields should only be required when another field is set. Below is an example of requiring an `address` when the `credit_card` field is present.

In this example, both fields are always shown.

```yaml
---
title: Conditionally Required Field Example
type: object
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

### Conditionally Displayed Fields

Conditionally _displaying_ the field is also possible with a slightly modified `properties` structure.

In this example the conditional fields are placed beneath the `dependencies` field.

```yaml
---
title: Conditionally Displayed Required Field Example
type: object
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

Conditionally displayed fields can also be handled using value matches from a boolean or enum. The below example uses a one of to set up the two potential cases. In this case if the enabled property is `true`, the first case will be used and the `view_type` attribute will be displayed.

```yaml
---
stream:
  type: object
  title: "DynamoDB Streams"
  description: "Enable the emission of all changes to the database to a DynamoDB stream which can be consumed by a downstream service."
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

Here is another exmaple based on an enum.

```yaml
---
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

More complex conditional interfaces can be created using JSON Schema [if-then-else](https://json-schema.org/understanding-json-schema/reference/conditionals.html#if-then-else).
