---
id: deprecations-secret-sha256
slug: /deprecations/secret-sha256
title: Secret SHA-256 Fields
sidebar_label: Secret SHA-256 Fields
---

**End of life:** February 1, 2027. After this date, the API does not have these fields. A query that asks for them fails.

**Replacement:** [`InstanceSecretField.isSet`](/api/graphql/types/objects/instance-secret-field).

## Deprecated fields

| Field | Replacement |
|---|---|
| `InstanceSecretField.sha256` | `InstanceSecretField.isSet` |
| `InstanceSecret.sha256`, returned by `setInstanceSecret` and `removeInstanceSecret` | `isSet` on `Instance.secretFields` |

Massdriver encrypts secret values with keys that belong to your organization. A SHA-256 hash of a secret is stored next to the encrypted value. For a short secret, someone who has the hash can test guesses against it. Massdriver will stop storing the hash.

## Migration checklist

1. **Find each query that selects `sha256`** on `secretFields`, `setInstanceSecret`, or `removeInstanceSecret`.
2. **Select `isSet` instead.** To find out if a secret has a value, use `isSet`, not a null check on `sha256`:

   ```graphql
   query {
     instance(organizationId: "your-org", id: "myapp-prod-api") {
       secretFields {
         name
         required
         isSet
       }
     }
   }
   ```

3. **Remove `sha256`** from the selections of `setInstanceSecret` and `removeInstanceSecret`. To check the result, query `secretFields` again.
4. **Upgrade the Massdriver CLI, Go SDK, and MCP server** to versions that do not select `sha256`.
