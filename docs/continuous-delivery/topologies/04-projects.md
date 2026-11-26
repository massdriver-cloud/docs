---
id: topologies-projects
slug: /continuous-delivery/topologies/projects
title: Projects That Work Together
sidebar_label: Projects That Work Together
description: Separate projects that share resources through environment defaults and remote references.
image: /img/og/topologies-projects.png
---

# Projects That Work Together

A project is one blueprint. When parts of a system need different components or a different number of copies, they go in separate projects. Each project then uses the others' resources through environment defaults and remote references.

## Singleton {#singleton}

<Topology id="singleton" />

A project with one environment, for things the organization has exactly one of.

- **Projects:** One organization project, used by every other project.
- **Environments:** One, such as `global`.
- **Resources it provides:** Each application environment sets the container registry as an environment default. Delegated DNS zones in other projects have a remote reference to the root zone.
- **Parity:** There is no other environment to compare it with.

**Example.** The `org` project's `global` environment deploys the root DNS zone, the container registry, and SSO roles. `billing-prod` and `search-prod` both set the registry as an environment default.

## Platform Layer {#platform-layer}

<Topology id="platform-layer" />

A project of shared infrastructure, such as networks and clusters. Its environments are environment defaults for the environments of application projects.

- **Projects:** The platform project, plus each application project that uses it.
- **Environments:** The platform usually has fewer environments than the applications. Several application environments can share one platform environment, such as `nonprod`.
- **Resources it provides:** Each application environment sets the platform's network and cluster as environment defaults. They never appear on an application blueprint.
- **Parity:** Each project keeps its own parity. A change to a platform environment reaches every application environment that uses it, the next time each one deploys.

**Example.** The `platform` project has `nonprod` and `prod`, each with a network and a Kubernetes cluster. `billing-dev` and `billing-staging` both use `platform-nonprod`'s cluster as their environment default, and `billing-prod` uses `platform-prod`'s.

```bash
mass environment default billing-dev <nonprod-cluster-resource-id>
mass environment default billing-staging <nonprod-cluster-resource-id>
mass environment default billing-prod <prod-cluster-resource-id>
```

## Migration Pair {#migration-pair}

<Topology id="migration-pair" />

The old architecture and its replacement run side by side while traffic moves across.

- **Projects:** Two. The architectures have different components, so they cannot be environments of the same project.
- **Environments:** Each project keeps its own environments, such as dev, staging, and prod.
- **Resources from elsewhere:** A resource that both sides need during the move, such as the database, stays in the old project. Instances in the new project have a remote reference to it.
- **Parity:** There is none between the two projects.

**Example.** A monolith on virtual machines is moving to services on Kubernetes. The `legacy` and `services` projects each have their own environments. The new services' database slots point at the monolith's database by remote reference, and the edge moves traffic one route at a time. The database has to move out of the legacy project before that project is decommissioned.

## Multi-Cloud {#multi-cloud}

<Topology id="multi-cloud" />

The same application on more than one cloud provider.

- **Projects:** One per cloud, because the infrastructure components differ.
- **Environments:** Each project has its own stages or regions.
- **Resources from elsewhere:** None across clouds. The application bundle can be the same in every project when its dependencies are resource types that each cloud's bundles produce, such as a Kubernetes cluster and a Postgres database.
- **Parity:** Each project keeps its own parity. Across clouds, only the application instances can be compared.

**Example.** The `shopaws` project uses EKS and RDS bundles, and `shopazure` uses AKS and Azure Database bundles. Both run the same `shop-app` bundle.

## Isolated Boundary {#isolated-boundary}

<Topology id="boundary" />

Environments inside a regulated or isolated boundary, such as GovCloud or a sovereign region.

- **Projects:** The same project when only the credentials and region differ. A different project when the boundary needs different components.
- **Environments:** An environment inside the boundary, such as `govcloud`, next to the ones outside it.
- **Resources from elsewhere:** Each environment sets the credentials for its own account as an environment default. The environment defaults and remote references inside the boundary point only at resources inside it.
- **Parity:** Because it is the same project, comparing `govcloud` with `prod` shows exactly what differs.

**Example.** The `records` project has `prod` in a commercial AWS account and `govcloud` in a GovCloud account. Each sets its own account's credentials as its environment default, and the blueprint is the same.
