---
id: deprecations-connections-and-artifacts-aliases
slug: /deprecations/connections-and-artifacts-aliases
title: Connections and Artifacts Aliases
sidebar_label: Connections and Artifacts Aliases
---

**End of life:** December 31, 2026. After this date, the aliases below are not available to bundles.

**Replacement:** `dependencies`, `resources`, and `id`.

## Deprecated aliases

Massdriver renamed connections to dependencies, artifacts to resources, and slug to id. The old names stay available as aliases until the end-of-life date. Each alias holds the same data as its replacement.

| Where | Deprecated alias | Replacement |
|---|---|---|
| jq expressions in the `envs` block and step `config` blocks of `massdriver.yaml` | `.connections` | `.dependencies` |
| Provisioner input files | `/massdriver/connections.json` | `/massdriver/dependencies.json` |
| [Operator guides](/guides/operator-guides) | `{{connections.<name>}}` | `{{dependencies.<name>}}` |
| Operator guides | `{{artifacts.<name>}}` | `{{resources.<name>}}` |
| Operator guides | `{{slug}}` | `{{id}}` |

```yaml
# Deprecated
config:
  region: .connections.azure_credentials.specs.region

# Replacement
config:
  region: .dependencies.azure_credentials.specs.region
```

## Migration checklist

1. **Search each bundle** for the deprecated names. Run this command in the bundle directory:
   ```bash
   grep -rnE '\.connections\b|connections\.json|\{\{ *(connections|artifacts|slug)\b' .
   ```
   Also search the code of each [custom provisioner](/platform-operations/self-hosted/custom-provisioners) image for `connections.json`.
2. **Replace each alias** with its replacement from the table above.
3. **Publish a new bundle version** and deploy each instance that uses the bundle.
4. **Verify** the deployment and the operator guide of each instance.
