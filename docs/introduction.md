---
id: introduction
slug: /
title: Welcome to Massdriver!
sidebar_label: Introduction
---

Massdriver is an internal developer platfrom with support for deploying cloud infrastructure _and_ applications 
platform for building platforms
augment ops teams
be ops for your devs
parity

## Bar
Sections:

* IDP
* Terminology
* Bundles / Applications
* Artifacts & Artifact Definitions
* JSON Schema


Bundles - Useful, intention-based infrastructure abstractions, should include security and observability.
ArtifactDefinition - defines the resources that can be connected in Massdriver. Often carry metadata (region, policies)
Project - A collection of manifests that compose an application or architecture.
Manifest - An instance of a Bundle (with name/context) added to a project (redis: Cache & Sessions). Template of a Package
Link - a link between two manifests, acts as a template for Connection creation at the package level. Template of a Connection
Target - An "environment" or "workspace" that a package is deployed to (prod, staging, chauncy-dev)
TargetConnection - A single instance of an artifact type linked to a target that all packages will default to if that type isn't set explicitly on the package.
E.g.: A single default AWS Credential for the Prod target.
Package - A manifest that has been configured to be deployed to a target.
Params - User supplied parameters to package
Connection - A connection can be thought of as an "input" that is another package's artifact.
This links that artifact as an 'input connection' to the package.
Deployment - Act of executing packages
Artifact - Resource created by a deployment. Artifacts are always a concrete type.
