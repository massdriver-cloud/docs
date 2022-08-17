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

More complex conditional interfaces can be created using JSON Schema [if-then-else](https://json-schema.org/understanding-json-schema/reference/conditionals.html#if-then-else).
