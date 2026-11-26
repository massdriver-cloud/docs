---
id: topologies-canvas-design
slug: /continuous-delivery/topologies/canvas-design
title: Canvas Design
sidebar_label: Canvas Design
description: Deciding which bundles share a project.
image: /img/og/canvas-design.png
---

# Canvas Design

A canvas is the blueprint of one project. Canvas design is deciding which bundles share a project. The environments of each project follow from that decision. A network and a billing API do not belong on the same canvas, because a network is needed once per region and a billing API is needed once per stage.

## One copy per what

Every environment in a project gets an instance of every component on its canvas. So for each bundle, ask what one copy of it is for: the organization, a region, a stage, a customer. Bundles with the same answer can share a canvas. Bundles with different answers go in different projects.

Components in different places connect in three ways:

- **Connection on the canvas.** Joins two components of the same project, inside each environment. Use it when both sides need the same number of copies and have the same owner, such as a service and its database.
- **Environment default.** A resource set on an environment for its type. It fills every slot of that type in the environment that nothing else fills. Use it for what an environment has exactly one of: the network, the cluster, the credentials. The bundle that produces it is in another project and is not on the consuming canvas.
- **Remote reference.** Set on one slot of one instance. It points at a specific resource in another environment, of the same project or a different one, and takes priority over the canvas connection for that slot. Use it when the consumer has to pick one resource, such as which shared database to read.

Other reasons to split a canvas:

- **A different owner.** Access and release timing follow the project.
- **Data that has to survive.** A canvas that gets forked for previews should not carry state that cannot be forked.
- **A larger blast radius** than the things around it.

## An example organization

<OrganizationTopology />

The billing project has four environments, the network under it has three, and the edge in front of it has two. Dev and staging share one non-production cluster and network. [How projects combine](/continuous-delivery/topologies#how-projects-combine) walks through each project.

## Where common bundles go

| Bundle | One copy per | Canvas | How others use it |
|---|---|---|---|
| Root DNS zone | Organization | [Organization](#organization) | Remote reference from the zones delegated under it |
| Identity provider and SSO roles | Organization | [Organization](#organization) | Remote reference from account and cluster bundles |
| Container registry | Organization | [Organization](#organization) | Environment default in application environments |
| CI runners | Organization | [Organization](#organization) | Nothing depends on it |
| Audit log archive | Organization | [Organization](#organization) | Remote reference from each network or account |
| VPC or VNet with subnets | Region and account tier | [Network](#network) | Environment default |
| Private DNS zone | Region and account tier | [Network](#network) | Environment default |
| Transit gateway or hub network | Organization or region | [Network](#network) | Its own hub project. Remote reference from each spoke network. |
| VPN or dedicated interconnect | Region | [Network](#network) | Connected to the hub on the hub canvas |
| Kubernetes cluster | Network | [Compute Platform](#compute-platform) | Environment default |
| Container service cluster or app hosting plan | Network | [Compute Platform](#compute-platform) | Environment default |
| Ingress controller, cert-manager, external-dns | Cluster | [Compute Platform](#compute-platform) | Connected to the cluster on its canvas |
| Event bus | Account tier, or region and tier | [Shared Services](#shared-services) | Environment default |
| Metrics, logs, and tracing backend | Account tier | [Shared Services](#shared-services) | Environment default |
| Key management and secrets store | Region and account tier | [Shared Services](#shared-services) | Environment default |
| Database used by several services | Stage | [Shared Services](#shared-services) | Remote reference from each service |
| CDN and WAF | Stage | [Edge](#edge) | Holds remote references to application environments |
| Global load balancer or failover routing | Stage | [Edge](#edge) | Holds remote references to application environments |
| Public DNS records | Stage | [Edge](#edge) | Connected on the edge canvas |
| API or web service | Stage, and region in production | [Application](#application) | Connected on the canvas |
| Workers and scheduled jobs | Stage, and region in production | [Application](#application) | Connected on the canvas |
| Database owned by one service | Stage, and region in production | [Application](#application) | Connected on the canvas |
| Cache, queue, or bucket owned by one service | Stage, and region in production | [Application](#application) | Connected on the canvas |
| Service alarms and dashboards | Stage, and region in production | [Application](#application) | Connected on the canvas |
| Tenant control plane | Stage | [Application](#application) | Remote reference from every tenant environment |
| Warehouse and lake storage | Stage | [Data Platform](#data-platform) | Connected on the canvas |
| Pipelines and orchestration | Stage | [Data Platform](#data-platform) | Holds remote references to application databases |
| Customer runtime and database | Customer or cell | [Tenant Stack](#tenant-stack) | Holds a remote reference to the control plane |

## Canvases

Each of these is a kind of project. A small organization can merge neighbors, such as network and compute platform. A large one has many application projects and usually one of each of the others.

### Organization {#organization}

<Canvas id="organization" />

Things that exist once for the whole company.

- **Bundles:** Root DNS zone, identity provider and SSO roles, container registry, CI runners, audit log archive.
- **Environments:** One.
- **Connects:** Other projects use its resources by remote reference. Anything every environment needs, such as the registry, is set as an environment default in each of them.

<details>
<summary>Example <code>blueprint.yaml</code> <span className="badge badge--warning">alpha</span></summary>

```yaml
version: 1
project: org
components:
  dns:      { bundle: root-dns-zone, name: Root DNS Zone }
  sso:      { bundle: sso-identity, name: SSO and Roles }
  registry: { bundle: container-registry, name: Container Registry }
  runners:  { bundle: ci-runners, name: CI Runners }
  audit:    { bundle: audit-log-archive, name: Audit Log Archive }
links:
  - sso.identity      -> registry.identity
  - sso.identity      -> runners.identity
  - registry.registry -> runners.registry
```

</details>

### Network {#network}

<Canvas id="network" />

The address space everything else is deployed into.

- **Bundles:** VPC or VNet with subnets, private DNS zone, VPN or dedicated interconnect.
- **Environments:** One per region, split by account tier: `nonuseast`, `produseast`, `prodeuwest`. Stages do not each need a network, and dev and staging usually share the non-production one. A transit hub is its own project, because there are fewer hubs than networks.
- **Connects:** Each network is set as the environment default in the environments deployed into it, so it never appears on an application canvas.

<details>
<summary>Example <code>blueprint.yaml</code> <span className="badge badge--warning">alpha</span></summary>

```yaml
version: 1
project: network
components:
  vpc:        { bundle: aws-vpc, name: VPC }
  privatedns: { bundle: private-dns-zone, name: Private DNS Zone }
  vpn:        { bundle: site-to-site-vpn, name: VPN }
links:
  - vpc.network -> privatedns.network
  - vpc.network -> vpn.network
```

</details>

### Compute Platform {#compute-platform}

<Canvas id="compute-platform" />

Clusters, and what has to be installed in them before a workload can run.

- **Bundles:** Kubernetes cluster, container service cluster or app hosting plan, ingress controller, cert-manager, external-dns.
- **Environments:** The same as the network when each network has one cluster, and then the two can share a canvas if one team owns both. More environments when a network holds several clusters.
- **Connects:** The cluster is an environment default for application environments. Add-ons such as the ingress controller are connected to the cluster on this canvas.

<details>
<summary>Example <code>blueprint.yaml</code> <span className="badge badge--warning">alpha</span></summary>

```yaml
version: 1
project: compute
# No network component: each environment sets its network as an environment default.
components:
  cluster: { bundle: aws-eks-cluster, name: Kubernetes Cluster }
  ingress: { bundle: ingress-nginx, name: Ingress Controller }
  certs:   { bundle: cert-manager, name: Cert Manager }
  dns:     { bundle: external-dns, name: External DNS }
links:
  - cluster.kubernetes -> ingress.kubernetes
  - cluster.kubernetes -> certs.kubernetes
  - cluster.kubernetes -> dns.kubernetes
```

</details>

### Shared Services {#shared-services}

<Canvas id="shared-services" />

Services that many applications use and no single application owns.

- **Bundles:** Event bus, metrics, logs, and tracing backend, key management and secrets store, database used by several services.
- **Environments:** One per account tier, or one per region and tier when traffic has to stay in its region.
- **Connects:** Environment default when an environment has exactly one of the resource type, such as the metrics endpoint. Remote reference when the consumer has to pick one, such as a specific database.

<details>
<summary>Example <code>blueprint.yaml</code> <span className="badge badge--warning">alpha</span></summary>

```yaml
version: 1
project: shared
components:
  eventbus:  { bundle: aws-eventbridge-bus, name: Event Bus }
  telemetry: { bundle: observability-stack, name: "Metrics, Logs, and Traces" }
  kms:       { bundle: aws-kms-key, name: Encryption Key }
  secrets:   { bundle: secrets-store, name: Secrets Store }
  sharedb:   { bundle: aws-aurora-postgres, name: Shared Database }
links:
  - kms.key -> secrets.encryption
  - kms.key -> sharedb.encryption
  - kms.key -> eventbus.encryption
```

</details>

### Edge {#edge}

<Canvas id="edge" />

Where traffic enters and is steered.

- **Bundles:** CDN and WAF, global load balancer or failover routing, public DNS records.
- **Environments:** One per stage. There is one production edge no matter how many regions sit behind it.
- **Connects:** It consumes and is not consumed. Its instances have remote references to the application environments behind it, which makes it the traffic switch for blue/green and failover.

<details>
<summary>Example <code>blueprint.yaml</code> <span className="badge badge--warning">alpha</span></summary>

```yaml
version: 1
project: edge
# The application endpoints behind the load balancer are remote references,
# set on each edge environment.
components:
  waf:     { bundle: aws-waf, name: Web Application Firewall }
  lb:      { bundle: global-load-balancer, name: Global Load Balancer }
  cdn:     { bundle: cloudfront-cdn, name: CDN }
  records: { bundle: public-dns-records, name: Public DNS Records }
links:
  - waf.firewall     -> cdn.firewall
  - lb.loadbalancer  -> cdn.origin
  - cdn.distribution -> records.target
```

</details>

### Application {#application}

<Canvas id="application" />

One service or one product, and the things only it uses.

- **Bundles:** API or web service, workers and scheduled jobs, database owned by one service, cache, queue, or bucket owned by one service, service alarms and dashboards, tenant control plane.
- **Environments:** One per stage, and one per region in production when the service runs in several: `dev`, `staging`, `produseast`, `prodeuwest`. Previews and workspaces are forks of these.
- **Connects:** Components are connected to each other on the canvas. The network, cluster, and credentials arrive as environment defaults.

<details>
<summary>Example <code>blueprint.yaml</code> <span className="badge badge--warning">alpha</span></summary>

```yaml
version: 1
project: billing
# No network or cluster components: both arrive as environment defaults.
components:
  api:    { bundle: web-service, name: Billing API }
  worker: { bundle: worker-service, name: Invoice Worker }
  cron:   { bundle: scheduled-job, name: Nightly Reconciliation }
  db:     { bundle: aws-rds-postgres, name: Billing Database }
  cache:  { bundle: aws-elasticache-redis, name: Cache }
  queue:  { bundle: aws-sqs-queue, name: Invoice Queue }
  alarms: { bundle: service-alarms, name: Alarms and Dashboards }
links:
  - db.database -> api.database
  - db.database -> worker.database
  - db.database -> cron.database
  - cache.redis -> api.cache
  - queue.queue -> api.jobs
  - queue.queue -> worker.jobs
  - api.service -> alarms.service
```

</details>

### Data Platform {#data-platform}

<Canvas id="data-platform" />

Warehouse, lake, pipelines, and reporting.

- **Bundles:** Warehouse and lake storage, pipelines and orchestration.
- **Environments:** Usually two: dev and prod.
- **Connects:** Pipelines read application databases by remote reference. Applications do not depend on it.

<details>
<summary>Example <code>blueprint.yaml</code> <span className="badge badge--warning">alpha</span></summary>

```yaml
version: 1
project: data
# Pipelines read application databases through remote references,
# set on each data environment.
components:
  lake:      { bundle: s3-data-lake, name: Data Lake }
  warehouse: { bundle: redshift-serverless, name: Warehouse }
  pipelines: { bundle: managed-airflow, name: Pipelines }
links:
  - lake.bucket         -> warehouse.lake
  - lake.bucket         -> pipelines.lake
  - warehouse.warehouse -> pipelines.warehouse
```

</details>

### Tenant Stack {#tenant-stack}

<Canvas id="tenant-stack" />

The part of the product that each customer gets a private copy of.

- **Bundles:** Customer runtime and database.
- **Environments:** One per customer or per cell.
- **Connects:** Each tenant environment has a remote reference to the shared control plane, which is an application canvas with one environment per stage.

<details>
<summary>Example <code>blueprint.yaml</code> <span className="badge badge--warning">alpha</span></summary>

```yaml
version: 1
project: tenant
# runtime.controlplane is a remote reference to the control plane,
# set on each tenant environment.
components:
  runtime: { bundle: tenant-runtime, name: Tenant Runtime }
  db:      { bundle: aws-rds-postgres, name: Tenant Database }
links:
  - db.database -> runtime.database
```

</details>
