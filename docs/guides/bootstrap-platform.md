---
id: bootstrap-platform
slug: /guides/bootstrap-platform
title: Bootstrap Your Platform
sidebar_label: Bootstrap Your Platform
---

# Bootstrap Your Platform

The Massdriver Catalog is a bootstrap repository for self-hosted instances containing artifact definitions, bundle schemas, and credential templates. It lets you model your platform architecture and test the developer experience before implementing infrastructure code.

**[→ Massdriver Catalog on GitHub](https://github.com/massdriver-cloud/massdriver-catalog)**

## Model First, Implement Later

Instead of building bundles one at a time and discovering issues after implementation, the catalog provides working schemas you can publish and test in the UI. Create projects and environments, add bundles to your canvas, connect them together, and configure parameters. Once you've validated the architecture, replace the placeholder IaC with your actual OpenTofu/Terraform.

This is useful for answering questions like: Should you have separate `postgres` and `mysql` bundles or a generic `database` bundle? One `network` artifact or separate `public-subnet` and `private-subnet` artifacts? What parameters do developers actually need? Test it in the UI before writing infrastructure code.

## What's Included

- **Credential artifact definitions** - AWS, Azure, GCP authentication contracts
- **Artifact definitions** - Networks, databases (PostgreSQL, MySQL), storage buckets
- **Infrastructure bundles** - Complete massdriver.yaml configs with parameter schemas, connections, artifacts, and UI schemas (placeholder IaC)

## Workflow

1. **Model** - Publish the catalog to your instance, add bundles to canvases, connect them, configure parameters
2. **Implement** - Replace placeholder code with your OpenTofu/Terraform
3. **Iterate** - Add more bundles, create [custom artifacts](/guides/custom-artifact-definition), use [release channels](/bundle-development/publishing/versioning#release-channels)

## Prerequisites

- Self-hosted Massdriver instance ([install guide](/platform-operations/self-hosted/install))
- [Massdriver CLI](/reference/cli/overview) installed

## Get Started

The repository contains setup instructions, customization guides, and examples.

**[→ Clone and start modeling](https://github.com/massdriver-cloud/massdriver-catalog)**

## Related

- [Custom Artifact Definitions](/guides/custom-artifact-definition)
- [Core Artifact Definitions](https://github.com/massdriver-cloud/artifact-definitions)
- [Massdriver Slack](https://massdriver.cloud/slack)

