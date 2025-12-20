---
id: concepts-environment-default-connections
slug: /concepts/environment-default-connections
title: Environment Default Connections
sidebar_label: Environment Default Connections
---

Environment default connections let you automatically share common infrastructure across all bundles in an environment without drawing individual connection lines for each bundle.

<!-- TODO: Add screenshot showing environment defaults overlay -->

## What Are Environment Default Connections?

Environment defaults are shared resources—like landing zones, networks, Kubernetes namespaces, or cloud credentials—that you set once per environment. They automatically connect to all compatible bundles, eliminating the need to manually wire the same infrastructure to dozens of packages.

Instead of appearing as connection lines on your canvas, environment defaults work invisibly in the background, keeping your diagrams clean and focused on unique architectural relationships.

## How They Work

When you set a resource as an environment default:

1. **Set once**: Configure the default through the environment overlay (cloud icon in the top bar)
2. **Auto-connect**: All bundles with compatible connection types automatically receive the artifact
3. **Clean canvas**: No connection lines clutter your diagram
4. **Visual indicator**: Bundles show they're using a default with subtle UI cues

Environment defaults are organized by **groups** (like `networking`, `credentials`, `kubernetes`) that categorize similar infrastructure types.

## What Problems They Solve

### Reduce Repetition

Without environment defaults, you'd need to draw connection lines from your shared VPC to every single application and database in your environment. With 20 bundles, that's 20 redundant connections to manage.

**With environment defaults**: Set your VPC once as the network default, and all 20 bundles automatically use it.

### Cleaner Diagrams

Connection lines communicate architectural decisions. When every bundle connects to the same network, those lines add noise without conveying meaningful information.

**Environment defaults remove visual clutter**, letting you focus on the connections that matter: which app talks to which database, which service depends on which queue.

### Faster Environment Setup

When creating a new environment (like a staging or preview environment), you can set a few environment defaults and immediately deploy dozens of bundles without individually configuring each one's infrastructure dependencies.

**Environment defaults accelerate environment creation** from hours to minutes.

### Guarantee Consistency

Environment defaults ensure every bundle in an environment uses the correct shared infrastructure. Your production applications will always use the production VPC and production credentials—no risk of misconfiguration.

**Environment defaults enforce infrastructure boundaries** between environments automatically.

## Common Use Cases

### Landing Zones

Landing zones are pre-configured cloud environments that establish security guardrails, networking, identity management, and governance policies. Set your landing zone as an environment default to ensure all infrastructure in that environment inherits the correct security posture, compliance controls, and organizational policies automatically—without teams needing to configure these foundational controls for each bundle.

```bash
mass environment default prod-env landing-zone-artifact-id
```

### VPCs and Networks

Set your VPC/Virtual Network as an environment default so every bundle deploys into the correct network without manual configuration.

```bash
mass environment default prod-env vpc-artifact-id
```

### Kubernetes Namespaces

For platform teams managing shared Kubernetes infrastructure, set your namespace as an environment default so applications automatically deploy to the right namespace.

### Cloud Credentials

Set cloud provider credentials (AWS IAM roles, Azure service principals, GCP service accounts) as environment defaults to ensure all infrastructure provisions with the correct authentication.

### DNS Zones

Set shared DNS zones as environment defaults so applications can automatically register routes in the correct domain.

## Setting Environment Defaults

### Via UI

Click the **cloud icon** in the environment toolbar and select the artifact you want to set as a default for the appropriate group.

<!-- TODO: Add screenshot/gif of setting environment default via UI -->

### Via CLI

Use the Massdriver CLI to set environment defaults programmatically:

```bash
mass environment default <environment-id> <artifact-id>
```

**Example**:
```bash
mass env default api-prod abc123-def456
```

See the [CLI documentation](/cli/commands/mass_environment_default) for more details.

## Environment Defaults vs. Explicit Connections

You can choose between environment defaults and explicit connections based on your use case:

| Approach | When to Use |
|----------|-------------|
| **Environment Default** | Shared infrastructure used by most/all bundles (landing zones, networks, namespaces, credentials) |
| **Explicit Connection** | Unique relationships that communicate architecture (app → database, service → queue) |

Some artifact types support both approaches, giving you flexibility. For example:
- **SREs** might draw explicit connections to Kubernetes namespaces to visualize platform architecture
- **Developers** might only see the namespace as an environment default, simplifying their experience

## Configuring Artifact Types as Environment Defaults

If you're building custom bundles for a self-hosted Massdriver instance, you can control which artifact types appear as environment defaults by setting the `$md.ui.environmentDefaultGroup` field in your artifact definition.

```json
{
  "$md": {
    "ui": {
      "environmentDefaultGroup": "networking"
    }
  }
}
```

This makes your custom artifact type eligible to be set as an environment default under the `networking` group.

### The Special `credentials` Group

There's a special environment default group called `credentials`. Artifacts assigned to this group:
- Appear on the credentials page in the UI
- Enable Massdriver to fetch credentials for use in workflows
- Follow special security and access control rules

**Example**: Cloud provider credentials (AWS IAM roles, Azure service principals) should use the `credentials` group.

### Controlling Connection Visibility

Use `$md.ui.connectionOrientation` to control how artifacts appear:

- `"link"`: Users can draw connection lines to the artifact (explicit connections)
- `"environmentDefault"`: Artifact only appears as a default, not as a connectable box on the canvas
- **Both**: You can enable both modes independently for maximum flexibility

See the [Custom Artifact Definition Guide](/guides/custom-artifact-definition#customizing-the-artifact-types-that-can-be-defaulted-in-an-environment) for more details.

## Best Practices

### Do ✅

- **Use environment defaults for shared infrastructure** that most bundles need (landing zones, networks, namespaces, credentials)
- **Use explicit connections for architectural relationships** that communicate design decisions
- **Set environment defaults early** when creating new environments
- **Group related defaults** using consistent group names across your organization

### Don't ❌

- **Don't use defaults for unique relationships** (e.g., a specific app connecting to its specific database)
- **Don't overuse defaults** - explicit connections can be valuable documentation
- **Don't mix approaches inconsistently** - decide on patterns and stick to them across environments

## Learn More

- [Environments Concept](/concepts/environments) - Understanding environments in Massdriver
- [Connections Concept](/concepts/connections) - How explicit connections work
- [Custom Artifact Definitions](/guides/custom-artifact-definition) - Creating custom artifact types with environment defaults
- [CLI: Setting Environment Defaults](/cli/commands/mass_environment_default) - Command-line management
- [Sharing Infrastructure Guide](/guides/sharing-infrastructure) - Practical examples of using environment defaults

