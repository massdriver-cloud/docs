---
id: networking-templates
slug: /guides/networking-templates
title: Network Organization Templates
sidebar_label: Network Organization Templates
---

# Network Organization Templates

This guide provides common patterns for organizing network infrastructure (VPCs, subnets, VPN tunnels) using Massdriver's project/environment hierarchy. These templates help you avoid "mostly undeployed" diagrams by correctly mapping network parity to your organizational needs.

## Key Concepts Refresher

- **Projects**: Enforce architectural parity across all environments. All environments in a project share the same canvas/diagram.
- **Environments**: Can differ in scale and configuration, but maintain the same architecture as their project.
- **Environment Defaults (ED)** 😂: Shared resources that auto-connect to all compatible bundles without cluttering the canvas. Networks are invisible when set as ED.
- **Remote References (RR)**: Allow packages to reference resources from other projects/environments, appearing as boxes on the canvas. RR enables **intentional disparity**: you can substitute a resource from elsewhere or leave a resource undeployed entirely. Undeployed packages remain visible on the canvas with a clear status indicator, making architectural differences between environments explicit.

:::tip The Parity Problem
If you create a project with 5 network bundles on the canvas but only 2 are actually deployed in each environment (the other 3 showing as undeployed), you've mis-scoped your project. This guide helps you avoid that by thinking through which networks should have parity across environments.
:::

---

## Template 1: Environment-Per-Network (Fully Isolated)

**Scenario**: Each application environment (prod, staging, dev) needs its own completely isolated network. No shared networking infrastructure.

**When to use**:
- Maximum isolation required (compliance, security)
- Multi-tenant SaaS with strict tenant separation
- Each environment managed by different teams

### Project Structure

**Project**: `corporate-networks`

**Environments**:
- `production`
- `staging`
- `development`

**Canvas** (same for all environments):
```
[VPC/Virtual Network]
├── [Public Subnets]
├── [Private Subnets]
└── [Database Subnets]
```

### What Gets Deployed

**Production Environment**:
- VPC: `10.0.0.0/16`, 3 AZs, multi-region replication
- All subnets deployed

**Staging Environment**:
- VPC: `10.1.0.0/16`, 1 AZ, single-region
- All subnets deployed

**Development Environment**:
- VPC: `10.2.0.0/16`, 1 AZ
- All subnets deployed

### Implementation

**Environment Defaults**: None

**Remote References**: None

**Result**: All 3 environments deploy all 3 bundles. **No undeployed packages**. Parity is maintained (all envs have same network structure), scale differs (AZ count, CIDR size).

### Pros & Cons

✅ Clean parity - all environments deploy everything
✅ Maximum isolation
✅ Easy to understand

❌ Highest cost (3 complete networks)
❌ More resources to manage

---

## Template 2: Shared Networks with Per-Environment CIDRs

**Scenario**: You want a single project to provision multiple networks for different application environments, but each network is independent.

**When to use**:
- Centralized network team manages all networks
- Want single source of truth for all network configs
- Networks don't connect to each other

### Project Structure

**Project**: `platform-networks`

**Environments**:
- `production-usw2`
- `production-use1`
- `staging`
- `development`

**Canvas** (same for all environments):
```
[VPC/Virtual Network]
├── [Public Subnets]
├── [Private Subnets]
└── [Database Subnets]
```

### What Gets Deployed

**Production-USW2 Environment**:
- VPC: `10.0.0.0/16` in us-west-2
- All subnets deployed

**Production-USE1 Environment**:
- VPC: `10.10.0.0/16` in us-east-1
- All subnets deployed

**Staging Environment**:
- VPC: `10.1.0.0/16` in us-west-2
- All subnets deployed

**Development Environment**:
- VPC: `10.2.0.0/16` in us-west-2
- All subnets deployed

### Implementation

**Environment Defaults**: Each network artifact is set as ED in consuming application projects (different applications projects reference these networks)

**Remote References**: None

**Result**: All environments deploy all bundles. **No undeployed packages**. Each environment provisions one complete network with different configs.

### Pros & Cons

✅ Clean parity - every environment deploys everything
✅ Single project for all network management
✅ Easy to compare network configs across envs

❌ Many environments to manage if you have many networks
❌ Can't easily model cross-network connections in same project

---

## Template 3: Hub Network with Spoke Networks

**Scenario**: You have a central hub network that provides shared services, plus multiple spoke networks for teams/applications. Spokes connect to hub via VPN tunnels, VPC peering, or Transit Gateway.

**When to use**:
- Enterprise with centralized shared services
- Multiple teams need isolated networks but shared connectivity
- Want to model network topology explicitly

### Project Structure

**Project 1**: `hub-network`

**Environments**:
- `production-hub`
- `staging-hub`

**Canvas**:
```
[Hub VPC]
├── [Public Subnets]
├── [Private Subnets]
├── [Transit Gateway]
└── [VPN Gateway]
```

**Project 2**: `spoke-networks`

**Environments**:
- `team-auth-production`
- `team-payments-production`
- `team-analytics-production`
- `team-auth-staging`
- `team-payments-staging`
- `team-analytics-staging`

**Canvas** (same for all environments):
```
[Spoke VPC]
├── [Public Subnets]
├── [Private Subnets]
└── [Database Subnets]
```

**Project 3**: `network-connectivity`

**Environment**:
- `production-mesh`

**Canvas**:
```
[Hub VPC] (RR from hub-network, undeployed)
[Auth Spoke VPC] (RR from spoke-networks team-auth-production, undeployed)
[Payments Spoke VPC] (RR from spoke-networks team-payments-production, undeployed)
[Analytics Spoke VPC] (RR from spoke-networks team-analytics-production, undeployed)
[Transit Gateway Attachment - Hub]
[Transit Gateway Attachment - Auth]
[Transit Gateway Attachment - Payments]
[Transit Gateway Attachment - Analytics]
[TGW Route Table]
```

### What Gets Deployed

**Hub Network Project**:
- Production-hub env: Hub VPC `10.0.0.0/16`, all subnets, Transit Gateway, VPN Gateway
- Staging-hub env: Hub VPC `10.1.0.0/16`, all subnets, Transit Gateway, VPN Gateway

**Spoke Networks Project**:
- Team-auth-production: Spoke VPC `10.10.0.0/16`, all subnets
- Team-payments-production: Spoke VPC `10.20.0.0/16`, all subnets
- Team-analytics-production: Spoke VPC `10.30.0.0/16`, all subnets
- (Staging envs deploy with different CIDRs)

**Network Connectivity Project**:
- Production-mesh env: 4 undeployed VPCs (RR), 4 deployed Transit Gateway attachments, 1 deployed route table

### Implementation

**Environment Defaults**: Application projects use these VPCs as ED (hub or specific spoke depending on the app)

**Remote References**: network-connectivity project uses RR to reference VPCs from other projects, then creates connectivity resources (TGW attachments)

**Result**: Connectivity project has intentional disparity - VPCs shown as undeployed (they exist elsewhere), only connectivity resources deployed.

### Pros & Cons

✅ Clear separation of concerns (networks vs connectivity)
✅ Easy to see hub-spoke topology
✅ Spokes have clean parity (all teams get same structure)

❌ More complex (3 projects)
❌ Connectivity project has undeployed packages (but this is intentional)

---

## Template 4: Regional Networks with Cross-Region Tunnels

**Scenario**: You have networks in multiple regions and need to connect them with VPN tunnels or VPC peering for replication or failover.

**When to use**:
- Multi-region deployments
- Active-active or DR architectures
- Data replication across regions

### Project Structure

**Project 1**: `regional-networks`

**Environments**:
- `us-west-2`
- `us-east-1`
- `eu-west-1`
- `ap-southeast-1`

**Canvas** (same for all environments):
```
[VPC]
├── [Public Subnets]
├── [Private Subnets]
├── [Database Subnets]
└── [VPN Gateway]
```

**Project 2**: `cross-region-tunnels`

**Environment**:
- `global-mesh`

**Canvas**:
```
[US-West-2 VPC] (RR, undeployed)
[US-East-1 VPC] (RR, undeployed)
[EU-West-1 VPC] (RR, undeployed)
[VPN Connection - USW to USE]
[VPN Connection - USW to EU]
[VPN Connection - USE to EU]
```

### What Gets Deployed

**Regional Networks Project**:
- us-west-2: VPC `10.10.0.0/16`, all subnets, VPN Gateway
- us-east-1: VPC `10.20.0.0/16`, all subnets, VPN Gateway
- eu-west-1: VPC `10.30.0.0/16`, all subnets, VPN Gateway
- ap-southeast-1: VPC `10.40.0.0/16`, all subnets, VPN Gateway

**Cross-Region Tunnels Project**:
- global-mesh: 3 undeployed VPCs (RR), 3 deployed VPN connections

### Implementation

**Environment Defaults**: Regional application projects use regional VPCs as ED

**Remote References**: cross-region-tunnels project references regional VPCs, creates VPN connections between them

**Result**: Tunnels project has intentional disparity (VPCs undeployed, tunnels deployed).

### Pros & Cons

✅ Clean regional network management
✅ Easy to visualize cross-region connectivity
✅ Simple to add new regions (add environment)

❌ Tunnels project has undeployed VPCs (but intentional)
❌ Must manage CIDR allocation carefully

---

## Template 5: Per-Developer Networks

**Scenario**: Developers get their own isolated networks for testing infrastructure changes without affecting shared environments.

**When to use**:
- Developers need to test network changes
- Platform team provides self-service networking
- Want isolation for experimentation

### Project Structure

**Project**: `developer-networks`

**Environments**:
- `alice-dev`
- `bob-dev`
- `carol-dev`
- `dave-dev`

**Canvas** (same for all environments):
```
[VPC]
├── [Public Subnets]
├── [Private Subnets]
└── [Database Subnets]
```

### What Gets Deployed

**Alice-Dev Environment**:
- VPC: `10.10.0.0/16`, all subnets

**Bob-Dev Environment**:
- VPC: `10.11.0.0/16`, all subnets

**Carol-Dev Environment** (testing new subnet structure):
- VPC: `10.12.0.0/16`, all subnets (but different sizes/CIDRs)

**Dave-Dev Environment**:
- VPC: `10.13.0.0/16`, all subnets

### Implementation

**Environment Defaults**: None (developers control everything)

**Remote References**: None for this project (though developers might reference these from their app projects)

**Result**: All environments deploy all bundles. **No undeployed packages**. Clean parity with per-environment configuration.

### Pros & Cons

✅ Clean parity - all devs get same structure
✅ Easy to provision new developer environments
✅ Developers can experiment safely

❌ Can be expensive with many developers
❌ Need cleanup policies

---

## Template 6: Environment-Specific Network Features

**Scenario**: Production has advanced networking features (VPN, Transit Gateway, Network Firewall) that staging/dev don't need. You want to show these on the canvas but only deploy selectively.

**When to use**:
- Production has compliance requirements staging doesn't
- Want to visualize full production architecture but not pay for it in all envs
- Testing network features before full rollout

### Project Structure

**Project**: `corporate-network`

**Environments**:
- `production`
- `staging`
- `development`

**Canvas** (same for all environments):
```
[VPC]
├── [Public Subnets]
├── [Private Subnets]
├── [Database Subnets]
└── [Transit Gateway]

[VPN Gateway]
[Network Firewall]
[DNS Firewall]
```

### What Gets Deployed

**Production Environment**:
- VPC + all subnets: Deployed
- Transit Gateway: Deployed
- VPN Gateway: Deployed
- Network Firewall: Deployed
- DNS Firewall: Deployed

**Staging Environment**:
- VPC + all subnets: Deployed
- Transit Gateway: **Undeployed** (not configured, skipped)
- VPN Gateway: **Undeployed**
- Network Firewall: **Undeployed**
- DNS Firewall: **Undeployed**

**Development Environment**:
- VPC + all subnets: Deployed
- Transit Gateway: **Undeployed**
- VPN Gateway: **Undeployed**
- Network Firewall: **Undeployed**
- DNS Firewall: **Undeployed**

### Implementation

**Environment Defaults**: VPC artifact can be set as ED for application projects

**Remote References**: None

**Disparity**: Staging and dev environments have 4 undeployed packages (advanced networking features). This is **intentional disparity** - you're showing what production looks like while not paying for those features in lower environments.

**Result**: This creates "undeployed" packages, but it's intentional. The canvas shows the full architecture across all environments with clear visibility into what's deployed where.

### Pros & Cons

✅ Single source of truth for network architecture
✅ Clear visibility into production vs non-production features
✅ Can promote features from dev → staging → prod

❌ Many undeployed packages in non-prod (but this is intentional)
❌ Canvas looks "incomplete" for staging/dev (though accurately reflects reality)

:::warning When to Use This Pattern
Use this template when you WANT to show architectural differences between environments. If the undeployed packages bother you, consider splitting into separate projects instead (e.g., "basic-networks" vs "production-networks").
:::

---

## Decision Matrix: Choosing the Right Template

| Consideration | Template 1<br/>Isolated | Template 2<br/>Shared Mgmt | Template 3<br/>Hub-Spoke | Template 4<br/>Regional | Template 5<br/>Dev Sandboxes | Template 6<br/>Feature Disparity |
|---------------|------------------------|---------------------------|--------------------------|------------------------|------------------------------|----------------------------------|
| **Parity** | ✅ Clean | ✅ Clean | ✅ Clean | ✅ Clean | ✅ Clean | ⚠️ Intentional disparity |
| **Undeployed Packages** | ❌ None | ❌ None | ⚠️ Some (connectivity project) | ⚠️ Some (tunnels project) | ❌ None | ⚠️ Many (non-prod envs) |
| **Complexity** | ⭐ Simple | ⭐⭐ Moderate | ⭐⭐⭐⭐ Complex | ⭐⭐⭐ Moderate | ⭐ Simple | ⭐⭐ Moderate |
| **Projects** | 1 | 1 | 3 | 2 | 1 | 1 |
| **Best For** | Maximum isolation | Centralized mgmt | Enterprise hub-spoke | Multi-region | Developer enablement | Showing prod architecture |

---

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: One Project Per Network

**Don't**:
```
Project: production-vpc (1 environment: prod)
Project: staging-vpc (1 environment: staging)
Project: dev-vpc (1 environment: dev)
```

**Why**: You lose parity enforcement. Each project is independent, so you can't ensure architectural consistency.

**Do instead**: Use Template 1 or 2 (single project, multiple environments).

---

### ❌ Anti-Pattern 2: Mixing Unrelated Networks in One Project

**Don't**:
```
Project: all-networks
Environments: production

Canvas:
[US-West Production VPC]
[EU-West Production VPC]
[Staging VPC]
[Dev VPC]
[Alice's Dev VPC]
[Bob's Dev VPC]
[DMZ VPC]
```

**Why**: These networks have nothing to do with each other. When you create a staging environment, you'd have to deploy 7 VPCs, most marked as "undeployed" because they don't make sense in staging context.

**Do instead**: Split into logical projects (Template 4 for regional, Template 5 for dev sandboxes).

---

### ❌ Anti-Pattern 3: Networks + Applications in Same Project

**Don't**:
```
Project: ecommerce
Canvas:
[VPC]
[Subnets]
[EKS Cluster]
[RDS Database]
[Applications]
```

**Why**: Networks and applications have different lifecycles. Networks rarely change. Applications change constantly. If you want to test a new application, you shouldn't need to think about network configs.

**Do instead**: Separate projects for networks and applications. Networks provide artifacts via ED to application projects.

---

## Best Practices

### ✅ Scope Projects by Network Lifecycle

Networks that have the same lifecycle should be in the same project:
- **Good**: Production network + Production DR network in one project (both change together)
- **Bad**: Production network + Developer sandbox networks (completely different lifecycles)

### ✅ Use Separate Projects for Cross-Network Connectivity

If you have VPC peering, VPN tunnels, or Transit Gateway attachments:
- Put the VPCs themselves in one project (or multiple projects if they have different lifecycles)
- Put the connectivity resources in a separate project that uses RR to reference the VPCs

This keeps the network projects clean and makes connectivity explicit.

### ✅ Accept Intentional Disparity for Connectivity Projects

Projects that handle connectivity (Template 3, Template 4) will have undeployed VPC packages because they're using RR. **This is OK**. The canvas is showing the network topology, not claiming to deploy the VPCs.

### ✅ Document When Disparity Is Intentional

If you're using Template 6 (environment-specific features), add notes in the bundle descriptions explaining why certain packages are undeployed in certain environments. This helps teammates understand the architecture.

---

## Migration Paths

### Starting Small → Growing

1. **Start with Template 2**: Single project, multiple environments, centralized network management
2. **Add Template 5**: When developers need sandboxes
3. **Split to Template 3**: When you grow to hub-spoke architecture
4. **Add Template 4**: When you go multi-region

### Consolidating Sprawl

If you have many single-environment projects (Anti-Pattern 1):
1. Identify networks with same lifecycle (prod networks, staging networks, dev networks)
2. Create new project with multiple environments
3. Migrate one environment at a time
4. Delete old single-environment projects

---

## Alternative: Importing Existing Networks

:::tip Already Managing Networks Elsewhere?
If you're already managing networks outside Massdriver (CloudFormation, Terraform, manual), you don't need to migrate them to Massdriver immediately. You can:

1. **Create artifact definitions** for your network types
2. **Import network artifacts** using the Massdriver CLI or API with existing VPC/subnet IDs
3. **Use as environment defaults** in application projects to assign landing zones to developers

This lets you use Massdriver for application deployment while keeping network management where it is. Your teams get self-service access to networks without you rewriting all your network IaC.

See the [Custom Artifact Definitions guide](./custom_artifact_definition) for creating importable network artifacts.
:::

---

## Summary

Choose your template based on:

1. **Do you want all environments to deploy everything?** → Templates 1, 2, 5 (no undeployed packages)
2. **Do you need to model cross-network connectivity?** → Templates 3, 4 (separate connectivity project, some undeployed packages)
3. **Do you want to show production features in all environments?** → Template 6 (intentional disparity)

**Most Important Rule**: Scope projects so that architectural parity makes sense. If two networks should always have the same structure, they belong in the same project as different environments. If they have different structures, they belong in different projects (or use intentional disparity).

The goal is to avoid accidental undeployed packages while allowing intentional disparity when it makes sense to visualize your architecture.
