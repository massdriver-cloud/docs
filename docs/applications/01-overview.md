---
id: applications-overview
slug: /applications
title: Applications
sidebar_label: Overview
---

Applications in Massdriver _are_ bundles. 🤯

Everything in the [Bundle Guide](/bundles) applies to applications. The application bundle code is _rigging_ to run your application in the cloud and connect to it services.

We've got some great getting started tutorials on YouTube.

<iframe width="560" height="315" src="https://www.youtube.com/embed/jWAdaNe57ws" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

Additionally, applications have a few other characteristics:

* IAM Roles (AWS) or Service Accounts (GCP / Azure) are automatically created for your app to manage IAM with principle of least privilege.
* They are container-based ([VMs are on our roadmap](https://roadmap.massdriver.cloud/bundles/application-vm-support-cl7s8svuy3959141xipth2cwcbe)).
* Ability to generate environment variables via the application [package's](/concepts/packages) parameters or [connections](/concepts/connections).
* Ability to programmatically select IAM Policies & Permissions from infrastructure components.

**Supported Runtimes**:

* AWS Lambda
* Azure App Service
* GCP Cloud Run
* GCP VMs
* Kubernetes Deployments (EKS, AKS, GKE, & On-prem)
* Kubernetes Cronjobs (EKS, AKS, GKE, & On-prem)
* Kubernetes Jobs (EKS, AKS, GKE, & On-prem)

Additional application runtimes can be supported by adding a runtime template [here](https://github.com/massdriver-cloud/application-templates).
