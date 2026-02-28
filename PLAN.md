# Massdriver Documentation Reorganization Plan

## Overview

Reorganize the documentation using the **Divio framework** (Tutorials, How-to Guides, Reference, Explanation) to create clear learning paths and eliminate content overlap.

---

## Proposed Table of Contents

```
docs/
├── Introduction                           # Landing page (keep as-is)
│
├── Getting Started/                       # TUTORIALS - Learning-oriented
│   ├── Overview
│   ├── Deploy Your First Bundle
│   ├── Connect Bundles Together
│   ├── Create Your Own Bundle
│   └── Use Bundle Metadata
│
├── Guides/                                # HOW-TO - Task-oriented
│   ├── Bundles/
│   │   ├── Convert Terraform/OpenTofu Module
│   │   ├── Add Connections to a Bundle
│   │   ├── Emit Artifacts
│   │   ├── Configure Policies
│   │   └── Version and Publish Bundles
│   ├── Artifacts/
│   │   ├── Create Custom Artifact Definition
│   │   ├── Import External Resources
│   │   └── Share Artifacts Across Projects
│   ├── Applications/
│   │   ├── Deploy a Container
│   │   ├── Configure Secrets & Env Vars
│   │   └── Docker Templates
│   ├── Environments/
│   │   ├── Set Up Default Connections
│   │   ├── Compare Environments
│   │   └── Clone Configuration
│   ├── Operations/                        # NEW SECTION
│   │   ├── State Management
│   │   ├── Scaling Infrastructure
│   │   ├── Disaster Recovery
│   │   └── Cost Optimization
│   ├── Platform/
│   │   ├── Bootstrap Your Catalog
│   │   ├── Multi-Team Setup
│   │   └── RBAC Configuration
│   ├── CI-CD/
│   │   ├── GitHub Actions
│   │   └── Azure DevOps
│   ├── Monitoring/
│   │   └── Alarms and Alerts
│   └── Troubleshooting/                   # EXPANDED
│       ├── Common Errors
│       ├── Deployment Failures
│       └── Connection Issues
│
├── Concepts/                              # EXPLANATION - Understanding-oriented
│   ├── Platform Overview
│   ├── Bundles                            # Conceptual only, no YAML specs
│   ├── Artifacts & Definitions            # MERGED from 3 files
│   ├── Connections
│   ├── Projects & Environments            # MERGED from 2 stubs
│   ├── Manifests, Packages & Deployments  # MERGED from 3 stubs
│   ├── Organizations & Access             # EXPANDED with RBAC
│   └── Architecture Patterns              # NEW
│
├── Reference/                             # REFERENCE - Information-oriented
│   ├── Specifications/
│   │   ├── Bundle YAML                    # SINGLE SOURCE OF TRUTH
│   │   └── Artifact Definition YAML       # CONSOLIDATED
│   ├── JSON Schema/
│   │   ├── Overview
│   │   ├── Validation Patterns            # CONSOLIDATED from 6 short pages
│   │   └── Massdriver Annotations
│   ├── Provisioners/
│   │   ├── Overview
│   │   ├── OpenTofu
│   │   ├── Terraform
│   │   ├── Helm
│   │   └── Bicep
│   ├── CLI/
│   │   ├── Overview
│   │   └── Commands/                      # Auto-generated, keep as-is
│   ├── API/
│   │   └── GraphQL/                       # Auto-generated, keep as-is
│   └── Security/
│       ├── Overview
│       ├── Service Accounts
│       └── Authorization
│
├── Applications/                          # Keep separate for discoverability
│   ├── Overview
│   ├── Create Application
│   ├── Deploy Application
│   └── Docker/
│
├── Platform/
│   ├── Self-Hosted/
│   │   ├── Overview
│   │   ├── Installation
│   │   ├── Cloud Storage
│   │   └── Custom Provisioners
│   └── Preview Environments/
│       └── Overview
│
└── Integrations/
    ├── Overview
    ├── AWS Cost Reports
    └── Azure Cost Management
```

---

## Change Summary

### What's Just Moving (No Content Changes)

| Current Location | New Location |
|-----------------|--------------|
| `provisioners/*` | `reference/provisioners/*` |
| `cli/*` | `reference/cli/*` |
| `swapi/*` (GraphQL) | `reference/api/graphql/*` |
| `security/*` | `reference/security/*` |
| `self_hosted/*` | `platform/self-hosted/*` |
| `preview_environments/*` | `platform/preview-environments/*` |
| `integrations/*` | `integrations/*` (keep) |
| `ci_cd/*` | `guides/ci-cd/*` |

### What's Being Split

| Current File | Lines | Split Into |
|-------------|-------|------------|
| `concepts/01-bundles.md` | 671 | **concepts/bundles.md** (principles, design, why) + move YAML specs to reference |
| `guides/bundle-yaml-spec.md` | 757 | **reference/specifications/bundle-yaml.md** (single source of truth) |
| `concepts/02-artifact-definitions.md` + `concepts/03-artifacts.md` | ~100 | **concepts/artifacts-and-definitions.md** (merge related concepts) |

### What's Being Merged/Consolidated

| Current Files | New File | Reason |
|--------------|----------|--------|
| `concepts/04-projects.md` (18 lines) + `concepts/05-environments.md` (17 lines) | **concepts/projects-and-environments.md** | Both are stubs, related concepts |
| `concepts/06-manifests.md` (14 lines) + `concepts/07-packages.md` (24 lines) + `concepts/10-deployments.md` (18 lines) | **concepts/manifests-packages-deployments.md** | All stubs, form a lifecycle |
| `concepts/02-artifact-definitions.md` + `concepts/03-artifacts.md` | **concepts/artifacts-and-definitions.md** | Closely related, reduces navigation |
| `guides/artifact-definition-yaml-spec.md` + `guides/custom_artifact_definition.md` | **reference/specifications/artifact-definition-yaml.md** + **guides/artifacts/create-custom-definition.md** | Split reference from how-to |
| `json_schema_cheat_sheet/01-*.md` through `07-*.md` (6 short files, 9-24 lines each) | **reference/json-schema/validation-patterns.md** | Consolidate thin content |

### What's Being Expanded (New Content Needed)

| New Page | Priority | Content Source |
|----------|----------|----------------|
| `concepts/organizations-and-access.md` | High | Expand from 29-line stub, add RBAC |
| `guides/operations/state-management.md` | High | Refactor from existing `managing_state.md` |
| `guides/operations/scaling-infrastructure.md` | Medium | New content |
| `guides/operations/disaster-recovery.md` | Medium | New content |
| `guides/troubleshooting/deployment-failures.md` | High | Expand from current single FAQ page |
| `guides/troubleshooting/connection-issues.md` | High | Extract from troubleshooting.md |
| `concepts/architecture-patterns.md` | Medium | New content on composition patterns |

### What's Being Removed/Deduplicated

| File | Action | Reason |
|------|--------|--------|
| Overlap in `concepts/01-bundles.md` re: YAML spec | Remove spec details | Duplicate of `bundle-yaml-spec.md` |
| Overlap in `getting_started/03-creating-bundles.md` re: OpenTofu conversion | Keep in getting started, make `bundle-from-opentofu.md` reference it | Avoid two tutorials for same task |

---

## Key Files to Modify

### Configuration
- `sidebars.js` - Complete rewrite for new structure
- `docusaurus.config.js` - Update navbar if needed

### High-Impact Content Files
- `docs/concepts/01-bundles.md` - Remove YAML specification content
- `docs/guides/bundle-yaml-spec.md` - Move to reference/specifications/
- `docs/concepts/02-artifact-definitions.md` - Merge with artifacts
- `docs/concepts/03-artifacts.md` - Merge with definitions
- `docs/troubleshooting.md` - Split into multiple pages

---

## Verification Plan

1. **Build locally**: `npm run build` to verify no broken links
2. **Test navigation**: Manually verify sidebar structure matches plan
3. **Check redirects**: Add redirects in `docusaurus.config.js` for moved pages
4. **Search indexing**: Verify local search still indexes all content
5. **Cross-references**: Grep for internal links and update paths

---

## Implementation Phases

### Phase 1: Structure Setup
- Create new directory structure
- Update `sidebars.js`
- Move files that don't need content changes

### Phase 2: Content Consolidation
- Merge stub concept pages
- Split bundle/artifact specs from concepts
- Consolidate JSON Schema pages

### Phase 3: Content Expansion
- Expand merged concept pages with real content
- Create operations guides
- Expand troubleshooting section

### Phase 4: Cleanup
- Add redirects for old URLs
- Update internal links
- Final build verification

---

## Detailed File Movements

### Phase 1 File Movements (No Content Changes)

```bash
# Provisioners -> Reference/Provisioners
mv docs/provisioners/01-overview.md docs/reference/provisioners/01-overview.md
mv docs/provisioners/02-opentofu.md docs/reference/provisioners/02-opentofu.md
mv docs/provisioners/03-terraform.md docs/reference/provisioners/03-terraform.md
mv docs/provisioners/04-helm.md docs/reference/provisioners/04-helm.md
mv docs/provisioners/05-bicep.md docs/reference/provisioners/05-bicep.md

# CLI -> Reference/CLI
mv docs/cli/00-overview.md docs/reference/cli/00-overview.md
mv docs/cli/commands/* docs/reference/cli/commands/

# Security -> Reference/Security
mv docs/security/00-overview.md docs/reference/security/00-overview.md
mv docs/security/01-service-accounts.md docs/reference/security/01-service-accounts.md
mv docs/security/02-authorization.md docs/reference/security/02-authorization.md

# Self-Hosted -> Platform/Self-Hosted
mv docs/self_hosted/00-overview.md docs/platform/self-hosted/00-overview.md
mv docs/self_hosted/01-install.md docs/platform/self-hosted/01-install.md
mv docs/self_hosted/02-cloud-storage.md docs/platform/self-hosted/02-cloud-storage.md
mv docs/self_hosted/03-custom-provisioners.md docs/platform/self-hosted/03-custom-provisioners.md

# Preview Environments -> Platform/Preview Environments
mv docs/preview_environments/00-overview.md docs/platform/preview-environments/00-overview.md

# CI/CD -> Guides/CI-CD
mv docs/ci_cd/01-github.md docs/guides/ci-cd/01-github.md
mv docs/ci_cd/02-devops.md docs/guides/ci-cd/02-devops.md

# GraphQL API stays in swapi/ but gets referenced from reference/api/
# (may need to adjust based on GraphQL plugin configuration)
```

### Phase 2 Content Consolidation

```bash
# Specifications
mv docs/guides/bundle-yaml-spec.md docs/reference/specifications/bundle-yaml.md
mv docs/guides/artifact-definition-yaml-spec.md docs/reference/specifications/artifact-definition-yaml.md

# JSON Schema consolidation
# Merge: 01-human-readable-enum-labels.md through 07-custom-validation-messages.md
# Into: docs/reference/json-schema/validation-patterns.md
mv docs/json_schema_cheat_sheet/00-overview.md docs/reference/json-schema/00-overview.md
mv docs/json_schema_cheat_sheet/08-massdriver-annotations.md docs/reference/json-schema/massdriver-annotations.md

# Guides reorganization
mv docs/guides/bundle-from-opentofu.md docs/guides/bundles/convert-terraform-opentofu.md
mv docs/guides/custom_artifact_definition.md docs/guides/artifacts/create-custom-definition.md
mv docs/guides/import-artifact.md docs/guides/artifacts/import-external-resources.md
mv docs/guides/bootstrap-platform.md docs/guides/platform/bootstrap-your-catalog.md
mv docs/guides/managing_state.md docs/guides/operations/state-management.md
mv docs/guides/monitoring-and-alarms.md docs/guides/monitoring/alarms-and-alerts.md
mv docs/guides/sharing_infrastructure.md docs/guides/artifacts/share-artifacts-across-projects.md
```

### Files to Merge (Phase 2)

1. **concepts/projects-and-environments.md** - Merge from:
   - `concepts/04-projects.md`
   - `concepts/05-environments.md`

2. **concepts/manifests-packages-deployments.md** - Merge from:
   - `concepts/06-manifests.md`
   - `concepts/07-packages.md`
   - `concepts/10-deployments.md`

3. **concepts/artifacts-and-definitions.md** - Merge from:
   - `concepts/02-artifact-definitions.md`
   - `concepts/03-artifacts.md`

4. **reference/json-schema/validation-patterns.md** - Merge from:
   - `json_schema_cheat_sheet/01-human-readable-enum-labels.md`
   - `json_schema_cheat_sheet/02-immutable-fields.md`
   - `json_schema_cheat_sheet/03-range-exclusion.md`
   - `json_schema_cheat_sheet/04-conditionally-requiring-fields.md`
   - `json_schema_cheat_sheet/05-property-reuse.md`
   - `json_schema_cheat_sheet/06-sets.md`
   - `json_schema_cheat_sheet/07-custom-validation-messages.md`

---

## New sidebars.js Structure

```javascript
module.exports = {
  docs: [
    "introduction",
    {
      type: "category",
      label: "Getting Started",
      items: [{ type: "autogenerated", dirName: "getting_started" }],
    },
    {
      type: "category",
      label: "Guides",
      items: [
        {
          type: "category",
          label: "Bundles",
          items: [{ type: "autogenerated", dirName: "guides/bundles" }],
        },
        {
          type: "category",
          label: "Artifacts",
          items: [{ type: "autogenerated", dirName: "guides/artifacts" }],
        },
        {
          type: "category",
          label: "Applications",
          items: [{ type: "autogenerated", dirName: "guides/applications" }],
        },
        {
          type: "category",
          label: "Environments",
          items: [{ type: "autogenerated", dirName: "guides/environments" }],
        },
        {
          type: "category",
          label: "Operations",
          items: [{ type: "autogenerated", dirName: "guides/operations" }],
        },
        {
          type: "category",
          label: "Platform",
          items: [{ type: "autogenerated", dirName: "guides/platform" }],
        },
        {
          type: "category",
          label: "CI/CD",
          items: [{ type: "autogenerated", dirName: "guides/ci-cd" }],
        },
        {
          type: "category",
          label: "Monitoring",
          items: [{ type: "autogenerated", dirName: "guides/monitoring" }],
        },
        {
          type: "category",
          label: "Troubleshooting",
          items: [{ type: "autogenerated", dirName: "guides/troubleshooting" }],
        },
      ],
    },
    {
      type: "category",
      label: "Concepts",
      items: [{ type: "autogenerated", dirName: "concepts" }],
    },
    {
      type: "category",
      label: "Reference",
      items: [
        {
          type: "category",
          label: "Specifications",
          items: [{ type: "autogenerated", dirName: "reference/specifications" }],
        },
        {
          type: "category",
          label: "JSON Schema",
          items: [{ type: "autogenerated", dirName: "reference/json-schema" }],
        },
        {
          type: "category",
          label: "Provisioners",
          items: [{ type: "autogenerated", dirName: "reference/provisioners" }],
        },
        {
          type: "category",
          label: "CLI",
          link: { type: "doc", id: "reference/cli/00-overview" },
          items: [{ type: "autogenerated", dirName: "reference/cli" }],
        },
        {
          type: "category",
          label: "Security",
          items: [{ type: "autogenerated", dirName: "reference/security" }],
        },
        {
          type: "category",
          label: "GraphQL API",
          items: [
            { type: "doc", id: "swapi", label: "Overview" },
            {
              type: "category",
              label: "Queries",
              items: [{ type: "autogenerated", dirName: "swapi/operations/queries" }],
            },
            {
              type: "category",
              label: "Mutations",
              items: [{ type: "autogenerated", dirName: "swapi/operations/mutations" }],
            },
            {
              type: "category",
              label: "Types",
              items: [{ type: "autogenerated", dirName: "swapi/types" }],
            },
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Applications",
      items: [{ type: "autogenerated", dirName: "applications" }],
    },
    {
      type: "category",
      label: "Platform",
      items: [
        {
          type: "category",
          label: "Self-Hosted",
          items: [{ type: "autogenerated", dirName: "platform/self-hosted" }],
        },
        {
          type: "category",
          label: "Preview Environments",
          items: [{ type: "autogenerated", dirName: "platform/preview-environments" }],
        },
      ],
    },
    {
      type: "category",
      label: "Integrations",
      items: [{ type: "autogenerated", dirName: "integrations" }],
    },
  ],
};
```

---

## Redirects Configuration

Add to `docusaurus.config.js` in the presets section:

```javascript
docs: {
  // ... existing config
  async redirects() {
    return [
      // Provisioners
      { from: '/provisioners/overview', to: '/reference/provisioners/overview' },
      { from: '/provisioners/opentofu', to: '/reference/provisioners/opentofu' },
      { from: '/provisioners/terraform', to: '/reference/provisioners/terraform' },
      { from: '/provisioners/helm', to: '/reference/provisioners/helm' },
      { from: '/provisioners/bicep', to: '/reference/provisioners/bicep' },

      // CLI
      { from: '/cli/cli-overview', to: '/reference/cli/overview' },

      // Security
      { from: '/security/overview', to: '/reference/security/overview' },
      { from: '/security/service-accounts', to: '/reference/security/service-accounts' },
      { from: '/security/authorization', to: '/reference/security/authorization' },

      // Self-Hosted
      { from: '/self_hosted/overview', to: '/platform/self-hosted/overview' },
      { from: '/self_hosted/install', to: '/platform/self-hosted/install' },
      { from: '/self_hosted/cloud-storage', to: '/platform/self-hosted/cloud-storage' },
      { from: '/self_hosted/custom-provisioners', to: '/platform/self-hosted/custom-provisioners' },

      // Preview Environments
      { from: '/preview_environments/overview', to: '/platform/preview-environments/overview' },

      // CI/CD
      { from: '/ci_cd/github', to: '/guides/ci-cd/github' },
      { from: '/ci_cd/devops', to: '/guides/ci-cd/devops' },

      // JSON Schema
      { from: '/json_schema_cheat_sheet/overview', to: '/reference/json-schema/overview' },
      { from: '/json_schema_cheat_sheet/massdriver-annotations', to: '/reference/json-schema/massdriver-annotations' },

      // Guides
      { from: '/guides/bundle-yaml-spec', to: '/reference/specifications/bundle-yaml' },
      { from: '/guides/artifact-definition-yaml-spec', to: '/reference/specifications/artifact-definition-yaml' },
      { from: '/guides/bundle-from-opentofu', to: '/guides/bundles/convert-terraform-opentofu' },
      { from: '/guides/custom_artifact_definition', to: '/guides/artifacts/create-custom-definition' },
      { from: '/guides/import-artifact', to: '/guides/artifacts/import-external-resources' },
      { from: '/guides/bootstrap-platform', to: '/guides/platform/bootstrap-your-catalog' },
      { from: '/guides/managing_state', to: '/guides/operations/state-management' },
      { from: '/guides/monitoring-and-alarms', to: '/guides/monitoring/alarms-and-alerts' },
      { from: '/guides/sharing_infrastructure', to: '/guides/artifacts/share-artifacts-across-projects' },

      // Concepts merges
      { from: '/concepts/projects', to: '/concepts/projects-and-environments' },
      { from: '/concepts/environments', to: '/concepts/projects-and-environments' },
      { from: '/concepts/manifests', to: '/concepts/manifests-packages-deployments' },
      { from: '/concepts/packages', to: '/concepts/manifests-packages-deployments' },
      { from: '/concepts/deployments', to: '/concepts/manifests-packages-deployments' },
      { from: '/concepts/artifact-definitions', to: '/concepts/artifacts-and-definitions' },
      { from: '/concepts/artifacts', to: '/concepts/artifacts-and-definitions' },
    ];
  },
},
```

Note: You'll need to install `@docusaurus/plugin-client-redirects` for redirects to work.

---

## Files to Delete After Migration

After verifying the migration is complete and all redirects work:

```bash
# Old directories to remove
rm -rf docs/provisioners/
rm -rf docs/cli/
rm -rf docs/security/
rm -rf docs/self_hosted/
rm -rf docs/preview_environments/
rm -rf docs/ci_cd/
rm -rf docs/json_schema_cheat_sheet/

# Old guide files (now in subdirectories)
rm docs/guides/bundle-yaml-spec.md
rm docs/guides/artifact-definition-yaml-spec.md
rm docs/guides/bundle-from-opentofu.md
rm docs/guides/custom_artifact_definition.md
rm docs/guides/import-artifact.md
rm docs/guides/bootstrap-platform.md
rm docs/guides/managing_state.md
rm docs/guides/monitoring-and-alarms.md
rm docs/guides/sharing_infrastructure.md

# Old concept files (merged)
rm docs/concepts/04-projects.md
rm docs/concepts/05-environments.md
rm docs/concepts/06-manifests.md
rm docs/concepts/07-packages.md
rm docs/concepts/10-deployments.md
rm docs/concepts/02-artifact-definitions.md
rm docs/concepts/03-artifacts.md
```
