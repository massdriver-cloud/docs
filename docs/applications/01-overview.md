---
id: applications-overview
slug: /applications
title: Applications
sidebar_label: Overview
image: /img/og/applications.png
---

An application in Massdriver is a bundle that runs on a **runtime**.

A runtime is a bundle that sets `provides: [runtime]`. Its IaC decides how applications run on a cloud, for example as a Lambda function, a Kubernetes deployment, or an ECS service. The platform team writes and publishes the runtime.

An application is a bundle whose `massdriver.yaml` sets `app.runtime`. An application has no IaC of its own. It adds only the fields that are specific to it:

* [Dependencies](/concepts/dependencies) that the application uses after it deploys, such as a database or a queue.
* Resources that other bundles can depend on.
* Environment variables and secrets.

When you publish an application, Massdriver merges its `massdriver.yaml` onto the runtime's. The published application pins `app.runtime` to the exact runtime version that it was built on, for example `lambda@1.2.7`.

Everything in the [Bundle Guide](/concepts/bundles) applies to applications. For the full specification, see [Runtimes and Applications](/bundle-development/runtimes-and-applications).

## Inherited fields

The fields that an application gets from its runtime are **inherited**. These include the runtime's params, steps, IaC, dependencies, resources, environment variables, and secrets. The application cannot change an inherited field. Only a new runtime version can change it.

An application cannot set `provides`. Thus an application cannot be a runtime, and an application cannot run on another application.

## What a runtime does

The runtime decides how the application runs. For example, a runtime can:

* Create IAM Roles (AWS) or Service Accounts (GCP / Azure) for the application, with the principle of least privilege.
* Run the application as a container ([VMs are on our roadmap](https://roadmap.massdriver.cloud/bundles/application-vm-support-cl7s8svuy3959141xipth2cwcbe)).
* Set environment variables from the [instance's](/concepts/components-instances-deployments) params or [dependencies](/concepts/dependencies).
* Select IAM policies and permissions from the infrastructure that the application connects to.

**Runtimes**:

A runtime is a bundle in your organization. An application can run only on a runtime in the same organization, and you need `repo:pull` access to the runtime's repository. Common runtimes include:

* AWS Lambda
* Azure App Service
* GCP Cloud Run
* GCP VMs
* Kubernetes Deployments (EKS, AKS, GKE, & On-prem)
* Kubernetes Cronjobs (EKS, AKS, GKE, & On-prem)
* Kubernetes Jobs (EKS, AKS, GKE, & On-prem)

The [application-templates](https://github.com/massdriver-cloud/application-templates) repository has IaC that you can use as a start for a runtime.
