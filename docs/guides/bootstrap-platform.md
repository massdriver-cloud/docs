---
id: bootstrap-platform
slug: /guides/bootstrap-platform
title: Bootstrap Your Platform
sidebar_label: Bootstrap Your Platform
---

# Bootstrap Your Platform

A bootstrap catalog for self-hosted Massdriver instances containing artifact definitions, infrastructure bundles, and cloud credentials. This catalog helps you quickly model your platform architecture and developer experience before implementing infrastructure code.

**This is your platform foundation.** While typical guides walk you through implementing infrastructure, this catalog helps you design the entire developer experience first. You're not just following a tutorial—you're building your actual platform architecture, testing abstractions, and discovering the right self-service patterns before writing a single line of infrastructure code.

**[→ View the Massdriver Catalog on GitHub](https://github.com/massdriver-cloud/massdriver-catalog)**

## Why Use the Catalog?

The Massdriver Catalog enables a **DevEx-first approach** to platform engineering:

1. **Model your architecture** - Design how services connect using artifact definitions and bundle schemas
2. **Test the developer experience** - Add bundles to your canvas, configure parameters, iterate on what works
3. **Discover the right abstractions** - Should you have one "network" artifact or separate "public-subnet" and "private-subnet" artifacts? Test it visually.
4. **Design before implementing** - Validate your architecture and developer experience, then fill in the infrastructure code when ready

This approach is ideal for platform teams setting up self-hosted Massdriver instances who want to think through their entire infrastructure architecture and self-service interface before committing to implementation details.

## What's Included

### Credential Artifact Definitions

Special artifact definitions that define how Massdriver authenticates to your cloud providers:
- `aws-iam-role.json` - AWS IAM Role credentials
- `azure-service-principal.json` - Azure Service Principal credentials  
- `gcp-service-account.json` - GCP Service Account credentials

These are starting points—customize them to match your provider block requirements.

### Artifact Definitions

JSON Schema-based contracts that define how infrastructure components interact:
- `network.json` - Network/VPC abstraction (subnets, CIDR blocks, routing)
- `postgres.json` - PostgreSQL database connection contract
- `mysql.json` - MySQL database connection contract
- `bucket.json` - Object storage bucket access contract

Each artifact definition has two parts:
- **`data`**: Encrypted connection details (credentials, IAM policies, endpoints, security groups)
- **`specs`**: Public metadata (region, tags, capabilities) visible in the UI

**These are examples to get you started.** Customize them to match your organization's infrastructure patterns and the data your bundles need to exchange.

### Infrastructure Bundles

Template bundles with complete schemas and placeholder infrastructure code:
- `network/` - Network/VPC provisioning
- `postgres/` - PostgreSQL database provisioning  
- `mysql/` - MySQL database provisioning
- `bucket/` - Object storage bucket provisioning
- `application/` - Application deployment template

Each bundle includes:
- ✅ Complete `massdriver.yaml` configuration
- ✅ **Parameter schemas** - Define user-configurable inputs
- ✅ **Connection schemas** - Define dependencies on other bundles
- ✅ **Artifact schemas** - Define what this bundle produces
- ✅ **UI schemas** - Control how configuration forms render
- 🚧 Placeholder OpenTofu/Terraform code (replace with yours)

## Quick Start

### Prerequisites

- Self-hosted Massdriver instance configured (see [installation guide](/self-hosted/install))
- [Massdriver CLI (`mass`)](/cli/overview) installed and authenticated (version 1.13.4+)
- OpenTofu or Terraform installed

### Getting Started

1. **Clone the catalog repository**

```bash
git clone https://github.com/massdriver-cloud/massdriver-catalog.git
cd massdriver-catalog
```

2. **Update GitHub URLs** (Optional - if using your own fork)
   
Replace `YOUR_ORG` with your GitHub organization:

```bash
# macOS/BSD
find . -type f \( -name "*.yaml" -o -name "*.md" \) -exec sed -i '' 's/YOUR_ORG/your-actual-org/g' {} +

# Linux
find . -type f \( -name "*.yaml" -o -name "*.md" \) -exec sed -i 's/YOUR_ORG/your-actual-org/g' {} +
```

3. **Explore the catalog structure**
- Review artifact definitions in `artifact-definitions/`
- Explore bundle schemas in `bundles/*/massdriver.yaml`
- Understand what data flows between bundles

4. **Model your platform**
- Create **projects** in the Massdriver UI - Logical groupings like "ecommerce", "api", "data-platform"
- Create **environments** within projects - "dev", "staging", "production", or preview environments
- Add bundles to your **canvas** - The visual diagram where you design architecture
- **Connect** bundles together - Link artifacts from one bundle to connections in another
- Configure **parameters** - Test what the developer experience feels like

5. **Publish to Massdriver**

```bash
make
```

This will publish artifact definitions and bundles to your Massdriver instance. You'll see them appear in the UI and can start adding them to canvases.

6. **Implement infrastructure code when ready**
- Replace placeholder code in `bundles/*/src/` with your OpenTofu/Terraform
- Test locally with `tofu init` and `tofu plan`
- Update schemas if your implementation needs different parameters
- Republish with `make` to deploy changes

## Three-Phase Workflow

### Phase 1: Architecture Modeling (Now)

1. Use provided artifact definitions and bundle schemas as-is
2. Create projects and environments in the UI
3. Add bundles to your canvas (creating packages)
4. Connect bundles by linking artifact outputs to connection inputs
5. Configure parameters to test the developer experience
6. Design artifact `data` to transmit sensitive information securely
7. Design artifact `specs` to surface infrastructure metadata
8. Iterate on abstractions until they feel right

**Goal**: Discover the right abstractions and design the self-service platform interface before writing infrastructure code.

**Key insight**: Does it make sense to have separate `postgres` and `mysql` bundles? Should your network bundle produce separate artifacts for public/private subnets, or one combined artifact? Test these questions quickly without implementation.

**Don't aim for perfection—aim for feedback.** Get a working version in front of developers and iterate. Real developer feedback beats theoretical perfection.

### Phase 2: Implementation (When Ready)

1. Replace placeholder OpenTofu/Terraform in `bundles/*/src/`
2. Test infrastructure code locally with `tofu plan`
3. Update parameter schemas if needed
4. Publish with `make` (or automate with [GitHub Actions](https://github.com/massdriver-cloud/actions))
5. Deploy packages to test environments and validate

**Goal**: Fill in infrastructure code that matches your validated architectural model.

**Key benefit**: You're implementing against a proven design. You know what parameters developers need, what connections make sense, and what artifacts to produce.

### Phase 3: Continuous Improvement

1. Add more bundles as needed
2. Create custom artifact definitions (see our [guide](/guides/custom_artifact_definition))
3. Refine parameter validation and UI schemas
4. Use [release channels and strategies](/concepts/versions#release-channels) to automate version distribution
5. 👋 Say farewell to ticket ops

## Customization Examples

### Artifact Definitions

Customize artifact definitions to match your organization's needs:

**Example**: If applications need to know whether a database supports read replicas:
- Add a `read_replicas` boolean to the artifact's `specs` (public metadata)
- If they need the replica endpoint, add it to `data` (encrypted)

**Example**: If your AWS provider requires `external_id` for role assumption:
- Add the field to `aws-iam-role.json` credential definition

### Bundle Schemas

Each bundle's `massdriver.yaml` defines the complete contract:

- **params**: Input parameters users configure (instance sizes, database names, etc.)
- **connections**: Input artifacts this bundle depends on
- **artifacts**: Output artifacts this bundle produces  
- **ui**: Controls how configuration forms render

**Important**: Params and connections share the same variable namespace in your IaC code. Use distinct names to avoid conflicts.

## Automation

For production workflows, automate publishing with CI/CD:

- 🚀 **[GitHub Actions](https://github.com/massdriver-cloud/actions)** - Automate artifact definition and bundle publishing

## Best Practices

### Do ✅

- **Start with modeling**: Use schemas to plan before implementing
- **Single-purpose bundles**: Keep focused (e.g., `postgres`, not `rds`)
- **Iterate on abstractions**: Refine based on developer feedback
- **Test the developer experience**: Configure bundles in the UI first
- **Version your bundles**: Use semantic versioning for stability

### Don't ❌

- **Rush to implementation**: Model your architecture first
- **Create generic bundles**: Be specific about use cases
- **Skip documentation**: Update descriptions and help text
- **Ignore validation**: Use JSON Schema to prevent errors
- **Forget about UI**: Good UX drives adoption

## Learn More

- 📚 **[Catalog Repository](https://github.com/massdriver-cloud/massdriver-catalog)** - The full catalog with examples
- 📖 **[Custom Artifact Definitions](/guides/custom_artifact_definition)** - Create custom artifact definitions
- 🎯 **[Core Artifact Definitions](https://github.com/massdriver-cloud/artifact-definitions)** - Standard types from Massdriver SaaS
- 💬 **[Massdriver Slack](https://massdriver.cloud/slack)** - Community support

---

**Remember**: This catalog is your platform foundation. Clone it, customize it, make it yours. Design the self-service platform interface before writing infrastructure code. Start modeling today, implement tomorrow.

