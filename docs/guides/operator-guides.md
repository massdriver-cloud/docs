---
id: guides-operator-guides
slug: /guides/operator-guides
title: Writing Operator Guides
sidebar_label: Operator Guides
---

# Writing Operator Guides

Operator guides (also called runbooks) provide operational documentation for your deployed infrastructure. They render **inside the Massdriver UI** after an instance is deployed, giving operators context-aware instructions and reference information.

**Key features:**
- **Dynamic content**: Variables are interpolated at render time with actual deployed values
- **Context-aware**: Shows configuration, dependencies, and resource outputs specific to this instance
- **Operational focus**: Command examples, troubleshooting steps, and reference information
- **Customizable**: You control the content—this is your documentation

## What is an Operator Guide?

Every bundle can include an `operator.md` file in its root directory. This file becomes the operational documentation for instances deployed from that bundle. The guide is rendered in the Massdriver UI's "Runbook" tab for each deployed instance, with template variables replaced by actual values from that specific deployment.

## Choosing a Template Engine

Set your template engine in the YAML frontmatter at the top of `operator.md`:

**Use whichever template engine you're more familiar with.** Both mustache and liquid are fully supported.

### Mustache

```yaml
---
templating: mustache
---
```

Simple, logic-less templating. Use for straightforward variable interpolation and basic conditionals/loops.

### Liquid

```yaml
---
templating: liquid
---
```

More powerful templating with filters and complex logic. Use when you need advanced string manipulation or conditional logic.

If frontmatter is missing or `templating` is unset (or set to an unsupported value), the guide is rendered as-is with no interpolation.

## Available Context

Operator guides have access to the following top-level variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{id}}` | Instance identifier | `myapp-prod-useast1` |
| `{{params.<field>}}` | Configuration parameter values | `{{params.database_name}}` |
| `{{params.md_metadata.<field>}}` | Massdriver-injected metadata (see below) | `{{params.md_metadata.name_prefix}}` |
| `{{dependencies.<name>.<...>}}` | Upstream dependency payload (shape depends on its resource type) | `{{dependencies.network.specs.aws.region}}` |
| `{{resources.<name>.<...>}}` | This bundle's output payload (shape depends on its resource type) | `{{resources.database.data.infrastructure.arn}}` |
| `{{slug}}` | **Deprecated** alias for `id` (will be removed 2026-03-12) | `myapp-prod-useast1` |
| `{{connections.<name>.<...>}}` | **Deprecated** alias for `dependencies` (will be removed 2026-05-07) | `{{connections.network.specs.aws.region}}` |
| `{{artifacts.<name>.<...>}}` | **Deprecated** alias for `resources` (will be removed 2026-05-07) | `{{artifacts.database.data.infrastructure.arn}}` |

### `params.md_metadata`

Massdriver injects a `md_metadata` block into `params` with deployment context:

| Field | Description |
|-------|-------------|
| `params.md_metadata.name_prefix` | Resource name prefix for this package (e.g., `prod-us-west-myapp-abc123`) |
| `params.md_metadata.default_tags.managed-by` | Always `massdriver` |
| `params.md_metadata.default_tags.md-project` | Project identifier |
| `params.md_metadata.default_tags.md-target` | Target/environment identifier |
| `params.md_metadata.default_tags.md-manifest` | Manifest identifier |
| `params.md_metadata.default_tags.md-package` | Package name prefix |
| `params.md_metadata.observability.alarm_webhook_url` | Webhook URL for forwarding alarms to Massdriver |
| `params.md_metadata.package.created_at` | When the package was created |
| `params.md_metadata.package.updated_at` | When the package was last updated |
| `params.md_metadata.package.deployment_enqueued_at` | When the current deployment was enqueued |
| `params.md_metadata.package.previous_status` | Status of the package before this deployment |
| `params.md_metadata.target.contact_email` | Contact email of the user/service account that triggered the deployment |

### Dependencies and Resources

The shape of `dependencies.<name>` and `resources.<name>` is determined by the **resource type schema** they conform to. Massdriver's V1 artifact definitions typically split fields into two top-level keys:

- **`specs`** — public metadata (regions, names, configuration)
- **`data`** — connection details (ARNs, hostnames, credentials)

So an AWS Lambda dependency might expose `{{dependencies.my_lambda.specs.aws.region}}` and `{{dependencies.my_lambda.data.infrastructure.arn}}`. V2 resource-type schemas may use a flatter shape — always inspect the resource type (or `bundle.json` `connections_schema`) to see the exact field layout.

:::note Renamed from `connections` / `artifacts`
`connections` and `artifacts` were renamed to `dependencies` and `resources` on 2026-05-07. The old names still work as aliases but will be removed — update your `operator.md` files to the new names.
:::

### Sensitive field masking

Fields marked `$md.sensitive: true` in the resource type schema are **masked** to `[SENSITIVE]` rather than removed. The shape of the value is preserved (a sensitive object becomes an object with each leaf replaced; a sensitive array becomes a list of `[SENSITIVE]` strings). For example:

```mustache
Password: {{dependencies.my_db.data.authentication.password}}
```

Renders as:

```
Password: [SENSITIVE]
```

This means:
- **Don't print credentials** in the rendered guide — the literal `[SENSITIVE]` text is not useful to operators.
- **Do print non-sensitive metadata** like ARNs, regions, hostnames, and ports freely.

### Missing keys

Both engines render missing keys as empty strings rather than errors, so it's safe to reference fields that may not always be present.

## Mustache Syntax Reference

### Variables

Display a value:

```mustache
Instance: {{id}}
Database: {{params.database_name}}
Version: {{params.version}}
```

### Conditionals

Check if a value exists:

```mustache
{{#dependencies.database}}
**Database Connected:** Yes
**Hostname:** {{data.infrastructure.hostname}}
{{/dependencies.database}}

{{^dependencies.database}}
_No database connected_
{{/dependencies.database}}
```

`{{#name}}` — Renders if truthy
`{{^name}}` — Renders if falsy (inverse)

### Loops

Iterate over arrays:

```mustache
**Configured Subnets:**
{{#params.subnets}}
- {{name}}: {{cidr}}
{{/params.subnets}}
```

### Comments

Add non-rendered notes:

```mustache
{{! This is a comment and won't appear in the rendered guide }}
```

## Liquid Syntax Reference

Liquid supports `{% if %}`, filters, and richer expressions. Example:

```liquid
{% if params.enable_ssl %}
SSL is enabled on port {{ params.ssl_port }}
{% else %}
SSL is not enabled
{% endif %}

Deployed in: {{ params.md_metadata.default_tags.md-target | upcase }}
```

See the [Liquid documentation](https://shopify.github.io/liquid/) for the full filter and tag reference.

## Example Operator Guide

```markdown
---
templating: mustache
---

# {{params.md_metadata.default_tags.md-package}} Runbook

> **Instance:** `{{id}}`
> **Project / Target:** `{{params.md_metadata.default_tags.md-project}}` / `{{params.md_metadata.default_tags.md-target}}`
> **Deployment enqueued:** {{params.md_metadata.package.deployment_enqueued_at}}

## Configuration

- **App name:** `{{params.app_name}}`
- **Version:** `{{params.version}}`

## Dependencies

{{#dependencies.network}}
- **VPC region:** `{{specs.aws.region}}`
- **VPC ID:** `{{data.infrastructure.arn}}`
{{/dependencies.network}}

{{^dependencies.network}}
_No network dependency wired up._
{{/dependencies.network}}

## Resources (this bundle's outputs)

- **API endpoint:** `https://{{resources.api.specs.hostname}}`
- **Lambda ARN:** `{{resources.fn.data.infrastructure.arn}}`

## Operational Commands

\`\`\`bash
# Tail logs (replace LOG_GROUP if needed)
aws logs tail /aws/lambda/{{params.md_metadata.name_prefix}} --follow

# Re-deploy via Massdriver
mass instance deploy {{id}}
\`\`\`

## Alarms

This package forwards alarms to: `{{params.md_metadata.observability.alarm_webhook_url}}`

Contact for this environment: `{{params.md_metadata.target.contact_email}}`
```

## Writing Effective Operator Guides

**Do:**
- Use actual parameter, connection, and artifact field names from your schemas
- Provide copy-paste-ready commands with interpolated values
- Show common operations (connecting, testing, troubleshooting)
- Keep it concise — operators skim these under pressure
- Test interpolation by deploying and checking the rendered guide

**Don't:**
- Print sensitive fields — they render as `[SENSITIVE]`
- Use placeholders like `<replace-me>` when you can interpolate
- Rely on the deprecated names `{{slug}}`, `{{connections.*}}`, or `{{artifacts.*}}` in new guides — use `{{id}}`, `{{dependencies.*}}`, and `{{resources.*}}`
- Forget to update the guide when you change schemas

## Testing Your Guide

1. Deploy an instance using this bundle
2. Open the instance in Massdriver UI
3. Check the "Runbook" tab
4. Verify all `{{variables}}` interpolated correctly
5. Fix any missing fields, typos, or sensitive-field references

## Further Reading

- [Mustache Manual](https://mustache.github.io/mustache.5.html)
- [Liquid Documentation](https://shopify.github.io/liquid/)
- [Bundle Structure](../concepts/bundles)
- [Creating Bundles Guide](../getting_started/03-creating-bundles.md)
