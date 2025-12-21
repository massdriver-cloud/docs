---
id: self-hosted-overview
slug: /self-hosted/overview
title: Self-Hosted Overview
sidebar_label: Overview
---

# Massdriver Self-Hosted Overview

Massdriver is available as a **self-hosted installation** for teams and agencies that need full control over their infrastructure management platform. By running Massdriver entirely within your own environment, you keep data inside your security boundary and align directly with existing compliance frameworks like **FISMA**, **NIST 800-53**, and agency **Authority to Operate (ATO)** processes.

Because Massdriver is **not delivered as a SaaS**, **FedRAMP authorization is not required**. Agencies can adopt Massdriver through their existing security review and ATO processes without waiting on a vendor FedRAMP package.

## Why Self-Hosted?

Running Massdriver in your own cloud or data center offers unique advantages:

- **Security & Compliance**  
  - Sensitive data never leaves your environment.  
  - Fits cleanly into FISMA and ATO workflows.  
  - Aligns with NIST 800-53 and related federal security standards.  

- **Air-Gapped Friendly**  
  - No dependency on external SaaS services.  
  - Works in disconnected or classified environments.  

- **Operational Control**  
  - You manage uptime, monitoring, and upgrades.  
  - Integrates with your IdPs, and observability systems.  

- **Feature Parity**  
  - Full functionality of Massdriver’s cloud platform.  
  - Helm-based deployment with included dependencies (Argo Workflows, MinIO, etc.).  

## Benefits for Federal & Enterprise Teams

- **Accelerated ATO:** Faster adoption since you manage the security boundary.  
- **Policy-Driven IaC Deployments:** Built-in OPA enforcement.  
- **Compliance Ready:** Works within FISMA/ATO requirements without FedRAMP.  
- **No Vendor Lock-In:** Full control of deployment, networking, and data.  

## Next Steps

- [Install Massdriver Self-Hosted](/self-hosted/install)  

---

Massdriver Self-Hosted is the best option for organizations that need **security, compliance, and air-gap compatibility**—without the overhead of FedRAMP—while still delivering the modern developer experience of our cloud platform.

Once installed, check out our [Bootstrap Your Platform](/guides/bootstrap-platform) guide to quickly model your platform architecture with the Massdriver Catalog.
