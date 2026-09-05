---
id: custom-resource-type
slug: /guides/custom-resource-type
title: Crafting Custom Resource Types
sidebar_label: Custom Resource Type
---

<iframe width="560" height="315" src="https://www.youtube.com/embed/Am2_CJAsuSQ?si=GUf7QR1qBRRJFBeC" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

# Crafting Custom Resource Types

This guide walks through creating your own resource type in Massdriver, for when the existing types do not cover what you need. For a primer on what resources and resource types are, see the [Resources & Resource Types](/concepts/resources-and-types) concepts page.

A resource type is authored as a `massdriver.yaml` in its own directory, published to your organization's catalog as a versioned OCI artifact, and referenced from bundles by name and version.

## Step 1: Check whether one already exists

Look through the Massdriver [resource types GitHub repo](https://github.com/massdriver-cloud/artifact-definitions/tree/main/definitions/artifacts) first. If nothing there fits, write your own.

:::tip Bootstrap Your Resource Types

If you're setting up a self-hosted Massdriver instance, check out the **[Massdriver Catalog](https://github.com/massdriver-cloud/massdriver-catalog)**. It includes example resource types for common infrastructure patterns (networks, databases, storage) that you can customize for your organization. This is a great starting point for designing your platform's resource type contracts before implementing infrastructure code.

:::

## Step 2: Create the resource type

Use the [Massdriver CLI](/reference/cli/overview) to create the repository in your catalog:

```bash
mass resource-type create my-resource-type
```

A resource type lives in a directory:

```
my-resource-type/
├── massdriver.yaml
├── instructions/
│   └── console.md
└── exports/
    └── config.yaml.liquid
```

Start from this template:

```yaml massdriver.yaml
name: my-resource-type
version: 0.1.0
label: My Resource Type

schema:
  type: object
  title: My Resource Type
  additionalProperties: false
  properties:
    authentication:
      title: Authentication
      type: object
      properties: {}
    infrastructure:
      title: Infrastructure
      type: object
      properties: {}
```

If you already have a resource type as a raw JSON schema, convert it rather than rewriting it by hand:

```bash
mass resource-type convert ./my-resource-type.json
```

`convert` writes a `massdriver.yaml` alongside the schema and pulls any inlined instruction and export content back out into referenced files. It writes a placeholder `version` — set a real one before you publish.

## Step 3: Shape the schema

Structure the schema to match your infrastructure abstraction. Group related properties, and mark secrets with `$md.sensitive: true` so their values are masked in API responses and the UI.

```yaml massdriver.yaml
name: my-resource-type
version: 1.0.0
label: My Resource Type
icon: https://example.com/my-icon.svg

schema:
  type: object
  title: My Resource Type
  additionalProperties: false
  required:
    - infrastructure
    - authentication
  properties:
    infrastructure:
      title: Infrastructure configuration
      type: object
      required:
        - foo
        - bar
      properties:
        foo:
          type: string
          title: Foo
          description: Foo description
          pattern: "^.*+$"
          message:
            pattern: Must be a valid format for foo.
        bar:
          type: string
          title: Bar
          description: Bar description

    authentication:
      title: Authentication configuration
      type: object
      required:
        - token
      properties:
        token:
          title: Token
          type: string
          $md.sensitive: true

    iam:
      title: IAM
      description: IAM Roles And Scopes
      additionalProperties: false
      patternProperties:
        "^[a-z]+[a-z_]*[a-z]$":
          type: object
          required:
            - role
            - scope
          properties:
            role:
              title: Role
              description: Cloud Role
              pattern: "^[a-zA-Z ]+$"
              message:
                pattern: Must be a valid Cloud Role (uppercase, lowercase letters and spaces)
              examples:
                - Data Reader
            scope:
              title: Scope
              description: Cloud IAM Scope (cloud resource identifier)
              type: string

    cloud:
      type: object
      properties:
        region:
          type: string
          title: Cloud Region
          description: Select the cloud region you'd like to provision your resources in.
```

:::note
`$md.sensitive` is a single key with a dot in it, written at the same level as `type` and `title`. It is not a nested `$md` object.
:::

## Step 4: Publish

```bash
mass resource-type publish ./my-resource-type
```

Publishing is immutable. Once `1.0.0` exists it cannot be overwritten, so anything pinned to it keeps resolving to what it resolved to the first time. Bump `version` in `massdriver.yaml` for each change, following [semantic versioning](/bundle-development/publishing/versioning) — adding a required field to the payload is a breaking change for every bundle that consumes it, so it needs a major bump.

The published artifact carries the `massdriver.yaml`, the readme, the changelog, the icon, and the instruction and export files the `massdriver.yaml` references. A referenced file that does not exist, or that resolves outside the directory, fails the publish.

## Step 5: Confirm it published

```bash
mass resource-type get my-resource-type
mass resource-type pull my-resource-type@1.0.0
```

## Step 6: Use it in a bundle

Name the resource type and the versions you accept in the bundle's `massdriver.yaml`. `resources` is what the bundle produces; `dependencies` is what it consumes.

:::tip Recommended: Omit Organization Prefix
When referencing resource types from your own organization, you can omit the organization prefix. Massdriver will automatically use your organization's resource types. This keeps your bundle configuration cleaner and more portable.
:::

```yaml massdriver.yaml
resources:
  my_resource:
    # Recommended: omit the org prefix for your own resource types
    # Also valid: acme/my-resource-type@1.0.0
    resource_type: my-resource-type@1.0.0
    required: true
```

A bundle that consumes it declares a range instead of a pinned version:

```yaml massdriver.yaml
dependencies:
  my_resource:
    resource_type: my-resource-type@~1
    required: true
```

See [Version Resolution](/bundle-development/dependencies-resources/version-resolution) for the accepted range forms and how a range is matched at deploy time.

Produce the resource from your OpenTofu module:

```hcl src/_artifacts.tf
resource "massdriver_artifact" "my_resource" {
  field                = "my_resource"
  provider_resource_id = my_dummy_resource.main.id
  name                 = "My Resource ${var.md_metadata.name_prefix}"
  artifact = jsonencode(
    {
      infrastructure = {
        foo = my_dummy_resource.main.foo
        bar = my_dummy_resource.main.bar
      }
      authentication = {
        token = my_dummy_resource.main.token
      }
      iam = {
        "read" = {
          role  = "Data Reader"
          scope = my_dummy_resource.main.id
        }
      }
      cloud = {
        region = my_dummy_resource.main.region
      }
    }
  )
}
```

> The OpenTofu provider resource is named `massdriver_artifact` for backwards compatibility. It produces a Massdriver resource.

Run `mass bundle lint` and `mass bundle build` to check the bundle, then `mass bundle publish` to publish it.

## Customizing Massdriver

### Customizing Onboarding

Massdriver lets you customize the onboarding experience for cloud credentials and other resource types. Onboarding instructions, UI labels, and icons are declared in the `massdriver.yaml`, so you can give users step-by-step guidance when they add a new credential.

The onboarding panel on the right side of the **Import Resource** dialog — shown below for the `aws-iam-role` type — is rendered from the `ui.instructions` array. Each instruction has a `label` and a `path` to a markdown file, so you can walk users through CLI commands, console clicks, or a one-click flow.

<video controls loop muted playsInline width="100%">
  <source src="/img/screenshots/importing-resources.webm" type="video/webm" />
</video>

**Relevant fields:**

- `label`: The display name for your resource type in the UI.
- `icon`: A custom icon for your resource type.
- `ui.instructions`: Onboarding steps, each with a `label` and a `path` to a markdown file.

```yaml massdriver.yaml
name: my-cloud-credential
version: 1.0.0
label: My Cloud Credential
icon: https://example.com/my-icon.svg

ui:
  connectionOrientation: environmentDefault
  instructions:
    - label: "Step 1: Create a Service Account"
      path: ./instructions/create-service-account.md
    - label: "Step 2: Grant Access"
      path: ./instructions/grant-access.md

schema:
  type: object
  title: My Cloud Credential
  properties: {}
```

Instruction content and icons are files in the resource type's directory. They are packaged into the published artifact by `mass resource-type publish`, so nothing has to be base64-encoded or inlined into the schema.

See a real-world example of onboarding instructions in the [aws-iam-role resource type](https://github.com/massdriver-cloud/artifact-definitions/blob/main/definitions/artifacts/aws-iam-role.json#L20).

### Offering a downloadable file

`exports` gives users a download button on the resource, rendering a [Liquid](https://shopify.github.io/liquid/) template against the resource's data:

```yaml massdriver.yaml
exports:
  - downloadButtonText: Download .env
    fileFormat: env
    templatePath: ./exports/dotenv.liquid
    templateLang: liquid
```

```liquid exports/dotenv.liquid
DATABASE_HOST={{ artifact.authentication.hostname }}
DATABASE_PORT={{ artifact.authentication.port }}
DATABASE_USER={{ artifact.authentication.username }}
DATABASE_PASSWORD={{ artifact.authentication.password }}
```

### Customizing the resource types that can be defaulted in an environment

Massdriver environments support environment default resources — credentials, networks, or DNS zones that are shared across multiple bundles. Any resource type appears as a selectable **Resource Type** in the **Environment Defaults** dialog, so users can pin a default for that type without wiring it into every bundle. The recording below shows a Kubernetes Cluster default being set for an environment.

<video controls loop muted playsInline width="100%">
  <source src="/img/screenshots/set-env-default-kubernetes.webm" type="video/webm" />
</video>

**Relevant fields:**

- `ui.connectionOrientation`: How resources of this type appear on the canvas. `link` lets users draw lines to connect bundles to the resource. `environmentDefault` shows the resource only as a default, not as a connectable box. For example, SREs might draw lines to a shared Kubernetes cluster while developers only see it as a default.
- `ui.environmentDefaultGroup`: Groups the type with others in the environment defaults panel. The group named `credentials` holds cloud credential types, which the UI separates from the rest.

**References:**

- [Resource Type Spec](/bundle-development/dependencies-resources/resource-type-spec) — the complete `massdriver.yaml` field reference
- [Version Resolution](/bundle-development/dependencies-resources/version-resolution) — how a version range picks a resource at deploy time
- [Open source resource types](https://github.com/massdriver-cloud/artifact-definitions)

## Publishing a raw JSON schema

`mass resource-type publish` still accepts a raw JSON or YAML schema file, the format that predates `massdriver.yaml`, and prints a deprecation warning. That path will be removed in a future release.

A raw schema carries no version of its own. It is stored as the resource type's unversioned `0.0.0` document, cannot be pinned by version, and cannot be pulled back down. Run `mass resource-type convert` to move one to `massdriver.yaml`.
