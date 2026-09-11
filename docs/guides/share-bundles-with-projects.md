---
id: guides-share-bundles
slug: /guides/share-bundles
title: Share Bundles with Projects
sidebar_label: Share Bundles
---

A **repo grant** makes the bundles in an OCI repository usable by projects. Without a grant, a project cannot add a component from that bundle, even if its members can see the bundle in the catalog.

Grants match **recipient projects by attribute**, not by name. Tag projects once, write one grant, and every current and future project with matching attributes picks it up.

## Default access for new repositories

New repositories are restricted until a grant exists. To make every new repository usable by all projects automatically, set **Default Bundle Access** to `ALL_PROJECTS` in your [organization settings](https://app.massdriver.cloud/orgs?destination=/settings). Each new repository then receives an org-wide `repo:pull` grant, which you can revoke like any other grant. Existing repositories are not affected.

<video controls loop muted playsInline width="100%">
  <source src="/img/screenshots/default-bundle-access.webm" type="video/webm" />
</video>

To share individual repositories, or to share with a subset of projects, follow the steps below.

## Prerequisites

* `repo:grant` on the repository (org admins have it; otherwise add it to a [group policy](/platform-operations/security/access-control#policies)).
* A project-scoped [custom attribute](/platform-operations/security/access-control#custom-attributes) if you want to target projects by tag (e.g. `team`). Skip this to share by project ID or org-wide.

## 1. Tag the recipient projects

Open each project that should receive the bundle, go to its **Settings**, and set the attribute (e.g. `team` = `payments`).

<details>
<summary>Prefer the CLI?</summary>

```shell
mass project update ecomm -a team=payments
```

</details>

## 2. Create the grant

Open the repository under **Bundles**, go to the **Grants** tab, and click **Add Grant**. Set the action to `repo:pull` and the recipient conditions.

<video controls loop muted playsInline width="100%">
  <source src="/img/screenshots/create-repo-grant.webm" type="video/webm" />
</video>

### Recipient conditions

Each condition is a **key** and one or more **values**. A project matches when it has every key with one of the listed values. Add more conditions to narrow the match, add more values to widen it. Use `*` as the value to match any project that has the key at all.

| Share with | Key | Values |
|---|---|---|
| Projects tagged `team=payments` | `team` | `payments` |
| Projects tagged `team=payments` or `team=checkout` | `team` | `payments` `checkout` |
| One specific project | `md-project` | `ecomm` |
| Any project that has a `team` tag | `team` | `*` |
| Every project in the org | `*` | `*` |

Grants can also be managed through the [GraphQL API](/api/graphql/operations/mutations/create-repo-grant) and the [Terraform provider](https://registry.terraform.io/providers/massdriver-cloud/massdriver/latest). Full matching rules are in [Access Control](/platform-operations/security/access-control#recipient-matching).

## 3. Verify

In a recipient project, open the **Bundles** panel on the canvas and add a component from the shared bundle. If the bundle is missing or the add fails, check:

* The project's attributes match the grant's conditions.
* Your group has `repo:view` on the repository (grants control **use**; policies control **view**).

## Revoke

Grants are immutable. To change one, delete it from the repository's **Grants** tab and create a new one.

## Related

* [Share Resources with Environments](/guides/share-resources)
* [Access Control: Grants](/platform-operations/security/access-control#grants)
