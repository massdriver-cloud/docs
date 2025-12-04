---
id: introduction
slug: /
title: Massdriver Docs
sidebar_label: Introduction
---

Massdriver turns Infrastructure as Code into reusable, self-service components that developers can deploy and connect visually — without needing to understand the cloud.

## Massdriver Platform Principles

- Bundle-centric architecture — bundles encapsulate best practices, validations, policies, and artifact contracts so mistakes can’t propagate downstream.
- Proactive guardrails — invalid, insecure, or out-of-policy configurations are impossible to express; issues are prevented up front rather than caught in review.
- Pipeline-free automation — ephemeral, on-demand workflows replace permanent IaC pipelines, eliminating pipeline sprawl and the maintenance burden that comes with it.
- Type-safe infrastructure composition — artifact schemas and connection contracts ensure components are compatible before they’re ever deployed.
- The compliant path is the easiest path — developers get a simple, visual, self-service workflow that naturally adheres to ops policies and standards.
- Environment consistency by design — every environment is created from the same validated bundle definitions, eliminating drift and configuration divergence.
- API-first platform — every UI action maps to an API, enabling deep automation, custom tooling, and integration with external systems.
- Bring your own IaC — use Terraform, OpenTofu, Helm, Bicep, etc.; Massdriver adds guardrails, validation, and orchestration without locking you into a DSL.
- No lock-in — infrastructure runs in your cloud accounts, bundles are open, and you retain full ownership of IaC code and state.
- All-in-one orchestration — infrastructure, applications, IAM, security checks, cost insights, and observability live in one cohesive system rather than scattered across tools.

## Massdriver Core Concepts

Massdriver transforms infrastructure as code (IaC) into reusable software components that developers can easily connect and deploy. Here's how it works:

### [Bundles](/concepts/bundles)
Bundles are the building blocks of your infrastructure. Each bundle packages IaC modules, policies, runbooks, and cloud dependencies into a deliverable software component. Think of them as pre-built infrastructure components that developers can use without deep cloud expertise.

### [Project Architecture](/concepts/projects)
Your project architecture is represented as a canvas where you can place and connect bundles. Each bundle instance on your canvas is called a **manifest**, which provides context for how the bundle is used in your project. For example, you might have two Redis manifests - one for user sessions and another for page caching.

### [Environments](/concepts/environments)
Environments (formerly called targets) are where your bundles get deployed. Each environment represents a deployment target (like staging or production) where your infrastructure components run.

### [Artifact Definitions](/concepts/artifact-definitions)
Artifact definitions are standardized contracts that enable state passing between infrastructure modules, even across different IaC tools. They allow bundles to automatically configure resources based on their inputs - for example, binding IAM policies, fetching AWS Secrets Manager secrets, or injecting database credentials into environment variables. This standardization makes it easy to connect cloud resources regardless of how they were provisioned.

### [Packages](/concepts/packages)
When you deploy a bundle in the context of its manifest, it becomes a package - a running instance of your infrastructure component in a specific environment.

This modular approach allows teams to build, share, and deploy infrastructure components with the same ease as traditional software development.

## **Features that Teams Love:**

* **Infrastructure-as-Diagrams**: Diagrams as the source of truth. Onboard team members faster with accurate representations of your cloud environment.
* **Anti-lockin**: Use the best tool for the job in each cloud with the same interface. All infrastructure and applications run in _your_ cloud account - walk away anytime without a migration process.
* **No black boxes**: Our bundles and design docs are all [open source.](https://github.com/massdriver-cloud)
* **Parity**: Each `project` is a _blueprint_ with adjustable scale per application environment, region, or tenant.
* **Secure & Compliant**: Each provisioning runs security benchmarks and compliance scanning.
* **Automated IAM Management**: No one enjoys managing IAM; Massdriver gives teams principal of least privilege by default.
* **Secrets Management**: Secrets are per-row encrypted at rest and dynamically injected into applications at runtime.
* **Deletion Protection Everywhere**: Integrated OPA rules stop accidental deletion of critical infrastructure.
* **Visual Comparison Engine**: Visually _diff_ environments, regions, and deployment history. No more clicking endlessly through a cloud dashboard or reading config files to find out why "it worked in staging."
* **Integrated Monitoring and Alerting**: Infrastructure ships with common sense metrics and thresholds that can be customized. Feel free to cancel PagerDuty - we'll wake you up for free!
* **Naming and tagging conventions**: All resources managed by Massdriver have a consistent naming and tagging convention. One less bikeshed to paint.
* **Fast-tracked compliance**: Correct infrastructure diagrams, activity logs, bundle source code access, resource manifests, and change/deployment history. Everything a compliance auditor desires in their extremely exciting life.
* **Infinitely Extensible**: Extend the platform with the open-source infrastructure-as-code tools your team is familiar with, like [OpenTofu](https://www.massdriver.cloud/partners/opentofu), Terraform, Helm, and Pulumi (coming soon).

Massdriver integrates with any CI system and provides a unified infrastructure and application continuous deployment system.

We fully dogfood Massdriver, and all of [our bundles](https://github.com/orgs/massdriver-cloud/repositories?q=&type=all&language=terraform&sort=) are open-sourced.

## Getting started

* [Developing Custom Infrastructure Components](/getting-started/creating-bundles)
* [Running Applications on Massdriver](/applications/create)

We've got some great getting started tutorials on YouTube.

<iframe width="560" height="315" src="https://www.youtube.com/embed/jWAdaNe57ws" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

## We are here to help

* Explore our [open-source Terraform modules](https://github.com/orgs/massdriver-cloud/repositories?q=&type=all&language=terraform&sort=)
* [Check out (and contribute to) our roadmap](https://roadmap.massdriver.cloud)
* [Join the community Slack](https://join.slack.com/t/massdrivercommunity/shared_invite/zt-1sxag35w2-eYw7gatS1hwlH2y8MCmwXA)
* [Webinars and workshops](https://blog.massdriver.cloud/webinars)
