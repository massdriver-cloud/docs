---
id: json-schema-cheatsheet-immutable-fields
slug: /json-schema-cheat-sheet/immutable-fields
title: Immutable Fields
sidebar_label: Immutable Fields
---

RJSF and JSON Schema support `readOnly` fields. Massdriver extends this functionality with the `$md.immutable` (boolean) annotation.

When a field is set to immutable, it cannot be changed once provisioned. This is useful for adding guardrails on fields that might cause recreation if a value is changed. I.e.: changing the CIDR address of a VPC.

:::note
This is currently only supported on top-level properties.
:::


```yaml
title: Immutable Field Example
type: object
properties:
  cidr:
    title: CIDR Range
    $md.immutable: true
    type: string
```
