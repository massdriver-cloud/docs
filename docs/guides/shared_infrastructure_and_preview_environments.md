# Sharing Infrastructure

why shared infra is important 

## Use Cases

* isolating team responsibilities & permissions
* cost optimization
* fast spin-up preview environments

## TODO: doing the work

WHAT_ARE_PROJECTS + WHAT_ARE_REMOTE_REFERENCES

We recommend creating _at least_ one shared infrastructure project to run and share your networking and compute layer with your team.

:::note
You may create additional shared infrastructure environments, and even layer them depending on needs. We'll cover this in the (advanced)[#advanced-scenarios] section below.
:::

### Setting up Shared Infrastructure

First visit the project creation page, here we'll pick AWS, but you can create shared infrastructure on AWS, Azure, GCP, or even Kubernetes with Massdriver.

Click "Create Project"
Name: Shared Infra
Slug: shrinfr
Description: Networking and compute for Ecomm, API, and Billing teams.

Create "Environment"
Name: Staging
Slug: staging
Description: Staging compute

Add an AWS VPC and an EKS Cluster and provision both. These resources can be shared with other projects. Teams will be able to use and deploy to them, but not configure or manage these resources.

Click the "+" button and create a production version of your resources.

:::important
Teams can share _anything_ between projects. If you had a internal bug tracking service, it could be provisioned once in this shared environment and exposed to other application projects.
:::

### Using Shared Infrastructure

Create a new project for an example application:
Name: E-Commerce
Slug: ecomm
Description: E-Commerce Team resources

Create ... PROD, remote ref add "spree" add postgres

Two modes depending on governance:
* Environment default or remote referenced
* Environment defaults use the shared resources, with no option for control in a particular environment
* Remote reference uses the shared resource, but allows a developer to make a new environment and provision there own if the use case permits.

#### Using Remote References

#### Using Environment Defaults

## Advanced Scenarios

### Cost controls for preview environments

### Global networks w/ regional compute projects & per app projects

### General compute + ML compute (spark) projects
