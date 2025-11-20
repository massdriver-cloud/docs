---
id: json-schema-cheatsheet-immutable-fields
slug: /json-schema-cheat-sheet/immutable-fields
title: Immutable Fields
sidebar_label: Immutable Fields
---

RJSF and JSON Schema support `readOnly` fields. Massdriver extends this functionality with the `$md.immutable` (boolean) annotation.

When a field is set to immutable, it cannot be changed once provisioned. This is useful for adding guardrails on fields that might cause recreation if a value is changed. I.e.: changing the CIDR address of a VPC.

:::tip
For complete documentation on `$md.immutable` and other Massdriver custom annotations, see the [Massdriver Annotations](/json-schema-cheat-sheet/massdriver-annotations) reference page.
:::

:::note
This is currently supported on top-level properties and nested properties within objects.
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
