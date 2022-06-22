---
id: introduction
slug: /
title: Welcome to Massdriver!
sidebar_label: Introduction
---

Massdriver is an internal developer platfrom with support for deploying cloud infrastructure _and_ applications in AWS, Google Cloud, Azure, and Kubernetes.

## Terminology

### Bundles

Bundles are the basic building blocks of infrastructure, applications, and architectures in Massdriver. They are composed of Terraform modules and Helm charts.

Massdriver includes a number of pre-built best-practices and reference architecture bundles, but you may also develop your own.

A Massdriver bundle typically services a single purpose rather than abstracting an entire cloud service. Instead of terraform modules like "AWS RDS" they will typically be designed around the use case a software engineering is looking for like "AWS RDS MySQL".

### Artifact Definition

Artifact definitions are a form of type system in Massdriver that determines _what_ types of bundles can be connected together. They typically carry metadata like region, policies, and cloud resource identifiers.

### Artifact

Resource created by a deployment that can be attached to other bundles.

### Project

A collection of manifests that compose an application or architecture. A project acts as a 'blue print' that can be applied to multiple environments or regions.

A project also acts as the parity boundary. All targets in a project will have the same blueprint of resources applied (although scale can be controlled independently).

### Manifests & Packages

Manifests are _bundles_ that have been added to a project with a context. 

For example: You may add the `aws-elasticache-redis` bundle to a project for multiple use-cases, one instance for `user-sessions` and a second instance for `caching`.

A _package_ is a deployed intance of a _manifest_.

### Target

An "environment" or "workspace" that a manifest will be deployed to. Massdriver doesn't enforce any governance on how you design your targets. Targets can be modeled by application stage (production, staging, development), by region (prod-usw, prod-eu), and even ephemerally per developer (alice-dev, bob-dev).

Massdriver separates authentication and scale from the parity that is enforced by a project. This allows targets to share the same 'architecture' for staging and production, but have a different scale for cost savings purposes.

### Links & Connections

Links and connections are the lines between manifests in the Massdriver UI. They can be thought of as an "input" that is another package's artifact.

A _link_ acts as a placeholder for a connection when connecting infrastructure in Massdriver. Links are converted to connections once the source manifest (left-side) of the connection has been provisioned. They are indicated as dashed lines in the Massdriver UI.

A _connection_ is indicated by a solid line. A connection represents a provisioned artifact that is connected as an input to the dependent manifest (right-side).

### Params

Values that are configured by an end-user to deploy a manifest. These are defined using JSON Schema (draft-07).

### Deployment
 
A record of provisioning or decommissioning infrastructure or applications in Massdriver.

## Parity Enforcement

## JSON Schema
