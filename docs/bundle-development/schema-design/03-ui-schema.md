---
id: schema-design-ui-schema
slug: /bundle-development/schema-design/ui-schema
title: UI Schema
sidebar_label: UI Schema
---

The `ui` block in `massdriver.yaml` controls how the configuration form renders. It follows the [React JSON Schema Form (RJSF) uiSchema](https://react-jsonschema-form.readthedocs.io/en/docs/api-reference/uiSchema/) format. Keys in `ui` match the property names in `params`, and nested objects and arrays nest the same way.

This page covers the RJSF options used most often and the form behavior Massdriver adds to every bundle. For validation rules, see [Validation Patterns](./validation-patterns).

## Common RJSF Options

```yaml
ui:
  ui:order:
    - database_name
    - instance_type
    - "*"
  database_name:
    ui:help: Choose a unique name. Cannot be changed after creation.
    ui:placeholder: my-database
  storage_gb:
    ui:widget: updown
  notes:
    ui:widget: textarea
  allowed_cidrs:
    ui:options:
      orderable: false
```

| Option | Description |
|--------|-------------|
| `ui:order` | Sets the field order. `"*"` places all fields that are not listed at that position. |
| `ui:help` | Help text shown below the field. |
| `ui:placeholder` | Placeholder text in an empty input. |
| `ui:widget` | Changes the input type. Common values: `updown`, `range`, `textarea`, `password`, `hidden`. |
| `ui:options` | Widget options. For arrays: `addable`, `orderable`, and `removable` (all `true` by default). |

For the full list, see the [RJSF uiSchema reference](https://react-jsonschema-form.readthedocs.io/en/docs/api-reference/uiSchema/).

## Built-in Form Behavior

Every bundle form has this behavior. You do not configure it.

- **Markdown descriptions.** A property's `description` renders as markdown, so you can use links, `code`, and emphasis.
- **Searchable dropdowns.** A property with `enum` or `oneOf` renders as a dropdown that filters as you type.
- **Collapsible array items.** Each array item renders as a collapsible card with a header. Each array has **Expand all** and **Collapse all** buttons. An item with a validation error shows an error icon in its header.

### Array Item Titles

Set `itemTitle` under `ui:options` on an array to control the header of each item. `{{key}}` is replaced with the value of that key in the item.

```yaml
params:
  properties:
    subnets:
      type: array
      title: Subnets
      items:
        type: object
        title: Subnet
        properties:
          cidr:
            type: string
          availability_zone:
            type: string

ui:
  subnets:
    ui:options:
      itemTitle: "{{cidr}} ({{availability_zone}})"
```

A subnet with `cidr: 10.0.0.0/24` and `availability_zone: us-east-1a` has the header `10.0.0.0/24 (us-east-1a)`.

Placeholders read only top-level keys of the item. `{{network.cidr}}` does not resolve.

The header uses the first rule that gives a value:

1. `itemTitle`, when at least one placeholder has a value.
2. The item's `name`, `title`, `label`, or `id` key, in that order.
3. The `title` of `items` and the item position, for example `Subnet 2`. If `items` has no `title`, the header is `Item 2`.

For an array of strings or numbers, the header is the item value.

## See Also

- [Validation Patterns](./validation-patterns) - JSON Schema patterns for enums, conditionals, ranges, and more
- [Massdriver Annotations](./massdriver-annotations) - `$md.*` extensions for immutability, dynamic enums, and more
- [Bundle YAML Specification](/bundle-development/bundle-yaml-spec) - Complete bundle reference
- [RJSF uiSchema reference](https://react-jsonschema-form.readthedocs.io/en/docs/api-reference/uiSchema/)
