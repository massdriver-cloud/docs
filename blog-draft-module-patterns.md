# Your Terraform Utility Modules Are Solving Problems That Shouldn't Exist

_Draft blog post — not for publication in docs site_

---

Every mature Terraform codebase has them. A `naming` module. A `tags` module. A `diagnostic-settings` module. An `iam` module. Maybe a whole repo of them, imported as a git submodule into every other repo.

These modules exist because Terraform doesn't give you context. It doesn't know what project you're deploying, what environment you're in, or what team owns this infrastructure. So you build modules that pass that context around. You build modules that enforce naming conventions. You build modules that make sure every resource gets the right tags.

And over time, these utility modules become the connective tissue of your entire infrastructure. They're in every repo. They're referenced by every team. They're the thing that breaks everything when someone makes a backwards-incompatible change on a Friday afternoon.

Here's the thing: most of these modules are compensating for missing platform capabilities. When you move to a platform that provides those capabilities natively, entire categories of modules just disappear.

## The Five Types of Utility Module

After working with dozens of teams migrating their Terraform libraries to Massdriver, we've found that utility modules reliably fall into five categories — and each one maps to a different outcome:

### 1. Naming and Tagging: Delete Them

This is the most surprising one for teams to hear. Your naming module — the one that concatenates project, environment, and app name into a consistent resource identifier — isn't needed anymore.

In Massdriver, every bundle deployment automatically receives a `md_metadata` object that includes:

- A `name_prefix` in the format `{project}-{target}-{manifest}-{suffix}` (e.g., `ecomm-prod-api-abc1`)
- A `default_tags` map with `managed-by`, `md-project`, `md-target`, `md-manifest`, and `md-package`

This isn't a "recommended convention." It's injected by the platform. There's no way to forget it, misconfigure it, or skip it. The naming module doesn't need to be migrated — it needs to be deleted.

What's more, removing these modules means removing the `project_name`, `environment`, and `app_name` variables from your bundle's configuration form. Developers deploying infrastructure never see those fields. That's not just cleaner UX — it's one less category of misconfiguration.

### 2. Shared Child Modules: Move Them

IAM helpers, secret processors, firewall rule builders — these are the modules you call from inside other modules. They don't represent independently deployable infrastructure. They're implementation details.

These stay as modules. The migration is straightforward: move them from your git submodule into your catalog repository under `modules/{iacTool}/`, and reference them with relative paths.

But here's where it gets interesting. In traditional Terraform, these child modules take raw inputs — a resource ID, a role name, a CIDR block. In Massdriver, they can take an entire artifact — a structured, validated, type-safe contract that includes everything another module needs to interact with a resource.

When your VM bundle declares a PostgreSQL connection, it receives the full artifact: infrastructure IDs, IAM policies, authentication details, network configuration. A single child module can process all of that — fetching secrets, creating role assignments, opening firewall rules — in one call. Your security team writes it once, and every bundle that needs database access uses the same codified path.

This is where utility modules like RBAC helpers and firewall managers start collapsing into artifact processors. The module still exists, but the surface area shrinks dramatically because the artifact carries the context that those modules used to have to assemble from scattered variables.

### 3. Decorator Modules: Decide Their Fate

Decorator modules are the interesting ones. Azure diagnostic settings. VM extensions. Backup policies. Resource locks. They attach configuration to existing resources without producing anything new.

These have a genuine architectural choice:

**Bake them in** if they're mandatory. If every storage account must have diagnostic settings, make it a child module inside the storage account bundle. Compliance is guaranteed — there's no deployment path that skips it.

**Promote them to bundles** if they're optional or vary by environment. A VM monitoring extension might be required in production but unnecessary in development. As a standalone bundle with a connection to the VM, it appears on the canvas only when needed. Teams can connect or disconnect it per environment.

The key insight is that a bundle doesn't need to produce artifacts. Decorator bundles exist purely to consume connections and create side effects. This is a valid pattern, and it's one that traditional Terraform module libraries struggle with because there's no clean way to express "this module depends on that module's output but doesn't produce anything itself."

### 4. Meta Config: Promote Everything

SSO apps. DNS zones. Automation accounts. Management groups. Azure Policy assignments. These organizational resources are some of the most painful to manage in traditional Terraform because they're:

- Infrequently changed (so no one remembers how)
- Referenced by many systems (so changes are scary)
- Poorly documented (so tribal knowledge dominates)
- Never tested in isolation (so changes go straight to production)

Every single one of these should become a full bundle. Not because the Terraform is complex, but because the operational benefits compound:

- **Audit trail**: Every change is a versioned deployment. "Who changed the Entra app and when?" has a clear answer.
- **Rollback**: Bad SSO configuration? Revert to the previous deployment.
- **Ephemeral testing**: Spin up a preview environment, test the Entra app change, tear it down. This was never possible when these modules ran directly against production.
- **Operator guides**: Documentation lives in `operator.md` alongside the bundle. The team managing the Entra app knows exactly what other systems reference it.
- **Connections**: An Entra app bundle can produce an artifact that application bundles consume for SSO configuration. Suddenly, adding SSO to a new app is connecting two boxes on a canvas instead of reading a wiki page and copying values.

### 5. Git Submodules: Burn Them

Nobody likes git submodules. They create merge conflicts. They drift out of sync. They make CI builds flaky. They're a workaround for "I need to share code between repos" in a world that didn't have a better answer.

Your massdriver-catalog repository replaces the submodule. Child modules live in `modules/`. Bundles live in `bundles/`. Artifact definitions live in `artifact-definitions/`. Everything references everything else with relative paths, versioned and published together.

No submodule init. No submodule update. No "wait, which commit of the shared repo is this pinned to?"

## The Compounding Effect

The real value isn't any single migration. It's what happens when they compound.

When you delete the naming module and your child modules start processing artifacts, the surface area of your RBAC helper shrinks from "take twelve parameters and figure out the right role assignment" to "take a postgres artifact and bind this principal to its IAM policy."

When your decorator modules become standalone bundles, you can see on a canvas which resources have diagnostic settings and which don't — across every environment.

When your meta config becomes a bundle with connections, you can trace the dependency graph from "this Entra app" to "these five applications that use it for SSO" without reading documentation.

Each migration makes the next one simpler, because the platform carries more context with each artifact contract you define.

## Getting Started

If you're already using Massdriver and want to migrate your module library, we have a step-by-step guide: [Mapping Terraform Module Patterns to Massdriver](https://docs.massdriver.cloud/guides/module-patterns).

If you're evaluating Massdriver and want to understand how your existing Terraform patterns would translate, [join our Slack](https://massdriver.cloud/slack) — we've helped dozens of teams through this migration and we're happy to walk through your specific module library.

---

_What patterns have you seen in your Terraform utility modules? We'd love to hear about the weird ones. Find us in [Community Slack](https://massdriver.cloud/slack)._
