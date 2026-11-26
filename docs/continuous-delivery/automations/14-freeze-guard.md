---
id: automation-freeze-guard
slug: /continuous-delivery/automations/freeze-guard
title: freeze-guard
sidebar_label: freeze-guard
description: Block deployments during change freeze windows with deny policies.
image: /img/og/automation-freeze-guard.png
---

Blocks deployments during change freeze windows with [access policies](/platform-operations/security/access-control#policies). When a window starts, freeze-guard adds a
`DENY` policy for the deployment actions to every custom group, except the exempt groups. When the window ends, it
deletes those policies. A window is weekly, such as every weekend, or a fixed range, such as a holiday.

Massdriver checks the policies when a person or a service account starts a deployment, so a frozen group cannot
start one. freeze-guard does not stop or abort deployments.

## How it works

freeze-guard reconciles at start, every minute, and after each `group.created`, `group.updated`, and
`group.deleted` event:

- For each active window, each custom group that is not exempt has one deny policy with the window's actions and
  conditions. freeze-guard creates the missing ones. A group created during a window gets its policy on the next
  reconcile.
- freeze-guard deletes each policy that it created and that no active window needs: the window ended, the window
  was lifted, or the group became exempt.
- When a policy that freeze-guard created is deleted by someone else during the window, freeze-guard creates it
  again. To let a group deploy, add it to `exempt_groups` or lift the window.
- freeze-guard never changes or deletes a policy that it did not create.

freeze-guard records the id of each policy that it creates in `$STATE_DIR/freeze-guard.json`. When it starts with
no state file, it takes over each `DENY` policy whose actions and conditions exactly equal a window's, so a lost
state file cannot leave a freeze in place. A policy that you wrote by hand with exactly those actions and
conditions is also taken over, and deleted when no window is active.

The built-in **Administrators** group is never frozen. Massdriver does not let anyone add policies to it.

### Actions

The default actions are the ones that change infrastructure:

| Action | Blocks |
|---|---|
| `instance:deploy` | Deploying an instance, and approving or rejecting a proposed deployment. |
| `instance:decommission` | Decommissioning an instance. |
| `environment:deploy` | Deploying every instance of an environment. |
| `environment:decommission` | Decommissioning every instance of an environment. |

`instance:propose`, `instance:plan`, and `instance:configure` stay allowed. During a freeze, people can configure
instances, plan, and propose deployments. A member of a frozen group cannot approve a proposal until the window
ends.

### Conditions

A window's `match` becomes the policy's conditions. `md-environment: prod` denies the actions only on instances
and environments whose `md-environment` is `prod`. With no `match`, the policy denies the actions everywhere.

Massdriver drops a condition from a policy for each action whose entity cannot have that attribute. When every
condition drops, a deny policy does not apply to that action. Instances have the `md-environment`, `md-project`,
`md-component`, `md-instance`, `md-repo`, and `md-bundle` attributes, and custom attributes of the project,
environment, and component scopes. Environments have only `md-environment`, `md-project`, and custom attributes of
the project and environment scopes. For example, `match: {md-component: database}` blocks `instance:deploy` on
database instances, but does not block `environment:deploy`.

## Who is frozen

- **Deny wins.** A person who is in an exempt group and also in a frozen group is denied. Put the people who must
  deploy during a freeze only in exempt groups.
- **Administrators are not frozen.** Massdriver has no bypass for organization owners or admins in its access
  checks. Members of the built-in **Administrators** group get every action from that group's fixed allow
  policies, and freeze-guard cannot add a deny policy to it. The organization owner is always in that group. An
  administrator who is also in a frozen custom group is denied, because deny wins.
- **Service accounts are frozen like people.** A service account gets policies only from the groups it is in. A
  CI service account in a frozen group cannot deploy during the window. Put CI service accounts that must deploy
  during a freeze in an exempt group only.
- **The deployment itself is not frozen.** The provisioner calls Massdriver as the deployment, which Massdriver
  authorizes by tenancy, not by policies. A running deployment can still report its status and write its state.

## Deployments that already started

Massdriver checks `instance:deploy`, `instance:decommission`, `environment:deploy`, and `environment:decommission`
once, when the request arrives: `createDeployment`, `approveDeployment`, `rejectDeployment`, `deployEnvironment`,
`decommissionEnvironment`, and `orphanInstance`. It does not check again later. When a window starts:

- A running deployment runs to its end.
- A deployment that waits behind another deployment on the same instance (`PENDING`), or an approved proposal
  that waits (`APPROVED`), starts when the instance is free, without another permission check.
- An environment deployment or decommission that is in progress continues to deploy its remaining instances in
  dependency order, without another permission check.
- A proposal (`PROPOSED`) waits. A member of a frozen group cannot approve or reject it until the window ends.

To stop one of these, abort it in Massdriver.

## Windows file

YAML or JSON. `timezone` applies to every window that does not set its own. The default is `UTC`. `actions` and
`exempt_groups` at the top apply to every window. A window's `actions` replace the top-level actions. A window's
`exempt_groups` add to the top-level exempt groups.

```yaml
timezone: America/New_York
exempt_groups: [SRE]
windows:
  - name: weekend
    match:
      md-environment: prod
    exempt_groups: [Release Managers]
    weekly:
      - from: Fri 17:00
        to: Mon 08:00
  - name: thanksgiving
    match:
      md-environment: [prod, staging]
    from: 2026-11-26
    to: 2026-11-30 08:00
  - name: payments-quarter-close
    timezone: Europe/London
    actions: [instance:deploy, environment:deploy]
    match:
      md-project: payments
    from: 2026-12-31T00:00:00Z
    to: 2027-01-02T00:00:00Z
```

| Field | |
|---|---|
| `name` | Required and unique. Shown in Slack messages, and used by the lift endpoint. |
| `match` | The policy's conditions. Each key is an attribute. Each value is a string, a list of strings, or `"*"` for any value. Empty denies the actions everywhere. |
| `actions` | The actions to deny. The default is `instance:deploy`, `instance:decommission`, `environment:deploy`, and `environment:decommission`. |
| `exempt_groups` | Names of the groups that the window does not freeze. A name must equal the group's name exactly. |
| `timezone` | An IANA time zone, such as `America/New_York`. |
| `weekly` | A list of ranges, each `from` and `to` as `<day> HH:MM`. A range whose `to` is earlier in the week than its `from` continues into the next week. |
| `from`, `to` | A fixed range: `YYYY-MM-DD`, `YYYY-MM-DD HH:MM` in the window's time zone, or RFC 3339. `to` is not included. |

A window has `weekly` or `from` and `to`, not both.

## Emergency lift

When `FREEZE_ADMIN_TOKEN` is set, `POST /freeze/lift?window=<name>` lifts an active window. freeze-guard deletes
the window's policies and does not create them again until the window's next start. A fixed window stays lifted
until it ends. The lift is saved in the state file.

```bash
curl -X POST -H "Authorization: Bearer $FREEZE_ADMIN_TOKEN" \
  "https://freeze-guard.example.com/freeze/lift?window=weekend"
```

```json
{"until":"2026-12-04T22:00:00Z","window":"weekend"}
```

| Status | |
|---|---|
| `200` | Lifted. The policies are deleted. |
| `202` | Lifted, but deleting a policy failed. The reconcile retries every minute. The body has `error`. |
| `401` | Wrong token. |
| `404` | Unknown window. |
| `409` | The window is not active. |

Anyone with the token can lift a freeze. Keep it with the people who can approve an emergency change.

## Slack

When `SLACK_WEBHOOK_URL` is set, freeze-guard posts to that Slack incoming webhook when a window starts, ends, or
is lifted:

```
Freeze window "weekend" started. Denied environment:decommission, environment:deploy, instance:decommission, instance:deploy where md-environment is prod.
Frozen groups: Contractors, Developers.
Exempt groups: Release Managers, SRE.
```

```
Freeze window "weekend" ended. Removed its deny policies.
```

```
Freeze window "weekend" lifted until 2026-12-04 17:00 EST. Removed its deny policies.
```

## Configuration

| Variable | Default | |
|---|---|---|
| `MASSDRIVER_ORGANIZATION_ID` | | Required. Your organization's identifier. |
| `MASSDRIVER_API_KEY` | | Required. An `md_` access token of a service account. |
| `MASSDRIVER_SIGNING_SECRET` | | Required. The `whsec_` signing secret of the event destination. |
| `MASSDRIVER_URL` | `https://api.massdriver.cloud` | The URL of your Massdriver installation. |
| `FREEZE_WINDOWS_FILE` | | Required. The path of the windows file. |
| `STATE_DIR` | | A directory that survives restarts. Without it, freeze-guard finds its policies by exact match at each start, and a restart loses lifts. |
| `FREEZE_ADMIN_TOKEN` | | Turns on `POST /freeze/lift`. |
| `SLACK_WEBHOOK_URL` | | A Slack incoming webhook URL. |
| `PORT` | `8080` | |

### Service account

The service account needs `organization:manageGroups`, which gates `createGroupPolicy` and `deletePolicy`. Any
member of the organization can list groups and their policies. `organization:manageGroups` also lets the account
create and delete groups, change members, and write any group policy, so keep its token secret.

The deny policies do not cover `organization:manageGroups`, so freeze-guard keeps working when its service
account is in a frozen group. freeze-guard does not need the deployment actions itself.

Anyone with `organization:manageGroups` can delete a deny policy or move people into an exempt group. freeze-guard creates a deleted policy again within a minute, but does not undo
membership changes. Give `organization:manageGroups` only to the service account and to the people who may end a
freeze.

## Event destination

The destination is optional. The reconcile runs every minute without it. With it, freeze-guard freezes a new group,
and applies a renamed group's exemption, within seconds.

Requires [mass](/reference/cli/overview) 2.6.0 or later.

```bash
mass event destination create \
  --name freeze-guard \
  --url https://freeze-guard.example.com/hooks/massdriver \
  --event-type group.created \
  --event-type group.updated \
  --event-type group.deleted
```

Group events have no attributes, so the destination has no `--attribute` filter and no condition.

Copy the signing secret from the destination's **Overview** tab into `MASSDRIVER_SIGNING_SECRET`.

## Run

```bash
docker run -p 8080:8080 \
  -v "$PWD/windows.yaml:/etc/freeze-guard/windows.yaml:ro" \
  -v freeze-guard-state:/var/lib/freeze-guard \
  -e FREEZE_WINDOWS_FILE=/etc/freeze-guard/windows.yaml \
  -e STATE_DIR=/var/lib/freeze-guard \
  -e MASSDRIVER_ORGANIZATION_ID=acme \
  -e MASSDRIVER_API_KEY=md_... \
  -e MASSDRIVER_SIGNING_SECRET=whsec_... \
  -e FREEZE_ADMIN_TOKEN=... \
  -e SLACK_WEBHOOK_URL=https://hooks.slack.com/services/... \
  massdrivercloud/massdriver-automations:latest run freeze-guard
```

The windows file is read at start. Restart the service after you change it. When you remove or rename a window,
freeze-guard deletes the policies that it created for the old window.

## Limits

- A freeze blocks new requests only. See [Deployments that already started](#deployments-that-already-started).
- Policies change at most one minute after a window starts or ends, or longer while the Massdriver API is
  unavailable.
- Run one replica. Two replicas create two policies per group.
- Exemptions match group names. Renaming a group changes whether it is exempt.
