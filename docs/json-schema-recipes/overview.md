---
id: overview
slug: /json-schema-recipes
title: JSON Schema Recipes
sidebar_label: Overview
---

## Human-readable Enum Labels

It can be useful to have human-readable labels for enums while having a machine-readable value. Below is an example of presenting a color choice of red, green, or blue to a user while submitting a hex value to Massdriver.

```json
title: Alternative label example
type: object
properties:
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

## Named Lists, Sets

[_WIP_](https://rjsf-team.github.io/react-jsonschema-form/#eyJmb3JtRGF0YSI6eyJmb28iOnsibW9kZWwiOiJmb28iLCJtYWtlIjoiYmFyIiwieWVhciI6ImJheiJ9LCJiYXIiOnsibW9kZWwiOiJmb28iLCJtYWtlIjoiYmFyIiwieWVhciI6ImJheiJ9LCJuZXdLZXkiOnt9fSwic2NoZW1hIjp7InR5cGUiOiJvYmplY3QiLCJwcm9wZXJ0eU5hbWVzIjp7InBhdHRlcm4iOiJeW2EtejAtOV0rJCJ9LCJhZGRpdGlvbmFsUHJvcGVydGllcyI6eyJ0eXBlIjoib2JqZWN0IiwicHJvcGVydGllcyI6eyJtb2RlbCI6eyJ0eXBlIjoic3RyaW5nIn0sIm1ha2UiOnsidHlwZSI6InN0cmluZyJ9LCJ5ZWFyIjp7InR5cGUiOiJzdHJpbmcifX0sInJlcXVpcmVkIjpbIm1vZGVsIiwibWFrZSIsInllYXIiXX19LCJ1aVNjaGVtYSI6e30sInRoZW1lIjoiZGVmYXVsdCIsImxpdmVTZXR0aW5ncyI6eyJ2YWxpZGF0ZSI6ZmFsc2UsImRpc2FibGUiOmZhbHNlLCJyZWFkb25seSI6ZmFsc2UsIm9taXRFeHRyYURhdGEiOmZhbHNlLCJsaXZlT21pdCI6ZmFsc2V9fQ==)


<!-- * [Validating ranges w/ exlusions](https://rjsf-team.github.io/react-jsonschema-form/#eyJmb3JtRGF0YSI6eyJmaXJzdE5hbWUiOjEwLCJsYXN0TmFtZSI6Ik5vcnJpcyIsImFnZSI6NzUsImJpbyI6IlJvdW5kaG91c2Uga2lja2luZyBhc3NlcyBzaW5jZSAxOTQwIiwicGFzc3dvcmQiOiJub25lZWQiLCJhTnVtYmVyIjoxMH0sInNjaGVtYSI6eyJ0aXRsZSI6IkEgcmVnaXN0cmF0aW9uIGZvcm0iLCJkZXNjcmlwdGlvbiI6IkEgc2ltcGxlIGZvcm0gZXhhbXBsZS4iLCJ0eXBlIjoib2JqZWN0IiwicmVxdWlyZWQiOlsiZmlyc3ROYW1lIiwibGFzdE5hbWUiXSwicHJvcGVydGllcyI6eyJhTnVtYmVyIjp7InRpdGxlIjoiWmVybyBvciBiZXR3ZWVuIDEwIGFuZCAxMDAwIiwidHlwZSI6ImludGVnZXIiLCJtaW5pbXVtIjowLCJtYXhpbXVtIjoxMDAwLCJub3QiOnsibWluaW11bSI6MSwibWF4aW11bSI6OX19LCJsYXN0TmFtZSI6eyJ0eXBlIjoic3RyaW5nIiwidGl0bGUiOiJMYXN0IG5hbWUifSwidGVsZXBob25lIjp7InR5cGUiOiJzdHJpbmciLCJ0aXRsZSI6IlRlbGVwaG9uZSIsIm1pbkxlbmd0aCI6MTB9fX0sInVpU2NoZW1hIjp7ImZpcnN0TmFtZSI6eyJ1aTphdXRvZm9jdXMiOnRydWUsInVpOmVtcHR5VmFsdWUiOiIiLCJ1aTphdXRvY29tcGxldGUiOiJmYW1pbHktbmFtZSJ9LCJsYXN0TmFtZSI6eyJ1aTplbXB0eVZhbHVlIjoiIiwidWk6YXV0b2NvbXBsZXRlIjoiZ2l2ZW4tbmFtZSJ9LCJhZ2UiOnsidWk6d2lkZ2V0IjoidXBkb3duIiwidWk6dGl0bGUiOiJBZ2Ugb2YgcGVyc29uIiwidWk6ZGVzY3JpcHRpb24iOiIoZWFydGhpYW4geWVhcikifSwiYmlvIjp7InVpOndpZGdldCI6InRleHRhcmVhIn0sInBhc3N3b3JkIjp7InVpOndpZGdldCI6InBhc3N3b3JkIiwidWk6aGVscCI6IkhpbnQ6IE1ha2UgaXQgc3Ryb25nISJ9LCJkYXRlIjp7InVpOndpZGdldCI6ImFsdC1kYXRldGltZSJ9LCJ0ZWxlcGhvbmUiOnsidWk6b3B0aW9ucyI6eyJpbnB1dFR5cGUiOiJ0ZWwifX19LCJ0aGVtZSI6ImRlZmF1bHQiLCJsaXZlU2V0dGluZ3MiOnsidmFsaWRhdGUiOnRydWUsImRpc2FibGUiOmZhbHNlLCJyZWFkb25seSI6ZmFsc2UsIm9taXRFeHRyYURhdGEiOmZhbHNlLCJsaXZlT21pdCI6ZmFsc2V9fQ==) -->

## Immutable Fields

Fields can be made immutable or `readOnly` (JSON Schema) by setting the following annotation on a property. This will allow the field to initially be set, but not changed once provisioned.

```yaml
title: Immutable Field Example
type: object
properties:
  title: CIDR Range
  type: string
  $md.immutable: true
```

:::note
This is currently only supported on top-level properties.
:::


