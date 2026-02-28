---
id: bundle-development-overview
slug: /bundle-development/overview
title: Bundle Development
sidebar_label: Overview
---

This section covers everything you need to build, test, and publish Massdriver bundles.

## What's in this section

- **[Bundle YAML Specification](./bundle-yaml-spec)** - Complete reference for the `massdriver.yaml` file format
- **[Schema Design](./schema-design/overview)** - JSON Schema patterns and Massdriver annotations for building parameter forms
- **[Connections & Artifacts](./connections-artifacts/overview)** - How bundles consume and produce artifacts for type-safe infrastructure composition
- **[Provisioners](./bundle-development/provisioners/overview)** - Configure OpenTofu, Terraform, Helm, and Bicep provisioning steps
- **[Publishing](./publishing/versioning)** - Version, template, and publish bundles to the registry

## Quick start

1. **Create a bundle** using the CLI:
   ```bash
   mass bundle new my-bundle
   ```

2. **Define your schema** in `massdriver.yaml` with parameters, connections, and artifacts

3. **Write your IaC** in the provisioner directory (e.g., `src/` for OpenTofu)

4. **Test locally** with development releases:
   ```bash
   mass bundle publish --development
   ```

5. **Publish a stable release** when ready:
   ```bash
   mass bundle publish
   ```

## Learning path

If you're new to bundle development, start with the [Getting Started](/getting-started/overview) tutorials, then return here for the complete reference documentation.

For conceptual background on why bundles exist and their design principles, see [Concepts: Bundles](/concepts/bundles).
