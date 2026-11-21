---
id: deprecations-legacy-bundle-format
slug: /deprecations/legacy-bundle-format
title: Legacy Bundle Format
sidebar_label: Legacy Bundle Format
---

**End of life:** December 31, 2026. After this date, Massdriver does not accept a bundle publish that uses the `connections` and `artifacts` blocks.

**Replacement:** The [`dependencies` and `resources` blocks](/bundle-development/bundle-yaml-spec) in `massdriver.yaml`.

## Legacy format

Older bundles declare the resources they consume and produce as JSON Schema blocks named `connections` and `artifacts`:

```yaml
connections:
  required:
    - vpc
  properties:
    vpc:
      $ref: aws-vpc

artifacts:
  required:
    - database
  properties:
    database:
      $ref: postgresql-authentication
```

A legacy block does not have a version range for its resource types.

Bundle versions that you published before the end-of-life date continue to deploy. Only new publishes must use the current format.

## Current format

A dependency names its resource type and the versions it accepts. A resource names its resource type and the version it produces:

```yaml
dependencies:
  vpc:
    resource_type: aws-vpc@~1
    required: true

resources:
  database:
    resource_type: postgresql-authentication@1.0.0
    required: true
```

## Migration checklist

1. **Update the Mass CLI** to the latest version.
2. **Find each bundle** that has a `connections` or `artifacts` block in its `massdriver.yaml`.
3. **Convert each block.** Change each `properties` entry to a named entry with `resource_type`. Add a version constraint to each dependency and a version to each resource. Change the `required` list to `required: true` or `required: false` on each entry. Refer to [version resolution](/bundle-development/dependencies-resources/version-resolution) to select a constraint.
4. **Rename the aliases** in the bundle's jq expressions and operator guide. Refer to [Connections and Artifacts Aliases](/deprecations/connections-and-artifacts-aliases).
5. **Publish a new bundle version** with `mass bundle publish`, and deploy an instance to verify it.
