---
id: deprecations-renamed-resource-type-names
slug: /deprecations/renamed-resource-type-names
title: Renamed Resource Type Names
sidebar_label: Renamed Resource Type Names
---

**End of life:** December 31, 2026. After this date, the old name of a renamed resource type does not resolve.

**Replacement:** The new name of the resource type.

## Renamed resource types

Resource types and bundles share one set of repository names in each organization. When Massdriver moved resource types to OCI repositories, some resource types had the same name as a bundle repository. Massdriver renamed each of these resource types:

| Old name | New name |
|---|---|
| `<name>` | `<name>-resource` |
| `<name>`, when `<name>-resource` was also in use | `<name>-resource-<4 digits>` |

Until the end-of-life date, Massdriver resolves the old name to the renamed resource type. After that date:

- A bundle publish that references the old name fails.
- A resource type publish with the old name creates a new resource type. It does not add a version to the renamed resource type.

## Migration checklist

1. **Find the renamed resource types** in your organization. Look for names that end in `-resource` or `-resource-<4 digits>` in the resource type catalog, or run `mass resource-type list`.
2. **Find each bundle** whose `massdriver.yaml` references an old name in `dependencies`, `resources`, `connections`, or `artifacts`.
3. **Replace the old name** with the new name, and publish a new bundle version.
4. **Rename the resource type source.** Set the new name in each resource type `massdriver.yaml` that you publish, so that the next publish adds a version to the renamed resource type.
