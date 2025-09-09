---
id: self-hosted-overview
slug: /self-hosted/overview
title: Self-Hosted Overview
sidebar_label: Overview
---

# Massdriver Self-Hosted Overview

Massdriver is available as a **self-hosted installation** for teams and agencies that need full control over their infrastructure management platform. Unlike SaaS-based Infrastructure-as-Code orchestrators that require **FedRAMP authorization** to operate in government environments, Massdriver can be deployed entirely within your own network, aligning with existing **FISMA / ATO** processes.

## Why Self-Hosted?

Running Massdriver in your own cloud or data center offers unique advantages:

- **Security & Compliance**  
  - Keep sensitive data inside your own security boundary.  
  - No data leaves your network, eliminating SaaS dependencies.  
  - Simplifies compliance with frameworks like FISMA, NIST 800-53, and agency ATO processes.  
  - Avoid waiting on FedRAMP authorizations for a vendor’s SaaS environment.  

- **Air-Gapped Friendly**  
  - Massdriver is designed to run without external dependencies.  
  - Suitable for high-security environments, classified workloads, or disconnected networks.  

- **Operational Control**  
  - Deploy on your Kubernetes infrastructure with full ownership of uptime, monitoring, and upgrades.  
  - Integrate directly with your own IdPs, SMTP, and observability stacks.  
  - No reliance on external multitenant SaaS systems.  

- **Feature Parity**  
  - The self-hosted edition includes **all the capabilities of Massdriver’s SaaS platform**.  
  - Helm-based installation provides built-in dependencies (Argo Workflows, MinIO, etc.) for a turnkey deployment.

## FedRAMP vs. Self-Hosted

- **FedRAMP**: Required when a federal agency consumes a **vendor-operated cloud service**.  
- **Self-Hosted**: If the agency operates the software within its own boundary, **FedRAMP is not required**. Instead, the deployment falls under the agency’s own **ATO process**, making self-hosting the fastest path for federal adoption.  

This distinction means federal teams can adopt Massdriver today without waiting on our FedRAMP package, while still aligning with all required security frameworks.

## Benefits for Federal & Enterprise Teams

- **Accelerated Authority to Operate (ATO):** Agencies control the security package and boundary.  
- **Policy-Driven IaC Deployments:** Built-in policy enforcement with OPA.  
- **Future-Proof Compliance:** Aligns with NIST, CIS, and agency-specific baselines.  
- **No Vendor Lock-In:** You manage the deployment footprint, networking, and data flow.  

## Next Steps

- [Install Massdriver Self-Hosted](/self-hosted/install)  
- [Getting Started Guide](/getting_started/00-overview)  
- [Customizing Cloud Support](/guides/customizing-cloud-support)  

---

Massdriver Self-Hosted is the best option for organizations that need **control, compliance, and air-gap compatibility** without sacrificing the developer experience of modern infrastructure orchestration.
