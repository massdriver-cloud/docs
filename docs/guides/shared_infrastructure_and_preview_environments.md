# Sharing Infrastructure

Shared projects in Massdriver are a mechanism that enables sharing an environments artifacts with other projects. Shared projects facilitate collaboration, resource management, and operational governance across different teams or departments within an organization. When it comes to networking and container orchestration clusters, shared resources between projects brings several benefits:

* **Resource Sharing and Segmentation**: Shared projects allow different teams to share resources and network configurations without compromising on isolation and security. This is crucial in a multi-tenant environment where various teams or applications need to coexist without interfering with each other.

* **Centralized Network Management**: By having a shared project for networking resources, organizations can centralize the management and control of network configurations, firewalls, and routing policies. This centralized approach ensures consistency, eases management overhead, and helps in enforcing network policies across multiple projects and teams.

* **Cost Efficiency**: Utilizing shared VPCs (Virtual Private Clouds) within shared projects can lead to cost savings as resources like subnets and network routes can be re-used across different projects, thereby reducing the overhead associated with managing multiple VPCs.

* **Unified Container Orchestration**: Shared projects provide a unified infrastructure for deploying and managing container orchestration clusters like Kubernetes. By consolidating container orchestration within a shared project, organizations can standardize configurations, simplify management, and ensure that clusters adhere to organizational policies and best practices.

* **Policy and Security Enforcement**: Shared projects facilitate the enforcement of security policies, IAM roles, and permissions at a granular level. This is crucial for ensuring that only authorized personnel have access to networking resources and container orchestration clusters, thereby enhancing the security posture of the organization.

* **Enhanced Monitoring and Logging**: Having a shared project allows for centralized logging, monitoring, and auditing of network and container orchestration activities. This centralization is crucial for gaining visibility, troubleshooting issues, and adhering to compliance and auditing requirements.

* **Ease of Scalability and Upgrades**: As the demands of applications and services grow, having a structured shared project setup helps in scaling resources, networks, and clusters more efficiently. It also simplifies the process of upgrading networks and clusters to meet evolving operational requirements.

* **Cross-Project Communication**: Shared projects enable easier communication and data transfer between different projects and teams. This is particularly useful in microservices architectures where services deployed across multiple projects need to communicate with each other securely and efficiently.

* **Preview Environment Management**: Shared projects facilitate efficient creation, management, and teardown of preview environments for applications. They ensure consistent configurations, centralized monitoring, and adherence to security policies across these temporary deployments, thus accelerating the review and feedback loop while ensuring a controlled, secure, and cost-effective environment for testing and validation before production deployment.

Shared projects allow organizations to achieve better operational governance, cost efficiency, and technical synergy when managing networking resources and container orchestration clusters across diverse teams and workloads.

TODO: record a quick & dirty youtube video walkthrough and embed here, grab screen shots for step by step below.

## Setting up Shared Infrastructure

First visit the project creation page, here we'll pick AWS, but you can create shared infrastructure on AWS, Azure, GCP, or even Kubernetes with Massdriver.

Click "Create Project"
Name: Shared Infra
Slug: shrinfr (TODO: is it SLUG OR ID OR ABBREVIATION)
Description: Networking and compute for Ecomm, API, and Billing teams.

TODO: screen shot

Create "Environment"
Name: Staging
Slug: staging (TODO: is it SLUG OR ID OR ABBREVIATION)
Description: Staging compute

TODO: screen shot

Add an AWS VPC and an EKS Cluster and provision both. These resources can be shared with other projects. Teams will be able to use and deploy to them, but not configure or manage these resources.

Click the "+" button and create a production version of your resources.

Deploy the resources.

:::important
Teams can share _anything_ between projects. If you had a internal bug tracking service, it could be provisioned once in this shared environment and exposed to other application projects.
:::

## Using Shared Infrastructure

Create a new project for an example application:

Name: E-Commerce
Slug: ecomm (TODO: is it SLUG OR ID OR ABBREVIATION)
Description: E-Commerce Team resources

TODO: screen shot

Create ... 

* [ ] TODO: app:prod, app:staging
* [ ] TODO: add "spree" add postgres

Massdriver supports sharing resources through two mechanisms: _environment defaults_ or _remote references_

### Using Environment Defaults

Environment defaults use the shared resources, with no option for configuration in a particular environment. 

The resource is a "default" for the environment and is _not_ shown on the canvas.

:::note
By default only VPCs, Kubernetes clusters, and cloud credentials can be environment defaults. Other resource types can be configured as defaults (i.e.: spark clusters).

If you need to configure environment defaults for any custom resource types, please reach out in our [community slack](https://join.slack.com/t/massdrivercommunity/shared_invite/zt-1sxag35w2-eYw7gatS1hwlH2y8MCmwXA).
:::


### Using Remote References

Remote reference uses the shared resource, but allows a developer to make a new environment and provision there own if the use case permits. The resource appears as a package on the canvas.

## Advanced Scenarios

### Cost controls for preview environments

Shared projects can be significantly beneficial in a scenario where a company is using preview environments for applications. Preview environments are temporary deployments used for reviewing changes to an application before they are pushed to production. Here's how shared projects can aid in managing preview environments:

### Global networks w/ regional compute projects & per app projects

This could be its own guide but its directly related to sharing resources ... put it here or another file?

### General compute + ML compute (spark) projects

This could be its own guide but its directly related to sharing resources ... put it here or another file?
