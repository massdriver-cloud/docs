---
id: connections-artifacts-overview
slug: /bundle-development/connections-artifacts/overview
title: Connections & Artifacts
sidebar_label: Overview
---

Connections and artifacts enable type-safe composition of infrastructure components in Massdriver.

## Key concepts

- **Artifacts** are the outputs a bundle produces (e.g., database connection details, cluster credentials)
- **Connections** are the inputs a bundle consumes from other bundles' artifacts
- **Resource Types** are the schemas that define the contract between bundles

## How it works

When you connect bundles on the canvas, Massdriver validates that:
1. The artifact type matches the connection's expected type
2. The artifact data conforms to the resource type schema
3. Any additional constraints (version, region) are satisfied

This validation happens at design time, preventing incompatible infrastructure from being deployed.

## In this section

- **[Resource Type Specification](./artifact-definition-spec)** - Complete reference for defining artifact schemas

## Related documentation

- [Concepts: Artifacts & Definitions](/concepts/resources-and-types) - Conceptual overview
- [Bundle YAML: connections](/bundle-development/bundle-yaml-spec#connections) - Connection schema reference
- [Bundle YAML: artifacts](/bundle-development/bundle-yaml-spec#artifacts) - Artifact output reference
- [Resource Types Repository](https://github.com/massdriver-cloud/artifact-definitions) - Standard artifact types
