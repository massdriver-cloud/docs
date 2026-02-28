---
id: introduction
slug: /
title: Massdriver Docs
sidebar_label: Introduction
---

Massdriver is an internal developer platform that turns infrastructure-as-code into reusable, self-service components. Platform teams encode best practices, security policies, and architecture patterns into bundles. Developers deploy what they need through a visual interface without writing IaC or managing pipelines.

## How Massdriver Works

**Bundles** package IaC modules (Terraform, OpenTofu, Helm, Bicep) with input schemas, output contracts, policies, and documentation. Each bundle represents a production-ready piece of architecture with your organization's standards built in.

**Artifacts** are standardized contracts that pass state between infrastructure modules—even across different IaC tools. They enable automatic configuration: binding IAM policies, injecting credentials, connecting services.

**The canvas** lets developers drag bundles, connect them visually, and deploy. Massdriver validates connections using artifact schemas, so developers don't need deep cloud knowledge to assemble working infrastructure.

**Ephemeral pipelines** run IaC automatically when developers deploy. No pipeline code to maintain. Massdriver orchestrates the workflow, manages state, and runs compliance checks on every deployment.

## Core Principles

- **Proactive guardrails** — Invalid, insecure, or out-of-policy configurations are impossible to express. Issues are prevented, not caught in review.
- **The compliant path is the easiest path** — Developers get a simple, visual workflow that naturally adheres to ops policies.
- **Pipeline-free automation** — Ephemeral, on-demand workflows replace permanent IaC pipelines.
- **Type-safe composition** — Artifact schemas ensure components are compatible before deployment.
- **Bring your own IaC** — Use Terraform, OpenTofu, Helm, Bicep. Massdriver adds guardrails without locking you into a DSL.
- **No lock-in** — Infrastructure runs in your cloud accounts. You own the IaC code and state.
- **API-first** — Every UI action maps to an API for automation and integration.

## AI-Ready Infrastructure

Massdriver provides structured context that AI agents need to work reliably with infrastructure:

- **Queryable infrastructure graph** — Projects, environments, components, metrics, and alarms connected in a unified model
- **Schema-validated inputs** — JSON Schema enforcement rejects invalid configurations before execution
- **Policy enforcement** — SOC2, HIPAA, CIS benchmarks checked on every deployment
- **Full audit trail** — Complete visibility into every change and deployment

AI agents can generate IaC. Massdriver makes it trustworthy.

## Getting Started

### Start with the Catalog

**[Massdriver Catalog](https://github.com/massdriver-cloud/massdriver-catalog)** — A complete, git-ready catalog of artifact definitions and infrastructure bundles. Clone it, customize it, and use it as the foundation for your platform. The catalog helps you model your platform architecture and developer experience before writing infrastructure code.

### Learn the Fundamentals

Work through the getting started guides using example bundles from the catalog:

1. **[Deploy Your First Bundle](/getting-started/deploying-first-bundle)** — Publish, configure, and deploy a bundle
2. **[Connect Bundles Together](/getting-started/connecting-bundles)** — Pass artifacts between infrastructure components
3. **[Create Your Own Bundle](/getting-started/creating-bundles)** — Build custom bundles from existing IaC
4. **[Bundle Metadata & Schemas](/getting-started/using-bundle-metadata)** — Design parameter schemas and presets

### Deploy Applications

**[Running Applications](/applications)** — Deploy containers, serverless functions, and other workloads on your infrastructure.

## Resources

- [Open-source Terraform modules](https://github.com/orgs/massdriver-cloud/repositories?q=&type=all&language=terraform&sort=)
- [Product roadmap](https://roadmap.massdriver.cloud)
- [Community Slack](https://join.slack.com/t/massdrivercommunity/shared_invite/zt-1sxag35w2-eYw7gatS1hwlH2y8MCmwXA)
- [Webinars and workshops](https://blog.massdriver.cloud/webinars)

<iframe width="560" height="315" src="https://www.youtube.com/embed/jWAdaNe57ws" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
