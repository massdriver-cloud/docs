---
id: bundles-overview
slug: /bundles
title: Bundle Development
sidebar_label: Overview
---

Massdriver bundles are a wrapper around infrastructure-as-code tools like Terraform or Helm. Bundles provide a way of visualizing the infrastructure or application on the Massdriver canvas, providing a rich user interface to the end-user, and ensuring valid connections between infrastructure.

Massdriver manages parity across application environments, regions, and tenants, so it is important that bundle resources can be created multiple times.

:::note
Singleton resources like _container repositories_, _DNS Zones_, and _transit gateways_ are examples of resources that **do not** fit well into Massdriver bundles.

Some resources like _container repositories__ and _DNS Zones_ are supported as first class citizens in Massdriver.

If you need help with incorporating a singleton resource in Massdriver, feel free to [contact us](#TBDLINK). We're always happy to help.
:::
