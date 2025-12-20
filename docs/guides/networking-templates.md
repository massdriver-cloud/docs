---
id: networking-templates
slug: /guides/networking-templates
title: Network Organization Patterns
sidebar_label: Network Organization Patterns
---

# Network Organization Patterns

This guide provides principles and patterns for organizing network infrastructure using Massdriver's project/environment hierarchy. The goal is to help you scope projects correctly and avoid diagrams full of undeployed packages.

## The Core Problem

You're creating network bundles (VPCs, subnets, tunnels, VPN gateways, Transit Gateways, etc.). You need to decide:
1. **Bundle scope**: What does each bundle provision?
2. **Project scope**: Which bundles go in the same project?
3. **Environment strategy**: Which environments should exist in each project?

**Get this wrong** and you'll have diagrams where most packages are marked "undeployed" because the project parity doesn't match your actual infrastructure needs.

## Key Concepts

- **Projects**: Enforce architectural parity. All environments in a project share the same canvas.
- **Environments**: Can differ in scale/configuration, but must have the same architecture.
- **Environment Defaults (ED)** 😂: Shared resources that auto-connect without appearing on canvas.
- **Remote References (RR)**: Reference resources from other projects/environments. Appear on canvas as undeployed.

:::tip The Golden Rule
**If a bundle won't be deployed in every environment in a project, you've mis-scoped your project.**

Either:
- Split into separate projects (different architectures deserve different projects)
- Make the bundle configurable so it deploys everywhere (just with different configs)
- Use intentional disparity (show the architecture, mark as undeployed in some envs)
:::

---

## Principle 1: Match Project Scope to Architectural Parity

### Question to Ask Yourself

**"Do these networks have the same architecture across environments?"**

#### Example: VPC Bundle Scope

**Scenario A**: You create a "VPC" bundle that provisions a VPC + all subnets (public, private, database) in one bundle with parameters for AZ count, CIDR sizes, etc.

- Production: Deploy "VPC" bundle with `availability_zones: 3`, CIDR `/16`
- Staging: Deploy "VPC" bundle with `availability_zones: 1`, CIDR `/20`
- Development: Deploy "VPC" bundle with `availability_zones: 1`, CIDR `/22`

**Result**: ✅ All environments deploy the same bundle with different configs. **No undeployed packages.**

**Project Structure**:
```
Project: corporate-networks
Environments: production, staging, development

Canvas (same for all):
[VPC] (includes all subnets)
```

---

**Scenario B**: You create separate bundles: "VPC", "Public Subnets", "Private Subnets", "Database Subnets". Each creates N subnets based on a parameter.

- Production: Deploy all 4 bundles, each with `availability_zones: 3`
- Staging: Deploy all 4 bundles, each with `availability_zones: 1`
- Development: Deploy all 4 bundles, each with `availability_zones: 1`

**Result**: ✅ All environments deploy all bundles with different configs. **No undeployed packages.**

**Project Structure**:
```
Project: corporate-networks
Environments: production, staging, development

Canvas (same for all):
[VPC]
[Public Subnets]
[Private Subnets]
[Database Subnets]
```

---

**Scenario C**: You create individual bundles per actual subnet: "Public Subnet AZ-A", "Public Subnet AZ-B", "Public Subnet AZ-C".

- Production: Deploy all 9 subnet bundles (3 AZs × 3 subnet types)
- Staging: Deploy only 3 subnet bundles (1 AZ × 3 subnet types)

**Result**: ❌ Staging has 6 undeployed packages. **This is the problem we're trying to avoid.**

**What to Do Instead**:

**Option 1**: Split into separate projects by AZ count:
```
Project: multi-az-networks
Environments: production
Canvas: [VPC] + 9 subnet bundles

Project: single-az-networks
Environments: staging, development
Canvas: [VPC] + 3 subnet bundles
```
**Result**: ✅ No undeployed packages, but you lose parity between prod and non-prod.

**Option 2**: Make subnet bundles parameterized (like Scenario B).

**Option 3**: Use monolithic VPC bundle (like Scenario A).

---

## Principle 2: Separate Projects by Network Lifecycle

### Question to Ask Yourself

**"Do these networks change together?"**

If networks have different lifecycles, they probably belong in different projects.

### Example: Production Networks vs Developer Sandboxes

**Scenario**: You manage production VPCs and also provision developer sandbox networks on-demand.

❌ **Don't do this**:
```
Project: all-networks
Environments: production, staging, dev, alice-sandbox, bob-sandbox, carol-sandbox...

Canvas:
[Production VPC]
[Staging VPC]
[Dev VPC]
[Sandbox VPC]
```

**Problem**: Creating alice-sandbox environment would require configuring 4 VPCs (production, staging, dev, sandbox). You'd mark 3 as undeployed. Messy.

✅ **Do this instead**:
```
Project: corporate-networks
Environments: production, staging, development
Canvas: [VPC]

Project: developer-sandboxes
Environments: alice, bob, carol...
Canvas: [VPC]
```

**Result**: Each project has clean parity. Developer sandboxes are independent from corporate networks.

---

## Principle 3: Use Separate Projects for Cross-Network Connectivity

### Question to Ask Yourself

**"Am I connecting existing networks together, or provisioning new networks?"**

If you're creating resources that connect networks (VPC peering, VPN tunnels, Transit Gateway attachments), put those in a **separate project** that uses RR to reference the networks.

### Example: Hub-and-Spoke Architecture

**Scenario**: You have a hub VPC and 3 spoke VPCs. You want to connect them with Transit Gateway.

✅ **Do this**:

**Project 1: hub-network**
```
Environments: production, staging

Canvas:
[Hub VPC]
[Transit Gateway]
[VPN Gateway]
```

**Project 2: spoke-networks**
```
Environments: team-auth-prod, team-payments-prod, team-analytics-prod, team-auth-staging...

Canvas:
[Spoke VPC]
```

**Project 3: transit-gateway-connectivity**
```
Environment: production-mesh

Canvas:
[Hub VPC] (RR from hub-network, undeployed)
[Auth VPC] (RR from spoke-networks, undeployed)
[Payments VPC] (RR from spoke-networks, undeployed)
[Analytics VPC] (RR from spoke-networks, undeployed)
[TGW Attachment - Hub]
[TGW Attachment - Auth]
[TGW Attachment - Payments]
[TGW Attachment - Analytics]
[TGW Route Table]
```

**Why this works**:
- Hub and spokes are provisioned independently
- Connectivity project uses RR to "import" existing VPCs
- Connectivity project has intentional undeployed packages (the VPCs)
- Canvas clearly shows the network topology

**Result**: ⚠️ Connectivity project has undeployed VPC packages, **but this is intentional**. You're visualizing topology, not claiming to provision the VPCs.

---

## Principle 4: Choose Your Parameters vs Disparity Trade-off

### Question to Ask Yourself

**"Should I use parameters to handle differences, or show disparity explicitly?"**

There's a spectrum:

### Option A: Highly Parameterized (No Disparity)

**Bundle**: VPC with parameters for everything (AZ count, CIDR size, enable VPN, enable Transit Gateway, enable Network Firewall)

**Project**:
```
Project: corporate-network
Environments: production, staging

Canvas:
[VPC]
[VPN Gateway]
[Transit Gateway]
[Network Firewall]
```

**Configuration**:
- Production: All features enabled via params
- Staging: Features disabled via params (bundles still "deployed", just no-op or minimal resources)

**Result**: ✅ No undeployed packages. All features "deployed" everywhere (even if some are no-ops).

**Pros**: Clean canvas, no disparity
**Cons**: Complex parameter management, staging configs might be confusing

---

### Option B: Explicit Disparity (Show Architectural Differences)

**Bundle**: VPC with minimal params. Separate bundles for each feature.

**Project**:
```
Project: corporate-network
Environments: production, staging

Canvas:
[VPC]
[VPN Gateway]
[Transit Gateway]
[Network Firewall]
```

**Configuration**:
- Production: All 4 bundles deployed
- Staging: Only VPC deployed, other 3 marked undeployed

**Result**: ⚠️ Staging has 3 undeployed packages, **but this shows the architectural difference explicitly**.

**Pros**: Clear visibility into what production has that staging doesn't
**Cons**: Undeployed packages on canvas

**When to use**: When you WANT to show the full production architecture in all environments, even if some features aren't deployed in non-prod.

---

### Option C: Separate Projects (Complete Isolation)

**Bundle**: VPC with minimal params.

**Project 1**:
```
Project: production-network
Environment: production

Canvas:
[VPC]
[VPN Gateway]
[Transit Gateway]
[Network Firewall]
```

**Project 2**:
```
Project: non-production-networks
Environments: staging, development

Canvas:
[VPC]
```

**Result**: ✅ No undeployed packages anywhere.

**Pros**: Clean separation, no disparity
**Cons**: Production and non-production architectures can drift apart

**When to use**: When production and non-production have fundamentally different architectures.

---

## Pattern Catalog

### Pattern 1: Single Project, Environment Per Network

**Use when**: You manage multiple independent networks with the same architecture.

```
Project: corporate-networks
Environments: production, staging, development

Canvas:
[VPC]

Configuration:
- Production: VPC 10.0.0.0/16, 3 AZs
- Staging: VPC 10.1.0.0/16, 1 AZ
- Development: VPC 10.2.0.0/16, 1 AZ
```

**Result**: ✅ Clean parity, no undeployed packages

**When to use**:
- Networks are architecturally identical (just different scale)
- You want to compare configs across environments easily
- Networks don't connect to each other

---

### Pattern 2: Multiple Projects, One Per Network Purpose

**Use when**: Different types of networks have different architectures.

```
Project: hub-network
Environments: production, staging
Canvas: [Hub VPC] + [Transit Gateway] + [VPN Gateway]

Project: spoke-networks
Environments: team-a-prod, team-b-prod, team-c-prod...
Canvas: [Spoke VPC]

Project: developer-networks
Environments: alice, bob, carol...
Canvas: [Sandbox VPC]
```

**Result**: ✅ Clean parity within each project

**When to use**:
- Networks have different purposes (hub vs spoke vs sandbox)
- Networks have different lifecycles
- Networks are managed by different teams

---

### Pattern 3: Connectivity Projects with Remote References

**Use when**: You're connecting existing networks together.

```
Project: networks
Environments: us-west-2, us-east-1, eu-west-1
Canvas: [VPC] + [VPN Gateway]

Project: cross-region-vpn
Environment: global-mesh
Canvas:
  [US-West VPC] (RR, undeployed)
  [US-East VPC] (RR, undeployed)
  [EU-West VPC] (RR, undeployed)
  [VPN Connection US-West to US-East]
  [VPN Connection US-West to EU-West]
  [VPN Connection US-East to EU-West]
```

**Result**: ⚠️ VPN project has undeployed VPC packages (intentional, showing topology)

**When to use**:
- Connecting networks across regions or projects
- Want to visualize network topology
- Connectivity is managed separately from networks themselves

---

### Pattern 4: Regional Networks

**Use when**: You deploy the same network architecture in multiple regions.

```
Project: regional-networks
Environments: us-west-2, us-east-1, eu-west-1, ap-southeast-1

Canvas:
[VPC]
[VPN Gateway]

Configuration:
- us-west-2: VPC 10.10.0.0/16 in us-west-2
- us-east-1: VPC 10.20.0.0/16 in us-east-1
- eu-west-1: VPC 10.30.0.0/16 in eu-west-1
- ap-southeast-1: VPC 10.40.0.0/16 in ap-southeast-1
```

**Result**: ✅ Clean parity, no undeployed packages

**When to use**:
- Multi-region deployments
- Same network architecture in every region
- Want single source of truth for network configs

---

## Decision Framework

Use this flowchart to decide how to organize your network projects:

### Step 1: Bundle Scope

**Q**: How are you scoping your bundles?

- **A1**: One monolithic bundle per network (VPC + all subnets + gateways)
  → Continue to Step 2

- **A2**: Separate bundles per network component (VPC, subnets, gateways)
  → Ask: "Will all components be deployed in all environments?"
    - **Yes** → Continue to Step 2
    - **No** → Either:
      - Make components optional via parameters (no undeployed packages)
      - Accept intentional disparity (some packages undeployed)
      - Split into separate projects (different architectures)

### Step 2: Network Relationships

**Q**: Do your networks connect to each other?

- **No**: Simple independent networks
  → Use Pattern 1 (single project, env per network) or Pattern 4 (regional)

- **Yes**: Networks have connections (peering, VPN, Transit Gateway)
  → Use Pattern 3 (separate connectivity project with RR)

### Step 3: Network Lifecycles

**Q**: Do these networks change together?

- **Yes**: All networks managed by same team, similar lifecycle
  → Keep in one project (Pattern 1 or 4)

- **No**: Different teams, different purposes, different lifecycles
  → Split into multiple projects (Pattern 2)

### Step 4: Environment Strategy

**Q**: What environments do you need?

- **One environment per physical network**: Use environments to represent actual networks (prod, staging, dev)
  → Pattern 1

- **Same architecture, multiple regions**: Use environments to represent regions
  → Pattern 4

- **Different network types**: Use projects to represent network types, environments for instances
  → Pattern 2

---

## Common Mistakes and How to Fix Them

### Mistake 1: Mixing Unrelated Networks in One Project

❌ **Problem**:
```
Project: all-networks
Environment: production
Canvas: [Prod VPC] + [Staging VPC] + [Dev VPC] + [Alice VPC] + [Bob VPC]
```

When you create staging environment, you'd have to deploy 5 VPCs, but only one makes sense. 4 undeployed packages.

✅ **Fix**: Split by lifecycle
```
Project: corporate-networks
Environments: production, staging, development
Canvas: [VPC]

Project: developer-networks
Environments: alice, bob
Canvas: [VPC]
```

---

### Mistake 2: One Project Per Network

❌ **Problem**:
```
Project: production-vpc (env: prod)
Project: staging-vpc (env: staging)
Project: dev-vpc (env: dev)
```

You lose parity enforcement. Each network can drift independently.

✅ **Fix**: Single project with multiple environments
```
Project: corporate-networks
Environments: production, staging, development
Canvas: [VPC]
```

---

### Mistake 3: Networks + Applications in Same Project

❌ **Problem**:
```
Project: ecommerce
Canvas: [VPC] + [Subnets] + [EKS Cluster] + [RDS] + [Apps]
```

Networks and applications have different lifecycles. When you want to deploy a new app, you shouldn't think about network configs.

✅ **Fix**: Separate projects
```
Project: ecommerce-network
Canvas: [VPC] + [Subnets]
→ Set VPC as environment default

Project: ecommerce-apps
Canvas: [EKS Cluster] + [RDS] + [Apps]
→ Uses VPC via environment default
```

---

### Mistake 4: Fine-Grained Subnet Bundles Without Parameterization

❌ **Problem**:
```
Project: network
Canvas:
  [VPC]
  [Public Subnet AZ-A]
  [Public Subnet AZ-B]
  [Public Subnet AZ-C]
  [Private Subnet AZ-A]
  [Private Subnet AZ-B]
  [Private Subnet AZ-C]

Production: All 7 deployed
Staging: Only VPC + 2 subnets deployed (5 undeployed packages)
```

✅ **Fix**: Use parameterized subnet bundles
```
Project: network
Canvas:
  [VPC]
  [Public Subnets] (param: az_count)
  [Private Subnets] (param: az_count)

Production: az_count=3
Staging: az_count=1
```

Or: Use monolithic VPC bundle that creates all subnets internally.

---

## When Undeployed Packages Are OK

Sometimes having undeployed packages is **intentional and valuable**:

### Use Case 1: Showing Production Architecture Everywhere

You want all environments to show what the production architecture looks like, even if non-prod doesn't deploy everything.

```
Project: corporate-network
Canvas: [VPC] + [Transit Gateway] + [Network Firewall] + [VPN Gateway]

Production: All deployed
Staging: VPC deployed, others undeployed
```

**Why**: Makes it clear what production has that staging doesn't. Helps with planning and understanding.

---

### Use Case 2: Connectivity Visualization

You want to show how networks connect together.

```
Project: network-connectivity
Canvas: [Hub VPC] + [Spoke A] + [Spoke B] + [VPN Connections]

Reality: VPCs deployed elsewhere (via RR), only VPN connections deployed here
```

**Why**: Shows network topology clearly. The undeployed VPCs are just references.

---

## Alternative: Import Existing Networks

:::tip Already Managing Networks Elsewhere?

If you're managing networks outside Massdriver (CloudFormation, Terraform, ClickOps), you don't need to move them into Massdriver:

1. **Create artifact definitions** for your network types
2. **Import network artifacts** using CLI/API with existing VPC IDs, subnet IDs, etc.
3. **Use as environment defaults** for application projects

This lets you use Massdriver for applications while keeping network management where it is.

**Example**:
```bash
# Import existing production VPC
mass artifact import \
  --type "massdriver/aws-vpc" \
  --data '{"vpc_id": "vpc-123abc", "subnet_ids": [...]}' \
  --specs '{"region": "us-west-2"}' \
  --name "production-vpc"

# Set as environment default
mass environment default prod-env <artifact-id>
```

Now application projects can use this network without Massdriver managing it.
:::

---

## Summary: The Checklist

Before creating your network projects, answer these questions:

- [ ] **Bundle scope**: Are my bundles parameterized enough to deploy in all environments with just config changes?
- [ ] **Project scope**: Do all these networks have the same architecture (ignoring scale)?
- [ ] **Environment scope**: Does each environment represent one logical network deployment?
- [ ] **Lifecycle alignment**: Do these networks change together?
- [ ] **Connectivity**: If networks connect, am I using a separate project with RR?
- [ ] **Intentional disparity**: If I have undeployed packages, is it intentional and documented?

**Goal**: Every environment in a project should deploy every bundle (or have an intentional reason for not deploying).

If you can't answer "yes" to these questions, reconsider your project boundaries.

---

## Need Help?

If you're unsure how to scope your projects:

1. Start with **Pattern 1** (single project, environment per network) - it's the simplest
2. Split into multiple projects only when lifecycles or architectures differ
3. Use connectivity projects (Pattern 3) when you grow to hub-spoke or multi-region
4. Document why you're using intentional disparity if you have undeployed packages

Remember: **The goal is to avoid accidental undeployed packages.** Intentional disparity for visualization purposes is fine.
