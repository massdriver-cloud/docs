---
id: topologies-place
slug: /continuous-delivery/topologies/place
title: Place Topologies
sidebar_label: Place
description: Environments that are locations, such as regions, clouds, and sites.
---

# Place Topologies

Each environment is a location.

## Multi-Region {#multi-region}

<Topology id="multi-region" />

The same project deployed once per region. Regions are peers, so a release is a rollout across them.

- **Project:** One project, with one environment per region.
- **Instances:** Every regional component is deployed in every region. Components that exist once for all regions belong in another project.
- **Versions:** Exact versions, moved region by region with instance promote. Regions that follow the same channel all update at once.
- **Parity:** When a rollout finishes, Compare should show the params that are specific to a region and nothing else.

**Example.** A SaaS API runs in `useast`, `euwest`, and `apsouth`. Release 1.5.0 is promoted from staging to `useast`. After a day of clean metrics, it is promoted from `useast` to `euwest`, then to `apsouth`. Afterward, `mass environment compare api-useast api-euwest` shows only the region and capacity params.

## Hub and Spoke {#hub-and-spoke}

<Topology id="hub-and-spoke" />

A hub holds shared infrastructure such as transit networking, DNS, or a central cluster. Spokes consume it.

- **Project:** Two projects. The hub and the spokes have different canvases.
- **Instances:** The hub project deploys the shared components once. Each spoke environment sets the hub's resources as environment defaults, so spoke instances connect to the hub without the hub appearing on the spoke canvas.
- **Versions:** The hub holds exact versions, and every change is reviewed as a plan. Spokes roll out as in multi-region.
- **Parity:** Parity is among the spokes. A hub change reaches every spoke through the resources the hub produces, so a new resource type version has to stay inside the range the spoke bundles accept.

**Example.** A transit gateway, shared egress, and central DNS live in a `hub` project with one environment. Each regional application environment sets the hub's transit gateway as an environment default with `mass environment default`. Upgrading the transit gateway bundle is one reviewed deploy in the hub, and each spoke reads the updated resource the next time it deploys.

## Disaster Recovery Standby {#disaster-recovery-standby}

<Topology id="disaster-recovery-standby" />

A second copy of production in another location that takes no traffic until a failover.

- **Project:** One project with two environments.
- **Instances:** Every component is deployed in both. The standby can run at a reduced size if it scales up during failover.
- **Versions:** The standby holds the same exact versions as the primary. Promote primary to standby after every production deploy.
- **Parity:** This is the strictest parity in the catalog. Any difference in Compare other than size and location is a failover risk.

**Example.** Production runs in `primary` in us-east-1 and `standby` in us-west-2 at half size. Every production deploy is followed by `mass instance promote` from each primary instance to its standby instance. During a failover drill, the edge points traffic at the standby and the standby's size params are raised to match the primary.

## Multi-Cloud {#multi-cloud}

<Topology id="multi-cloud" />

The same application on more than one cloud provider.

- **Project:** One project per cloud when the infrastructure components differ, which they usually do.
- **Instances:** Each project deploys the infrastructure bundles for its cloud. The application bundle can be the same in all of them if its dependencies are resource types that every cloud's bundles can produce.
- **Versions:** The shared application bundle is published once and every project picks it up through its channel. Infrastructure bundles are versioned separately per cloud.
- **Parity:** Parity holds inside each cloud's project. Across clouds, only the application instances can be compared.

**Example.** A product is sold through both the AWS and Azure marketplaces. The `shopaws` project uses EKS and RDS bundles, and `shopazure` uses AKS and Azure Database bundles. Both run the same `shop-app` bundle, whose dependencies are a Kubernetes cluster and a Postgres database. Publishing `shop-app` 2.3.0 reaches both projects' production environments through `~2`.

## Site Fleet {#site-fleet}

<Topology id="site-fleet" />

One environment per physical location: a store, a factory, a clinic, an edge point of presence. There can be hundreds.

- **Project:** One project. A template environment that is never deployed holds the baseline configuration.
- **Instances:** Every site deploys every component. The template deploys none.
- **Versions:** Exact versions per site, moved in batches by promoting from the template.
- **Parity:** Each site is compared against the template. A new site is a fork of it.

**Example.** A retailer runs a small Kubernetes stack in 400 stores. A release goes into the `stores-template` environment first, then is promoted to 20 stores, then 100 more, then the rest. Opening a new store is one command:

```bash
mass environment fork stores-template store401
```
