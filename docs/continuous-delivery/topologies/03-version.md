---
id: topologies-version
slug: /continuous-delivery/topologies/version
title: Version Topologies
sidebar_label: Version
description: Production split across environments because more than one version is live at a time.
---

# Version Topologies

Production is more than one environment because more than one version is live at a time.

## Blue/Green {#blue-green}

<Topology id="blue-green" />

Two production environments, one of them receiving traffic. A release goes to the idle one, traffic switches, and the previous one stays up for rollback.

- **Project:** One project with two environments. Whatever switches traffic, such as DNS or a load balancer, belongs in a separate project because there is only one of it.
- **Instances:** Stateless components are deployed in both. Shared state, such as the database, is deployed once and filled into both environments by remote reference.
- **Versions:** Exact versions in both. The idle environment gets the new version first.
- **Parity:** Compare should show a version difference during a release and nothing at any other time.

**Example.** An `api` project has `blue` and `green` environments behind a load balancer in the edge project. Blue serves traffic on 1.4.2. Version 1.5.0 is promoted to green, smoke tests run against green's URL, and a deploy of the edge points the listener at green. Blue stays on 1.4.2 until the next release, ready to take the traffic back.

## Canary Rings {#canary-rings}

<Topology id="canary-rings" />

Production is several environments that take a release in order, smallest first.

- **Project:** One project, with one environment per ring.
- **Instances:** Every component is deployed in every ring.
- **Versions:** Publishing a bundle deploys to every instance on a matching channel, so a channel cannot put the rings in order. The first ring follows the channel. Later rings hold exact versions that are moved forward with instance promote.
- **Parity:** Rings differ in version while a release is in flight. Params should match apart from size.

**Example.** A consumer app splits production into `canary` (1% of users), `ring1` (20%), and `ring2` (everyone else). Canary follows `~1.5`, so it deploys 1.5.0 when it is published. After an hour with no alarms, 1.5.0 is promoted to ring1, and the next morning to ring2.

## Release Lines {#release-lines}

<Topology id="release-lines" />

One environment per supported major version, all serving users at the same time.

- **Project:** One project while the major versions share a blueprint. A major version that changes the architecture needs its own project.
- **Instances:** Every component is deployed in every environment.
- **Versions:** Each environment follows a major channel: `~1`, `~2`, `~3`. Patch and minor releases reach the right line with no version changes by hand.
- **Parity:** Versions differ by design. Compare is useful for params only.

**Example.** An API vendor still supports v1 and v2 clients after shipping v3. `prodv1` follows `~1`, `prodv2` follows `~2`, and `prodv3` follows `~3`. A security fix published as 1.9.3 deploys only to `prodv1`, and 2.4.1 only to `prodv2`.

## Migration Pair {#migration-pair}

<Topology id="migration-pair" />

The old architecture and its replacement run side by side while traffic or data moves across.

- **Project:** Two projects. The architectures differ and a project is one blueprint, so they cannot be two environments of the same project.
- **Instances:** Each project deploys its own components. A resource that both sides need during the move, such as the database, is a remote reference from the new project to the old one.
- **Versions:** Independent. The legacy project usually stays on exact versions.
- **Parity:** There is none between the two projects. Each project keeps parity across its own environments.

**Example.** A monolith on virtual machines is moving to services on Kubernetes. The `legacy` and `services` projects each keep their own dev, staging, and prod. During the move, the new services read the monolith's database through a remote reference, and the edge shifts traffic one route at a time. When the last route moves, the legacy project is decommissioned.
