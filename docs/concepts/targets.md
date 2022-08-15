---
id: concepts-targets
slug: /concepts/targets
title: Targets
sidebar_label: Targets
---

An "environment" or "workspace" that a [manifest](#manifest) will be deployed to. Massdriver doesn't enforce any governance on how you design your targets. Targets can be modeled by application stage (production, staging, development), by region (prod-usw, prod-eu), and even ephemerally per developer (alice-dev, bob-dev).

Massdriver separates authentication and scale from the parity that is enforced by a project. This allows targets to share the same 'architecture' for staging and production, but have a different scale for cost savings purposes.
