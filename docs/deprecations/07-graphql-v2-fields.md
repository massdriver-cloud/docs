---
id: deprecations-graphql-v2-fields
slug: /deprecations/graphql-v2-fields
title: GraphQL V2 Fields
sidebar_label: GraphQL V2 Fields
---

**End of life:** December 31, 2026. After this date, Massdriver removes the fields, arguments, and operations below from the V2 GraphQL API. A query that selects one of them fails validation.

**Replacement:** Refer to the table below.

## Deprecated fields and operations

| Deprecated | Replacement |
|---|---|
| `Environment.blueprint` | The `instances` and `connections` fields on [`Environment`](/api/graphql/types/objects/environment) |
| `Project.blueprint` | The `components` and `links` fields on [`Project`](/api/graphql/types/objects/project) |
| `Resource.type` | `Resource.resourceType { id }` on [`Resource`](/api/graphql/types/objects/resource) |
| `Instance.releaseStrategy` | `Instance.version`. A version that ends in `+dev` is a development release channel. |
| `releaseStrategy` in the [`updateInstance`](/api/graphql/operations/mutations/update-instance) input | Add `+dev` to `version`, for example `latest+dev` or `~1.2+dev` |
| `resourceTypes` query | The [`resourceType`](/api/graphql/operations/queries/resource-type) query with a version, for example `resourceType(id: "aws-iam-role@1.2.3")`. To list resource types, use the [`ociRepos`](/api/graphql/operations/queries/oci-repos) query with `artifactType: "application/vnd.massdriver.resource-type.v1+json"`. |
| `publishResourceType` mutation | Refer to [Raw JSON Schema Resource Types](/deprecations/raw-json-schema-resource-types) |
| `deleteResourceType` mutation | Refer to [Raw JSON Schema Resource Types](/deprecations/raw-json-schema-resource-types) |

The `resourceTypes` query returns only the unversioned `0.0.0` document of each resource type. It does not return published versions.

## Examples

```graphql
# Deprecated
query {
  instance(organizationId: "your-org-id", id: "ecomm-prod-api") {
    version
    releaseStrategy
  }
}

# Replacement
query {
  instance(organizationId: "your-org-id", id: "ecomm-prod-api") {
    version # "~1.2+dev" is a development channel. "~1.2" is a stable channel.
  }
}
```

```graphql
# Deprecated
mutation {
  updateInstance(organizationId: "your-org-id", id: "ecomm-prod-api", input: { version: "latest", releaseStrategy: DEVELOPMENT }) {
    successful
  }
}

# Replacement
mutation {
  updateInstance(organizationId: "your-org-id", id: "ecomm-prod-api", input: { version: "latest+dev" }) {
    successful
  }
}
```

## Migration checklist

1. **Find each query and mutation** that uses a deprecated item. GraphQL clients and code generators show a warning for fields with the `@deprecated` directive. You can also search your code for the names in the table above.
2. **Change each query and mutation** to use the replacement.
3. **Regenerate client types** if you use a GraphQL code generator.
4. **Verify** each integration.
