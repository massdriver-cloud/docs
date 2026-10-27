---
id: concepts-organization-settings
slug: /concepts/organization-settings
title: Organization Settings
sidebar_label: Organization Settings
---

Organization settings hold behavior that applies across every project in the organization. Changing them requires the `organization:manageSettings` action, which the `organization:manage` umbrella includes. See [Access Control](/platform-operations/security/access-control) for how actions are granted.

Settings are changed through the `updateOrganizationSettings` mutation. Only the settings you send are changed; the rest keep their current values.

```graphql
mutation {
  updateOrganizationSettings(
    organizationId: "your-org-id"
    input: {
      namingConvention: "{{project.id}}-{{environment.local_id}}-{{instance.local_id}}"
      defaultBundleAccess: ALL_PROJECTS
    }
  ) {
    result { id }
  }
}
```

## Naming convention

A naming convention is a [Liquid](https://shopify.github.io/liquid/) template that names the cloud resources your bundles provision. It becomes the name prefix for every instance created under the organization.

The default is:

```liquid
{{instance.id}}-{{component.suffix}}
```

Sending an empty string or `null` restores that default.

### Atoms

A template is composed from a fixed vocabulary. The examples below are for a `db` component in the `prod` environment of the `api` project.

| Atom | Value | Example |
|------|-------|---------|
| `{{org.id}}` | Your organization's id | `sandbox` |
| `{{project.id}}` | The project's id | `api` |
| `{{project.name}}` | The project's display name. May contain spaces | `Checkout API` |
| `{{environment.id}}` | The full environment id, including the project | `api-prod` |
| `{{environment.local_id}}` | The environment id without the project part | `prod` |
| `{{environment.name}}` | The environment's display name. May contain spaces | `Production West` |
| `{{instance.id}}` | The full instance id. Unique per instance in the organization | `api-prod-db` |
| `{{instance.local_id}}` | The component's local id within the project | `db` |
| `{{component.id}}` | The component's id, including the project. The same in every environment | `api-db` |
| `{{component.name}}` | The component's display name. May contain spaces | `Database` |
| `{{component.suffix}}` | A short random token for the component. Shared by the component across environments | `a1b2` |
| `{{attrs.<key>}}` | Any custom attribute your organization has declared | `{{attrs.cost_center}}` |

`{{attrs.<key>}}` reads the attributes on the project, the environment, and the instance, merged together. The most specific level wins when the same key is set at more than one level.

### Filters

Built-in Liquid filters work on any atom:

```liquid
{{project.id}}-{{environment.name | replace: " ", "-" | downcase}}-{{instance.local_id}}
```

Liquid **tags** — anything in `{% %}` — are rejected. A template is a composition of atoms and filters, nothing more.

### Rules

A template is validated when you save it, so a broken template never reaches a deployment.

- **The name should be distinct per instance.** The template should include `{{instance.id}}`, or `{{component.id}}` together with an environment atom, or `{{project.id}}` together with an environment atom and `{{instance.local_id}}`. `{{component.suffix}}` alone is not enough, because a component shares its suffix across every environment.
- **Every atom must be in the table above.** An atom outside the vocabulary is rejected, and the error names it.
- **Attributes must be declared.** `{{attrs.<key>}}` is rejected when your organization has not declared `<key>` as a custom attribute.
- **255 characters maximum.**
- **No control characters.** Tabs, newlines, and carriage returns are rejected. Spaces are allowed.

### When the name is applied

The name is resolved when an instance is first created and does not change afterward. Adopting a convention, or changing one, affects the instances you create next. Instances that already exist keep the names their infrastructure is running under.

## Default bundle access

`defaultBundleAccess` controls what access a bundle repository gets at the moment it is created.

| Value | Behavior |
|-------|----------|
| `NONE` (default) | A new repository stays restricted until you author a grant for it |
| `ALL_PROJECTS` | A new repository is created with an org-wide `repo:pull` grant, so every project can use its bundles |

The grant `ALL_PROJECTS` creates is an ordinary grant row. It is listed on the repository and you can revoke it with `deleteGrant`, the same as a grant you author by hand.

Two limits are worth knowing:

- The setting applies to **bundle** repositories. Resource type repositories are catalog metadata and are not grant-gated, so they are unaffected.
- The setting applies **at creation**. Turning it on does not grant access to repositories that already exist, and turning it off does not revoke grants it created earlier.

## Default tags

Every deployment receives a set of default tags in `md_metadata.default_tags`. Bundles apply them to the cloud resources they provision. `defaultTags` controls which attributes are in that set.

```graphql
mutation {
  updateOrganizationSettings(
    organizationId: "your-org-id"
    input: {
      defaultTags: ["md-project", "md-environment", "md-component", "md-instance", "cost_center"]
    }
  ) {
    result { id }
  }
}
```

Each entry is an attribute key: a [system attribute](/platform-operations/security/access-control) such as `md-project`, or a custom attribute your organization has declared. The attribute must apply to instances. The value of each tag is the attribute's value on the instance, merged from the project, the environment, and the instance. An attribute that has no value on an instance is left out of that instance's tags.

Two tags are always sent, whatever the list contains:

| Tag | Value |
|-----|-------|
| `managed-by` | `massdriver` |
| `md-instance` | The instance id, for example `api-prod-database` |

Massdriver reads `md-instance` back to attribute cloud costs and alarms to the instance.

An organization that has not set `defaultTags` sends these tags:

| Tag | Value |
|-----|-------|
| `managed-by` | `massdriver` |
| `md-project` | The project id |
| `md-target` | The environment id without the project part |
| `md-manifest` | The component id without the project part |
| `md-package` | The instance's name prefix |

### Rules

- **Once set, the list cannot be removed.** You can change the list, and an empty list is allowed, but you cannot return to the tags above.
- **Attributes in the list cannot be deleted.** Remove an attribute from `defaultTags` before you delete it.
- **Cloud tag rules still apply.** Massdriver does not change tag values. GCP label values allow only lowercase letters, digits, `_`, and `-`, so a value such as `md-bundle` (`aws-aurora@1.2.3`) is not a valid GCP label. Bundles that provision GCP resources must convert or leave out such values. AWS and Azure limit a resource to 50 tags, and GCP to 64 labels.

### When the tags are applied

The tags are sent with each deployment. An instance's resources get the new tags at its next deployment. Resources that are not deployed again keep the tags they have.

Before you set `defaultTags` for the first time, read how the switch affects [AWS cost reports](/reference/integrations/aws-cost-and-usage-reports#switching-to-custom-default-tags), [Azure cost exports](/reference/integrations/azure-cost-management-exports#switching-to-custom-default-tags), and [alarms](/platform-operations/monitoring-and-alarms#switching-to-custom-default-tags). Also check cloud tag policies, cost reports, and scripts that use the tags in the table above.

## Related documentation

- [Organizations](/concepts/organizations) — members, groups, and finding your organization id
- [Access Control](/platform-operations/security/access-control) — actions, attributes, and grants
- [Identifier constraints](/reference/identifier-constraints) — the shape of the ids the atoms produce
