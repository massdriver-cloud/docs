---
id: concepts-components-instances-deployments
slug: /concepts/components-instances-deployments
title: Components, Instances & Deployments
sidebar_label: Components, Instances & Deployments
---

This page covers the lifecycle of infrastructure from blueprint to deployed resources.

## Components

A **component** (previously called a "manifest") is a [bundle](/concepts/bundles) that has been added to a project's blueprint with a specific use case.

For example: You may add the `aws-elasticache-redis` bundle to a project for multiple use cases — one component for `user-sessions` and a second component for `caching`.

In the example below, an **SNS Topic** is added to the project for tracking _created orders_ in an e-commerce application.

<video controls loop muted playsInline width="100%">
  <source src="/img/screenshots/add-component.webm" type="video/webm" />
</video>

## Instances

An **instance** (previously called a "package") is a component as it exists in a specific [environment](/concepts/projects-and-environments) (e.g. production, staging, US West, etc).

> An instance is the intersection of an environment and a component.

In Massdriver, naming conventions for cloud resources are managed for you. The instance's identifier can be seen by clicking on the component and selecting the `Details` tab. The `ID` will be the naming prefix for all resources created when this instance is deployed.

![Instances](./img/packages.png)

### Instance Alarms

Instances can integrate monitors and alarms into Massdriver's notification system. In the example below, a number of CloudWatch alarms are visible for Aurora Postgres.

![Instance Alarms](./img/packages-alarms.gif)

### Instance Resources

Cloud resources created by the instance are tracked within Massdriver. Below is a view of the resources created by the [AWS EKS Cluster](https://github.com/massdriver-cloud/aws-eks-cluster) bundle.

![Instance Resources](./img/packages-resources.gif)

## Deployments

Deployments are a record of provisioning or decommissioning infrastructure or applications in Massdriver.

Massdriver keeps a record of every deployment, whether provisioning or decommissioning infrastructure or applications.

<video controls loop muted playsInline width="100%">
  <source src="/img/screenshots/deploy-instance.webm" type="video/webm" />
</video>

### Deployment Comparison

Massdriver makes it easy to view the difference in configuration between deployments. It's a great way to provide information to auditors, or to debug issues related to a recent deployment.

![Deployment Comparison](./img/deployments-comparison.gif)

## The Lifecycle

```
Bundle → Component → Instance → Deployment
   ↓         ↓          ↓           ↓
Template  Blueprint  Env-bound    Record
```

1. **Bundle**: A reusable infrastructure template (e.g., "PostgreSQL Database")
2. **Component**: A bundle added to a project for a specific purpose (e.g., "User Database")
3. **Instance**: A component as it exists in a specific environment (e.g., "User Database in Production")
4. **Deployment**: A record of provisioning or decommissioning that instance

## Related Documentation

- [Bundles](/concepts/bundles) - Understanding bundle structure
- [Projects & Environments](/concepts/projects-and-environments) - Organizing your infrastructure
- [Resources & Resource Types](/concepts/resources-and-types) - How instances connect
