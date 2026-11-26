---
id: automations-deploy
slug: /continuous-delivery/automations/deploy
title: Deploy the Automations
sidebar_label: Deploy
description: Run any set of the automations on Kubernetes or Amazon ECS with a Massdriver bundle.
---

Two bundles in [massdriver-automations](https://github.com/massdriver-cloud/massdriver-automations) run any set of the automations. Turn on the automations you want in the instance's params. For each one, the bundle runs one container and creates a Massdriver event destination that sends the container only the events it uses.

| Bundle | Source | Runs on |
|---|---|---|
| `massdriver-automations` | [`bundle/`](https://github.com/massdriver-cloud/massdriver-automations/tree/main/bundle) | A Kubernetes cluster, with an ingress controller |
| `massdriver-automations-ecs` | [`bundle-ecs/`](https://github.com/massdriver-cloud/massdriver-automations/tree/main/bundle-ecs) | Amazon ECS with Fargate, behind an Application Load Balancer |

Both bundles have the same automation settings, secrets, and event destinations. Publish the one you use to your organization:

```bash
git clone https://github.com/massdriver-cloud/massdriver-automations.git
cd massdriver-automations/bundle
mass bundle publish
```

## Requirements

Both bundles need:

- The [`massdriver-service-account`](/bundle-development/dependencies-resources/massdriver-resource-types#massdriver-service-account) resource type installed in your organization, and a resource of that type. The bundle creates the event destinations with it, and gives its credentials to the automations that call the API.
- The `massdriver-cloud/massdriver` Terraform provider 2.7.0 or later, which returns the `signing_secret` of `massdriver_event_destination`.
- TLS on every host. Massdriver and Slack send requests to `https://` URLs only.

### Kubernetes

- A [`massdriver-kubernetes-cluster`](/bundle-development/dependencies-resources/massdriver-resource-types#massdriver-kubernetes-cluster) resource. The bundle deploys into the namespace of that resource, or `default` when it has none. It does not create the namespace.
- An ingress controller, and a wildcard DNS record for `*.<domain>` that points at it.
- A cert-manager ClusterIssuer, a TLS secret that holds a certificate for `*.<domain>`, or TLS that ends in front of the ingress controller.

### Amazon ECS

- An `aws-iam-role` resource, the AWS credential type of the [Massdriver catalog](https://github.com/massdriver-cloud/massdriver-catalog/tree/main/platforms/aws).
- An `aws-ecs-cluster` resource. The type is an example in [`examples/resource-types/aws-ecs-cluster`](https://github.com/massdriver-cloud/massdriver-automations/tree/main/examples/resource-types/aws-ecs-cluster). Publish it, or a copy that you change, to your organization.
- An internet-facing Application Load Balancer with an HTTPS listener. The listener needs a certificate for `*.<domain>`, and for the statuspage host when it is outside `<domain>`.
- A load balancer security group that allows outbound traffic to the tasks on port 8080.
- Private subnets with a route through a NAT gateway, so tasks can pull images and call the Massdriver API, Slack, GitHub, and the other services in their settings.

## What the bundle creates

For each automation that you turn on:

| | Kubernetes | Amazon ECS |
|---|---|---|
| Workload | A Deployment with one replica | An ECS service with one Fargate task (ARM64) |
| Settings | A Secret with its environment variables, and a ConfigMap with its YAML configuration | Environment variables in the task definition, and a Secrets Manager secret for the secret ones. A `files` container writes the YAML configuration and router **Scripts** to a task volume. |
| Routing | A Service and an Ingress for the host `<name>.<domain>` | A target group with a health check on `/healthz`, and a rule on the HTTPS listener for the host `<name>.<domain>`. With **Ingress > Create DNS records**, a CNAME record in the cluster's hosted zone. |
| State, for drift, freeze-guard, and statuspage | A PersistentVolumeClaim for `STATE_DIR` | An EFS access point mounted at `STATE_DIR` |
| Logs | Container logs | A CloudWatch log group |
| Event destination | `<instance>-<automation>`, which sends events to `https://<name>.<domain>/hooks/massdriver` | The same |

The signing secret of each event destination goes to the automation as `MASSDRIVER_SIGNING_SECRET`. The bundles produce no resources for other bundles.

On ECS, the instance also gets one KMS key for the secrets, the logs, and the state, and one security group for the tasks. Each task execution role can read only its automation's secret and write only to its log group. Decommissioning the instance deletes the EFS file system and the state.

## Hosts

Set **Ingress > Domain**, such as `automations.acme.com`. On ECS, leave it empty to use the base domain of the cluster's hosted zone. Each automation is served at `<name>.<domain>`:

| Automation | Host | Paths that must be public |
|---|---|---|
| audit-archiver | `audit-archiver.<domain>` | `/hooks/massdriver` |
| autodeploy-downstream | `autodeploy-downstream.<domain>` | `/hooks/massdriver` |
| bundle-scanner | `bundle-scanner.<domain>` | `/hooks/massdriver` |
| drift | `drift.<domain>` | `/hooks/massdriver`, and `/drift/run` to start checks from outside the cluster |
| freeze-guard | `freeze-guard.<domain>` | `/hooks/massdriver`, and `/freeze/lift` to lift a freeze from outside the cluster |
| github-deployments | `github-deployments.<domain>` | `/hooks/massdriver` |
| proposal-chatops | `proposal-chatops.<domain>` | `/hooks/massdriver`, `/slack/interactions` |
| release-notes | `release-notes.<domain>` | `/hooks/massdriver` |
| rollback-on-failure | `rollback-on-failure.<domain>` | `/hooks/massdriver` |
| router | `router.<domain>` | `/hooks/massdriver` |
| sandbox-on-join | `sandbox-on-join.<domain>` | `/hooks/massdriver` |
| statuspage | **statuspage > Host**, or `statuspage.<domain>` | every path |

Each host serves one automation, so two instances of a bundle need different domains.

For proposal-chatops, set the Slack app's interactivity request URL to `https://proposal-chatops.<domain>/slack/interactions`.

## Service account

A deployment cannot create event destinations, so the bundle creates them with the `massdriver-service-account` resource. The automations that call the Massdriver API get its URL, organization, and token as `MASSDRIVER_URL`, `MASSDRIVER_ORGANIZATION_ID`, and `MASSDRIVER_API_KEY`.

The service account needs `organization:manageEventDestinations`, plus the permissions of each automation that you turn on:

| Automation | Permissions |
|---|---|
| audit-archiver | None. |
| autodeploy-downstream | `instance:deploy` on the downstream instances, and `project:view` on their projects. |
| bundle-scanner | `repo:view` and `repo:pull` on the bundle repos. With a result attribute key, also `repo:update`. |
| drift | `project:view` and `instance:plan` on the matched instances. Mode `resolve` also needs `instance:deploy`, and `instance:propose` with `resolve_with: deployed`. Mode `propose` needs `instance:propose`. |
| freeze-guard | `organization:manageGroups`, to create and delete group policies. |
| github-deployments | None. |
| proposal-chatops | `instance:deploy` on the instances. |
| release-notes | `repo:view` on the bundle repos, and `project:view` on the projects whose instances are listed. |
| rollback-on-failure | `instance:propose` and `instance:deploy` on the opted-in instances, and `project:view` on their projects. |
| router | The permissions of the operations in its `massdriver` steps. None without them. |
| sandbox-on-join | `project:view` on the template's project, `environment:create` for environments with the attributes `owner` and `sandbox`, and `environment:deploy`, `environment:decommission`, and `environment:delete` on the forks. With the `copy*` options, also `resource:view`, a resource grant for each copied environment default and remote reference, and `instance:configure` on each template instance with secrets. |
| statuspage | `project:view` on the projects of the configured environments. |

One service account with every permission is the simplest setup. To limit what each automation can do, run one instance of the bundle for each service account. Refer to [Access control](/platform-operations/security/access-control#permissions) for each action.

## Secrets

Set each secret on the instance. Set only the secrets of the automations that you turn on.

| Secret | Automation | Variable |
|---|---|---|
| `AUDIT_ARCHIVER_AWS_ACCESS_KEY_ID`, `AUDIT_ARCHIVER_AWS_SECRET_ACCESS_KEY` | audit-archiver | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| `AUDIT_ARCHIVER_SPLUNK_HEC_TOKEN` | audit-archiver | `SPLUNK_HEC_TOKEN` |
| `AUDIT_ARCHIVER_DD_API_KEY` | audit-archiver | `DD_API_KEY` |
| `BUNDLE_SCANNER_SLACK_WEBHOOK_URL` | bundle-scanner | `SLACK_WEBHOOK_URL` |
| `DRIFT_SLACK_WEBHOOK_URL`, `DRIFT_RUN_TOKEN` | drift | `SLACK_WEBHOOK_URL`, `DRIFT_RUN_TOKEN` |
| `FREEZE_GUARD_SLACK_WEBHOOK_URL`, `FREEZE_GUARD_ADMIN_TOKEN` | freeze-guard | `SLACK_WEBHOOK_URL`, `FREEZE_ADMIN_TOKEN` |
| `GITHUB_DEPLOYMENTS_TOKEN` | github-deployments | `GITHUB_TOKEN` |
| `PROPOSAL_CHATOPS_SLACK_BOT_TOKEN`, `PROPOSAL_CHATOPS_SLACK_SIGNING_SECRET` | proposal-chatops | `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET` |
| `RELEASE_NOTES_SLACK_WEBHOOK_URL`, `RELEASE_NOTES_TEAMS_WEBHOOK_URL` | release-notes | `SLACK_WEBHOOK_URL`, `TEAMS_WEBHOOK_URL` |
| `ROLLBACK_ON_FAILURE_SLACK_WEBHOOK_URL` | rollback-on-failure | `SLACK_WEBHOOK_URL` |
| `ROUTER_ENV` | router | Each key of the JSON object |

On ECS, audit-archiver uses a task role that can write to the bucket when **S3 bucket** is set, **S3 endpoint** is empty, and the `AUDIT_ARCHIVER_AWS_ACCESS_KEY_ID` secret is not set.

## Event destinations

Each destination has the event types, attributes, and condition from the automation's page. The bundle writes the condition from the configuration:

- sandbox-on-join: from the `group` of each sandbox rule.
- statuspage: from the environment `id`s of the configuration.
- github-deployments: from the repository attribute key.
- rollback-on-failure: from the opt-in attribute key and value.

The router destination sends the event types of every route in its configuration, with no attributes and no condition. Each route filters with its own `match` and `when`.

**Event attributes** on an automation adds an attribute filter to its destination, such as `md-environment` = `prod`. audit-archiver, freeze-guard, github-deployments, router, and sandbox-on-join have none, because their events can have no attributes. release-notes always filters on `md-repo-artifact-type` = `bundle`.

## Limits

- Each automation runs one replica and restarts on every change of its settings. The automations keep their queues and repeated-event ids in memory, and a restart loses them. Massdriver sends the events that fail during a restart again.
- router runs the `<tag>-scripts` image when a route has an `exec` step or **Scripts** has a file. That image has `sh`, `jq`, `curl`, and `python3`. For other tools, build an image from it, push it with the same `-scripts` tag to your own repository, and set **Image > Repository**, which every automation uses. On ECS, the image must have an ARM64 variant.
- Resource sizes are fixed. On Kubernetes: 25m CPU and 64Mi memory, up to 500m and 256Mi, and for bundle-scanner 250m and 512Mi, up to 2 CPUs and 2Gi. On ECS: 0.25 vCPU and 512 MiB, and for bundle-scanner 1 vCPU and 2 GiB.
- On ECS, a task definition holds at most 64 KiB, which includes the configuration files and the router **Scripts**.
- On Kubernetes, audit-archiver reads S3 credentials from the secrets. It does not set up IRSA or EKS Pod Identity.
