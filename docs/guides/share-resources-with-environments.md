---
id: guides-share-resources
slug: /guides/share-resources
title: Share Resources with Environments
sidebar_label: Share Resources
---

A **resource grant** makes a resource (a VPC, a Kubernetes cluster, a database) usable by other environments as a [remote reference or environment default](/guides/sharing-infrastructure). Without a grant, an environment cannot consume the resource, even if its members can see it in the resources list.

Grants match **recipient environments by attribute**. An environment's attributes include its own tags plus everything cascaded from its project, so you can target by environment (`md-environment`), by project (`md-project`), or by any custom tag on either.

## Prerequisites

* `resource:grant` on the resource. Provisioned resources carry their project's attributes, so a [group policy](/platform-operations/security/access-control#policies) granting `resource:grant` on a team's projects covers everything they deploy. Org admins have it everywhere.
* Optionally, a [custom attribute](/platform-operations/security/access-control#custom-attributes) at project or environment scope (e.g. `TEAM`, `pci`) to target recipients by tag.

## 1. Tag the recipient environments

Tag the environment directly, or tag the project so every environment in it matches. Use the environment or project settings, or the CLI:

```shell
mass environment update ecomm-staging -a STAGE=nonprod
mass project update ecomm -a TEAM=payments
```

## 2. Create the grant

Open the resource (from the owning instance's **Resources** tab, or from the org **Resources** list), go to the **Grants** tab, and click **Add Grant**. Set the action to `resource:export` and the recipient conditions.

<video controls loop muted playsInline width="100%">
  <source src="/img/screenshots/create-resource-grant.webm" type="video/webm" />
</video>

### Recipient conditions

Each condition is a **key** and one or more **values**. An environment matches when it has every key with one of the listed values. Add more conditions to narrow the match, add more values to widen it. Use `*` as the value to match any environment that has the key at all. Project attributes cascade to environments, so project tags work here too.

| Share with | Key | Values |
|---|---|---|
| Every `staging` environment, in any project | `md-environment` | `staging` |
| Every environment in one project | `md-project` | `ecomm` |
| Every environment in projects tagged `TEAM=payments` | `TEAM` | `payments` |
| Non-prod environments only | `STAGE` | `nonprod` |
| Prod and staging in PCI projects (two conditions) | `md-environment`<br/>`pci` | `prod` `staging`<br/>`true` |
| Every environment in the org | `*` | `*` |

Grants can also be managed through the [GraphQL API](/api/graphql/operations/mutations/create-resource-grant) and the [Terraform provider](https://registry.terraform.io/providers/massdriver-cloud/massdriver/latest). Full matching rules are in [Access Control](/platform-operations/security/access-control#recipient-matching).

## 3. Consume the resource

In a recipient environment, set the resource as an [environment default](/guides/sharing-infrastructure#using-environment-defaults) or pick it as a [remote reference](/guides/sharing-infrastructure#using-remote-references) on an instance. The environment can only consume resources with a grant that covers it.

```shell
# environment default
mass environment default ecomm-staging si-staging-k8s-cluster

# remote reference on an instance's connection slot
mass instance remote-reference set ecomm-staging-api kubernetes_cluster si-staging-k8s-cluster
```

If the resource is missing, check:

* The environment's effective attributes match the grant's conditions.
* Your group has `resource:view` on the resource (grants control **use**; policies control **view**).

## Revoke

Grants are immutable. To change one, delete it from the resource's **Grants** tab and create a new one.

## Related

* [Share Bundles with Projects](/guides/share-bundles)
* [Sharing Infrastructure between Projects and Environments](/guides/sharing-infrastructure)
* [Access Control: Grants](/platform-operations/security/access-control#grants)
