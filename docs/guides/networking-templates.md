---
id: networking-templates
slug: /guides/networking-templates
title: Networking Architecture Templates
sidebar_label: Networking Templates
---

# Networking Architecture Templates

This guide provides common networking architecture patterns using Massdriver's project/environment hierarchy, environment defaults (ED), and remote references (RR). These templates help you model infrastructure isolation, cost efficiency, and developer workflows based on your organization's needs.

## Key Concepts Refresher

Before diving into templates, recall these principles:

- **Projects**: Enforce architectural parity across all environments. All environments in a project share the same canvas/diagram.
- **Environments**: Can differ in scale, configuration, and credentials, but maintain the same architecture as their project.
- **Environment Defaults (ED)** 😂: Shared resources (networks, clusters, credentials) that auto-connect to all compatible bundles without cluttering the canvas.
- **Remote References (RR)**: Allow packages to reference resources from other projects/environments, appearing as boxes on the canvas with the flexibility to swap between shared and dedicated resources per environment. RR enables **intentional disparity**: you can substitute a resource from elsewhere (e.g., use a shared staging database instead of deploying your own) or leave a resource undeployed entirely. Undeployed packages remain visible on the canvas with a clear status indicator, making architectural differences between environments explicit and auditable.

:::tip Project Boundary Design
Massdriver enforces parity by project, so scope your projects to boundaries where you're comfortable with parity enforcement. Keep directed graphs well-balanced—overly complex projects become harder to manage, while too many small projects lose the benefit of parity enforcement.
:::

## Template 1: Fully Isolated Networks Per Environment

**Scenario**: Maximum isolation for compliance, security, or tenant separation. Each environment has its own VPC/VNet with no shared networking infrastructure.

**Use Cases**:
- Multi-tenant SaaS with strict data isolation requirements
- Regulated industries (healthcare, finance) requiring environment-level network segmentation
- Organizations prioritizing security over cost efficiency

### Project/Environment Structure

```
Project: Application Platform
├── Environment: Production
├── Environment: Staging  
├── Environment: Development
└── Environment: Preview (ephemeral)
```

### Canvas Architecture

Each environment has identical architecture but independent networking:

```
[VPC/VNet] ──> [Kubernetes Cluster]
              │
              ├──> [Application 1]
              ├──> [Application 2]
              └──> [Application 3]
              
[VPC/VNet] ──> [Database Subnet]
              │
              └──> [PostgreSQL]
```

### Implementation Strategy

**Environment Defaults**: None (or only cloud credentials)

**Remote References**: None

**Rationale**: Each environment provisions its own network, cluster, and data resources. No shared infrastructure means maximum isolation but higher cost.

### Configuration Pattern

- Production: Full-scale VPC, production-grade cluster, high-availability databases
- Staging: Mid-scale VPC, smaller cluster, single-AZ databases
- Development: Minimal VPC, small cluster, minimal databases
- Preview: Minimal VPC, smallest cluster footprint, ephemeral lifecycle

### Pros & Cons

✅ **Pros**:
- Maximum security and compliance isolation
- No cross-environment risk or blast radius
- Clear cost attribution per environment
- Perfect for regulated workloads

❌ **Cons**:
- Highest infrastructure costs (duplicate networking in every environment)
- More complexity managing multiple networks
- Slower preview environment creation (must provision full network stack)

---

## Template 2: Shared Network with Environment-Specific Compute

**Scenario**: Cost-efficient approach where networking is shared, but compute resources (clusters, instances) are isolated per environment.

**Use Cases**:
- Startups and small teams optimizing cloud costs
- Organizations with shared network policies but isolated workloads
- Development teams wanting quick preview environments

### Project/Environment Structure

```
Project: Shared Infrastructure
├── Environment: Shared Staging
└── Environment: Shared Production

Project: Application Platform
├── Environment: Production
├── Environment: Staging
└── Environment: Preview (ephemeral)
```

### Canvas Architecture

**Shared Infrastructure Project** (network only):

```
[VPC/VNet - Staging]
[VPC/VNet - Production]
```

**Application Platform Project** (compute + apps):

```
[Kubernetes Cluster] ──> [Application 1]
                    ├──> [Application 2]
                    └──> [Application 3]
                    
[Database Cluster] ──> [PostgreSQL]
```

### Implementation Strategy

**Environment Defaults**: 
- VPC/VNet from Shared Infrastructure project set as ED for each Application Platform environment
- Each environment uses a different VPC (prod → prod VPC, staging → staging VPC)

**Remote References**: None (using ED instead)

**Rationale**: Networks are provisioned once and shared via environment defaults. Compute resources are dedicated per environment for isolation, but leverage shared networking infrastructure for cost efficiency.

### Configuration Pattern

**Shared Infrastructure Project**:
- Staging env: Shared VPC with subnets for staging/dev/preview workloads
- Production env: Dedicated production VPC with strict security groups

**Application Platform Project**:
- Production env: Uses production VPC (ED), dedicated production cluster
- Staging env: Uses staging VPC (ED), dedicated staging cluster  
- Preview env: Uses staging VPC (ED), minimal ephemeral cluster

### Pros & Cons

✅ **Pros**:
- Reduced networking costs (one VPC per tier instead of per environment)
- Consistent network policies across environments
- Faster preview environment setup (network already exists)
- Reasonable compute isolation

❌ **Cons**:
- Shared network blast radius (network issues affect multiple environments)
- Requires careful subnet planning and CIDR management
- Security groups must be carefully designed for isolation

---

## Template 3: Fully Shared Infrastructure for Preview Environments

**Scenario**: Production and staging are isolated, but all preview environments share a single cluster and network to minimize cost and maximize speed.

**Use Cases**:
- Development teams with frequent pull request deployments
- Organizations prioritizing developer velocity and cost efficiency for non-production
- Companies with ephemeral preview environment workflows

### Project/Environment Structure

```
Project: Shared Infrastructure
├── Environment: Production Network
├── Environment: Staging Network
└── Environment: Preview Shared Resources

Project: Application Platform  
├── Environment: Production
├── Environment: Staging
└── Environment: Preview-PR-123 (ephemeral, many instances)
```

### Canvas Architecture

**Shared Infrastructure Project** (provision once, use many times):

```
Preview Shared Resources environment:
├── [VPC/VNet]
└── [Kubernetes Cluster]
```

**Application Platform Project** (apps only):

```
[Application 1]
[Application 2]
[Application 3]
```

### Implementation Strategy

**Environment Defaults**:
- Preview environments: Set shared VPC and shared K8s cluster from "Preview Shared Resources" as ED

**Remote References**: 
- Could alternatively use RR to make the cluster "swappable" if specific preview envs need dedicated clusters

**Rationale**: All preview environments deploy only their applications to the same shared cluster and network. This drastically reduces cost and speeds up environment creation (apps deploy in seconds, not minutes).

### Configuration Pattern

**Shared Infrastructure Project**:
- Production Network env: Isolated production VPC
- Staging Network env: Isolated staging VPC  
- Preview Shared Resources env: Single shared VPC + single shared K8s cluster for ALL preview environments

**Application Platform Project**:
- Production env: Uses production network (ED), dedicated production cluster (ED from different source)
- Staging env: Uses staging network (ED), dedicated staging cluster (ED from different source)
- Preview-PR-* envs: All use the same shared network (ED) and shared cluster (ED) from "Preview Shared Resources"

### Pros & Cons

✅ **Pros**:
- Minimal preview environment cost (only application resources provisioned)
- Extremely fast preview environment creation (10-30 seconds for app deployment)
- Encourages frequent testing with low overhead
- Production and staging remain fully isolated

❌ **Cons**:
- Preview environments share resources (noisy neighbor potential)
- Requires namespace/tenant isolation within shared cluster
- All previews in same network (less isolation for testing network policies)
- Shared cluster must be right-sized for many concurrent previews

---

## Template 4: Regional Networks with Project-Level Compute

**Scenario**: Global applications with regional network presence but centralized application deployment patterns.

**Use Cases**:
- Global SaaS with multi-region deployment requirements
- Applications with region-specific compliance needs (GDPR, data residency)
- Organizations optimizing latency with regional infrastructure

### Project/Environment Structure

```
Project: Regional Networks
├── Environment: US-West
├── Environment: US-East  
├── Environment: EU-West
└── Environment: APAC

Project: Application Platform - US
├── Environment: Production-US
└── Environment: Staging-US

Project: Application Platform - EU
├── Environment: Production-EU
└── Environment: Staging-EU
```

### Canvas Architecture

**Regional Networks Project** (one per region):

```
[VPC/VNet]
├── [Public Subnets]
├── [Private Subnets]
└── [Database Subnets]
```

**Application Platform Projects** (one per region):

```
[Kubernetes Cluster] ──> [Application 1]
                    ├──> [Application 2]
                    └──> [Application 3]

[Database Cluster] ──> [Regional PostgreSQL]
```

### Implementation Strategy

**Environment Defaults**:
- Each Application Platform environment sets its regional VPC as an ED
- Production-US → US-West VPC (ED)
- Production-EU → EU-West VPC (ED)

**Remote References**: Optional for cross-region resources

**Network Peering**: Use separate "Peering" project for VPC peering between regions if needed

### Configuration Pattern

**Regional Networks Project**:
- Each environment represents a region with its own VPC
- All application projects reference these networks via ED

**Application Platform Projects** (per region):
- Each region has its own project for regional parity enforcement
- Production and staging environments within each regional project
- All leverage regional network from Regional Networks project

### Peering Project (Optional)

For cross-region communication:

```
Project: Network Peering
└── Environment: Global

Canvas:
[US-West VPC] ←→ [Peering Connection] ←→ [EU-West VPC]
```

Use RR to reference VPCs from Regional Networks project, then peer them.

### Pros & Cons

✅ **Pros**:
- Clear regional boundaries for compliance and data residency
- Centralized network management per region
- Easy to add new regions (create new environment in Regional Networks)
- Scales well for global applications

❌ **Cons**:
- More projects to manage (one per region for applications)
- Cross-region communication requires peering setup
- Increased complexity in multi-region deployment orchestration

---

## Template 5: Developer Sandbox Networks with Shared Production

**Scenario**: Individual developers get their own networks/subnets for experimentation, while production/staging use shared infrastructure.

**Use Cases**:
- Platform teams providing self-service infrastructure to developers
- Organizations encouraging infrastructure experimentation
- Onboarding and training environments

### Project/Environment Structure

```
Project: Shared Infrastructure
├── Environment: Production
└── Environment: Staging

Project: Application Platform
├── Environment: Production
└── Environment: Staging

Project: Developer Sandboxes
├── Environment: Alice-Dev
├── Environment: Bob-Dev
└── Environment: Carol-Dev
```

### Canvas Architecture

**Shared Infrastructure Project**:

```
[VPC/VNet]
└── [Shared Kubernetes Cluster]
```

**Application Platform Project** (uses shared infra via ED):

```
[Application 1]
[Application 2]
[Application 3]
```

**Developer Sandboxes Project** (each dev gets full stack):

```
[VPC/VNet] ──> [Small K8s Cluster]
              │
              └──> [Application (dev version)]
```

### Implementation Strategy

**Environment Defaults**:
- Production and Staging in Application Platform use shared VPC/cluster from Shared Infrastructure (ED)
- Developer environments provision their own networks and clusters (no ED, full isolation)

**Remote References**: 
- Developers can use RR to "swap in" shared databases or services from staging when needed
- Allows flexibility: "I want my own cluster but use the shared staging database"

**Rationale**: Production uses cost-efficient shared infrastructure. Developers get full environment isolation for experimentation without affecting production, but can selectively reference shared resources.

### Configuration Pattern

**Shared Infrastructure Project**:
- Production env: Large VPC, production cluster
- Staging env: Medium VPC, staging cluster

**Application Platform Project**:
- Uses shared infra via ED for all environments

**Developer Sandboxes Project**:
- Each developer environment is independent
- Provisioning their own small VPC and minimal cluster
- Can use RR to shared staging resources when useful (databases, caches, etc.)

### Developer Options

Developers can choose their connection strategy per resource:

| Resource Type | Option 1: Independent | Option 2: Shared via RR |
|---------------|----------------------|------------------------|
| Network | Own VPC | Use staging VPC (RR) |
| Cluster | Own small cluster | Use staging cluster (RR) |
| Database | Own dev database | Use shared staging DB (RR) |
| Cache | Own Redis | Use shared staging Redis (RR) |

### Pros & Cons

✅ **Pros**:
- Developers can experiment without production risk
- Flexible: can use shared resources or provision their own
- Clear separation between production and development infrastructure
- Great for onboarding and training

❌ **Cons**:
- Can become expensive if many developers provision full stacks
- Requires education on when to use shared vs. dedicated resources
- More environments to manage and clean up

---

## Template 6: Hub-and-Spoke Network Architecture

**Scenario**: Centralized networking hub with spoke networks for different teams/projects, all interconnected.

**Use Cases**:
- Large enterprises with many teams requiring network connectivity
- Organizations with centralized security/monitoring requirements
- Complex microservices architectures with cross-team communication

### Project/Environment Structure

```
Project: Network Hub
├── Environment: Production Hub
└── Environment: Staging Hub

Project: Network Peering
└── Environment: Hub Connections

Project: Team A Applications
├── Environment: Production
└── Environment: Staging

Project: Team B Applications  
├── Environment: Production
└── Environment: Staging
```

### Canvas Architecture

**Network Hub Project** (shared services network):

```
[Hub VPC/VNet]
├── [Shared Monitoring]
├── [Shared Security Services]
└── [Shared DNS]
```

**Network Peering Project** (connect everything):

```
[Hub VPC] ←→ [Peering] ←→ [Team A VPC]
          ←→ [Peering] ←→ [Team B VPC]
```

**Team Application Projects** (each team gets isolated network):

```
[Spoke VPC/VNet] ──> [Kubernetes Cluster]
                    │
                    └──> [Team Applications]
```

### Implementation Strategy

**Environment Defaults**:
- Each team uses their own spoke VPC as ED
- Shared services (monitoring, DNS) from Hub can be referenced

**Remote References**:
- Use RR in Network Peering project to reference Hub VPC and all Spoke VPCs
- Creates mesh network connectivity

**Rationale**: Teams get network isolation while maintaining connectivity to hub services and other teams. Centralized security/monitoring without sacrificing team autonomy.

### Configuration Pattern

**Network Hub Project**:
- Provisions hub VPC with shared services
- All security scanning, monitoring aggregation happens here

**Network Peering Project**:
- Uses RR to connect hub VPC to each team's spoke VPC
- Manages all peering connections in one place

**Team Application Projects**:
- Each team provisions their own spoke VPC
- Set spoke VPC as ED for their applications
- Applications can communicate through hub or directly via peered spokes

### Network Flow

```
Team A App ──> Team A VPC ──> Hub VPC ──> Monitoring
                          ↓
                     Team B VPC ──> Team B App
```

### Pros & Cons

✅ **Pros**:
- Centralized security and monitoring for all teams
- Team isolation with controlled connectivity
- Scales well to many teams
- Clear network topology visualization

❌ **Cons**:
- Complex setup with multiple projects and peering relationships
- Hub becomes single point of failure (design for HA)
- Requires careful routing and firewall management
- More expensive (multiple VPCs + peering costs)

---

## Decision Matrix: Choosing the Right Template

| Consideration | Template 1<br/>Fully Isolated | Template 2<br/>Shared Network | Template 3<br/>Shared Preview | Template 4<br/>Regional | Template 5<br/>Dev Sandboxes | Template 6<br/>Hub-Spoke |
|---------------|-------------------------------|-------------------------------|-------------------------------|------------------------|------------------------------|--------------------------|
| **Cost** | $$$$$ | $$$ | $$ | $$$$ | $$$ | $$$$$ |
| **Security/Isolation** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Preview Env Speed** | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **Complexity** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Team Scaling** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Compliance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## Best Practices Across All Templates

### Project Scope

- **Do**: Scope projects to boundaries where architectural parity makes sense
- **Don't**: Create overly complex projects with dozens of bundles
- **Do**: Keep directed graphs well-balanced and maintainable
- **Don't**: Create too many micro-projects that lose parity benefits

### Environment Defaults vs. Remote References

| Use Environment Defaults When | Use Remote References When |
|-------------------------------|---------------------------|
| Resource is truly default for ALL packages in environment | Resource should be swappable between environments |
| Canvas should stay clean (network, credentials) | Visual representation adds architectural value |
| No per-environment variability needed | Some environments use shared, others use dedicated |
| Automatic propagation is desired | Explicit control is required |

### Naming Conventions

Establish clear naming patterns:

```bash
# Projects
{team}-{purpose}
examples: platform-shared-infra, ecommerce-api, data-analytics

# Environments  
{stage} or {developer}-{stage} or {region}-{stage}
examples: production, staging, alice-dev, usw-prod, eu-staging

# Packages (bundles on canvas)
{resource-type}-{purpose}
examples: vpc-primary, eks-apps, postgres-users, redis-sessions
```

### Network CIDR Planning

When sharing networks across environments, plan CIDRs carefully:

```
Production:     10.0.0.0/16
Staging:        10.1.0.0/16  
Development:    10.2.0.0/16
Preview Shared: 10.3.0.0/16
Developer-1:    10.10.0.0/16
Developer-2:    10.11.0.0/16
...
```

### Migration Paths

You can evolve between templates:

1. **Start Simple** (Template 3: Shared everything for preview) → Fast iteration
2. **Add Isolation** (Template 2: Dedicated staging infra) → Security improvements
3. **Scale Teams** (Template 5: Developer sandboxes) → Team growth
4. **Go Regional** (Template 4: Regional networks) → Global expansion
5. **Enterprise Architecture** (Template 6: Hub-spoke) → Complex multi-team

---

## Real-World Hybrid Examples

### Example 1: Startup → Scale-Up Evolution

**Phase 1** (1-5 developers):
- Single project, dev/staging/prod environments
- Shared VPC and cluster for dev/staging (Template 2)
- Dedicated prod VPC and cluster

**Phase 2** (5-20 developers):
- Add preview environment shared infrastructure (Template 3)
- Keep prod isolated, share staging/preview
- Introduce developer sandboxes for specific needs (Template 5)

**Phase 3** (20+ developers, multiple teams):
- Split teams into separate projects
- Maintain shared infrastructure project
- Add hub-spoke networking for team communication (Template 6)

### Example 2: Regulated SaaS Company

**Structure**:
- Fully isolated production per customer/tenant (Template 1)
- Shared network for internal staging/dev (Template 2)
- Regional deployment for GDPR compliance (Template 4)

**Projects**:
```
Regional Networks (per region)
├── US-East VPC
├── EU-West VPC  
└── APAC VPC

Customer A (tenant)
├── Production (isolated network)
└── Staging (shared network via ED)

Customer B (tenant)
├── Production (isolated network)
└── Staging (shared network via ED)

Internal Dev
└── Preview (shared network + cluster)
```

### Example 3: Microservices Platform Team

**Structure**:
- Hub-spoke network (Template 6) for team connectivity
- Shared infrastructure for preview envs (Template 3)
- Regional networks for production (Template 4)

**Projects**:
```
Network Hub
├── Production Hub (monitoring, security)
└── Staging Hub

Platform Infrastructure
├── Prod Network
├── Staging Network  
└── Preview Shared Cluster

Team Auth
├── Production (peered to hub)
└── Staging (peered to hub)

Team Payments
├── Production (peered to hub)
└── Staging (peered to hub)

Team Analytics
├── Production (peered to hub)
└── Staging (peered to hub)
```

---

## Troubleshooting Common Patterns

### When Environment Defaults Don't Apply

**Problem**: Set a VPC as environment default, but bundles aren't connecting

**Solution**:
1. Check artifact definition compatibility (`$md.ui.environmentDefaultGroup`)
2. Verify bundle's connection schema matches the artifact type
3. Ensure environment default is set in correct group

### When Remote References Break

**Problem**: Remote reference works in staging but not production

**Solution**:
1. Verify source package exists in both source environments
2. Check that artifact is actually deployed (package status = success)
3. Confirm cross-project permissions are configured

### Managing CIDR Conflicts

**Problem**: VPC peering fails due to overlapping CIDRs

**Solution**:
1. Plan CIDR blocks before creating environments (see CIDR planning above)
2. Use a CIDR registry or documentation to track assignments
3. Reserve CIDR ranges for future expansion

### Preview Environment Cleanup

**Problem**: Preview environments accumulate and increase costs

**Solution**:
1. Use preview environment auto-cleanup features
2. Implement CI/CD hooks to delete environments when PRs close
3. Regular audits of orphaned environments

---

## Additional Resources

- [Sharing Infrastructure Guide](./sharing_infrastructure) - Detailed walkthrough of sharing resources
- [Environment Default Connections](../concepts/environment-default-connections) - Deep dive into environment defaults
- [Projects Concept](../concepts/projects) - Understanding project parity enforcement
- [Environments Concept](../concepts/environments) - Environment configuration and management
- [Custom Artifact Definitions](./custom_artifact_definition) - Creating artifact types that support environment defaults

---

## Summary

Choose your networking template based on:

1. **Security requirements**: How much isolation do you need?
2. **Cost constraints**: How much can you spend on infrastructure?
3. **Team structure**: How many teams, how much autonomy?
4. **Development velocity**: How fast do developers need environments?
5. **Compliance needs**: Any regulatory requirements for isolation?

**Quick Recommendations**:
- **Startups**: Template 2 or 3 (cost-efficient, fast)
- **Security-focused**: Template 1 (maximum isolation)
- **Global apps**: Template 4 (regional)
- **Large enterprises**: Template 6 (hub-spoke)
- **Platform teams**: Template 5 or 6 (team enablement)

Remember: These templates are starting points. Mix and match concepts to build the architecture that fits your organization's unique needs. Massdriver's flexibility with projects, environments, environment defaults, and remote references gives you the tools to model almost any network topology.

