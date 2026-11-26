---
id: topologies-overview
slug: /continuous-delivery/topologies
title: Environment Topologies
sidebar_label: Overview
description: The shapes environments take around a project, and how organizations combine them.
---

# Environment Topologies

An environment topology is the shape of the environments around a project: what each environment stands for, which components it deploys, which versions it runs, and how a change moves between them.

Most organizations run several topologies at once. A network is needed once per region, a billing API once per stage, and the root DNS zone once for the whole company. Each of those becomes its own project with its own topology, and the projects connect through [environment defaults and remote references](/bundle-development/dependencies-resources/version-resolution#what-fills-a-slot).

## How topologies combine

<OrganizationTopology />

Five projects, each with environments that mean something different:

- **Organization** is a [Singleton](/continuous-delivery/topologies/layer#singleton): one `global` environment for the root DNS zone, identity, the container registry, and CI runners.
- **Network** is [Multi-Region](/continuous-delivery/topologies/place#multi-region), split by account tier. Dev and staging share `nonuseast`. Each production region gets its own network.
- **Compute platform** is a [Platform Layer](/continuous-delivery/topologies/layer#platform-layer). Each cluster sits on one network and is the environment default for the application environments deployed to it.
- **Billing API** is [Linear Promotion](/continuous-delivery/topologies/stage#linear-promotion) through `dev` and `staging`, and production is [Multi-Region](/continuous-delivery/topologies/place#multi-region): `produseast` and `prodeuwest`. Previews and developer workspaces fork from it.
- **Edge** is Linear Promotion with one environment per stage. There is one production edge, no matter how many regions sit behind it, and it holds remote references to the regional billing environments.

The billing API has four environments, the network under it has three, and the edge in front of it has two. A release moves through billing one stage at a time. A network change in `produseast` reaches the cluster on it, then the billing environment on that cluster, then the edge in front of it. No project needs a copy of the components below it.

[Canvas Design](/continuous-delivery/topologies/canvas-design) covers how to decide which bundles share a project.

## What a topology is made of

Every topology in this guide is described at four scopes.

**Bundle.** A bundle is published once to the organization catalog, and any instance in any project can run it. Each instance chooses its own version: an exact version, a [release channel](/bundle-development/publishing/versioning#release-channels) such as `~1` or `~1.4`, or a channel with `+dev` to include development releases. Publishing a bundle deploys it to every instance whose channel matches, in every project.

**Project.** A project is one blueprint, and it is the parity boundary. Every environment in a project has the same components and the same links. A topology whose environments need different components spans more than one project.

**Environment.** An environment has one instance of every component, and an instance does not have to be deployed. Each dependency of an instance is filled by a remote reference, a link on the canvas, or an environment default, in that order. An environment can use a resource from another environment or another project instead of deploying its own.

**Parity.** The blueprint is shared. Params, versions, secrets, and credentials belong to each environment, and [Compare](/concepts/projects-and-environments#environment-comparison) shows the difference between two environments of a project. Each topology says which differences are expected.

A change moves in one of three ways:

- A **publish** reaches instances through their release channels.
- A **[promote](/continuous-delivery/promote)** copies params and the version from one instance to another instance of the same component, and leaves a plan on the destination.
- A **[fork](/continuous-delivery/fork-environment)** creates a new environment from a parent. Forking again resets it to the parent.

## Reading the diagrams

The squares in an environment are the components of the project blueprint, so every environment in a project has the same row of squares. The text beside them is the version or release channel that most instances in that environment hold.

<TopologyLegend />

## Catalog

The topologies are grouped by what an environment stands for.

| Group | An environment is | Topologies |
|---|---|---|
| [Stage](/continuous-delivery/topologies/stage) | A step in a sequence | Linear Promotion, Branch-Mapped Promotion, Shared Integration |
| [Change](/continuous-delivery/topologies/change) | One piece of work in progress | Pull Request Preview, Staged Preview, Feature Environment, Hotfix Environment |
| [Version](/continuous-delivery/topologies/version) | One of several live versions | Blue/Green, Canary Rings, Release Lines, Migration Pair |
| [Place](/continuous-delivery/topologies/place) | A location | Multi-Region, Hub and Spoke, Disaster Recovery Standby, Multi-Cloud, Site Fleet |
| [Tenant](/continuous-delivery/topologies/tenant) | A customer or a group of customers | Single-Tenant, Cells, Tiered Tenancy, Compliance Partition |
| [Person](/continuous-delivery/topologies/person) | Someone's workspace | Developer Workspace, Team Environment, Agent Workspace, Training Environment |
| [Purpose](/continuous-delivery/topologies/purpose) | One job | Load Test, Security and Chaos Target, Demo, Partner Sandbox, Spike, Scheduled |
| [Layer](/continuous-delivery/topologies/layer) | A foundation other projects use | Singleton, Platform Layer |
