---
id: guides-customizing-cloud-support
slug: /guides/customizing-cloud-support
title: Customizing Cloud Support
sidebar_label: Customizing Cloud Support
---

To enable cloud deployments in Massdriver—whether self-hosted or managed—you’ll need artifact definitions that represent your cloud credentials.

In self-hosted environments, you must publish these definitions yourself to onboard each cloud provider. In the managed version of Massdriver, we pre-install the core definitions (AWS, Azure, GCP) for you. However, you can still customize your authentication strategy or extend support to additional providers like Oracle, OVH, or other internal platforms.

## 🔍 What Are Artifact Definitions?

[Artifact definitions](/concepts/artifacts-and-definitions) are schema files that describe how structured data—like a cloud credential, Kubernetes configuration, or an ETL pipeline—should be validated, visualized in the UI, and connected to provisioning workflows. These definitions power the artifact system, enabling teams to plug and play infrastructure building blocks securely and consistently.

In both managed and self-hosted environments, artifact definitions shape the Massdriver experience: they define how cloud credentials are onboarded, how services are linked, and how deployment data is standardized across environments. When a Massdriver instance starts up, these definitions populate the cloud onboarind flows, canvas defaults sidebar, and the connections between infrastructure bundles on your canvs.

Check out the [Massdriver Catalog](https://github.com/massdriver-cloud/massdriver-catalog?tab=readme-ov-file#-platforms) for quick start platform configurations.
