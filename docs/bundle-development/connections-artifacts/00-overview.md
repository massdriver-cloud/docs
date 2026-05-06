---
id: connections-artifacts-overview
slug: /bundle-development/connections-artifacts/overview
title: Connections & Resources
sidebar_label: Overview
---

Connections and resources enable type-safe composition of infrastructure components in Massdriver.

## Key concepts

- **Resources** are the outputs a bundle produces (e.g., database connection details, cluster credentials). Bundles declare them under the `artifacts:` key in `massdriver.yaml` — the YAML key retains its original name for backwards compatibility.
- **Connections** are the inputs a bundle consumes from other bundles' resources.
- **Resource Types** are the schemas that define the contract between bundles.

## How it works

When you connect bundles on the canvas, Massdriver validates that:
1. The resource's type matches the connection's expected type
2. The resource data conforms to the resource type schema
3. Any additional constraints (version, region) are satisfied

This validation happens at design time, preventing incompatible infrastructure from being deployed.

## In this section

- **[Resource Type Specification](./artifact-definition-spec)** - Complete reference for defining resource type schemas

## Related documentation

- [Concepts: Resources & Resource Types](/concepts/resources-and-types) - Conceptual overview
- [Bundle YAML: connections](/bundle-development/bundle-yaml-spec#connections) - Connection schema reference
- [Bundle YAML: artifacts](/bundle-development/bundle-yaml-spec#artifacts) - Resource output reference (YAML key still named `artifacts:`)
- [Resource Types Repository](https://github.com/massdriver-cloud/artifact-definitions) - Standard resource types (the GitHub repo URL retains the legacy name)
