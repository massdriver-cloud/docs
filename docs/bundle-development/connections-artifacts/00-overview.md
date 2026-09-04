---
id: connections-artifacts-overview
slug: /bundle-development/connections-artifacts/overview
title: Connections & Resources
sidebar_label: Overview
---

Connections and resources enable type-safe composition of infrastructure components in Massdriver.

## Key concepts

- **Resources** are what a bundle produces for other bundles to consume — database connection details, cluster credentials, network layouts. Bundles declare them under `resources:` in `massdriver.yaml`.
- **Dependencies** are what a bundle consumes from other bundles' resources. Bundles declare them under `dependencies:` in `massdriver.yaml`.
- **Connections** are the lines you draw between components. A connection fills a dependency with a resource.
- **Resource types** are the versioned schemas that define the contract between bundles.

## How it works

When you connect bundles on the canvas, Massdriver validates that:

1. The resource's type matches the type the dependency expects
2. The resource data conforms to the resource type schema
3. The bundle versions at each end fall inside the connection's version ranges

The first two checks happen when you draw the connection, so incompatible infrastructure never reaches a deployment. The third is re-checked per environment, so one blueprint can serve environments running different bundle versions.

## In this section

- **[Resource Type Specification](./artifact-definition-spec)** - Authoring, versioning, and publishing a resource type
- **[Version Resolution](./version-resolution)** - How a version range picks a resource at deploy time

## Related documentation

- [Concepts: Resources & Resource Types](/concepts/resources-and-types) - Conceptual overview
- [Concepts: Connections](/concepts/connections) - Version ranges on a connection
- [Bundle YAML: dependencies](/bundle-development/bundle-yaml-spec#dependencies) - What a bundle consumes
- [Bundle YAML: resources](/bundle-development/bundle-yaml-spec#resources) - What a bundle produces
- [Resource Types Repository](https://github.com/massdriver-cloud/artifact-definitions) - Standard resource types (the GitHub repo URL retains the legacy name)
