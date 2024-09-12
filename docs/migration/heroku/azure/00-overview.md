---
id: migration-heroku-azure-overview
slug: /migration/heroku/azure/overview
title: Overview
sidebar_label: Overview
---

## Introduction

This guide provides a step-by-step process for migrating an application hosted on Heroku to Azure, using Massdriver as the orchestration tool. Massdriver simplifies the migration process by leveraging pre-built cloud infrastructure bundles for Azure, allowing developers to quickly transition their applications and services from Heroku into a scalable, production-grade Azure environment.

The guide covers all essential steps of the migration process, from configuring infrastructure on Azure to deploying the application and its dependencies, such as databases and caches, in a secure and efficient manner. It is designed to address common pain points associated with migrating from Heroku, such as managing environment configurations, handling database migrations, and ensuring the smooth setup of CI/CD pipelines.

For a demo of the migration process, watch the following video:
<iframe width="560" height="315" src="https://www.youtube.com/embed/YRTs2MYXEoM?si=shoKcDORIvidXQLD" title="Migrate from Heroku to Azure using Massdriver" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Why Migrate from Heroku to Azure?

Heroku offers a streamlined environment for application hosting, but its limitations often drive developers to consider cloud platforms like Azure. Common reasons for migrating from Heroku to Azure include:

- **Version Control Restrictions**: Heroku enforces specific versions of services like Redis or Postgres, which can limit your application’s flexibility.
- **Network Security**: Applications on Heroku communicate over the public internet, which introduces potential security vulnerabilities. Azure allows for network isolation, making applications more secure.
- **Cost Efficiency**: While Heroku runs on AWS infrastructure, it adds a premium, meaning users pay more than AWS prices. Azure offers competitive pricing models, which can result in cost savings.
- **Scalability and Global Distribution**: Azure offers a wide range of serverless services and geographic deployment options that Heroku lacks.
- **Advanced Capabilities**: Azure provides broader services such as custom caching, pipelines, and data queues, which Heroku's marketplace does not offer in full.

## What This Guide Will Cover

1. **Setting Up Infrastructure on Azure**: You'll learn how to configure a three-tier infrastructure with Massdriver bundles. This includes virtual networks, Kubernetes clusters, databases (Postgres), and caching (Redis).
2. **Migrating Your Heroku Application**: The guide details how to dockerize your Heroku application and deploy it on Azure Kubernetes Service (AKS).
3. **Handling Data Migration**: You'll go through the process of migrating Postgres databases from Heroku to Azure, including backing up and restoring data securely.
4. **Configuring Redis Cache**: While some Redis versions may cause compatibility issues during migration, we provide guidance on how to configure your Redis cache securely within the Azure environment.
5. **Automating Deployment with GitHub Actions**: We show how to set up CI/CD pipelines using GitHub Actions integrated with Massdriver to automate deployments.

## Tools and Technologies

- **Massdriver**: An internal developer platform used to automate cloud infrastructure provisioning and management, making the migration process simple and efficient.
- **Azure Kubernetes Service (AKS)**: For hosting containerized applications on a managed Kubernetes service.
- **Postgres and Redis**: Common dependencies for web applications that can be migrated and configured using Azure’s services.
- **GitHub Actions**: A popular CI/CD tool for automating the build, push, and deployment steps of your migrated application.

## Who Is This Guide For?

This guide is intended for developers and cloud architects who are familiar with Heroku but want to migrate their applications to a more flexible and scalable environment like Azure. Whether you are looking to optimize for cost, improve security, or take advantage of Azure's extensive features, this guide offers practical insights for ensuring a smooth transition.

## Key Benefits of Using Massdriver

- **Automated Infrastructure Setup**: Massdriver provides pre-configured bundles that simplify the deployment of critical infrastructure on Azure.
- **Simplified CI/CD Pipeline**: By integrating GitHub Actions, developers can automate their deployments with ease, reducing the complexity of manually managing infrastructure updates.
- **Streamlined Migration**: With Massdriver handling most of the heavy lifting, the migration from Heroku to Azure becomes a less daunting task, enabling you to focus on optimizing your application.

For more detailed instructions, follow along with the individual steps in this migration guide.
