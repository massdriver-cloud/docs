---
id: json-schema-cheatsheet-property-reuse
slug: /json-schema-cheat-sheet/property-reuse
title: Property Reuse
sidebar_label: Property Reuse
---

In complex dependency examples, large amounts of duplicate code can be generated. To handle this anchors and references can be used to eliminate some of this duplicate code leading to easier maintenance down the road.

Here is an example of this in action.

```yaml
---
primary_index:
  type: object
  title: "Primary Index"
  dependencies:
  type:
    oneOf:
    - properties:
      type:
        const: "compound"
      partition_key:
        type: string
        title: "Partition Key"
        $md.immutable: true
      partition_key_type:
        type: string
        title: "Partition Key Type"
        $md.immutable: true
        oneOf:
        - title: String
          const: "S"
        - title: Number
          const: "N"
        - title: Binary
          const: "B"
      sort_key:
        type: string
        title: "Sort Key"
        $md.immutable: true
      sort_key_type:
        type: string
        title: "Sort Key Type"
        $md.immutable: true
        oneOf:
        - title: String
          const: "S"
        - title: Number
          const: "N"
        - title: Binary
          const: "B"
      required:
      - partition_key
      - partition_key_type
      - sort_key
      - sort_key_type
    - properties:
      type:
        const: "simple"
      partition_key:
        type: string
        title: "Partition Key"
        $md.immutable: true
      partition_key_type:
        type: string
        title: "Partition Key Type"
        $md.immutable: true
        oneOf:
        - title: String
          const: "S"
        - title: Number
          const: "N"
        - title: Binary
          const: "B"
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

As you can see there is a lot of duplicate code that we can clean up. First we must declare anchors for the reusable code.

### Anchors

Here are the anchors we will use to DRY up the code

```yaml
---
PartitionKeyProperties: &partition_key_properties
  partition_key:
    type: string
    title: "Partition Key"
    $md.immutable: true
  partition_key_type:
    type: string
    title: "Partition Key Type"
    $md.immutable: true
    oneOf:
      - title: String
        const: "S"
      - title: Number
        const: "N"
      - title: Binary
        const: "B"

SortKeyProperties: &sort_key_properties
  sort_key:
    type: string
    title: "Sort Key"
    $md.immutable: true
  sort_key_type:
    type: string
    title: "Sort Key Type"
    $md.immutable: true
    oneOf:
      - title: String
        const: "S"
      - title: Number
        const: "N"
      - title: Binary
        const: "B"
```

Anchors are given a property name, and a value prefixed by `&`. These attributes will not be seen by the code consuming it so give it a name that is suitable for a user. Underneath the top level property is the code that we want to inject into a top level property.

### References

There is another reference we can create to DRY the code up a little further. Under the `sort_key_type` and `partition_key_type` attributes we have a list of supported types. If this list changes we will have to update the references in multiple places. Lets extract that to a new anchor and use it in our current anchors.

```yaml
---
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

The `<<` property is a native YAML construct like the Javascript spread (`...`) operator. It puts all of the current anchor's attributes into the current context. In this case the `partition_key_type` and `sort_key_type` attributes. Placing the `<<` property at the top would inject those properties before the `type` attribute. This is important to remember because you can use multiple anchor references in an array. These references will be inserted in the order they are added to the array.

To use our created anchor we reference the key with a `*` before it instead of a `&`.

### Putting It Together

Here is our final example with all of our anchors and references

```yaml
---
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
      sort_key:
        type: string
        title: "Sort Key"
        $md.immutable: true
      sort_key_type:
        type: string
        title: "Sort Key Type"
        $md.immutable: true
        oneOf:
        - title: String
          const: "S"
        - title: Number
          const: "N"
        - title: Binary
          const: "B"
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
