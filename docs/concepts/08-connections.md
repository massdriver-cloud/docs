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

To remove a connection, click the **X** on the connection line.

:::caution
Removing a connection **without decommissioning the dependent manifest** may result in an inconsistent state resulting in orphaned resources.
:::
