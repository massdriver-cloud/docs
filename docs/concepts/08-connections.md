---
id: concepts-connections
slug: /concepts/connections
title: Connections
sidebar_label: Connections
---

Connections are the lines between [manifests](#manifest) in the Massdriver UI. They indicate other application and infrastructure bundles that a bundle is dependent on. They can be thought of as an "input" that is another package's artifact.

Connections are unidirectional. They always flow from "left" to "right" and are the _edges_ of a directed acyclic graph defining the dependency hierarchy of your infrastructure and applications.

A dotted line indicates that an [artifact](#artifact) _has not_ been provisioned yet for the connection.

A solid line indicates that an [artifact](#artifact) _has_ been provisioned for the connection.

![Connections](./img/connections.png)

## Dynamic Configuration from Connections

You can use the `$md.enum` annotation in your bundle's params schema to create dynamic dropdown fields that query data from connected artifacts. This enables users to select from available resources (like subnets, database instances, or IAM roles) that exist in their connected infrastructure.

For example, a bundle connected to a VPC can provide a dropdown to select from available subnets, or a bundle connected to a database cluster can let users pick a specific database instance.

See the [Massdriver Annotations Reference](/json-schema-cheat-sheet/massdriver-annotations#mdenuml) for complete documentation and examples.

## Removing Connections

To remove a connection, click the **X** on the connection line.

:::caution
Removing a connection **without decommissioning the dependent manifest** may result in an inconsistent state resulting in orphaned resources.
:::
