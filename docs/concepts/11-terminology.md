---
id: concepts-FOO
slug: /concepts/terminology
title: FOO
sidebar_label: FOO
---

### Artifact

Resource created by a [deployment](#deployment) that can be attached to other bundles.

### Artifact Definition

Artifact definitions are a form of type system in Massdriver that determines _what_ types of [bundles](#bundle) can be connected together. They typically carry metadata like region, policies, and cloud resource identifiers.

additonalProperties should always be false or object

### Bundle

Bundles are the basic building blocks of infrastructure, applications, and architectures in Massdriver. They are composed of Terraform modules and Helm charts.

Massdriver includes a number of pre-built [best-practices and reference architecture](#TBD-GUIDES-LINK) bundles, but you may also develop your own.

A Massdriver bundle typically services a single purpose rather than abstracting an entire cloud service. Instead of terraform modules like "AWS RDS" they will typically be designed around the use case a software engineering is looking for like "AWS RDS MySQL".

### Connection

Connections are the lines between [manifests](#manifest) in the Massdriver UI. They can be thought of as an "input" that is another package's artifact.

Connections are unidirectional. The always flow from "left" to "right" and are the _edges_ of a directed acyclic graph defining the dependency hierachy of your infrastructure and applications.

A dotted line indicates that an [artifact](#artifact) _has not_ been provisioned yet for the connection.

A solid lines indicates that an [artifact](#artifact) _has_ been provisioned for the connection.

### Deployment

A record of provisioning or decommissioning infrastructure or applications in Massdriver.

### Manifest

Manifests are [bundles](#bundle) that have been added to a project with a context.

For example: You may add the `aws-elasticache-redis` bundle to a project for multiple use-cases, one instance for `user-sessions` and a second instance for `caching`.

### Package

A _package_ is a deployed instance of a [manifest](#manifest) to a specific [target](#target) (e.g.: production, staging, US West, etc).

### Params

Values that are configured by an end-user to deploy a [manifest](#manifest). These are defined using JSON Schema (draft-07).

### Project

A collection of [manifests](#manifest) that compose an application or architecture. A project acts as a 'blue print' that can be applied to multiple [targets](#target) (e.g.: environments or regions).

A project also acts as the parity boundary. All targets in a project will have the same blueprint of resources applied (although scale can be controlled independently).

### Target

An "environment" or "workspace" that a [manifest](#manifest) will be deployed to. Massdriver doesn't enforce any governance on how you design your targets. Targets can be modeled by application stage (production, staging, development), by region (prod-usw, prod-eu), and even ephemerally per developer (alice-dev, bob-dev).

Massdriver separates authentication and scale from the parity that is enforced by a project. This allows targets to share the same 'architecture' for staging and production, but have a different scale for cost savings purposes.
