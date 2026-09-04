---
id: concepts-dependencies
slug: /concepts/dependencies
title: Dependencies
sidebar_label: Dependencies
---

Dependencies are the lines between [components](/concepts/components-instances-deployments#components) in the Massdriver UI. They indicate other application and infrastructure bundles that a bundle depends on. Drawing one fills a slot the consuming bundle declared with another instance's resource.

Dependencies are unidirectional. They always flow from "left" to "right" and are the _edges_ of a directed acyclic graph defining the dependency hierarchy of your infrastructure and applications.

A dotted line indicates that a [resource](/concepts/resources-and-types) _has not_ been provisioned yet.

A solid line indicates that a [resource](/concepts/resources-and-types) _has_ been provisioned.

<video controls loop muted playsInline width="100%">
  <source src="/img/screenshots/connecting-dependencies.webm" type="video/webm" />
</video>

## Version ranges on a dependency

A dependency is drawn once on the project blueprint, but the environments under that project can run different bundle versions. Each dependency therefore records a version range for the source component and a version range for the destination component.

The dependency is only wired up in an environment where the bundle versions deployed there satisfy both ranges.

<VersionedConnections />

### How the ranges are set

You do not type the ranges. When you draw a dependency, Massdriver reads the bundle version at each end and stores that version's compatibility boundary:

| Deployed version | Stored range | Reason |
|------------------|--------------|--------|
| `1.2.3` | `~1` | For `1.0.0` and above, the major version is the compatibility boundary |
| `2.0.0` | `~2` | A new major version is a new contract |
| `0.4.1` | `~0.4` | Below `1.0.0`, the minor version is the compatibility boundary |
| `1.2.3-dev.20060102T150405Z` | `~1` | A development release shares its base version's boundary |

A development release satisfies the same range as the version it is based on, so a dependency stays wired while you test a `-dev` build.

:::caution Bundles below 1.0.0 narrow faster
A `0.x` bundle changes its compatibility boundary on every minor bump. A component moving from `0.4.1` to `0.5.0` leaves the `~0.4` range, and the dependency drawn at `0.4.1` no longer applies to it. Draw the dependency again at the new version, or publish `1.0.0` so the boundary widens to the major version.
:::

### More than one dependency on the same field

A destination field can carry several dependencies, as long as no two of them could apply at the same time. Massdriver rejects a new one when its source range **and** its destination range both overlap an existing dependency on that field, because a single pair of deployed versions would then satisfy two at once.

Non-overlapping pairs are what make a staged rollout work. A field can hold `vpc ~1 → db ~1` and `vpc ~1 → db ~2` together. Every environment satisfies exactly one of them, so staging moves to the new major version on its own schedule and production keeps the wiring it already had.

### Seeing what an instance is bound to

Open an instance and select the **Dependencies** tab. Each row shows the dependency's resource type and the version range it accepts, next to the instance currently filling it. The **Resources** tab shows the same for what the instance produces.

## Dynamic Configuration from Dependencies

You can use the `$md.enum` annotation in your bundle's params schema to create dynamic dropdown fields that query data from connected resources. This enables users to select from available cloud resources (like subnets, database instances, or IAM roles) that exist in their connected infrastructure.

For example, a bundle that depends on a VPC can provide a dropdown to select from available subnets, or a bundle that depends on a database cluster can let users pick a specific database instance.

See the [Massdriver Annotations Reference](/bundle-development/schema-design/massdriver-annotations#mdenuml) for complete documentation and examples.

## Removing a dependency

To remove a dependency, click the **X** on the line.

:::caution
Removing a dependency **without decommissioning the dependent component** may result in an inconsistent state resulting in orphaned resources.
:::

## Related documentation

- [Version resolution](/bundle-development/dependencies-resources/version-resolution) — how a dependency's version range picks a resource at deploy time
- [Bundle YAML: dependencies](/bundle-development/bundle-yaml-spec#dependencies) — declaring what a bundle consumes
