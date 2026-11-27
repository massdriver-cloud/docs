---
id: onboarding-automations
slug: /onboarding/automations
title: Run Automations
sidebar_label: Run Automations
description: Decide where the automations run, import a service account, and deploy pr-sync on ECS with a pull request note on the project.
---

An [automation](/continuous-delivery/automations) is a container that receives Massdriver events from an event destination and acts on them with a service account: deploy downstream instances, check for drift, freeze prod, approve from Slack, or list a project's pull requests. Each one ships as two bundles in [massdriver-automations](https://github.com/massdriver-cloud/massdriver-automations/tree/main/bundles): `massdriver-<automation>` for Kubernetes and `massdriver-<automation>-ecs` for Amazon ECS.

This page deploys **pr-sync**, which reads the pull requests of a project's GitHub repositories every two minutes and writes them to the project's [stash](/guides/stash). A [note](/guides/annotations/notes) on the project then lists what is in review, running checks and merging. Every other automation deploys the same way with different settings and secrets.

## Where automations run

An automation needs a container runtime, a public HTTPS host for `/hooks/massdriver`, and a TLS certificate for that host.

| You have | Run them on | Bundle | Its dependencies |
|---|---|---|---|
| The AWS catalog, greenfield or brownfield | The catalog's `ecs-cluster` | `massdriver-pr-sync-ecs` | `aws-iam-role`, `aws-ecs-cluster`, `massdriver-service-account` |
| An EKS, GKE, AKS or any other cluster, or one namespace in it | That namespace | `massdriver-pr-sync` | `massdriver-kubernetes-cluster`, `massdriver-service-account` |
| The pets catalog and nothing else | Nothing. `random_pet` has no compute. | — | — |

The AWS catalog has no EKS bundle. To run the automations on EKS, import an EKS cluster you already run as a `massdriver-kubernetes-cluster`.

With the pets catalog, either publish the AWS catalog and follow [Greenfield AWS](./03-greenfield-aws.md) to get an ECS cluster, or [import a Kubernetes namespace](./06-brownfield-kubernetes.md) from a cluster you already run. The second needs no new infrastructure.

The rest of this page is the ECS route. For Kubernetes, continue at [Brownfield Kubernetes](./06-brownfield-kubernetes.md) after [publishing the bundle](#publish-the-bundle).

## Import a service account

Follow [Import a service account](./02-resource-types.md#import-a-service-account). pr-sync's service account needs:

- `organization:manageEventDestinations`, so the bundle can create its event destination
- `project:update` on every project in its settings, so it can write their stash

## Publish the bundle

The AWS catalog ships most automations as `massdriver-<automation>-ecs`. pr-sync is published from the automations repository:

```bash
git clone https://github.com/massdriver-cloud/massdriver-automations.git
cd massdriver-automations/bundles/massdriver-pr-sync-ecs   # or massdriver-pr-sync for Kubernetes

mass repository create massdriver-pr-sync-ecs -t bundle
mass bundle publish
```

The `-ecs` bundles take the catalog's `aws-iam-role` and `aws-ecs-cluster` types. The automations repository has an [example `aws-ecs-cluster`](https://github.com/massdriver-cloud/massdriver-automations/tree/main/examples/resource-types/aws-ecs-cluster) with the same schema for organizations that do not use the catalog.

## Deploy pr-sync on ECS

<AutomationsProject />

The automations get their own project, `automations`, with one environment, `main`, on the dev platform's VPC, zone and cluster. A freeze or a failed deploy in prod then cannot take down the automations that handle it.

```bash
mass project create automations --name "Automations"
mass environment create automations-main --name "Main"
mass component add automations massdriver-pr-sync-ecs --id prsync --name "pr-sync"

for field in network.network dns.zone cluster.cluster; do
  mass resource grant create "platform-dev-$field" --condition md-project=automations
  mass environment default automations-main "platform-dev-$field"
done
mass environment default automations-main <aws-credential-id>

mass resource grant create <service-account-resource-id> --condition md-project=automations
mass instance remote-reference set automations-main-prsync service_account <service-account-resource-id>
```

A remote reference can be set only while the instance is not deployed.

Set the `GITHUB_TOKEN` secret on the instance in the UI. A fine-grained token needs read access to **Pull requests**, **Commit statuses** and **Contents** on the repositories; a classic token needs `repo` for private repositories.

Then deploy with the projects and repositories to watch:

```bash
mass instance deploy automations-main-prsync --params=- <<'EOF'
image:
  repository: ghcr.io/massdriver-cloud/massdriver-automations
  tag: latest
ingress:
  dns_records: true
logs:
  retention_days: 30
config:
  interval: 2m
  merged_window: 24h
  max_prs: 20
  projects:
    - project: billing
      repos: [acme/billing, acme/billing-infra]
EOF
```

pr-sync is in images built after `v0.2.0`. Until the next release, set **Image > Tag** to `latest`, then pin the release tag when it is out.

The bundle serves pr-sync at `pr-sync.<cluster zone>`, such as `pr-sync.dev.example.com`, creates the CNAME to the load balancer, and creates an event destination with the signing secret. pr-sync reads GitHub on its interval and acts on no event, so its destination sends nothing.

| It creates | |
|---|---|
| Compute | An ECS service with one Fargate task (ARM64, 0.25 vCPU, 512 MiB) |
| Secrets | A Secrets Manager secret for the secret environment variables, `GITHUB_TOKEN` among them, and a KMS key for it and the logs |
| Routing | A target group with a health check on `/healthz`, and a host rule on the cluster's HTTPS listener |
| Logs | A CloudWatch log group with the retention you set |

## Pin the note

pr-sync writes `github/prs` to each project's stash. Pin this note to the `billing` project:

```liquid
### Pull requests
{% for pr in project.stash["github/prs"].prs %}
- {% case pr.state %}{% when "merged" %}✅{% when "merging" %}🔄{% when "checks" %}🧪{% when "failed" %}❌{% else %}⏳{% endcase %} [{{ pr.repo }}#{{ pr.number }}]({{ pr.url }}) {{ pr.title }} · _{{ pr.author }}_ · **{{ pr.state }}**
{% endfor %}
```

The note shows next to the project name. Each entry has a TTL of three intervals, so when pr-sync stops, the list empties instead of going stale.

| `state` | When |
|---|---|
| `merged` | It merged within `merged_window` |
| `draft` | It is a draft |
| `merging` | It is in the merge queue, or auto-merge is on |
| `failed` | A reviewer requested changes, or a check failed |
| `checks` | Checks are running |
| `approved` | Approved, and its checks passed or it has none |
| `review` | It waits for a review |

The stash and notes are alpha. Their names and fields can change.

## More automations

Every automation follows the same steps: publish its bundle, connect the service account, set its secrets, deploy its settings. The AWS catalog has these as `-ecs` bundles already:

| Automation | Does |
|---|---|
| [autodeploy-downstream](/continuous-delivery/automations/autodeploy-downstream) | Deploys opted-in dependents when an instance deploys |
| [rollback-on-failure](/continuous-delivery/automations/rollback-on-failure) | Rolls an instance back to its last completed deployment when one fails |
| [drift](/continuous-delivery/automations/drift) | Plans instances on a schedule and reports or fixes drift |
| [freeze-guard](/continuous-delivery/automations/freeze-guard) | Denies deployments to groups during change freeze windows |
| [proposal-chatops](/continuous-delivery/automations/proposal-chatops) | Approve or reject proposed deployments from Slack |
| [release-notes](/continuous-delivery/automations/release-notes) | Posts new bundle versions, and the instances that can upgrade, to Slack and Teams |
| [statuspage](/continuous-delivery/automations/statuspage) | Serves a status page from alarms, instances and deployments |

The full list, with each automation's events, settings and permissions, is in the [massdriver-automations README](https://github.com/massdriver-cloud/massdriver-automations#automations).
