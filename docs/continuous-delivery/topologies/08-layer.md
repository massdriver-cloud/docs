---
id: topologies-layer
slug: /continuous-delivery/topologies/layer
title: Layer Topologies
sidebar_label: Layer
description: Environments that other projects depend on.
---

# Layer Topologies

Other projects depend on these environments.

## Singleton {#singleton}

<Topology id="singleton" />

A project for things that exist once per organization: root DNS, identity, registries, CI runners.

- **Project:** Its own project, with one environment.
- **Instances:** Every component is deployed once. Other projects use its resources through environment defaults or remote references.
- **Versions:** Exact versions. There is no earlier stage to test in, so every change is reviewed as a plan first.
- **Parity:** There is nothing to compare it with.

**Example.** The root DNS zone, the container registry, and SSO roles live in the one environment of the `org` project. Every application environment sets the registry as an environment default. Delegated DNS zones in other projects hold a remote reference to the root zone. A change to the registry bundle is planned, reviewed, and deployed once.

## Platform Layer {#platform-layer}

<Topology id="platform-layer" />

A foundation project whose environments are consumed by the environments of other projects.

- **Project:** At least two: the platform project and each application project.
- **Instances:** The platform project deploys networks, clusters, and other shared components. Application environments set those resources as environment defaults. The mapping is usually many to one, with several application environments on one non-production platform environment.
- **Versions:** Platform instances follow stable channels or hold exact versions in every environment, including non-production, because every attached project depends on them.
- **Parity:** Parity holds inside each project separately. A change to the platform reaches every application environment attached to it.

**Example.** A `platform` project has `nonprod` and `prod` environments, each with a network and a Kubernetes cluster. The billing project's dev and staging environments both use platform nonprod's network and cluster as environment defaults, and billing prod uses platform prod's. A cluster upgrade is deployed to platform nonprod first, verified against billing dev and staging, then deployed to platform prod.
