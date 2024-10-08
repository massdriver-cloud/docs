---
id: concepts-environments
slug: /concepts/environments
title: Environments
sidebar_label: Environments
---


An environment is the _workspace_ that a bundle will be deployed to. Massdriver doesn't enforce any governance on how you design your environments. Environments can be modeled by application stage (production, staging, development), by region (prod-usw, prod-eu), and even ephemerally per developer (alice-dev, bob-dev).

![Environments](./img/targets.gif)

Massdriver separates authentication and scale from the parity that is enforced by a project. This allows environments to share the same 'architecture' for staging and production, but have a different scale for cost-saving purposes.

It can be difficult to figure out the differences in configuration between two different environments. Massdriver Environments support a visual comparison, quickly highlighting the difference between staging and production, US West and the EU, or any combination of environments.

![Environment Comparison](./img/targets-comparison.gif)
