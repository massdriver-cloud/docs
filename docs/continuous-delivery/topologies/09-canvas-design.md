---
id: topologies-canvas-design
slug: /continuous-delivery/topologies/canvas-design
title: Canvas Design
sidebar_label: Canvas Design
description: Deciding which bundles share a project, and the environment topology that follows.
---

# Canvas Design

A canvas is the blueprint of one project. Canvas design is deciding which bundles share a project, and the environment topology of each project follows from that decision. A network and a billing API do not belong on the same canvas, because a network is needed once per region and a billing API is needed once per stage.

## One copy per what

Every environment in a project gets an instance of every component on its canvas. So for each bundle, ask what one copy of it is for: the organization, a region, a stage, a customer. Bundles with the same answer can share a canvas. Bundles with different answers go in different projects.

Three kinds of connection join components:

- **Link on the canvas.** Connects two components in the same project. Use it when both sides have the same copy count and the same owner, such as a service and its database.
- **Environment default.** One resource of a type that fills every instance in the environment that needs it. Use it for what an environment has exactly one of: the network, the cluster, the credentials. The producing bundle can live in another project and never appears on the consuming canvas.
- **Remote reference.** Set on one instance, and points at a specific resource in another environment or another project. Use it when the consumer has to choose, such as which shared database to read.

Other reasons to split a canvas:

- **A different owner.** Access and release timing follow the project.
- **Data that has to survive.** A canvas that gets forked for previews should not carry state that cannot be forked.
- **A larger blast radius** than the things around it.

## An example organization

<OrganizationTopology />

The billing API has four environments, the network under it has three, and the edge in front of it has two. Dev and staging share one non-production cluster and network. [How topologies combine](/continuous-delivery/topologies#how-topologies-combine) walks through each project.

## Where common bundles go

| Bundle | One copy per | Canvas | Topologies | How others use it |
|---|---|---|---|---|
| Root DNS zone | Organization | [Organization](#organization) | [Singleton](/continuous-delivery/topologies/layer#singleton) | Remote reference from the zones delegated under it |
| Identity provider and SSO roles | Organization | [Organization](#organization) | [Singleton](/continuous-delivery/topologies/layer#singleton) | Referenced by account and cluster bundles |
| Container registry | Organization | [Organization](#organization) | [Singleton](/continuous-delivery/topologies/layer#singleton) | Environment default in application environments |
| CI runners | Organization | [Organization](#organization) | [Singleton](/continuous-delivery/topologies/layer#singleton) | Nothing depends on it |
| Audit log archive | Organization | [Organization](#organization) | [Singleton](/continuous-delivery/topologies/layer#singleton) | Remote reference from each network or account |
| VPC or VNet with subnets | Region and account tier | [Network](#network) | [Multi-Region](/continuous-delivery/topologies/place#multi-region), [Platform Layer](/continuous-delivery/topologies/layer#platform-layer) | Environment default |
| Private DNS zone | Region and account tier | [Network](#network) | [Multi-Region](/continuous-delivery/topologies/place#multi-region), [Platform Layer](/continuous-delivery/topologies/layer#platform-layer) | Environment default |
| Transit gateway or hub network | Organization or region | [Network](#network) | [Hub and Spoke](/continuous-delivery/topologies/place#hub-and-spoke) | Its own hub project. Remote reference from each spoke network. |
| VPN or dedicated interconnect | Region | [Network](#network) | [Hub and Spoke](/continuous-delivery/topologies/place#hub-and-spoke) | Linked to the hub on the hub canvas |
| Kubernetes cluster | Network | [Compute Platform](#compute-platform) | [Multi-Region](/continuous-delivery/topologies/place#multi-region), [Platform Layer](/continuous-delivery/topologies/layer#platform-layer) | Environment default |
| Container service cluster or app hosting plan | Network | [Compute Platform](#compute-platform) | [Multi-Region](/continuous-delivery/topologies/place#multi-region), [Platform Layer](/continuous-delivery/topologies/layer#platform-layer) | Environment default |
| Ingress controller, cert-manager, external-dns | Cluster | [Compute Platform](#compute-platform) | [Platform Layer](/continuous-delivery/topologies/layer#platform-layer) | Linked to the cluster on its canvas |
| Event bus | Account tier, or region and tier | [Shared Services](#shared-services) | [Platform Layer](/continuous-delivery/topologies/layer#platform-layer) | Environment default |
| Metrics, logs, and tracing backend | Account tier | [Shared Services](#shared-services) | [Platform Layer](/continuous-delivery/topologies/layer#platform-layer) | Environment default |
| Key management and secrets store | Region and account tier | [Shared Services](#shared-services) | [Platform Layer](/continuous-delivery/topologies/layer#platform-layer) | Environment default |
| Database used by several services | Stage | [Shared Services](#shared-services) | [Platform Layer](/continuous-delivery/topologies/layer#platform-layer) | Remote reference from each service |
| CDN and WAF | Stage | [Edge](#edge) | [Linear Promotion](/continuous-delivery/topologies/stage#linear-promotion), [Blue/Green](/continuous-delivery/topologies/version#blue-green), [Canary Rings](/continuous-delivery/topologies/version#canary-rings) | Holds remote references to application environments |
| Global load balancer or failover routing | Stage | [Edge](#edge) | [Blue/Green](/continuous-delivery/topologies/version#blue-green), [Disaster Recovery Standby](/continuous-delivery/topologies/place#disaster-recovery-standby) | Holds remote references to application environments |
| Public DNS records | Stage | [Edge](#edge) | [Linear Promotion](/continuous-delivery/topologies/stage#linear-promotion) | Linked on the edge canvas |
| API or web service | Stage, and region in production | [Application](#application) | [Linear Promotion](/continuous-delivery/topologies/stage#linear-promotion), [Multi-Region](/continuous-delivery/topologies/place#multi-region), [Pull Request Preview](/continuous-delivery/topologies/change#pull-request-preview) | Linked on the canvas |
| Workers and scheduled jobs | Stage, and region in production | [Application](#application) | [Linear Promotion](/continuous-delivery/topologies/stage#linear-promotion), [Multi-Region](/continuous-delivery/topologies/place#multi-region) | Linked on the canvas |
| Database owned by one service | Stage, and region in production | [Application](#application) | [Linear Promotion](/continuous-delivery/topologies/stage#linear-promotion), [Multi-Region](/continuous-delivery/topologies/place#multi-region) | Linked on the canvas |
| Cache, queue, or bucket owned by one service | Stage, and region in production | [Application](#application) | [Linear Promotion](/continuous-delivery/topologies/stage#linear-promotion), [Pull Request Preview](/continuous-delivery/topologies/change#pull-request-preview) | Linked on the canvas |
| Service alarms and dashboards | Stage, and region in production | [Application](#application) | [Linear Promotion](/continuous-delivery/topologies/stage#linear-promotion) | Linked on the canvas |
| Tenant control plane | Stage | [Application](#application) | [Linear Promotion](/continuous-delivery/topologies/stage#linear-promotion) | Remote reference from every tenant environment |
| Warehouse and lake storage | Stage | [Data Platform](#data-platform) | [Linear Promotion](/continuous-delivery/topologies/stage#linear-promotion) | Linked on the canvas |
| Pipelines and orchestration | Stage | [Data Platform](#data-platform) | [Linear Promotion](/continuous-delivery/topologies/stage#linear-promotion) | Holds remote references to application databases |
| Customer runtime and database | Customer or cell | [Tenant Stack](#tenant-stack) | [Single-Tenant](/continuous-delivery/topologies/tenant#single-tenant), [Cells](/continuous-delivery/topologies/tenant#cells), [Tiered Tenancy](/continuous-delivery/topologies/tenant#tiered-tenancy) | Holds a remote reference to the control plane |

## Canvases

Each of these is a kind of project. A small organization can merge neighbors, such as network and compute platform. A large one has many application projects and usually one of each of the others.

### Organization {#organization}

<Canvas id="organization" />

Things that exist once for the whole company.

- **Bundles:** Root DNS zone, identity provider and SSO roles, container registry, CI runners, audit log archive.
- **Environments:** One.
- **Topologies:** [Singleton](/continuous-delivery/topologies/layer#singleton).
- **Connects:** Other projects reference its resources. Anything every environment needs, such as the registry, is set as a default in each of them.
- **Versions:** Exact versions, with every change reviewed as a plan.

### Network {#network}

<Canvas id="network" />

The address space everything else is deployed into.

- **Bundles:** VPC or VNet with subnets, private DNS zone, VPN or dedicated interconnect.
- **Environments:** One per region, split by account tier: `nonuseast`, `produseast`, `prodeuwest`. Stages do not each need a network, and dev and staging usually share the non-production one. A transit hub is its own project, because there are fewer hubs than networks.
- **Topologies:** [Multi-Region](/continuous-delivery/topologies/place#multi-region), [Hub and Spoke](/continuous-delivery/topologies/place#hub-and-spoke), [Platform Layer](/continuous-delivery/topologies/layer#platform-layer).
- **Connects:** Each network is set as the environment default in the environments deployed into it, so it never appears on an application canvas.
- **Versions:** Stable channels or exact versions in every environment, non-production included.

### Compute Platform {#compute-platform}

<Canvas id="compute-platform" />

Clusters, and what has to be installed in them before a workload can run.

- **Bundles:** Kubernetes cluster, container service cluster or app hosting plan, ingress controller, cert-manager, external-dns.
- **Environments:** The same as the network when each network has one cluster, and then the two can share a canvas if one team owns both. More environments when a network holds several clusters.
- **Topologies:** [Multi-Region](/continuous-delivery/topologies/place#multi-region), [Platform Layer](/continuous-delivery/topologies/layer#platform-layer), [Blue/Green](/continuous-delivery/topologies/version#blue-green).
- **Connects:** The cluster is an environment default for application environments. Add-ons such as the ingress controller are linked to the cluster on this canvas.
- **Versions:** Stable channels or exact versions in every environment. A cluster upgrade can run as blue/green with a second cluster environment.

### Shared Services {#shared-services}

<Canvas id="shared-services" />

Services that many applications use and no single application owns.

- **Bundles:** Event bus, metrics, logs, and tracing backend, key management and secrets store, database used by several services.
- **Environments:** One per account tier, or one per region and tier when traffic has to stay in its region.
- **Topologies:** [Platform Layer](/continuous-delivery/topologies/layer#platform-layer).
- **Connects:** Environment default when an environment has exactly one of the resource type, such as the metrics endpoint. Remote reference when the consumer has to pick one, such as a specific database.
- **Versions:** Stable channels or exact versions. Anything holding data stays on exact versions.

### Edge {#edge}

<Canvas id="edge" />

Where traffic enters and is steered.

- **Bundles:** CDN and WAF, global load balancer or failover routing, public DNS records.
- **Environments:** One per stage. There is one production edge no matter how many regions sit behind it.
- **Topologies:** [Linear Promotion](/continuous-delivery/topologies/stage#linear-promotion), [Blue/Green](/continuous-delivery/topologies/version#blue-green), [Canary Rings](/continuous-delivery/topologies/version#canary-rings), [Disaster Recovery Standby](/continuous-delivery/topologies/place#disaster-recovery-standby).
- **Connects:** It consumes and is not consumed. Its instances hold remote references to the application environments behind it, which makes it the traffic switch for blue/green, canary rings, and failover.
- **Versions:** A stable channel in staging and exact versions in prod.

### Application {#application}

<Canvas id="application" />

One service or one product, and the things only it uses.

- **Bundles:** API or web service, workers and scheduled jobs, database owned by one service, cache, queue, or bucket owned by one service, service alarms and dashboards, tenant control plane.
- **Environments:** One per stage, and one per region in production when the service runs in several: `dev`, `staging`, `produseast`, `prodeuwest`. Previews, workspaces, and agent tasks are forks of these.
- **Topologies:** [Linear Promotion](/continuous-delivery/topologies/stage#linear-promotion), [Multi-Region](/continuous-delivery/topologies/place#multi-region), [Pull Request Preview](/continuous-delivery/topologies/change#pull-request-preview), [Developer Workspace](/continuous-delivery/topologies/person#developer-workspace), [Agent Workspace](/continuous-delivery/topologies/person#agent-workspace).
- **Connects:** Components are linked to each other on the canvas. The network, cluster, and credentials arrive as environment defaults.
- **Versions:** `+dev` in dev, a stable channel in staging, and a minor channel or exact versions in prod.

### Data Platform {#data-platform}

<Canvas id="data-platform" />

Warehouse, lake, pipelines, and reporting.

- **Bundles:** Warehouse and lake storage, pipelines and orchestration.
- **Environments:** Usually two: dev and prod.
- **Topologies:** [Linear Promotion](/continuous-delivery/topologies/stage#linear-promotion).
- **Connects:** Pipelines read application databases by remote reference. Applications do not depend on it.
- **Versions:** A stable channel in dev and exact versions in prod.

### Tenant Stack {#tenant-stack}

<Canvas id="tenant-stack" />

The part of the product that each customer gets a private copy of.

- **Bundles:** Customer runtime and database.
- **Environments:** A template that is never deployed, and one environment per customer or per cell.
- **Topologies:** [Single-Tenant](/continuous-delivery/topologies/tenant#single-tenant), [Cells](/continuous-delivery/topologies/tenant#cells), [Tiered Tenancy](/continuous-delivery/topologies/tenant#tiered-tenancy).
- **Connects:** Each tenant environment references the pooled control plane, which is an application canvas with one environment per stage.
- **Versions:** Exact versions per customer, moved by promoting from the template.
