---
id: getting-started-overview
slug: /getting-started/overview
title: Getting Started with Massdriver
sidebar_label: Overview
---

Welcome to Massdriver! This getting started guide will walk you through the essential workflows and features of our platform. By the end of this series, you'll be comfortable with the core concepts and ready to start building your own infrastructure.

## What is Massdriver?

Massdriver is a comprehensive platform for managing cloud infrastructure through reusable, composable bundles. Our platform combines the power of infrastructure-as-code with visual design tools, making it easy to build, deploy, and manage complex cloud architectures.

## What You'll Learn

This getting started guide is organized into several focused sections:

1. **[Deploying Your First Bundle](01-deploying-first-bundle.md)** - Get hands-on experience with the core Massdriver workflow by publishing and deploying a simple bundle
2. **[Connecting Bundles With Artifacts](02-connecting-bundles.md)** - Learn how connect bundles together and share information between them using artifacts and connections
3. **[Creating Your Own Bundle](03-creating-bundles.md)** - Convert existing Terraform/OpenTofu modules into Massdriver bundles
4. **[Using Bundle Deployment Metadata](04-using-bundle-metadata.md)** - Leverage automatically injected metadata for resource naming, tagging, and conditional logic

Each guide builds upon the previous one, giving you a comprehensive understanding of how to work with Massdriver effectively.

## Two Paths to Getting Started

Massdriver offers two approaches to building your infrastructure platform:

### 🎨 **DevEx-First: Bootstrap Your Platform**

**If you want to start by designing your entire developer experience before writing any infrastructure code**, explore **[Bootstrap Your Platform](../guides/bootstrap-platform)**. This bootstrap catalog helps you model your platform architecture first, implement later.

The catalog is a collection of artifact definitions, bundle schemas, and credential templates that help you:

- **Model your architecture** - Design how bundles connect and what artifacts they produce
- **Test the developer experience** - Add bundles to your canvas, configure parameters, and iterate on abstractions
- **Design your platform** - Organize projects, environments, and infrastructure patterns
- **Implement when ready** - Fill in OpenTofu/Terraform code once you've validated the experience

This approach is ideal for platform teams setting up self-hosted Massdriver instances who want to think through their entire infrastructure architecture and self-service interface before committing to implementation details. The catalog teaches you how to **use and organize** your IaC and projects in Massdriver.

**→ [Bootstrap Your Platform guide](../guides/bootstrap-platform)**

### 🔧 **Bundle Development: The Getting Started Guide** (This Guide)

The guides below teach you how to **build custom bundles** from scratch or convert existing Terraform/OpenTofu modules. This is perfect for:

- Teams already familiar with Massdriver who want to create new bundles
- Converting existing infrastructure code to Massdriver bundles
- Learning the technical details of bundle development

**Which path should you choose?** If you're setting up a self-hosted Massdriver instance or want to design your entire platform architecture, start with the **Massdriver Catalog**. If you already have Massdriver set up and want to build specific bundles, follow this **Getting Started Guide**. Both paths complement each other!

## Prerequisites

Before you begin, you'll need:
- A **free** Massdriver account - [Create one here](https://app.massdriver.cloud/register)
- The **Mass CLI** installed and configured - [Installation guide](../cli/overview)


:::tip Need Help?

For any questions or assistance with these guides, join our [Slack community](https://join.slack.com/t/massdrivercommunity/shared_invite/zt-1smvckvdj-jVFpBG2jF5XiYzX2njDCWA) where our team and community members are happy to help!

:::

## Key Concepts

As you work through these guides, you'll encounter several important Massdriver concepts:

- **Bundles** - Reusable infrastructure modules that define cloud resources
- **Artifacts** - Standardized outputs that enable bundles to communicate with each other

Don't worry if these concepts aren't immediately clear - you'll see them in action as you progress through the guides.

## Ready to Get Started?

Now that you understand what to expect, let's dive into your first hands-on experience with Massdriver. Head over to the [Deploying Your First Bundle](01-deploying-first-bundle.md) guide to begin your journey!
