---
id: topologies-overview
slug: /continuous-delivery/topologies
title: Environment Topologies
sidebar_label: Overview
description: The shapes projects and environments take, and how they share resources.
image: /img/og/topologies.png
---

# Environment Topologies

A topology is the shape of your projects and environments. It answers three questions:

1. Which projects exist?
2. What does each environment of a project stand for: a stage, a region, a customer, a pull request?
3. Where does an environment get the resources it does not deploy itself?

How a change moves from one environment to another is a separate decision. Refer to [Promote](/continuous-delivery/promote) and [release channels](/bundle-development/publishing/versioning#release-channels).

## The rules

**A project is one blueprint.** Every environment in a project has the same components, connected the same way. If two environments need different components, they belong in different projects.

**An environment has one instance of every component.** Params and secrets are set per instance, so the environments of a project can differ in size, region, and credentials and still have the same architecture. An instance does not have to be deployed.

**A dependency is filled from one of three places.** Massdriver checks them in this order on every deploy and uses the first that matches:

1. A **remote reference**, set on one slot of one instance. It points at a specific resource in another environment, in the same project or a different one.
2. A **connection** drawn on the blueprint. It fills the slot from the connected component in the same environment, once that component has deployed.
3. An **environment default**, set on the environment for a resource type. It fills any slot of that type that the first two did not fill.

So an environment can use a resource it does not deploy in two ways:

- **The component is not on the blueprint.** The environment sets the resource as an environment default. Networks, clusters, and cloud credentials usually arrive this way.
- **The component is on the blueprint but left undeployed in this environment.** Each instance that depends on it gets a remote reference to the resource in another environment.

Either way, the resource needs a [resource grant](/guides/share-resources) that covers the consuming environment. [What fills a slot](/bundle-development/dependencies-resources/version-resolution#what-fills-a-slot) has the details.

**A fork is a new environment in the same project.** It starts with the params of the environment it was forked from. Environment defaults, secrets, and remote references are copied only when you ask for them. Refer to [Fork an Environment](/continuous-delivery/fork-environment).

## How projects combine

Most organizations have several projects, each with its own topology.

<OrganizationTopology />

- **Organization** has one environment, `global`, for the root DNS zone, identity, and the container registry. This is a [Singleton](/continuous-delivery/topologies/projects#singleton).
- **Network** has one environment per region: `nonuseast` for dev and staging, and `produseast` and `prodeuwest` for production. This is [Regions](/continuous-delivery/topologies/environments#regions).
- **Compute platform** has one cluster environment on each network. Each cluster is the environment default for the billing environments that run on it. This is a [Platform Layer](/continuous-delivery/topologies/projects#platform-layer).
- **Billing** has `dev` and `staging`, then one production environment per region. Dev and staging share the non-production cluster. This combines [Stages](/continuous-delivery/topologies/environments#stages) and [Regions](/continuous-delivery/topologies/environments#regions).
- **Edge** has `staging` and `prod`. The one production edge holds remote references to both regional billing environments.

No project has a copy of the components below it. Billing never puts a network or a cluster on its blueprint, so adding a region means adding an environment to the network, compute, and billing projects, with no change to any blueprint.

Start with [Canvas Design](/continuous-delivery/topologies/canvas-design), which covers how to decide which bundles share a project. The topology of each project follows from that decision.

## Reading the diagrams

<TopologyLegend />

## Topologies

| Page | Question | Topologies |
|---|---|---|
| [Canvas Design](/continuous-delivery/topologies/canvas-design) | Which bundles go in which project? | |
| [Environments in a Project](/continuous-delivery/topologies/environments) | What does each environment of one project stand for? | Stages, Regions, Standby, Blue/Green, Customers, Pool and Dedicated, Cells, Sites |
| [Short-Lived Environments](/continuous-delivery/topologies/short-lived) | Which environments are forked for a while and then removed? | Pull Request Preview, Workspace, Purpose Fork |
| [Projects That Work Together](/continuous-delivery/topologies/projects) | How do separate projects share resources? | Singleton, Platform Layer, Migration Pair, Multi-Cloud, Isolated Boundary |
