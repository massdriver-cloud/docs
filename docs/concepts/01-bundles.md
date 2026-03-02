---
id: concepts-bundles
slug: /concepts/bundles
title: Bundles
sidebar_label: Bundles
---

A **bundle** is a reusable, versioned definition of cloud infrastructure or application components. It encapsulates infrastructure-as-code (IaC) modules, their configuration schemas, dependencies, outputs, deployment logic, and policy-as-code into a single, composable unit.

Bundles solve a fundamental problem in cloud infrastructure management: how to create, share, and compose infrastructure components while maintaining type safety, security, and operational best practices. Instead of managing raw IaC code and ad-hoc configuration, bundles provide a structured contract that defines:

- **What inputs are required** (parameters and connections)
- **What outputs are produced** (artifacts)
- **How to deploy** (provisioning steps)
- **How to configure applications** (secrets, environment variables, IAM policies)
- **What policies are enforced** (policy-as-code validations)

## Bundles make Infrastructure-as-Code adoption scalable

Modern teams struggle with complex cloud setups, slow provisioning, and DevOps bottlenecks. Traditional IaC workflows require developers to author Terraform, Helm, or other infrastructure code, push to Git, and wait for CI pipelines to execute—a process that leads to long code review cycles and a steep learning curve for those not deeply familiar with cloud internals. This slows down innovation and creates friction between fast-moving development needs and the safeguards of operations.

Many organizations attempt to implement self-service infrastructure via ad-hoc scripts or internal platforms, but these typically demand significant engineering effort (e.g., building custom frontends and backends) or still rely on heavy gatekeeping in CI/CD. The result is inconsistent practices, misconfigurations, and "shadow IT" where developers bypass official processes, causing configuration drift and compliance issues.

Bundles address these challenges by providing a safe self-service framework that lets operations teams encode best practices, security policies, and cloud architecture patterns into ready-to-use modules, while developers get a simple interface to deploy what they need. This means developers can move fast without breaking things, because guardrails are built-in. By eliminating unnecessary red tape and providing an easier interface than even cloud consoles, bundles make the compliant path the path of least resistance—preventing configuration drift and errors at the source.

## Bundle Principles

### Bundle-Centric Architecture

Bundles encapsulate best practices, validations, policies, and artifact contracts so mistakes can't propagate downstream. When you use a bundle, you're not just deploying code—you're deploying a complete, validated configuration that has been tested and proven.

### Proactive Guardrails

Invalid, insecure, or out-of-policy configurations are impossible to express. Issues are prevented up front rather than caught in review. The bundle schema validates all inputs before deployment begins.

### Pipeline-Free Automation

Ephemeral, on-demand workflows replace permanent IaC pipelines, eliminating pipeline sprawl and the maintenance burden that comes with it. Each deployment is a fresh execution based on the bundle definition.

### Type-Safe Infrastructure Composition

Artifact schemas and connection contracts ensure components are compatible before they're ever deployed. You can't connect a PostgreSQL database to a component expecting a Redis connection—the system validates compatibility at design time.

### The Compliant Path is the Easiest Path

Developers get a simple, visual, self-service workflow that naturally adheres to ops policies and standards. The bundle enforces compliance by design.

### Environment Consistency by Design

Every environment is created from the same validated bundle definitions conceptually, eliminating drift and configuration divergence. While environments may use different bundle versions, they all follow the same bundle structure and validation rules, with environment-specific parameter values.

### Single-Purpose Design

A Massdriver bundle typically serves a single purpose rather than abstracting an entire cloud service. Instead of generic modules like `AWS RDS`, bundles are designed around the use case a software engineer is looking for, like `AWS RDS MySQL`. In Massdriver, we advise against bundles like 'S3 Bundle' and instead suggest bundles like 'S3 Logging Bucket' or 'CDN' (using S3 & CloudFront). This approach ensures bundles are composable, maintainable, and aligned with actual engineering needs.

### Bring Your Own IaC

Use Terraform, OpenTofu, Helm, Bicep, or any other IaC tool. Massdriver adds guardrails, validation, and orchestration without locking you into a DSL. Your IaC code remains in your repositories, under your control.

### No Lock-In

Infrastructure runs in your cloud accounts, bundles are open specifications, and you retain full ownership of IaC code and state. Bundles are stored in OCI-compatible registries and can be used independently of the platform.

## Bundle Lifecycle

### Development

1. **Create** a bundle repository with your IaC code using the Massdriver CLI, or start from a template in the [Bundle Template Library](https://www.massdriver.cloud/templates)
2. **Define** the `massdriver.yaml` file with schemas and configuration
3. **Test** using Development Releases: publish to a development release and test against ephemeral infrastructure

### Publishing

1. **Publish** a versioned bundle to the Massdriver registry. Stable semantic version releases automatically upgrade all active infrastructure modules when they pass plans and scans.

### Deployment

1. **Add** the bundle to an environment canvas from the bundle sidebar
2. **Configure** parameters and connections with proactive guardrails
3. **Deploy** to an environment
4. **Get back to writing software** - Your infrastructure is provisioned in minutes, not days

## Related Documentation

- [Bundle YAML Specification](/bundle-development/bundle-yaml-spec) - Complete reference for `massdriver.yaml`
- [Schema Design](/bundle-development/schema-design/overview) - JSON Schema patterns and Massdriver annotations
- [Provisioners](/bundle-development/provisioners/overview) - Configure OpenTofu, Terraform, Helm, Bicep
- [Artifacts & Definitions](/concepts/artifacts-and-definitions) - How bundles connect through typed contracts
- [Getting Started: Creating Bundles](/getting-started/creating-bundles) - Step-by-step tutorial
