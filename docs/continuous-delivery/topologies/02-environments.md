---
id: topologies-environments
slug: /continuous-delivery/topologies/environments
title: Environments in a Project
sidebar_label: Environments in a Project
description: What the environments of one project can stand for.
image: /img/og/topologies-environments.png
---

# Environments in a Project

Each topology on this page is one project. All of its environments have the same blueprint. What changes from one topology to the next is what each environment stands for.

## Stages {#stages}

<Topology id="stages" />

Each environment is a step on the way to production: `dev`, `staging`, `prod`.

- **Environments:** One per stage.
- **Resources from elsewhere:** Every stage deploys every component on the blueprint. The network and cluster are usually environment defaults from a [Platform Layer](/continuous-delivery/topologies/projects#platform-layer), with dev and staging sharing the non-production ones.
- **Parity:** Comparing two stages should show only size and credentials.

**Example.** The `billing` project's blueprint has an API, a Postgres database, and a queue. `billing-dev`, `billing-staging`, and `billing-prod` each deploy all three. Dev and staging set the non-production cluster as their environment default, and prod sets the production cluster.

```bash
mass environment default billing-staging <nonprod-cluster-resource-id>
mass environment compare billing-staging billing-prod
```

## Regions {#regions}

<Topology id="regions" />

Each environment is a region, and all of them are production.

- **Environments:** One per region.
- **Resources from elsewhere:** Every region deploys every component on the blueprint and sets its own region's network and cluster as environment defaults. Anything that exists once for all regions, such as global DNS or the CDN, goes in a different project.
- **Parity:** Comparing two regions should show only region-specific params, such as the region and capacity.

**Example.** The `api` project has `useast`, `euwest`, and `apsouth`. Each environment sets the cluster in its region as its environment default. Adding a region means adding an environment and setting its default. The blueprint does not change.

## Standby {#standby}

<Topology id="standby" />

A second copy of production in another location. It takes traffic only during a failover.

- **Environments:** `primary` and `standby`.
- **Resources from elsewhere:** Both environments deploy every component, and the standby can run smaller. Nothing in the standby uses resources from the primary's region, or it would fail along with it. The failover routing is in a different project, because there is only one of it.
- **Parity:** This topology needs the strictest parity. Comparing the two environments should show only size and region.

**Example.** The `api` project runs `primary` in us-east-1 and `standby` in us-west-2 at half size. The edge project's failover routing has a remote reference to each environment's load balancer. During a failover, the routing sends traffic to the standby and the standby's size params are raised.

## Blue/Green {#blue-green}

<Topology id="blue-green" />

Two production environments. One takes traffic and the other is idle, ready for the next release or for a rollback.

- **Environments:** `blue` and `green`.
- **Resources from elsewhere:** Both environments deploy the stateless components. There is only one database, so it lives in its own project with one environment, and each color fills its database slot with a remote reference to it. The traffic switch is in the edge project.
- **Parity:** Both colors have the same blueprint, so the idle color is always the same architecture as the live one.

**Example.** The `api` project's blueprint has the API service and a worker, and no database. Both colors point their database slot at the `database-prod` environment:

```bash
mass instance remote-reference set api-blue-service database <database-resource-id>
mass instance remote-reference set api-green-service database <database-resource-id>
```

The edge project's load balancer sends traffic to blue. When green is ready, the load balancer is redeployed pointing at green.

## Customers {#customers}

<Topology id="customers" />

One production environment per customer.

- **Environments:** One per customer.
- **Resources from elsewhere:** Every customer environment deploys every component on the blueprint. Services that all customers share, such as the control plane, are in a different project, and each customer environment uses them through a remote reference or an environment default.
- **Parity:** Comparing two customers should show only size and customer-specific params.

**Example.** The `tenant` project has `acme`, `globex`, and `initech`. Each one runs its own application and database. Each one's application has a remote reference to the API in the `controlplane-prod` environment. A new customer is a new environment of the `tenant` project.

## Pool and Dedicated {#pool-and-dedicated}

<Topology id="pool-and-dedicated" />

Most customers share one pooled environment, and customers on a higher tier each get an environment of their own.

- **Environments:** `pool`, plus one environment per dedicated customer.
- **Resources from elsewhere:** Same as [Customers](#customers).
- **Parity:** The pool and the dedicated environments differ in size. If a tier needs a component that the pool does not have, it is a different blueprint and belongs in a different project.

**Example.** Most customers share `product-pool`. Two enterprise customers have `product-acme` and `product-globex`, which have the same components at a smaller size and in the customer's preferred region.

## Cells {#cells}

<Topology id="cells" />

Production is split into identical environments, and each one serves a fixed share of tenants. A new cell is added when the existing ones are full.

- **Environments:** `cell1` through `cellN`.
- **Resources from elsewhere:** Every cell deploys every component on the blueprint. Cells do not use each other's resources, so a failure stays inside one cell. The router that assigns tenants to cells is in a different project, and it has a remote reference to each cell's entry point.
- **Parity:** Cells should be identical apart from their names.

**Example.** A messaging platform places 5,000 tenants in each cell of the `chat` project. When `cell3` fills up, a fork creates `cell4` with the same params, and the router gets a remote reference to it:

```bash
mass environment fork chat-cell3 cell4 --copy-environment-defaults
```

## Sites {#sites}

<Topology id="sites" />

One environment per physical location, such as a store, a factory, or a clinic. There can be hundreds.

- **Environments:** One per site.
- **Resources from elsewhere:** Every site deploys every component on the blueprint. Each site sets its own on-site cluster and credentials as environment defaults.
- **Parity:** Comparing two sites should show only site-specific params, such as the address range and the site's identity.

**Example.** A retailer runs a small Kubernetes stack in each store of the `store` project. Opening a new store means forking an existing one, changing the site-specific params, and setting the new store's cluster as its environment default:

```bash
mass environment fork store-store003 store401
mass environment default store-store401 <store401-cluster-resource-id>
```
