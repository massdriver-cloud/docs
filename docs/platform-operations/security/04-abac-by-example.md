---
id: security-abac-by-example
slug: /platform-operations/security/abac-by-example
title: ABAC by Example
sidebar_label: ABAC by Example
---

# ABAC by Example

This guide walks three fictional organizations through Massdriver's [access control](/platform-operations/security/access-control) model end to end: the attributes each one declares, the groups and policies they write, the grants they publish, and a week of concrete access decisions traced step by step. Each organization has a different shape, and each one leans on a different corner of the same evaluation rules.

Read the [Access Control](/platform-operations/security/access-control) guide first for the reference material. This page assumes you know what a custom attribute, a policy, and a grant are.

## The model in six rules

Every trace below is these six rules applied to a concrete entity.

1. **Attributes cascade down.** A custom attribute is declared once, at exactly one scope: `project`, `environment`, `component`, or `repo`. Project values flow to every environment, component, instance, and resource beneath. Lower levels cannot override.
2. **Identifiers are attributes.** Every entity carries system attributes: `md-project`, `md-environment`, `md-component`, `md-repo`, `md-instance`, `md-bundle`, `md-resource-type`, and `md-id`. Because `md-environment` is the environment's slug, a policy on it is also a naming rule. Slugs match `[a-z0-9]{1,20}`, so no hyphens.
3. **Policies face the target, grants face the recipient.** A group policy says "my members may do action X on entities matching C." A grant on a repo or resource says "this thing is usable by projects or environments matching C." Same condition syntax, opposite direction.
4. **AND inside, OR across, deny wins.** Every condition in one policy must match. Any single fully matching policy is enough. Partial matches from two policies never combine. One matching deny beats every allow. No match at all is a deny.
5. **Unreachable conditions drop.** A condition on an attribute the action's entity can never carry is removed before matching. An allow left with no conditions becomes a wildcard. A deny left with no conditions is discarded. A deny left with *some* conditions fires on everything the remaining ones match, which is wider than you wrote. All three are silent.
6. **Policy narrows the form.** The org declares which values a key may take. A user's `create` or `update` policies narrow the dropdown to the intersection. A key a policy does not mention stays wide open for that user.

Reach, by entity:

| Action's entity | Reachable system attributes | Reachable custom attribute scopes |
|---|---|---|
| project | `md-id`, `md-project` | `project` |
| environment | + `md-environment` | `project`, `environment` |
| component | + `md-component`, `md-repo` | `project`, `component` |
| instance | all of the above + `md-instance`, `md-bundle` | `project`, `environment`, `component` |
| resource | instance's set + `md-resource-type` | `project`, `environment`, `component` |
| repo | `md-id`, `md-repo` | `repo` only. Repo attributes never cascade anywhere else. |

---

## Persona 1: Ledgerline, a payments and lending fintech

A card issuer and small-business lender. They live inside PCI DSS, get audited by a QSA every year, and have been burned once by an engineer pasting a production database URL into a support ticket.

| | |
|---|---|
| Engineering | 180 people across 5 domains |
| Cloud | AWS, two accounts per environment |
| Regulation | PCI DSS Level 1, SOC 2 Type II |
| Projects | About 60, a third in PCI scope |

**The business rule they must be able to prove:** no engineer can push to production alone, no human outside the vault team can read a cardholder-data credential, and the auditor can see every PCI system and nothing else.

### Vocabulary

Ledgerline's attributes answer four questions about any piece of infrastructure: who owns it, is it in PCI scope, what data does it touch, and who is on call for it. A fifth classifies bundles by hardening status.

| Key | Scope | Required | Values | What it encodes |
|---|---|---|---|---|
| `DOMAIN` | project | yes | `payments`, `lending`, `identity`, `platform`, `data` | Architectural ownership. Every engineering group keys off this. |
| `PCI` | project | yes | `true`, `false` | Whether the project is inside the cardholder data environment. Drives auditor visibility and which bundles the project may use. |
| `DATA_CLASS` | component | yes | `public`, `internal`, `confidential`, `cardholder` | What a component stores or transmits. Set on the component, so it follows the instance into every environment. |
| `PURPOSE` | component | yes | `api`, `worker`, `database`, `cache`, `queue`, `network`, `storage` | What kind of thing it is. Routes specialist authority without project assignment. |
| `SRE_POD` | environment | no | `koalas`, `otters` | Which on-call pod operates this environment this quarter. Rotates. |
| `CERTIFIED` | repo | yes | `pci`, `general` | Whether the bundle passed the hardening review. Lives on the repo, so it gates catalog visibility and pulls. |

Environment names are fixed org-wide to `dev`, `staging`, and `prod`. That is not a seventh attribute; it is a condition on `md-environment` in every `environment:create` policy.

### Groups and policies

Nine groups. Five are the domain teams and share one template. The rest are cross-cutting roles that are never assigned to a project, only to an attribute.

| Group | Who |
|---|---|
| `payments-eng` (and `lending-eng`, `identity-eng`, `platform-eng`, `data-eng`) | Domain teams. One template, one value swapped. |
| `payments-leads` | Approve production for their domain. Not members of the eng group. |
| `sre-koalas`, `sre-otters` | Operate whichever environments carry their pod name. |
| `dba-guild` | Every database component, everywhere. |
| `vault-custodians` | The three people who may read cardholder credentials. |
| `engineers` | Everyone technical except the custodians. Carries the org-wide deny. |
| `qsa-auditors` | External. Added in March, removed in April. |
| `ci-deployer` | One service account. Deploys non-prod, proposes prod. |

The domain team template. `lending-eng` is identical with `DOMAIN: [lending]`:

```yaml
group: payments-eng
policies:
  - effect: allow
    action: [project:view, project:update, project:design]
    conditions: { DOMAIN: [payments] }

  - effect: allow
    action: environment:create
    conditions:
      DOMAIN: [payments]
      md-environment: [dev, staging, prod]     # the naming convention

  - effect: allow
    action: [environment:update, environment:configure]
    conditions: { DOMAIN: [payments], md-environment: [dev, staging] }

  - effect: allow
    action: [instance:configure, instance:plan, instance:deploy, instance:decommission]
    conditions: { DOMAIN: [payments], md-environment: [dev, staging] }

  - effect: allow
    action: [instance:plan, instance:propose]  # prod: you may look and you may ask
    conditions: { DOMAIN: [payments], md-environment: [prod] }

  - effect: allow
    action: [resource:view, resource:export]
    conditions: { DOMAIN: [payments], md-environment: [dev, staging] }

  - effect: allow
    action: resource:view
    conditions: { DOMAIN: [payments], md-environment: [prod] }

  - effect: allow
    action: [repo:view, repo:pull]
    conditions: { CERTIFIED: [pci, general] }  # repo-scoped key; only reachable on repo actions
```

The second pair of hands:

```yaml
group: payments-leads
policies:
  - effect: allow
    action: project:view
    conditions: { DOMAIN: [payments] }

  - effect: allow
    action: [instance:deploy, instance:plan]   # instance:deploy also approves/rejects proposals
    conditions: { DOMAIN: [payments], md-environment: [prod] }
```

Separation of duties at Ledgerline is a membership rule: leads are not in `payments-eng`, so an engineer holds `instance:propose` in prod and a lead holds `instance:deploy`. Neither can complete a production change alone. The engine has no concept of an "approver". It only knows that deciding a proposal is gated by `instance:deploy`.

```yaml
group: sre-koalas                              # sre-otters swaps the pod name
policies:
  - effect: allow
    action: project:view
    conditions: "*"

  - effect: allow
    action: [instance:deploy, instance:decommission, instance:propose, instance:plan]
    conditions: { SRE_POD: [koalas] }

  - effect: allow
    action: [environment:deploy, environment:decommission]
    conditions: { SRE_POD: [koalas] }
```

```yaml
group: dba-guild                               # authority over a kind of thing, not a place
policies:
  - effect: allow
    action: project:view
    conditions: "*"

  - effect: allow
    action: [instance:configure, instance:plan, instance:deploy, resource:view]
    conditions: { PURPOSE: [database] }
```

```yaml
group: vault-custodians                        # three people, not in `engineers`
policies:
  - effect: allow
    action: project:view
    conditions: { PCI: ["true"] }

  - effect: allow
    action: [resource:view, resource:export]
    conditions: { DATA_CLASS: [cardholder] }
```

```yaml
group: engineers                               # everyone technical except the custodians
policies:
  - effect: deny
    action: resource:export
    conditions: { DATA_CLASS: [cardholder] }   # any environment, any domain

  - effect: deny
    action: [instance:decommission, environment:decommission, project:delete]
    conditions:
      PCI: ["true"]
      md-environment: [prod]                   # drops for project:delete; deny still binds via PCI
```

The deny lives on the group whose members it should bind. Deny beats allow across all of a person's groups, so the custodians are deliberately kept out of `engineers`. Put denies on groups, not people, and know exactly which groups.

```yaml
group: qsa-auditors                            # time-boxed external group
policies:
  - effect: allow
    action: [project:view, resource:view]
    conditions: { PCI: ["true"] }

  - effect: allow
    action: repo:view
    conditions: { CERTIFIED: [pci] }
```

```yaml
group: ci-deployer                             # one service account
policies:
  - effect: allow
    action: project:view
    conditions: "*"

  - effect: allow
    action: [instance:configure, instance:plan, instance:deploy]
    conditions: { md-environment: [dev, staging] }

  - effect: allow
    action: [instance:plan, instance:propose]
    conditions: { md-environment: [prod] }
```

### Grants

Policies decide who can *see* a bundle. Grants decide which projects can *attach* it. Ledgerline sets the org default for new repositories to no access, so every bundle is invisible until the platform team grants it. Platform engineers hold `repo:grant` and `resource:grant`.

```yaml
# every CERTIFIED: pci bundle
- source: { repo: aws-aurora-hardened }
  action: repo:pull
  recipient_conditions: "*"

# every CERTIFIED: general bundle
- source: { repo: redis-community }
  action: repo:pull
  recipient_conditions: { PCI: ["false"] }

# the production network, published from project "net", environment "prod"
- source: { resource: net-prod-vpc.vpc }
  action: resource:export
  recipient_conditions: { md-environment: [prod] }

# the KMS key that wraps cardholder data
- source: { resource: vault-prod-kms.key }
  action: resource:export
  recipient_conditions: { PCI: ["true"], md-environment: [prod] }
```

Read the second grant carefully. A general-purpose Redis bundle is pullable by any project whose `PCI` is `false`. A PCI project does not match, so the canvas refuses to attach it, even for an engineer whose policies let them see it in the catalog. The hardening review is enforced at the moment of use.

### A week at Ledgerline

#### Monday: Priya looks for the Deploy button

Priya (`payments-eng`) opens `cardvault-prod-ledgerdb`.

```
DOMAIN:           payments
PCI:              true
DATA_CLASS:       cardholder
PURPOSE:          database
SRE_POD:          koalas
md-project:       cardvault
md-environment:   prod
md-component:     ledgerdb
md-repo:          aws-aurora-hardened
md-bundle:        aws-aurora-hardened@3.1.0
md-instance:      cardvault-prod-ledgerdb
```

| Action | Policy | Result | Why |
|---|---|---|---|
| `instance:deploy` | `payments-eng` deploy | miss | Needs `md-environment` in `[dev, staging]`. It is `prod`. |
| `instance:deploy` | `engineers` | miss | No policy on this action. |
| `instance:propose` | `payments-eng` propose | **match** | `DOMAIN = payments` and `md-environment = prod`. |

**Deploy denied, propose allowed.** The UI shows Plan and Propose. Priya submits a proposal with her plan attached.

#### Monday, twenty minutes later: Marcus approves

Marcus (`payments-leads`) reviews the proposal and clicks Approve. Approving is `instance:deploy` on the same instance.

| Action | Policy | Result | Why |
|---|---|---|---|
| `instance:deploy` | `payments-leads` | **match** | `DOMAIN = payments`, `md-environment = prod`. |
| `instance:deploy` | `engineers` deny | miss | The prod deny covers decommission and delete, not deploy. |

**Allowed.** Two humans, two groups, one production change. The audit log shows who proposed and who decided.

#### Tuesday: Priya exports a staging credential

Priya needs the staging ledger's connection string to reproduce a bug and clicks Export on `cardvault-staging-ledgerdb.primary`.

```
DOMAIN:           payments
DATA_CLASS:       cardholder
md-environment:   staging
md-resource-type: aws-postgres-connection@1.0.0
md-id:            cardvault-staging-ledgerdb.primary
```

| Action | Policy | Result | Why |
|---|---|---|---|
| `resource:export` | `payments-eng` export | **match** | `DOMAIN = payments`, `md-environment = staging`. |
| `resource:export` | `engineers` deny | **deny** | `DATA_CLASS = cardholder`. |

**Denied.** Deny wins over a matching allow. Staging holds synthetic card numbers, but the classification is on the component, so the rule follows it into every environment. Priya files a request with the custodians.

#### Wednesday: Priya attaches a Redis bundle to a PCI project

Priya tries to add `redis-community` to the `cardvault` canvas for a rate limiter.

```
# recipient project           # repo
DOMAIN:      payments          CERTIFIED:  general
PCI:         true              md-repo:    redis-community
md-project:  cardvault
```

| Gate | Result | Why |
|---|---|---|
| `repo:view` | **match** | `payments-eng` may view `CERTIFIED` in `[pci, general]`. She sees it in the picker. |
| grant | miss | The only grant on this repo requires `PCI = false`. The project is `PCI = true`. |

**Forbidden.** The bundle appears in the catalog but cannot be attached to a PCI project. The error names the failing gate: the bundle is not granted to this project. Priya picks `aws-elasticache-hardened`, which carries the wildcard grant.

#### Thursday: a new project

Priya creates `disputes` for chargeback handling. Her `project:create` policy constrains `DOMAIN`, so the form offers a single value, `payments`. `PCI` is unconstrained for her, so she chooses.

The moment the project exists:

| Group | Applies | Because |
|---|---|---|
| `payments-leads` | approve prod deploys | `DOMAIN = payments` |
| `dba-guild` | every component tagged `PURPOSE = database` | component attribute |
| `qsa-auditors` | if she set `PCI = true` | project attribute |
| `ci-deployer` | non-prod deploys, prod proposals | wildcard view, `md-environment` |
| `sre-otters` | as soon as an environment is tagged `SRE_POD = otters` | environment attribute |

**Zero grants written.** The project inherited its operators, approvers, and auditors from the attributes it was born with.

#### Friday, end of quarter: on-call rotation

Platform flips `SRE_POD` from `koalas` to `otters` on fourteen production environments, one `environment:update` each.

| Group | Effect |
|---|---|
| `sre-otters` | Can now deploy, decommission, and decide proposals on those fourteen environments. |
| `sre-koalas` | Loses them. No group membership changed. No policy edited. |

On-call rotation is fourteen attribute writes, which is also exactly the audit trail the QSA asks for.

:::warning The mistake Ledgerline made in week one
Their first draft of the auditor policy was `allow [project:view, resource:view] where DATA_CLASS: [cardholder]`. `DATA_CLASS` is component-scoped and is not reachable on a project. For `project:view` the condition dropped and the policy became a wildcard: the auditors could see every project in the org. The fix was to key project visibility on `PCI` (project scope) and reserve `DATA_CLASS` for instance and resource actions. When a policy mixes scopes, check the reach table for every action listed.
:::

---

## Persona 2: Halyard Cloud Partners, a managed services firm

Thirty-five engineers running infrastructure for forty clients out of one Massdriver organization. Isolation between clients is the product. Contractors come and go. Some clients want their own engineers on the console; some want to watch; some only want a quarterly deck.

| | |
|---|---|
| Engineering | 35 people in 3 delivery pods |
| Clients | 40 tenants, about 120 projects |
| Cloud | AWS and Azure, one account per client |
| Contracts | managed, co-managed, advisory |

**The business rule they must be able to prove:** a contractor for one client can never see another client's projects, a client's proprietary bundle can never be attached to a competitor's project, and downgrading a contract revokes the client's hands-on access the same afternoon.

### Vocabulary

Halyard's world has two axes that most companies collapse into one. `CLIENT` is the tenant, the legal boundary. `POD` is Halyard's internal delivery team, which changes when they rebalance workload. Contractors and client staff key off `CLIENT`; Halyard's own engineers key off `POD`. Neither group's policies need editing when the other axis moves.

| Key | Scope | Required | Values | What it encodes |
|---|---|---|---|---|
| `CLIENT` | project | yes | `acme`, `bluefin`, `cobalt`, ... 40 values, plus `halyard` for internal projects | The tenant. Added at onboarding, removed at offboarding. |
| `POD` | project | yes | `pod1`, `pod2`, `pod3` | Which Halyard delivery pod is accountable for the project this half. |
| `ENGAGEMENT` | project | yes | `managed`, `comanaged`, `advisory` | The contract. Decides how much the client's own staff may do and which shared services they receive. |
| `PUBLISHER` | repo | yes | `halyard`, `acme`, `bluefin`, `cobalt`, ... | Who owns the bundle. House bundles are shared with everyone; a client's bundle is theirs alone. |

Environment names are locked to `dev`, `stage`, and `prod` for every group that can create environments.

### Groups and policies

| Group | Who |
|---|---|
| `pod1-engineers`, `pod2-engineers`, `pod3-engineers` | Halyard staff. Full lifecycle on their pod's projects. |
| `contractor-acme` | One group per client that has contractors. Non-prod only. |
| `client-acme-viewers` | The client's staff on a managed contract. Read only. |
| `client-bluefin-engineers` | The client's staff on a co-managed contract. Hands on in non-prod. |
| `account-managers` | Create groups and rotate contractors without being org admins. |
| `halyard-platform` | Publish house bundles and author every grant. |
| `bluefin-publisher` | The client's CI service account. Pushes to their own repos only. |

```yaml
group: pod2-engineers
policies:
  - effect: allow
    action: [project:view, project:create, project:update, project:design]
    conditions: { POD: [pod2] }

  - effect: allow
    action: environment:create
    conditions: { POD: [pod2], md-environment: [dev, stage, prod] }

  - effect: allow
    action: [environment:update, environment:configure, environment:deploy, environment:decommission]
    conditions: { POD: [pod2] }

  - effect: allow
    action: [instance:configure, instance:plan, instance:deploy, instance:propose, instance:decommission]
    conditions: { POD: [pod2] }

  - effect: allow
    action: [resource:view, resource:export, resource:import, resource:update]
    conditions: { POD: [pod2] }

  - effect: allow
    action: [repo:view, repo:pull]
    conditions: "*"                            # staff may SEE every bundle. USE is gated by grants.
```

Halyard's engineers can browse every client's bundles, because seeing a bundle is not the leak. Attaching Bluefin's bundle to Cobalt's project is the leak, and that is a grant check. Splitting view from use keeps the catalog useful for staff while tenancy stays airtight.

```yaml
group: contractor-acme
policies:
  - effect: allow
    action: [project:view, project:design]
    conditions: { CLIENT: [acme] }

  - effect: allow
    action: [instance:configure, instance:plan, instance:deploy]
    conditions: { CLIENT: [acme], md-environment: [dev, stage] }

  - effect: allow
    action: resource:view
    conditions: { CLIENT: [acme] }

  - effect: allow
    action: [repo:view, repo:pull]
    conditions: { PUBLISHER: [halyard, acme] }
```

```yaml
group: client-bluefin-engineers                # the client's own staff, co-managed contract
policies:
  - effect: allow
    action: [project:view, resource:view]
    conditions: { CLIENT: [bluefin] }

  - effect: allow
    action: [instance:configure, instance:plan, instance:deploy]
    conditions:
      CLIENT: [bluefin]
      ENGAGEMENT: [comanaged]                  # the contract term is a condition
      md-environment: [dev, stage]

  - effect: allow
    action: instance:propose
    conditions: { CLIENT: [bluefin], ENGAGEMENT: [comanaged], md-environment: [prod] }

  - effect: allow
    action: [repo:view, repo:pull]
    conditions: { PUBLISHER: [halyard, bluefin] }
```

The `ENGAGEMENT` condition is the whole trick. Bluefin's engineers hold deploy rights only while the project says `comanaged`. If the contract changes, Halyard edits the project, not the group.

```yaml
group: client-acme-viewers                     # a managed client watching their own estate
policies:
  - effect: allow
    action: [project:view, resource:view]
    conditions: { CLIENT: [acme] }
```

```yaml
group: account-managers                        # delegated group administration, no umbrella
policies:
  - effect: allow
    action: organization:manageGroups
    conditions: "*"

  - effect: allow
    action: project:view
    conditions: "*"
```

`organization:manageGroups` is one of eight sub-actions under the `organization:manage` umbrella. Holding it does not imply the umbrella, so account managers cannot touch billing, integrations, or the attribute schema. They can create `contractor-cobalt`, invite a person, and remove them in six weeks. This is a real trust boundary: whoever can author group policies can author a broad one, so Halyard keeps this group to four people.

```yaml
group: halyard-platform
policies:
  - effect: allow
    action: project:view
    conditions: "*"

  - effect: allow
    action: [repo:view, repo:pull, repo:create, repo:update, repo:grant]
    conditions: "*"

  - effect: allow
    action: repo:push
    conditions: { PUBLISHER: [halyard] }

  - effect: allow
    action: resource:grant
    conditions: "*"
```

```yaml
group: bluefin-publisher                       # the client's CI service account
policies:
  - effect: allow
    action: [repo:view, repo:push]
    conditions: { PUBLISHER: [bluefin] }       # Halyard creates the repo and sets PUBLISHER; the client fills it
```

### Grants

```yaml
# every house bundle: usable by all 120 projects
- source: { repo: halyard-aks-baseline }
  action: repo:pull
  recipient_conditions: "*"

# Bluefin's proprietary edge router: usable by Bluefin projects only
- source: { repo: bluefin-edge-router }
  action: repo:pull
  recipient_conditions: { CLIENT: [bluefin] }

# Acme's hub VPC, imported from their account. No parent project, so it is an org-level resource.
- source: { resource: <acme-hub-vpc uuid> }
  action: resource:export
  recipient_conditions: { CLIENT: [acme] }

# Halyard's shared monitoring workspace, published from project "halyardops"
- source: { resource: halyardops-prod-monitor.workspace }
  action: resource:export
  recipient_conditions: { ENGAGEMENT: [managed, comanaged] }   # advisory clients do not get it
```

Resource grants match the recipient *environment's* effective attributes, which include everything cascaded from its project. A grant written against `CLIENT` or `ENGAGEMENT` lands on every environment in every matching project, including ones created next year.

### A week at Halyard

#### Monday: a contractor's first login

Jae (`contractor-acme`) opens the project list. The org has 120 projects.

| Projects | `project:view` | Why |
|---|---|---|
| `acmeweb`, `acmedata`, `acmeedge` | **match** | `CLIENT = acme` |
| the other 117 | miss | Not hidden by a UI flag. The query never returns them. |

**Three of 120.** Guessing a URL for a Bluefin project returns not found. Jae does not know how many clients Halyard has.

#### Tuesday: a staff engineer crosses tenants by accident

Sam (`pod2-engineers`) is building Cobalt's new edge project and tries to attach `bluefin-edge-router`, which Sam can see in the catalog.

```
# recipient project           # repo
CLIENT:      cobalt            PUBLISHER:  bluefin
POD:         pod2              md-repo:    bluefin-edge-router
ENGAGEMENT:  managed
```

| Gate | Result | Why |
|---|---|---|
| `repo:view` | **match** | `pod2-engineers` hold the wildcard. |
| grant | miss | The only grant requires `CLIENT = bluefin`. This project is `cobalt`. |

**Forbidden.** Staff can see across tenants. Bundles cannot cross them. Sam uses the house `halyard-edge-baseline` instead.

#### Wednesday: a contract downgrade

Bluefin downgrades from co-managed to managed. Halyard sets `ENGAGEMENT = managed` on Bluefin's four projects. An hour later Tomas, a Bluefin engineer, tries to deploy `bluefinapi-dev-api`.

| Action | Policy | Result | Why |
|---|---|---|---|
| `instance:deploy` | `client-bluefin-engineers` | miss | `CLIENT` and `md-environment` match, but `ENGAGEMENT` in `[comanaged]` fails. AND inside a policy. |
| `project:view` | `client-bluefin-engineers` | **match** | View is keyed on `CLIENT` alone. |

**Deploy denied, view allowed.** Four project edits implemented a contract change. The group, its members, and its policies are untouched, so re-upgrading next year is four edits back.

#### Thursday: onboarding a contractor without an admin

Rosa (`account-managers`) creates group `contractor-cobalt`, copies the acme policies with `CLIENT: [cobalt]`, and invites the contractor.

| Mutation | Result | Why |
|---|---|---|
| `createGroup` | **match** | `organization:manageGroups` |
| `createGroupPolicy` | **match** | `organization:manageGroups` |
| `createCustomAttribute` | miss | She cannot add a new `CLIENT` value herself. Platform does that at client onboarding. |

Account management runs day to day without anyone in the built-in admin group.

#### Friday: a pod rebalance

Acme moves from pod1 to pod3. Three project updates set `POD = pod3`.

| Group | Effect |
|---|---|
| `pod3-engineers` | Gain full lifecycle on three projects. |
| `pod1-engineers` | Lose them. |
| `contractor-acme`, `client-acme-viewers` | Unaffected. They key on `CLIENT`, which did not move. |

Internal reorganizations and client relationships are independent attributes, so one changes without disturbing the other.

:::warning Per-key wildcard is not whole-policy wildcard
Halyard's first draft of the pod policy used `conditions: { CLIENT: "*" }` for `project:view`, meaning "any client." It works for tenant projects, but it requires the key to be present, so `halyardops` and other internal projects that had `CLIENT` unset were invisible to staff. They made `CLIENT` required and added a `halyard` value for internal projects. Use the whole-field `"*"` when you mean "everything"; use `{ key: "*" }` only when "has this key at all" is the actual rule.
:::

---

## Persona 3: Tessellate, an AI research and inference company

Ninety people training vision and language models and serving them to enterprise customers, some of whom are in the EU. Research is fast and messy by design. GPU spend is the biggest line on the P&L. One bad bundle release once deleted a checkpoint bucket.

| | |
|---|---|
| People | 90, half research |
| Cloud | GCP for training, AWS for serving |
| Spend | GPU is 60% of infrastructure cost |
| Compliance | EU data residency for 6 customers |

**The business rule they must be able to prove:** nobody gets H100s without finance signing off, EU customer data is only ever referenced from EU environments, research can never touch production serving, and the release that ate the bucket can never be deployed again.

Note what ABAC does and does not do for the GPU rule. Attributes cannot count anything: there is no quota, spend ceiling, or node limit in the engine. What `GPU_TIER` encodes is an approval, "finance has signed off on this hardware class," and grants read that approval. Controlling who may *assert* the approval is the permissions problem. Controlling how many nodes are provisioned once approved is not something ABAC addresses.

### Vocabulary

| Key | Scope | Required | Values | What it encodes |
|---|---|---|---|---|
| `PROJECT_KIND` | project | yes | `research`, `product`, `template` | Which lifecycle the project gets. Research projects have scratch environments; product projects have dev, staging, prod; templates have one environment named `template`. |
| `TEAM` | project | yes | `vision`, `language`, `inference`, `platform`, `apps` | Ownership. |
| `GPU_TIER` | project | yes | `none`, `l4`, `h100` | The hardware class finance has approved for this project. Defaults to `none`, raised by finance. |
| `RESIDENCY` | environment | yes | `us`, `eu` | Where this environment's data lives. Gates which shared resources it may reference. |
| `PURPOSE` | component | yes | `training`, `serving`, `data`, `api`, `web`, `worker`, `storage` | Specialist routing. ML platform owns training and serving; inference SRE owns serving in prod. |
| `HARDWARE` | repo | yes | `cpu`, `gpu-l4`, `gpu-h100` | What a bundle provisions. Attribute values are free text, so hyphens are fine here; only entity slugs are restricted. |

### Groups and policies

| Group | Who |
|---|---|
| `engineering` | Everyone technical. Base surface plus the org-wide denies. |
| `vision-research`, `language-research` | Own their research projects end to end. |
| `apps-eng` | Product team pattern: non-prod deploy, prod propose. |
| `ml-platform` | Training and serving components everywhere; publish bundles. |
| `inference-sre` | Production serving, and only that. |
| `eu-ops` | The only people who can create or configure EU environments. |
| `finance-ops` | Raise and lower `GPU_TIER`. |
| `training-scheduler` | A service account. Deploys training jobs in experiment environments overnight. |

```yaml
group: engineering                             # base group, and where the denies live
policies:
  - effect: allow
    action: repo:view
    conditions: "*"

  - effect: allow
    action: repo:pull
    conditions: { HARDWARE: [cpu] }            # CPU bundles are free for all

  - effect: allow
    action: environment:create
    conditions:
      PROJECT_KIND: [product]
      md-environment: [dev, staging, prod]
      RESIDENCY: [us]                          # the RESIDENCY dropdown shows only "us" to this group

  - effect: deny
    action: instance:deploy
    conditions: { md-bundle: [gcp-gke-gpu-pool@2.3.0] }   # the release that deleted the bucket. Pinned by @version.

  - effect: deny
    action: [instance:decommission, environment:decommission]
    conditions:
      PURPOSE: [storage]
      md-environment: [prod]                   # PURPOSE drops for environment:*; that half denies ALL prod env decommissions. See below.

  - effect: deny
    action: [instance:configure, instance:deploy, instance:decommission]
    conditions: { PROJECT_KIND: [research], PURPOSE: [serving] }   # research projects cannot run serving components
```

```yaml
group: vision-research                         # stacked on top of engineering
policies:
  - effect: allow
    action: project:create
    conditions:
      PROJECT_KIND: [research]
      TEAM: [vision]
      GPU_TIER: [none]                         # without this line, researchers could self-approve H100s

  - effect: allow
    action: [project:view, project:design]
    conditions: { PROJECT_KIND: [research], TEAM: [vision] }

  - effect: allow
    action: project:update
    conditions:
      PROJECT_KIND: [research]
      TEAM: [vision]
      GPU_TIER: [none]                         # on update too, or the tier dropdown is wide open

  - effect: allow
    action: environment:create
    conditions:
      PROJECT_KIND: [research]
      TEAM: [vision]
      md-environment: [scratch, exp]           # research gets a different lifecycle than product
      RESIDENCY: [us]

  - effect: allow
    action: [environment:update, environment:configure, environment:deploy, environment:decommission]
    conditions: { PROJECT_KIND: [research], TEAM: [vision] }

  - effect: allow
    action: [instance:configure, instance:plan, instance:deploy, instance:decommission]
    conditions: { PROJECT_KIND: [research], TEAM: [vision] }

  - effect: allow
    action: [resource:view, resource:export]
    conditions: { PROJECT_KIND: [research], TEAM: [vision] }

  - effect: allow
    action: repo:pull
    conditions: { HARDWARE: [gpu-l4, gpu-h100] }   # may pull GPU bundles; whether a PROJECT may use one is a grant
```

Rule 6 bites twice here. Constraining `GPU_TIER` on `project:create` is not enough: an unconstrained `project:update` would let a researcher raise their own tier after the fact. So the update allow constrains it to `none` as well. The consequence is that a project finance has approved no longer matches the researcher's update policy, and metadata edits on approved projects go through `finance-ops` or platform. Tessellate took that trade knowingly.

```yaml
group: ml-platform                             # the kind of thing, not the place
policies:
  - effect: allow
    action: project:view
    conditions: "*"

  - effect: allow
    action: [instance:configure, instance:plan, instance:deploy, instance:propose, instance:decommission]
    conditions: { PURPOSE: [training, serving] }

  - effect: allow
    action: [repo:view, repo:pull, repo:create, repo:push, repo:update, repo:grant]
    conditions: "*"
```

```yaml
group: inference-sre                           # production serving only
policies:
  - effect: allow
    action: project:view
    conditions: "*"

  - effect: allow
    action: [instance:deploy, instance:decommission, instance:propose, instance:plan]
    conditions: { PURPOSE: [serving], md-environment: [prod] }

  - effect: allow
    action: environment:deploy
    conditions: { PROJECT_KIND: [product], md-environment: [prod] }
```

```yaml
group: eu-ops                                  # six people with a data processing agreement on file
policies:
  - effect: allow
    action: project:view
    conditions: "*"

  - effect: allow
    action: [environment:create, environment:update, environment:configure]
    conditions:
      PROJECT_KIND: [product]
      RESIDENCY: [eu]
      md-environment: [euprod, eustaging]

  - effect: allow
    action: [instance:configure, instance:plan, instance:deploy, instance:propose]
    conditions: { RESIDENCY: [eu] }

  - effect: allow
    action: resource:grant
    conditions: "*"                            # they author the residency grants below
```

```yaml
group: finance-ops                             # the approval lever
policies:
  - effect: allow
    action: project:view
    conditions: "*"

  - effect: allow
    action: project:update
    conditions: { GPU_TIER: [none, l4, h100] } # they can set any tier; other keys stay wildcard for them
```

```yaml
group: training-scheduler                      # one service account
policies:
  - effect: allow
    action: project:view
    conditions: { PROJECT_KIND: [research] }

  - effect: allow
    action: [instance:configure, instance:plan, instance:deploy]
    conditions:
      PROJECT_KIND: [research]
      PURPOSE: [training]
      md-environment: [exp]
```

### Grants

GPU grants are authored by `ml-platform`; residency grants by `eu-ops`.

```yaml
# every HARDWARE: cpu bundle
- source: { repo: gcp-gke-cpu-pool }
  action: repo:pull
  recipient_conditions: "*"

# L4 pool: projects approved for l4 or better
- source: { repo: gcp-gke-l4-pool }
  action: repo:pull
  recipient_conditions: { GPU_TIER: [l4, h100] }

# H100 pool: only projects finance has approved for h100
- source: { repo: gcp-gke-gpu-pool }
  action: repo:pull
  recipient_conditions: { GPU_TIER: [h100] }

# the EU customer data lake, published from project "eudata", environment "euprod"
- source: { resource: eudata-euprod-lake.bucket }
  action: resource:export
  recipient_conditions: { RESIDENCY: [eu] }

# the US lake
- source: { resource: usdata-prod-lake.bucket }
  action: resource:export
  recipient_conditions: { RESIDENCY: [us] }
```

### A week at Tessellate

#### Monday: a researcher creates a project

Wen (`vision-research`) creates a project called `saliency`. The form, narrowed by Wen's `project:create` policy:

| Field | Options offered |
|---|---|
| `PROJECT_KIND` | `research` |
| `TEAM` | `vision` |
| `GPU_TIER` | `none` |

Every dropdown had one option. Wen never saw a value they were not allowed to pick. From here, Wen can create environments named `scratch` or `exp` with `RESIDENCY = us`, the training scheduler will pick up any `PURPOSE = training` instance in `exp`, and `ml-platform` already has authority over every training component Wen adds.

#### Tuesday: the H100 bundle

Wen drags `gcp-gke-gpu-pool` (the H100 bundle) onto the `saliency` canvas.

```
# recipient project           # repo
GPU_TIER:      none            HARDWARE:  gpu-h100
PROJECT_KIND:  research        md-repo:   gcp-gke-gpu-pool
```

| Gate | Result | Why |
|---|---|---|
| `repo:view` | **match** | `engineering` wildcard. |
| `repo:pull` | **match** | `vision-research` may pull `HARDWARE` in `[gpu-l4, gpu-h100]`. |
| grant | miss | Requires `GPU_TIER = h100`. Project says `none`. |

**Forbidden.** Wen asks finance. Finance sets `GPU_TIER = h100` on `saliency`. Wen retries the exact same drag and it succeeds. No policy, group, or grant changed.

#### Wednesday: the banned release

Ade (`ml-platform`) tries to redeploy `saliency-exp-trainer`, which is still pinned to the bad release.

```
PURPOSE:         training
md-repo:         gcp-gke-gpu-pool
md-bundle:       gcp-gke-gpu-pool@2.3.0
md-environment:  exp
```

| Action | Policy | Result | Why |
|---|---|---|---|
| `instance:deploy` | `ml-platform` | **match** | `PURPOSE = training`. |
| `instance:deploy` | `engineering` deny | **deny** | `md-bundle` equals the pinned `@2.3.0`. |

**Denied.** Ade bumps the instance to 2.3.1 with `instance:configure`. The bundle attribute becomes `gcp-gke-gpu-pool@2.3.1` and the same deploy is allowed. Had the deny said the bare name `gcp-gke-gpu-pool`, every version would be blocked.

#### Thursday, 03:00: the scheduler

The `training-scheduler` service account fires two deploys in `saliency-exp`.

| Instance | `PURPOSE` | Result | Why |
|---|---|---|---|
| `saliency-exp-trainer` | `training` | **match** | research, training, exp. All three conditions hold. |
| `saliency-exp-checkpoints` | `storage` | miss | The scheduler cannot touch the bucket, by design. |

A service account's blast radius is a component classification, not a list of instance IDs someone has to maintain.

#### Friday: data residency

Kai (`inference-sre`) sets a remote reference from `chat-prod-api` to the EU data lake, then tries again from `chat-euprod-api`.

| Step | Result | Why |
|---|---|---|
| `resource:view` on the lake | **match** | Kai has `project:view` on `eudata`, so the resource is visible. |
| grant, recipient `chat-prod` (`RESIDENCY = us`) | miss | Recipient needs `RESIDENCY = eu`. Forbidden. |
| grant, recipient `chat-euprod` (`RESIDENCY = eu`) | **match** | Allowed. |

The same person, the same resource, two environments. Data residency is a property of where the reference lands, and the grant reads it.

:::warning The deny that did the wrong thing
Tessellate's first attempt to keep GPUs out of scratch environments was `deny instance:deploy where HARDWARE: [gpu-h100], md-environment: [scratch]`. `HARDWARE` is repo-scoped; repo attributes never cascade to instances. That condition dropped, `md-environment: [scratch]` remained, and the deny fired on every deploy in every scratch environment, GPU or not. Research ground to a halt for an afternoon.

The working version keys on the system attribute that does reach instances: `deny instance:deploy where md-repo: [gcp-gke-gpu-pool, gcp-gke-l4-pool], md-environment: [scratch]`.

The storage deny in the `engineering` group has the same shape. On `environment:decommission`, `PURPOSE` drops and the deny blocks decommissioning any production environment. Tessellate decided that is what they wanted, but they decided it after reading the reach table, not before.
:::

---

## Side by side

Each organization leaned on different corners of the same six rules. The attribute count barely matters; what differs is which axis of the business each attribute names.

| Question | Ledgerline | Halyard | Tessellate |
|---|---|---|---|
| Primary boundary | Domain team and PCI scope | Client (tenant) | Project kind and team |
| Cross-cutting authority | DBA guild via `PURPOSE`; SRE pods via `SRE_POD` | Delivery pods via `POD` | ML platform and inference SRE via `PURPOSE` |
| What a deny protects | Cardholder credentials, prod teardown | Nothing yet; isolation is allow-shaped | A specific bad release, prod storage, research touching serving |
| What repo grants enforce | Hardened bundles only in PCI projects | Client bundles stay with the client | GPU class matches approved tier |
| What resource grants enforce | Prod VPC to prod envs; KMS to PCI prod | Client VPC to client envs; monitoring by contract tier | Data lake by residency |
| The one-attribute business change | On-call rotation (`SRE_POD`) | Contract downgrade (`ENGAGEMENT`), pod rebalance (`POD`) | Hardware approval (`GPU_TIER`) |
| Identifiers as policy | `md-environment` locks names to dev/staging/prod | Same, dev/stage/prod for 40 clients | Different lifecycles per `PROJECT_KIND`; `md-bundle` pins the banned version |
| Admin delegation | Not delegated; small admin group | `organization:manageGroups` to account managers | `project:update` on tier to finance |

## Translate your own organization

Work through these in order. Each question maps to a scope, and the scope decides what the attribute can gate.

1. **Who owns it architecturally?** Usually one project-scoped key: `TEAM`, `DOMAIN`, `CLIENT`. This is what your everyday team policies key on.
2. **What contract, tier, or regulatory regime is the project under?** Project scope again: `PCI`, `ENGAGEMENT`, `SLA_TIER`, `GPU_TIER`. These are your capability gates and your grant recipients. Make them required, default them conservative, and decide who holds the `project:update` that changes them.
3. **What is true of a place but not the whole project?** Environment scope: `RESIDENCY`, `SRE_POD`, anything that rotates or differs between prod and staging.
4. **What kind of thing is it, and what data does it touch?** Component scope: `PURPOSE`, `DATA_CLASS`. These power specialist teams and the denies that must follow a component into every environment.
5. **Who published this bundle and what did it pass?** Repo scope: `PUBLISHER`, `CERTIFIED`, `HARDWARE`. These reach only repo actions. To reason about a bundle from an instance, use `md-repo` or `md-bundle`.
6. **What must never happen, regardless of who asks?** Write it as a deny on the broadest group it should bind, and keep the exempt people out of that group. Check that every condition is reachable for every action listed, or the deny may vanish or widen.
7. **What is shared, and with whom?** Those are grants. Write recipient conditions against the attributes from steps 2 and 3, and new projects will pick them up on creation.
8. **What must the names be?** Put the allowed set on `md-environment`, `md-project`, or `md-component` in every create policy. Slugs are lowercase alphanumerics, twenty characters or fewer.

:::tip Two habits that prevent most incidents
Before saving a multi-action policy, read the reach table for each action. Before saving a create or update policy, list the required attributes at that scope and confirm each one is either constrained in the policy or safe to leave wide open for that group.
:::

## Related

- [Access Control](/platform-operations/security/access-control) — the reference for custom attributes, policies, grants, and evaluation rules
- [GraphQL permissions reference](/platform-operations/security/graphql-permissions) — the permission required by every GraphQL operation
- [Service Accounts](/platform-operations/security/service-accounts) — non-human principals like `ci-deployer` and `training-scheduler`
