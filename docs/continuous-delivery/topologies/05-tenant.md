---
id: topologies-tenant
slug: /continuous-delivery/topologies/tenant
title: Tenant Topologies
sidebar_label: Tenant
description: Environments that are a customer or a group of customers.
---

# Tenant Topologies

Each environment is a customer or a group of customers.

## Single-Tenant {#single-tenant}

<Topology id="single-tenant" />

One production environment per customer.

- **Project:** One project, with a template environment and one environment per customer.
- **Instances:** Every component is deployed for every customer. Services that all customers share belong in another project.
- **Versions:** Exact versions per customer, because customers upgrade on their own schedules.
- **Parity:** Each customer is compared against the template. Version differences between customers are expected. Param differences should be limited to size and customer identity.

**Example.** An analytics vendor deploys a private stack for each enterprise customer. Acme upgrades as soon as a release is out. Globex has a quarterly maintenance window and stays on 1.4.2 until then. Initech skipped a release and moves from 1.3.9 straight to 1.5.0. Each upgrade is a promote from the template to that customer's environment, scheduled for the customer's window.

## Cells {#cells}

<Topology id="cells" />

Production is a set of identical environments, each serving a fixed share of tenants. A new cell is added when the existing ones fill up.

- **Project:** One project, with one environment per cell. The router that assigns tenants to cells is a separate project.
- **Instances:** Every component is deployed in every cell.
- **Versions:** Exact versions, moved cell by cell, so one bad release reaches a limited number of tenants.
- **Parity:** Cells should be identical. A new cell is a fork of an existing one.

**Example.** A messaging platform places 5,000 tenants in each cell. Release 1.5.0 is promoted to `cell1`, then `cell2`, then `cell3`, with an hour between each. When cell3 fills up, `mass environment fork chat-cell3 cell4` stamps a new cell, and the router starts placing new tenants there.

## Tiered Tenancy {#tiered-tenancy}

<Topology id="tiered-tenancy" />

Most customers share one pooled environment, and customers on a higher tier each get a dedicated one.

- **Project:** One project. The pool and the dedicated environments have the same canvas at different sizes.
- **Instances:** Every component is deployed in every environment.
- **Versions:** The pool usually follows a minor channel. Dedicated environments hold exact versions and upgrade by agreement with the customer.
- **Parity:** Size differs by design. A tier that needs a component the others lack is no longer this topology and needs its own project.

**Example.** Most customers share `pool`, which follows `~1.5`. Two enterprise customers have dedicated environments on exact versions. Patch 1.5.1 reaches the pool when it is published. Acme takes it in their next maintenance window by a promote from the pool. Globex stays on 1.4.2 until they schedule an upgrade.

## Compliance Partition {#compliance-partition}

<Topology id="compliance-partition" />

A copy of production inside a regulated or isolated boundary: GovCloud, a sovereign region, an air-gapped site.

- **Project:** The same project when the boundary is a different set of cloud credentials, as with GovCloud. An air-gapped site usually runs its own Massdriver installation with its own copy of the project.
- **Instances:** Every component is deployed inside the boundary. Nothing is referenced from outside it.
- **Versions:** Exact versions, promoted after review. For a separate installation, bundles have to be published into its catalog before anything can be deployed.
- **Parity:** Compare works inside a project. It cannot see across installations, so versions and params for a separate installation have to be tracked outside Massdriver.

**Example.** A health-tech product sells to US agencies. `govcloud` is an environment of the same project whose environment default is a GovCloud credential. It takes each release by promote from `prod` after a compliance review. One agency runs an air-gapped installation, and each release is published into that installation's catalog and deployed there.
