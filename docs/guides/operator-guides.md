---
id: guides-operator-guides
slug: /guides/operator-guides
title: Writing Operator Guides
sidebar_label: Operator Guides
---

# Writing Operator Guides

Operator guides (also called runbooks) provide operational documentation for your deployed infrastructure. They render **inside the Massdriver UI** after a package is deployed, giving operators context-aware instructions and reference information.

**Key features:**
- **Dynamic content**: Variables are interpolated at render time with actual deployed values
- **Context-aware**: Shows configuration, connections, and artifact outputs specific to this package
- **Operational focus**: Command examples, troubleshooting steps, and reference information
- **Customizable**: You control the content—this is your documentation

## What is an Operator Guide?

Every bundle can include an `operator.md` file in its root directory. This file becomes the operational documentation for packages deployed from that bundle. The guide is rendered in the Massdriver UI's "Runbook" tab for each deployed package, with template variables replaced by actual values from that specific deployment.

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

## Available Context

Operator guides have access to the following data:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{slug}}` | Package slug (unique identifier) | `myapp-prod-useast1` |
| `{{params.field}}` | Configuration parameter values | `{{params.database_name}}` |
| `{{connections.name.specs.field}}` | Connected artifact specs (public metadata) | `{{connections.network.specs.cidr}}` |
| `{{artifacts.name.specs.field}}` | This bundle's output artifact specs | `{{artifacts.database.specs.hostname}}` |

**Important notes:**
- Artifact `data` fields (encrypted secrets/credentials) are **not accessible** in operator guides
- Only `specs` (public metadata) are available
- Connection names match what you defined in `massdriver.yaml`
- Artifact names match the artifacts this bundle produces

## Mustache Syntax Reference

### Variables

Display a value:

```mustache
Package: {{slug}}
Database: {{params.database_name}}
Version: {{params.version}}
```

### Conditionals

Check if a value exists:

```mustache
{{#connections.database}}
**Database Connected:** Yes
**Hostname:** {{specs.hostname}}
{{/connections.database}}

{{^connections.database}}
_No database connected_
{{/connections.database}}
```

`{{#name}}` - Renders if truthy
`{{^name}}` - Renders if falsy (inverse)

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

## Example Operator Guide Structure

Here's a practical template structure:

```markdown
---
templating: mustache
---

# My Bundle Runbook

> **Templating**: This runbook supports mustache templating.
> **Available context**: `slug`, `params`, `connections.<name>.specs`, `artifacts.<name>.specs`

## Package Information

**Slug:** `{{slug}}`

### Configuration

**Parameter Name:** `{{params.parameter_name}}`
**Another Parameter:** `{{params.another_param}}`

### Connections

{{#connections.dependency}}
**Connected to:** {{specs.some_field}}
**Region:** {{specs.region}}
{{/connections.dependency}}

{{^connections.dependency}}
_No dependency connected_
{{/connections.dependency}}

---

## Operational Commands

**Example command using config:**

\`\`\`bash
some-cli --name {{params.name}} --version {{params.version}}
\`\`\`

**Example using artifact outputs:**

\`\`\`bash
curl https://{{artifacts.api.specs.hostname}}/health
\`\`\`

**Example using connection specs:**

\`\`\`bash
ping {{connections.network.specs.gateway_ip}}
\`\`\`

---

**Ready to customize?** [Edit this runbook](https://github.com/YOUR_ORG/massdriver-catalog/tree/main/bundles/your-bundle/operator.md) 🎯
```

## Writing Effective Operator Guides

**Do:**
- Use actual parameter/connection/artifact field names from your schemas
- Provide copy-paste-ready commands with interpolated values
- Show common operations (connecting, testing, troubleshooting)
- Keep it concise—operators skim these under pressure
- Test interpolation by deploying and checking the rendered guide

**Don't:**
- Reference `data` fields (they're not accessible)
- Use placeholders like `<replace-me>` when you can interpolate
- Write novels—keep it scannable
- Forget to update when you change schemas
- Include sensitive information in plain text

## Testing Your Guide

1. Deploy a package using this bundle
2. Open the package in Massdriver UI
3. Check the "Runbook" tab
4. Verify all `{{variables}}` interpolated correctly
5. Fix any missing fields or typos

## Further Reading

- [Mustache Manual](https://mustache.github.io/mustache.5.html)
- [Liquid Documentation](https://shopify.github.io/liquid/)
- [Massdriver Documentation](https://docs.massdriver.cloud)
- [Bundle Structure](../concepts/bundles)
- [Creating Bundles Guide](../getting_started/creating-bundles)

---

**Customize this template for your bundle's specific operational needs.**

