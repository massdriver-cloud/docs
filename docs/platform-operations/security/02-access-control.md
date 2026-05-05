---
id: security-access-control
slug: /platform-operations/security/access-control
title: Access Control (ABAC)
sidebar_label: Access Control
---

# Access Control

Massdriver uses attribute-based access control (ABAC) to manage permissions. Access is determined by attributes on entities, not by assigning users to specific entities. When a new project, environment, or instance is created with the right attributes, existing permissions apply automatically. No manual grants, no permission drift as your infrastructure scales.

## How It Works

Two primitives, cleanly separated:

- **Policies** are *consumer-side*: "members of this group can perform action `X` on entities whose attributes match `C`." Conditions match the **target** of the action.
- **Grants** are *publisher-side*: "this OCI repo / this resource is visible to recipient projects / environments whose attributes match `C`." Conditions match the **recipient**.

You declare **custom attributes** at the organization level to establish your attribute structure. Then you author group **policies** for everyday team RBAC, and **grants** to make a specific repo or resource visible to other projects / environments.

---

## Custom Attributes

Custom attributes define what structural attribute keys exist in your organization, where they are set, and what values are valid.

### Fields

| Field | Description |
|---|---|
| key | The attribute name (e.g., `TEAM`, `TIER`, `DOMAIN`). Identifier-like — 1-64 chars, letters/digits/underscore, starting with a letter or underscore. Case-insensitive. |
| scope | The level where this attribute is set: `project`, `environment`, `component`, `instance`, or `repo` |
| required | Whether the attribute must be provided when creating or updating an entity at that scope |
| values | The closed set of valid values for this attribute. Required, non-empty, all unique. The literal `"*"` is reserved for a future "any value accepted" semantic and rejected today. |

### Scoping and Cascade

Each attribute key is assigned to exactly one level. If `TEAM` is scoped to `project`, only projects can set it. Environments, components, instances, deployments, and resources below that project inherit the value automatically. Lower levels cannot change or override it.

Every structural attribute on any entity has a single, unambiguous origin. There is no merge logic and no precedence to debug.

### Allowed Values

The `values` field constrains what values are valid across the organization. The UI presents a closed dropdown of those values; any value outside the set is rejected at the API.

### Two-Layer Validation

Allowed values define what is valid for the entire organization. Policy conditions further narrow what a specific user can set.

1. **Custom attribute** — the org admin says "`DOMAIN` can be one of: payments, identity, platform, network"
2. **Policy condition** — a group policy says "members of this group can create projects where `DOMAIN` is payments"

The user sees the intersection. A payments engineer creating a project sees `DOMAIN` as a required dropdown with one option. An org admin sees all values and can enter new ones.

#### Example

```
Custom attribute:
  key: DOMAIN
  scope: project
  required: true
  values: [payments, identity, platform, network]
```

```
Group: payments-eng
  policy: project:create where DOMAIN: [payments]

Group: platform-eng
  policy: project:create where DOMAIN: [platform, network]
```

- A `payments-eng` member sees the DOMAIN dropdown with one option: `payments`
- A `platform-eng` member sees two options: `platform`, `network`
- An org admin sees all four and can type new values

### Only Declared Attributes Are Accepted

You can only set attributes that have a corresponding custom attribute declared for that scope. If you try to set an attribute key that has not been declared, it will be rejected.

### Reserved Prefix

Attribute keys starting with `md-` are reserved for system attributes. Users cannot create custom attributes or set attribute values with this prefix.

---

## System Attributes

Massdriver automatically injects system attributes on every entity. These use the reserved `md-` prefix, cascade through the resource hierarchy, and cannot be set or overridden by users.

### Resource Hierarchy

```
                ┌─────────────┐
                │   Project   │
                └──────┬──────┘
            ┌──────────┴──────────┐
            ▼                     ▼
     ┌─────────────┐      ┌─────────────┐
     │ Environment │      │  Component  │
     └──────┬──────┘      └──────┬──────┘
            └──────────┬──────────┘
                       ▼
                ┌─────────────┐
                │  Instance   │
                └──────┬──────┘
                       ▼
                ┌─────────────┐
                │ Deployment  │
                └──────┬──────┘
                       ▼
                ┌─────────────┐
                │  Resource   │
                └─────────────┘
```

An instance is the intersection of an environment and a component. Attributes set at any level cascade downward — a resource at the bottom carries attributes from every level above it.

### Attribute Reference

| Attribute | Set at | Example | Cascades to |
|---|---|---|---|
| `md-id` | every entity | `api`, `api-prod`, `api-prod-database.primary` | nowhere — always the entity's own identity |
| `md-project` | project | `api` | environment, component, instance, deployment, resource |
| `md-environment` | environment | `prod` | instance, deployment, resource |
| `md-component` | component | `database` | instance, deployment, resource |
| `md-repo` | component | `aws-aurora` | instance, deployment, resource |
| `md-instance` | instance | `api-prod-database` | deployment, resource |
| `md-bundle` | instance | `aws-aurora@1.2.3` | deployment, resource |
| `md-resource-type` | resource | `aws-iam-role` | nowhere |

`md-id` is always the *entity's own* identifier, never inherited:

- Project, environment, component, instance: the dotted slug (`api`, `api-prod`, `api-prod-database`)
- Deployment: the deployment's UUID
- Provisioned resource: `{instance}.{field}` (e.g., `api-prod-database.primary`)
- Imported resource: the resource's UUID

Use `md-instance` to target everything produced by a specific instance — the instance itself, every deployment of it, and every resource it has produced.

### Resolution

Effective attributes resolve through the parent chain at evaluation time. Renaming a project, moving an instance between environments, or changing a custom attribute value propagates immediately to every deployment and resource downstream. Audit history of "what was true at deploy time" lives in audit logs.

Imported resources have no parent instance and live at the org level. They carry only `md-id` (their UUID), `md-resource-type` (from the resource type), and any user attributes set directly on the row. They do **not** inherit `md-project` / `md-environment` / `md-component` / `md-instance` — there's no parent chain.

System attributes combine with your custom attributes for fine-grained targeting. A provisioned resource at the bottom of the hierarchy carries attributes from every level above it.

### Example: Full Attribute Set on a Resource

For a resource produced by the `database` component in the `prod` environment of the `api` project, deployed using `aws-aurora@1.2.3`, with custom attribute `TEAM: payments`:

```
TEAM:             payments                   ← custom attribute, set on project, cascaded down
md-project:       api                        ← from project
md-environment:   prod                       ← from environment
md-component:     database                   ← from component
md-instance:      api-prod-database          ← from instance (cascades to deployments + resources)
md-repo:          aws-aurora                 ← from instance (repo name)
md-bundle:        aws-aurora@1.2.3           ← from instance (repo + version)
md-resource-type: aws-iam-role               ← from resource type
md-id:            api-prod-database.primary  ← this resource's identity
```

### Identifiers as Governance Levers

`md-project`, `md-environment`, and `md-component` carry the **local identifier** chosen at create time — the short name like `api`, `prod`, or `database`, not the full hierarchical form. Local identifiers are constrained to `[a-z0-9]{1,20}` and are immutable after creation.

Policy conditions on these attributes are evaluated at create time against the proposed entity, which turns naming conventions into enforceable contracts:

```yaml
group: app-eng
policies:
  - effect: allow
    action: environment:create
    conditions: { md-environment: [dev, staging, prod] }
```

A member of `app-eng` cannot create an environment named `stage`, `qa`, or anything outside the allowed set — the mutation returns `forbidden` before the row is written. The same lever applies to projects and components via `md-project` and `md-component`.

This means you can extend the platform with governed namespaces just by declaring policy. No schema changes, no new entity types — your conventions become the contract, and every existing policy mechanism (creation gating, list filtering, deny rules, UI dropdowns) applies to them automatically.

---

## Policies

A policy grants or denies a principal the ability to perform an action on entities matching attribute conditions.

### Structure

| Field | Description |
|---|---|
| effect | `allow` or `deny` |
| actions | A non-empty list of operations being granted or denied (e.g., `[instance:deploy]` or `[project:view, project:update]`) |
| conditions | Attribute key/value pairs the entity must match, or `*` for any entity of that type |

The action determines what kind of entity the policy applies to — `project:view` applies to projects, `instance:deploy` applies to instances. All actions in a single policy must target the same entity type.

### Principals

Policies are attached to **groups**. Group membership determines who the policy applies to; the policy's `actions` and `conditions` determine what they can do and against which entities.

For per-repo or per-resource sharing — making a specific OCI repo or resource visible to other projects / environments — see [Grants](#grants) below.

### Evaluation Rules

- **Within a single policy**, all attribute conditions are AND — every attribute must match
- **Across policies**, evaluation is OR — any single fully-matching policy is sufficient
- **Partial matches never accumulate** — you cannot combine conditions from different policies
- **Deny wins** — if any deny policy matches, access is denied regardless of allow policies
- **Implicit deny** — if no policy matches, access is denied
- **Org admin bypass** — the organization owner account and any group with the `organization:admin` action skip all access control checks
- **Empty conditions are invalid** — use `*` for wildcard

### Condition Matching

Each condition value is either `"*"` (per-key wildcard — match any value for
that key) or a non-empty list of strings (closed set):

- `TEAM: ["payments"]` — the entity's `TEAM` attribute must be `payments`
- `md-environment: [dev, staging]` — the entity's `md-environment` must be `dev` or `staging`
- `md-project: "*"` — match any value for `md-project` (per-key wildcard)
- `*` (whole-field) — match any entity of that type, regardless of attributes

### What You Can Target

Using system attributes and custom attributes together:

- All resources in a project: `md-project: [api]`
- All production resources: `md-environment: [prod]`
- All database components: `md-component: [database]`
- Everything produced by a specific instance: `md-instance: [api-prod-database]`
- Any version of a bundle: `md-repo: [aws-aurora]`
- A specific bundle release: `md-bundle: [aws-aurora@1.2.3]`
- A specific entity: `md-id: [api-prod-database.primary]`
- Resources by type: `md-resource-type: [aws-iam-role]`
- Your team's non-prod instances: `TEAM: [payments], md-environment: [dev, staging]`
- Any project's prod environment: `md-project: "*", md-environment: [prod]`

---

## Permissions

Massdriver defines its permissions using an `entity:verb` format. See the [GraphQL permissions reference](/platform-operations/security/graphql-permissions) for the mapping of every API operation to the permission(s) it requires.

### Project

`project:view` is the read gate for all infrastructure. If you can view a project, you can see its environments, instances, and deployments.

| Permission | Description |
|---|---|
| `project:view` | View a project and all its children |
| `project:create` | Create a project |
| `project:update` | Update project name, description, and attributes |
| `project:delete` | Delete a project |
| `project:design` | Modify the project blueprint — add/remove components, create/delete links |

### Environment

| Permission | Description |
|---|---|
| `environment:create` | Create an environment in a project |
| `environment:update` | Update environment name, description, and attributes |
| `environment:delete` | Delete an environment |
| `environment:configure` | Set or remove environment-level resource defaults |

### Instance

| Permission | Description |
|---|---|
| `instance:configure` | Set parameters, secrets, version, and remote references |
| `instance:deploy` | Deploy infrastructure |
| `instance:plan` | Run an infrastructure plan without deploying |
| `instance:decommission` | Tear down infrastructure |
| `instance:propose` | Submit a deployment for approval |
| `instance:approve` | Approve or reject a proposed deployment |

### Group

| Permission | Description |
|---|---|
| `group:view` | View group details and membership |
| `group:manage` | Create, update, and delete groups. Manage members and invitations. |

### Repo

| Permission | Description |
|---|---|
| `repo:view` | View bundles and OCI repositories |
| `repo:pull` | Download bundle contents |
| `repo:push` | Publish new bundle versions |
| `repo:create` | Create a new (empty) OCI repository |
| `repo:update` | Modify a repository's user-settable metadata (e.g. attributes) |
| `repo:delete` | Remove an OCI repository (only when no versions are published) |

### Resource

| Permission | Description |
|---|---|
| `resource:view` | View resource metadata and listings |
| `resource:export` | Download credential payloads — IAM roles, connection strings, certificates |
| `resource:import` | Import external cloud resources into Massdriver |
| `resource:update` | Update an imported resource |
| `resource:delete` | Delete a resource |

### Resource Type

Resource types are organization-level catalog metadata. Listing and viewing resource types is gated by `organization:view`. Publishing (`publishResourceType` / `PUT /v1/resource-types`) and deleting (`deleteResourceType`) currently require `organization:manage`.

Dedicated resource type permissions will be introduced when resource types move to OCI-hosted distribution.

### Organization

| Permission | Description |
|---|---|
| `organization:admin` | Bypass all access control checks in the organization. Use sparingly — limit to the small number of people who own the account itself. |
| `organization:view` | Load the organization's public profile (name, logo, identifier). Granted implicitly to every member through their group memberships. |
| `organization:manage` | Update organization-level settings such as the display name and logo, and remove members from the organization. Required to view the org's member roster as a single list. |
| `organization:manageBilling` | View and manage subscription, payment method, seat counts, and the Stripe customer-portal link. |
| `organization:manageAttributes` | Define and edit the custom attribute schema used across the organization's projects, environments, components, instances, and resources. |

---

## Common Patterns

### Product Team with Non-Prod Access

The team can view their projects, design architecture, configure and deploy to dev and staging, and propose production deployments — but cannot approve them.

```yaml
group: payments-eng
policies:
  - effect: allow
    actions: [project:view, project:update, project:design]
    conditions: { TEAM: [payments] }

  - effect: allow
    actions: [environment:create, environment:update, environment:configure]
    conditions: { TEAM: [payments], md-environment: [dev, staging] }

  - effect: allow
    actions: [instance:configure, instance:deploy, instance:plan]
    conditions: { TEAM: [payments], md-environment: [dev, staging] }

  - effect: allow
    actions: [instance:propose]
    conditions: { TEAM: [payments], md-environment: [production] }
```

### SRE with Cross-Cutting Production Access

SRE can see all projects, deploy and decommission anything in production, and approve deployments from any team.

```yaml
group: sre
policies:
  - effect: allow
    actions: [project:view]
    conditions: "*"

  - effect: allow
    actions: [instance:deploy, instance:decommission, instance:approve]
    conditions: { md-environment: production }
```

### Read-Only Auditor

Full visibility, no write access.

```yaml
group: auditors
policies:
  - effect: allow
    actions: [project:view, group:view, repo:view, resource:view]
    conditions: "*"
```

### Compliance Auditor on PCI Projects

Auditors can view and design any project flagged `pci: true`, and the
`audit-tooling` bundle is the only one visible to them on those projects.

```yaml
custom_attribute:
  key: pci
  scope: project
  required: false
  values: ["true", "false"]

group: compliance-auditors
policies:
  - effect: allow
    actions: [project:view, project:design]
    conditions: { pci: ["true"] }
```

Bundle visibility is gated on the publisher side. A grant on the
`audit-tooling` repo makes it pullable by recipients whose project
matches `pci: true`:

```yaml
# On the audit-tooling repo
grant:
  source: { repo: audit-tooling }
  action: repo:pull
  recipient_conditions: { pci: ["true"] }
```

The two layers compose: `project:design` lets the auditor touch the
canvas of any PCI project, and `repo:pull` controls which bundles
they can see and attach. To restrict them to only the audit bundle,
don't grant any other `repo:view` / `repo:pull` policies — the bundle
picker will only show what they have access to.

---

## Grants

Grants are how a publisher (the team that owns an OCI repo or a resource) makes
their thing visible to other projects or environments. Policies say "members of
my group can pull repos that match these attributes." Grants say "this specific
repo of mine is visible to projects that match these attributes."

A grant is the inverse direction of a policy: the conditions match the
**recipient** project / environment, not the entity being acted on.

### Structure

| Field | Description |
|---|---|
| source | Exactly one of `source_bundle_id` (an OCI repo) or `source_artifact_id` (a resource). The thing being shared. |
| action | The action being granted on the source — e.g., `repo:pull`, `resource:export`. The action's entity must match the source kind. |
| recipient_conditions | Either the explicit wildcard `"*"` (every recipient in the org) or attribute conditions the recipient project / environment must satisfy. Same shape as policy `conditions`; required on create. |

A single grant fans out to every project or environment that satisfies its
recipient conditions. There is no recipient FK — recipients are matched at
access-evaluation time. When a new project is created with attributes matching
an existing grant, it picks up that visibility automatically.

### How visibility composes

Group `repo:view` and `resource:view` policies decide what shows up in lists
and metadata reads — "this group can see bundles / resources whose attributes
match." Grants decide what a project or environment can actually *use* —
"this specific bundle is usable by projects that match these attributes;
this specific resource is usable by environments that match these
attributes."

A caller's visible bundles is the union of:

- bundles their groups have a `repo:view` (or higher) policy on, **plus**
- bundles with a grant whose `recipient_conditions` match a project the
  caller has `project:view` on.

A caller's visible resources is the union of:

- the project cascade — provisioned resources whose parent project the
  caller has `project:view` on, **plus**
- resources their groups have a `resource:view` policy on, **plus**
- resources with a grant whose `recipient_conditions` match an environment
  the caller can see (envs are visible via their parent project's
  `project:view`).

Org admins bypass.

### Recipient matching

Grants target different recipient kinds depending on the source:

| Source kind | Recipient kind | Match against |
|---|---|---|
| Repo | Project | the recipient project's effective attributes (user attrs + `md-project` + `md-id`) |
| Resource | Environment | the recipient env's effective attributes (env user attrs + project cascade + `md-environment` + `md-project` + `md-id`) |

Matching uses the same condition semantics as group policies:
AND-within-conditions, per-key `"*"` requires the attribute to be present,
list values are any-of. A grant with `recipient_conditions = nil` is the
org-wide wildcard.

Because env effective attributes inherit cascaded project attributes, you
can write a resource grant against a project-scoped attribute like
`md-project`, `TEAM`, or `pci` and it will match envs in projects that
satisfy the condition.

### Use vs. view

- **View** is gated by group `repo:view` / `resource:view` policies.
- **Use** is gated by a grant covering the destination project or
  environment, in addition to the caller's view permission:

| Action | View check | Grant check |
|---|---|---|
| `addComponent` (project blueprint) | `repo:view` on the bundle | a repo grant covering the destination project |
| `setRemoteReference` (instance) | `resource:view` on the resource | a resource grant covering the instance's environment |
| `setEnvironmentDefault` | `resource:view` on the resource | a resource grant covering the destination environment |

Seeing a bundle in the catalog or a resource in the resources list is not
the same as the destination being permitted to consume it. Both gates apply
at the consumption mutation; org admins bypass both.

### Examples

Share the `aws-aurora-postgres` repo with any project tagged `TEAM=payments`:

```yaml
source: { repo: aws-aurora-postgres }
action: repo:pull
recipient_conditions: { TEAM: [payments] }
```

Share a managed-database resource with prod and staging environments:

```yaml
source: { resource: payments-prod-postgres-primary }
action: resource:export
recipient_conditions: { md-environment: [prod, staging] }
```

Share a managed-database resource with every environment in PCI projects:

```yaml
source: { resource: payments-prod-postgres-primary }
action: resource:export
recipient_conditions: { pci: ["true"] }
```

Open a repo to the entire org (wildcard) — every project sees it:

```yaml
source: { repo: shared-vpc-template }
action: repo:pull
recipient_conditions: "*"
```

### Authoring grants

Grant mutations are gated by edit access on the source:

| Mutation | Authorization |
|---|---|
| `createRepoGrant` | `repo:update` on the source repo |
| `createResourceGrant` | `resource:update` on the source resource |
| `deleteGrant` | `repo:update` (repo-source grant) or `resource:update` (resource-source grant) |

Grants are immutable: to change `recipient_conditions` or `action`, delete and
re-create. There is no `updateGrant`.

---

## Policy Patterns

The patterns above are the basic shape of group RBAC and cross-team grants. The same primitives — custom attributes, group policies, conditions — also compose into higher-order patterns that shape how the platform behaves, not just who can do what.

ABAC isn't only an access mechanism. Once you start treating attributes as a vocabulary for describing your infrastructure, group policies become a way to encode platform conventions — naming, ownership, lifecycle, capability gating, specialist authority — directly into the system that authorizes every action.

### Enforcing Naming Conventions

**Use case:** developers should only ever create environments named `dev`, `staging`, or `prod`. No `bobs-test`, no `temp-2`, no surprises.

Because `md-environment` *is* the slug of the environment, constraining it on `environment:create` constrains what slugs are creatable.

```yaml
group: developers
policies:
  - effect: allow
    actions: [environment:create]
    conditions: { md-environment: [dev, staging, prod] }
```

A user in this group sees the closed set in the UI and gets a rejection at the API for anything else.

The same pattern applies to any system attribute that doubles as an identifier: `md-project` to constrain project naming, `md-component` to constrain what components are creatable in a project, `md-repo` for OCI repo names. The permission system becomes the place where naming conventions live, instead of a wiki page nobody reads.

### Stacking Group Permissions for Specialized Teams

**Use case:** the base `developers` group can create `dev / staging / prod`. The AI team needs an extra `model-build` environment — but only on projects their team owns.

Two pieces compose this. First, declare a project-scope attribute for architectural ownership:

```yaml
Custom attribute:
  key: ARCHITECTURE_TEAM
  scope: project
  required: true
  values: [payments, checkout, ai, platform]
```

Then two groups, each contributing its own slice:

```yaml
group: developers
policies:
  - effect: allow
    actions: [environment:create]
    conditions: { md-environment: [dev, staging, prod] }

group: ai-team
policies:
  - effect: allow
    actions: [environment:create]
    conditions:
      md-environment: [model-build]
      ARCHITECTURE_TEAM: ai
```

A user in both groups gets the union of their slices: `dev / staging / prod` on any project, *and* `model-build` only on AI-owned projects. AND-within-policy, OR-across-policies does the work — the `model-build` allow doesn't bleed onto a payments project because the `ARCHITECTURE_TEAM: ai` condition won't match there.

This is the general shape of *capability extension*: a base group establishes the default surface area, and specialty groups add narrow, attribute-conditioned extensions on top.

### Template Projects

**Use case:** some projects are templates — reference architectures meant to be cloned, not deployed. They should have a single environment named `template` and no real lifecycles.

The decision of "is this a template?" is a project-shape decision, not an access decision. But because policy conditions can read attributes, you can express it through the permission system anyway.

Declare a project-scope attribute distinguishing real projects from templates:

```yaml
Custom attribute:
  key: PROJECT_KIND
  scope: project
  required: true
  values: [standard, template]
```

Split `environment:create` by project kind:

```yaml
group: developers
policies:
  # Standard projects get the normal lifecycle
  - effect: allow
    actions: [environment:create]
    conditions:
      PROJECT_KIND: standard
      md-environment: [dev, staging, prod]

  # Template projects get exactly one environment, named "template"
  - effect: allow
    actions: [environment:create]
    conditions:
      PROJECT_KIND: template
      md-environment: [template]
```

Marking a project as a template at create-time changes what environments are creatable on it. There's no separate template mode in the UI, no code branch — the policy engine *is* the mode switch. The same idea generalizes: any project-shape decision (sandbox vs. production, internal vs. customer-facing, regulated vs. unregulated) can be expressed as a project-scope attribute that conditions downstream actions.

### Naming Ownership by Role

**Use case:** a project isn't owned by just one "team." It has an architecture team that designed it and a development team that builds against it. An environment has an SRE team that operates it and a security team that audits it. A component has a maintenance team responsible for keeping it healthy. Each role needs different access, and a generic `TEAM` attribute flattens distinctions that matter.

Naming each ownership axis by **role** keeps them addressable independently. Roles attach at the scope where the responsibility actually lives:

```yaml
Custom attribute:
  key: ARCHITECTURE_TEAM      # who designed and architecturally owns the project
  scope: project
  required: true
  values: [payments, checkout, ai, platform]

Custom attribute:
  key: DEVELOPMENT_TEAM       # who writes code against this project
  scope: project
  required: true
  values: [payments, checkout, ai, platform, mobile]

Custom attribute:
  key: SRE_TEAM               # who operates this environment
  scope: environment
  required: false
  values: [koalas, otters, pandas]

Custom attribute:
  key: SECURITY_TEAM          # who audits this environment
  scope: environment
  required: false
  values: [appsec, infrasec, compliance]

Custom attribute:
  key: MAINTENANCE_TEAM       # who keeps this component healthy
  scope: component
  required: false
  values: [koalas, otters, pandas, dba, netops]
```

Project-scope attributes cascade down to environments, instances, and resources. Environment-scope attributes cascade to instances, deployments, and resources beneath them. Component-scope attributes cascade to instances and downward. A single resource at the bottom of the hierarchy can carry every role attribute set above it — and policies can match on any combination.

Each group keys off the role that matches its responsibility:

```yaml
group: koalas-sre
policies:
  - effect: allow
    actions: [project:view]
    conditions: "*"

  - effect: allow
    actions: [instance:deploy, instance:decommission, instance:approve]
    conditions: { SRE_TEAM: koalas }

group: appsec
policies:
  - effect: allow
    actions: [project:view]
    conditions: "*"

  - effect: allow
    actions: [resource:view, resource:export]
    conditions: { SECURITY_TEAM: appsec }
```

Multiple role attributes coexist on the same entity without conflict. The koalas SRE policy and the appsec security policy describe different actions over different conditions — they never need to know about each other.

Hand-off between teams is a single attribute change. Reassigning operational ownership of `prod` from koalas to otters means setting `SRE_TEAM: otters` on that environment; nothing else moves. No policy rewrite, no group-membership churn, no resource re-tagging.

### Cross-Cutting Specialist Teams

**Use case:** a DBA team needs to manage every database and storage component across the org — regardless of which project or environment it sits in. They don't own any single project or environment; their authority is over a *kind of thing*.

Components can carry a `PURPOSE` attribute classifying what they do:

```yaml
Custom attribute:
  key: PURPOSE
  scope: component
  required: true
  values: [api, web, worker, database, storage, network, cache, queue]
```

A specialist group then keys off purpose rather than ownership:

```yaml
group: dba
policies:
  - effect: allow
    actions: [project:view]
    conditions: "*"

  - effect: allow
    actions: [instance:configure, instance:deploy, instance:plan, resource:update]
    conditions: { PURPOSE: [database, storage] }

  - effect: allow
    actions: [instance:approve]
    conditions:
      PURPOSE: [database, storage]
      md-environment: prod
```

The DBA team can configure and deploy any database or storage component across every project and environment, with a stricter `instance:approve` scope tied to production specifically. A newly created project doesn't need to grant DBA access — as long as its database components are tagged `PURPOSE: database`, the existing policy applies automatically.

The same shape extends to other specialist functions:

- A **network team** keying off `PURPOSE: [network, cache]`
- A **platform security** group keying off `md-resource-type: aws-iam-role` for blast-radius review
- A **cost engineering** team keying off `PURPOSE: [database, storage, queue]` for high-spend capacity tuning
- An **ML platform** team keying off `PURPOSE: [model-serving, training]`

Specialist authority is defined by the kind of resource the team is responsible for, not by individual project assignment. New infrastructure tagged with the relevant attributes inherits the right operators automatically.

### Capability Gating by Tier

**Use case:** only projects with a high SLA commitment should be allowed to spin up a `load-test` environment. Lower-tier projects shouldn't be able to consume that capacity.

ABAC does exact match, not numeric comparison, so "above 99.9%" has to be expressed as a set of qualifying values or a derived flag. Two ways to do this, depending on how the surrounding policy logic is shaped.

#### Option A — Enum the SLA tier directly

```yaml
Custom attribute:
  key: SLA_TIER
  scope: project
  required: true
  values: ["99", "99.9", "99.95", "99.99"]

group: developers
policies:
  - effect: allow
    actions: [environment:create]
    conditions: { md-environment: [dev, staging, prod] }

  - effect: allow
    actions: [environment:create]
    conditions:
      SLA_TIER: ["99.95", "99.99"]
      md-environment: [load-test]
```

Best when the SLA tier itself is the relevant attribute elsewhere — for reporting, for choosing alerting thresholds, for cost allocation.

#### Option B — Derive a `HIGH_SLA` flag

```yaml
Custom attribute:
  key: SLA
  scope: project
  required: true
  values: ["95", "99", "99.9", "99.99"]

group: developers
policies:
  - effect: allow
    actions: [environment:create]
    conditions:
      SLA: ["99.9", "99.99"]
      md-environment: [load, standby, chaos]
```

High-SLA projects unlock additional `load`, `standby`, and `chaos` environments.

The capability-gating pattern shows up beyond SLA: regulated workloads getting access to a compliance scanner, paid-tier customers getting a higher resource ceiling, projects in a specific region getting a region-bound feature. In each case, attributes describe the project's qualifying status, and policy conditions decide what that status unlocks.

### The Pattern Underneath

Each of these examples does the same thing in a different domain: it uses attributes to express a *structural* fact about a project, environment, or component, and then lets the permission system carry that fact through every action that touches the entity.

A few things follow:

- **Conventions become enforceable.** A naming rule, an ownership scheme, a lifecycle distinction — once it's an attribute condition on a policy, it's no longer aspirational.
- **Group membership composes cleanly.** Specialty groups add slices on top of base groups; conditions narrow within each policy and union across policies. There's no "effective permissions" debugging because there's no implicit precedence.
- **Project-shape decisions become inputs to the policy engine.** The same action behaves differently depending on what attributes the target carries — and changing the target's attributes changes the behavior, without touching policy.
- **Roles can be named, and multiple roles per scope coexist.** Architecture, development, SRE, security, maintenance, purpose — each is its own attribute, each addressable independently. Specialist teams can own a *kind* of thing across the entire org without ever being assigned to a specific project.

The platform isn't customized through configuration toggles or feature flags. It's customized through the attributes you declare and the policies that match them. Adding a new capability, a new tier, a new specialist function doesn't mean writing new code — it means extending the vocabulary and the rules that read it.

---

## Day-2 Operations

Because permissions are attribute-based rather than ID-based, authorization survives the full lifecycle of your infrastructure.

- Deleting and recreating a database does not revoke the ability to manage it — the permission is tied to the attributes, not the specific instance.
- Online migrations where old and new resources coexist are handled naturally — both carry the same attributes.
- A team's access follows the intent encoded in attributes, not a list of identifiers that goes stale.

## Built-in Administration

The organization owner account always bypasses access control checks. A group with the `organization:admin` action also bypasses all access control checks in that organization. Use sparingly — limit to the small number of people who own the account itself.

## Related

- [GraphQL permissions reference](/platform-operations/security/graphql-permissions) — the permission required by every GraphQL operation
- [Service Accounts](/platform-operations/security/service-accounts) — non-human principals that authenticate to the API
