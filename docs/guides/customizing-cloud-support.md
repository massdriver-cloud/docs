---
id: guides-customizing-cloud-support
slug: /guides/customizing-cloud-support
title: Customizing Cloud Support
sidebar_label: Customizing Cloud Support
---

To enable cloud deployments in Massdriver—whether self-hosted or managed—you’ll need artifact definitions that represent your cloud credentials.

In self-hosted environments, you must publish these definitions yourself to onboard each cloud provider. In the managed version of Massdriver, we pre-install the core definitions (AWS, Azure, GCP) for you. However, you can still customize your authentication strategy or extend support to additional providers like Oracle, OVH, or other internal platforms.

## 🔍 What Are Artifact Definitions?

[Artifact definitions](/concepts/artifact-definitions) are schema files that describe how structured data—like a cloud credential, Kubernetes configuration, or an ETL pipeline—should be validated, visualized in the UI, and connected to provisioning workflows. These definitions power the artifact system, enabling teams to plug and play infrastructure building blocks securely and consistently.

In both managed and self-hosted environments, artifact definitions shape the Massdriver experience: they define how cloud credentials are onboarded, how services are linked, and how deployment data is standardized across environments. When a Massdriver instance starts up, these definitions populate the cloud onboarind flows, canvas defaults sidebar, and the connections between infrastructure bundles on your canvs.

## ☁️ Cloud Auth Quickstart Artifact Definitions

To help you get started quickly, Massdriver provides prebuilt artifact definitions for the three major cloud providers. These definitions map directly to the way most Infrastructure as Code (IaC) tools authenticate with cloud platforms:

| Artifact Key              | Cloud Provider | Purpose                                               |
| ------------------------- | -------------- | ----------------------------------------------------- |
| `aws-iam-role`            | AWS            | Federated IAM role used for secure cross-account auth |
| `azure-service-principal` | Azure          | Service principal credential used for deployments     |
| `gcp-service-account`     | GCP            | GCP service account with appropriate IAM permissions  |

These quickstarts are fully customizable—you can fork, modify, and republish them to match your organization’s naming standards, policies, or credential rotation strategies.

---

## 📦 Publishing Artifact Definitions

To publish these definitions to your self-hosted Massdriver instance, run the following commands using the Massdriver CLI. Each artifact you publish enables support for that cloud in your environment.

```bash
# AWS IAM Role Artifact Definition
curl -s https://raw.githubusercontent.com/massdriver-cloud/artifact-definitions/refs/heads/main/dist/aws-iam-role.json | mass definition publish -

# Azure Service Principal Artifact Definition
curl -s https://raw.githubusercontent.com/massdriver-cloud/artifact-definitions/refs/heads/main/dist/azure-service-principal.json | mass definition publish -

# GCP Service Account Artifact Definition
curl -s https://raw.githubusercontent.com/massdriver-cloud/artifact-definitions/refs/heads/main/dist/gcp-service-account.json | mass definition publish -
