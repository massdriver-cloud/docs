---
id: onboarding-catalogs
slug: /onboarding/catalogs
title: Choose a Catalog
sidebar_label: Choose a Catalog
description: The AWS catalog, the pets catalog, and the state of Azure and GCP.
---

A catalog is a Git repository of credentials (`platforms/`), resource types (`resource-types/`) and bundles (`bundles/`). You fork it, publish it to your organization, and change it from then on. It is the source of truth for what developers can deploy.

| Catalog | Repository | IaC | Cloud account | Runs automations |
|---|---|---|---|---|
| [AWS](#aws-catalog) | [massdriver-catalogs/aws](https://github.com/massdriver-catalogs/aws) | OpenTofu that builds real AWS infrastructure | Required | Yes, on its `ecs-cluster` |
| [Pets](#pets-catalog) | [massdriver-cloud/massdriver-catalog](https://github.com/massdriver-cloud/massdriver-catalog) | `random_pet` stubs behind real schemas | Not needed | No. Import a Kubernetes cluster to run them. |
| [Azure](#azure-and-gcp) | [massdriver-catalogs/azure](https://github.com/massdriver-catalogs/azure) | OpenTofu for Azure landing zones, networks, AKS, databases | Required | Onboarding path not written yet |
| [GCP](#azure-and-gcp) | — | — | — | Onboarding path not written yet |

## AWS catalog

The AWS catalog has the network and DNS for each environment, two runtimes (Lambda behind API Gateway, and containers on ECS Fargate), the data stores apps use, the bundles that onboard a new app, and most of the automations as `massdriver-<automation>-ecs` bundles.

| Group | Bundles |
|---|---|
| Environment | `vpc`, `dns-zone`, `ecs-cluster`, `github-actions-oidc`, `developer-vpn` |
| Runtimes | `http-api`, `lambda-function`, `ecs-service`, `ecs-agent`, `dev-workspace` |
| Data stores | `postgres`, `mariadb`, `dynamodb-table`, `s3-bucket`, `valkey`, `sqs-queue` |
| App onboarding | `ecr-repository`, `github-repo`, `massdriver-project`, `codebase` |
| Automations | `massdriver-<automation>-ecs`, one per automation |

Its credential is `aws-iam-role`: an IAM role that trusts Massdriver's [deployment identity tokens](/platform-operations/security/deployment-identity-tokens). Massdriver stores the role ARN, not keys.

### Fork and publish

1. Fork [massdriver-catalogs/aws](https://github.com/massdriver-catalogs/aws) into your GitHub organization.
2. In Massdriver, turn on **Settings → General → Grant new bundle repositories to all projects**.
3. Create a service account with a 1 year token, in a group that can create and publish repositories (`repo:create`, `repo:push`). Refer to [Service accounts](/platform-operations/security/service-accounts).
4. In the fork's **Settings → Secrets and variables → Actions**, add the token as the secret `MASSDRIVER_API_KEY` and your organization ID as the variable `MASSDRIVER_ORG_ID`.
5. Run **Actions → Publish → Run workflow** with *all* ticked.

The first run publishes the credentials and the official resource types, then the catalog's resource types, then every bundle. After that, each push to `main` publishes what changed.

To publish from your machine instead:

```bash
git clone git@github.com:<your-org>/aws.git massdriver-aws
cd massdriver-aws
make publish-platforms        # aws-iam-role, github-app, and the official Massdriver types
make publish-resource-types
make publish-bundles          # builds, runs tofu validate, publishes
```

Every `make` target creates missing OCI repositories first. A repository must exist before anything can publish to it.

### Versions

Everything in the catalog is `0.0.0`, which can be republished in place while you change it. Publishing any other version to a repository ends that: from then on, every change to that repository needs a version bump. Bump a bundle when developers depend on it in production.

### Examples

[`examples/`](https://github.com/massdriver-catalogs/aws/tree/main/examples) has whole companies built on the catalog. Each `deploy.sh` publishes the catalog and stands up projects, environments, groups, apps and automations. Read [`examples/telehealth/deploy.sh`](https://github.com/massdriver-catalogs/aws/blob/main/examples/telehealth/deploy.sh) for every `mass` command a full organization takes, in order.

Next: [install the official resource types](./02-resource-types.md), then [stand up the platform](./03-greenfield-aws.md) or [import it](./05-brownfield.md).

## Pets catalog

The pets catalog is cloud-neutral. Its bundles have complete schemas, presets, dependencies, resources, alarms and UI schemas, and their IaC is `random_pet`. Deploys take seconds and create nothing in a cloud. Use it to settle the developer experience before writing IaC: which bundles exist, what each one asks for, and how they connect.

| Bundle | Resource type it produces | Depends on |
|---|---|---|
| `network` | `virtual-network` | — |
| `postgres` | `postgres-database` | `virtual-network` |
| `mysql` | `mysql-database` | `virtual-network` |
| `bucket` | `object-storage` | — |
| `application` | `workload` | `virtual-network`, `postgres-database`, optional `object-storage` |

`platforms/` has credential types for AWS, Azure, GCP, Kubernetes, DigitalOcean, OVH, Scaleway, Snowflake, UpCloud and Vercel. `templates/` has scaffolds for `mass bundle new`.

:::caution Pets cannot run automations
Automations are containers. The pets catalog deploys `random_pet`, so there is no cluster to run them on. Either take the [AWS greenfield route](./03-greenfield-aws.md), which deploys an ECS cluster, or [import a Kubernetes namespace](./06-brownfield-kubernetes.md) you already have.
:::

### Publish

```bash
git clone https://github.com/massdriver-cloud/massdriver-catalog.git my-catalog
cd my-catalog
make all
```

`make all` creates the OCI repositories, publishes the resource types and platforms, builds and validates every bundle, then publishes them. Resource types must publish before bundles, because `mass bundle build` resolves every `resource_type` against the server.

To publish from CI, set `MASSDRIVER_API_KEY` and `MASSDRIVER_ORG_ID` on the repository. The workflows in `.github/workflows/` publish on push to `main`.

### Model the platform

1. Create a project, such as `ecommerce`, and two environments, `dev` and `prod`.
2. Add `network`, `postgres`, `bucket` and `application` to the canvas.
3. Connect `network` to `postgres` and `application`, `postgres` to `application`, and `bucket` to `application`.
4. Pick a preset on each instance, change what you would change, and deploy the environment.

Change the schemas in `bundles/*/massdriver.yaml`, republish, and look at the forms again. Split or merge bundles until each one maps to one thing a developer asks for.

### Replace the stubs

When the schemas are settled, replace `bundles/*/src/main.tf` with your OpenTofu. Keep `_massdriver_variables.tf`: `mass bundle build` regenerates it from `params` and `dependencies`. Populate each `resources:` entry with a `massdriver_resource`. Iterate with `mass bundle publish --development` and redeploy.

Refer to [Create a Bundle from OpenTofu](/guides/bundle-from-opentofu) and the [bundle YAML spec](/bundle-development/bundle-yaml-spec).

## Azure and GCP

The onboarding path for Azure and GCP is not written yet.

- **Azure.** [massdriver-catalogs/azure](https://github.com/massdriver-catalogs/azure) has 14 bundles, among them a subscription factory, a landing zone baseline, `azure-virtual-network`, `azure-kubernetes-service`, Postgres Flexible Server and Container Apps, and the service principal credential. Publish it with `make all`. It has no automation bundles. Run automations on its AKS cluster by importing the cluster as a [`massdriver-kubernetes-cluster`](./06-brownfield-kubernetes.md).
- **GCP.** There is no GCP catalog. Start from the pets catalog, publish its `platforms/gcp` service account credential, and replace the stubs with GCP OpenTofu. Run automations on a GKE cluster through [`massdriver-kubernetes-cluster`](./06-brownfield-kubernetes.md).
