---
id: json-schema-cheatsheet-sets
slug: /json-schema-cheat-sheet/sets
title: Sets
sidebar_label: Sets
---


Sets are useful for iterating over objects during IaC provisioning to create unique resources. When using _sets_ a unique identifier is required by tools like Terraform, but those IDs can be difficult to autogenerate in a safe, declarative manner.

When using _sets_ `patternProperties` can be useful for controlling the `keys` in maps to be used as a unique ID during provisioning.

In the example below a user would be prompted to enter a unique identifier for each car added.

```yaml
---
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
