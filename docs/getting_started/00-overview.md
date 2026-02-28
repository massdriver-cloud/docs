---
id: getting-started-overview
slug: /getting-started/overview
title: Getting Started with Massdriver
sidebar_label: Overview
---

Welcome to Massdriver! This guide walks you through setting up your platform and building your first bundles.

## Start with the Catalog

**[Massdriver Catalog](https://github.com/massdriver-cloud/massdriver-catalog)** is the foundation for your infrastructure platform. Clone it, customize it, and use it to model your architecture before writing code.

The catalog includes:
- **Artifact definitions** — Contracts for networks, databases, storage, credentials
- **Bundle schemas** — Complete `massdriver.yaml` configurations with parameter schemas and connections
- **Project templates** — Patterns for organizing environments and infrastructure

Start here to design how bundles connect, what parameters developers configure, and how artifacts flow between components. Once you've validated the experience in the UI, implement the actual OpenTofu/Terraform.

**→ [Bootstrap Your Platform](../guides/bootstrap-platform)**

## Learn Bundle Development

Work through these guides using example bundles from the catalog:

1. **[Deploying Your First Bundle](01-deploying-first-bundle.md)** — Publish, configure, and deploy a bundle
2. **[Connecting Bundles](02-connecting-bundles.md)** — Pass artifacts between infrastructure components
3. **[Creating Your Own Bundle](03-creating-bundles.md)** — Convert existing Terraform/OpenTofu modules into bundles
4. **[Bundle Metadata](04-using-bundle-metadata.md)** — Use injected metadata for naming, tagging, and conditional logic

Each guide builds on the previous one.

## Prerequisites

- **Massdriver account** — [Create one free](https://app.massdriver.cloud/register)
- **Mass CLI** — [Installation guide](/reference/cli/overview)

## Key Concepts

- **Bundles** — Reusable infrastructure modules with schemas, policies, and artifact contracts
- **Artifacts** — Typed outputs that enable bundles to connect and share state

You'll see these in action as you work through the guides.

:::tip Need Help?
Join our [Slack community](https://join.slack.com/t/massdrivercommunity/shared_invite/zt-1smvckvdj-jVFpBG2jF5XiYzX2njDCWA) for questions and assistance.
:::
