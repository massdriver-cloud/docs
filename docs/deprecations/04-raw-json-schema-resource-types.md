---
id: deprecations-raw-json-schema-resource-types
slug: /deprecations/raw-json-schema-resource-types
title: Raw JSON Schema Resource Types
sidebar_label: Raw JSON Schema Resource Types
---

**End of life:** December 31, 2026. After this date, you cannot publish or delete a resource type with a raw JSON schema document.

**Replacement:** A [`massdriver.yaml` resource type](/bundle-development/dependencies-resources/resource-type-spec), published with `mass resource-type publish`.

## Deprecated features

| Feature | Replacement |
|---|---|
| `mass resource-type publish` with a raw JSON or YAML schema file | `mass resource-type publish` with a `massdriver.yaml` file |
| `publishResourceType` GraphQL mutation | `mass resource-type publish` with a `massdriver.yaml` file |
| `deleteResourceType` GraphQL mutation | [`mass resource-type delete`](/cli/commands/mass_resource-type_delete) or the [`deleteOciRepo`](/api/graphql/operations/mutations/delete-oci-repo) mutation |

A raw schema has no version. Massdriver stores it as the unversioned `0.0.0` document of the resource type. It cannot take part in versioning, and you cannot pull it.

Resource types that you published before the end-of-life date continue to work.

## Migration checklist

1. **Update the Mass CLI** to the latest version.
2. **Find each raw schema file** that you publish, and each script or pipeline that calls `publishResourceType` or `deleteResourceType`.
3. **Convert each schema** to `massdriver.yaml`:
   ```bash
   mass resource-type convert ./my-resource-type.json
   ```
   The command writes a placeholder `version`. Set a real version.
4. **Publish** the resource type:
   ```bash
   mass resource-type publish
   ```
5. **Replace calls** to `deleteResourceType` with `mass resource-type delete` or the `deleteOciRepo` mutation.
6. **Update each bundle** that uses the resource type to a version constraint. Refer to [version resolution](/bundle-development/dependencies-resources/version-resolution).
