---
id: applications-overview
slug: /applications
title: Applications
sidebar_label: Overview
---

Applications in Massdriver _are_ bundles. Everything in the [Bundle Guide](/bundles) applies to applications.

Additionally, applications have a few other characteristics:

* IAM Roles (AWS) or Service Accounts (GCP / Azure) are automatically created for your app to manage IAM with principle of least privilege.
* They are container based ([VMs are on our roadmap](https://roadmap.massdriver.cloud/bundles/application-vm-support-cl7s8svuy3959141xipth2cwcbe)).
* Ability to generate environment variables via the application [package's](/concepts/packages) parameters or [connections](/concepts/connections).
* Ability to programatically select IAM Policies & Permissions from infrastructure components.
