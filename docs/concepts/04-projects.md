---
id: concepts-projects
slug: /concepts/projects
title: Projects
sidebar_label: Projects
---

Projects are the _blueprints_ of infrastructure and application architectures in Massdriver. A project acts as the parity boundary for deploying your architecture against multiple [targets](/concepts/targets) (e.g.: application environments, tenants, or regions).

![Projects](./img/projects.png)

All targets in the same project will always have the same diagram, but scale and authentication can be customized per target. 

This allows for:

* running cost efficient staging or preview environments that have architectural parity with production
* managing applications and infrastructure in isolated tenant environments
* replicating infrastructure and applications between regions
