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

### Manifest

Manifests are _bundles_ that have been added to a project with a context. 

For example: You may add the 'aws-elasticache-redis' bundle to a project twice, once for `user-sessions` and a second instance for `caching`.

### Target

An "environment" or "workspace" that a manifest will be deployed to. Massdriver doesn't enforce any governance on how you design your targets. They can be modeled by application stage (production, staging, development), by region (prod-usw, prod-eu), and even ephemerally per developer (alice-dev, bob-dev).

Massdriver separates authentication and scale from the parity that is enforced by a project onto a target. This allows you to have the same 'architecture' for staging and production, but have a different scale for cost savings purposes.

### Link

A link is the line between two manifests. A link acts as a template for Connection creation at the package level. 

### Connection

 A connection can be thought of as an "input" that is another package's artifact. This links that artifact as an 'input connection' to the package.

### Package

A manifest that has been configured or deployed to a target.

### Params

User supplied parameters to package

### Deployment
 
The history of provisioning or decommissioning infrastructure or applications in Massdriver.

## Parity Enforcement

## JSON Schema
