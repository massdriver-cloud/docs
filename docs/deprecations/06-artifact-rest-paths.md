---
id: deprecations-artifact-rest-paths
slug: /deprecations/artifact-rest-paths
title: Artifact REST Paths
sidebar_label: Artifact REST Paths
---

**End of life:** December 31, 2026. After this date, the REST paths below return `404 Not Found`.

**Replacement:** The `/v1/resources` and `/v1/resource-types` paths.

## Deprecated paths

Massdriver renamed artifacts to resources and artifact definitions to resource types. The old REST paths stay available as aliases until the end-of-life date.

| Deprecated path | Replacement |
|---|---|
| `/v1/artifacts` | `/v1/resources` |
| `/v1/artifact-definitions` | `/v1/resource-types` |
| `/artifact-definitions/<organization>/<name>` | `/v1/resource-types/<organization>/<name>` |

The methods and the request and response bodies are the same on each replacement path.

Older bundle versions have `$id` URLs in the `/artifact-definitions/<organization>/<name>` format. Massdriver updates these stored URLs to the replacement format before the end-of-life date.

## Migration checklist

1. **Find each script, pipeline, or API client** that sends a request to a path in the table above.
2. **Change the path** to its replacement.
3. **Find each tool that reads `$id` URLs** from bundle or resource type schemas, and make sure that it accepts the `/v1/resource-types/<organization>/<name>` format.
4. **Verify** each integration.
