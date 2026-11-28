---
id: onboarding-brownfield-kubernetes
slug: /onboarding/brownfield-kubernetes
title: "Brownfield Kubernetes: Deploy into a Namespace"
sidebar_label: Brownfield Kubernetes
description: Import one namespace of a cluster that another team runs as a massdriver-kubernetes-cluster resource, and deploy pr-sync into it.
---

Another team runs the cluster: EKS, GKE, AKS, OpenShift or kubeadm. You get a namespace. Massdriver needs nothing more than that: a token that is an admin of the namespace and nothing outside it. The cluster, its node pools, its ingress controller and its cert-manager stay with the team that runs them.

This works with any catalog, including the pets catalog, because the cluster is imported, not deployed. When the Terraform that runs the cluster can create the namespace and import it, use [the Terraform import](./05-brownfield.md#kubernetes) and skip to [Deploy pr-sync into the namespace](#deploy-pr-sync-into-the-namespace). The steps below are for when you can only ask the cluster's owners.

## Ask for

| What | Why | Example |
|---|---|---|
| A namespace | Every resource the bundles create goes in it. The bundles do not create it. | `team-platform` |
| `admin` in that namespace for a ServiceAccount | Deployments, Services, Ingresses, Secrets, ConfigMaps, PVCs | A RoleBinding to the `admin` ClusterRole |
| The ingress class | The automation's Ingress uses it | `nginx`, `alb` |
| A cert-manager ClusterIssuer, or a TLS secret in the namespace | Massdriver sends events to `https://` URLs only | `letsencrypt-prod` |
| A DNS name that points at the ingress controller | The automation's host | `pr-sync.platform.acme.com`, or a wildcard `*.platform.acme.com` |

## Import the namespace

Run these with a kubeconfig that can create a ServiceAccount and a RoleBinding in the namespace, or hand them to the cluster's owners:

```bash
NS=team-platform

kubectl -n "$NS" create serviceaccount massdriver
kubectl -n "$NS" create rolebinding massdriver-admin \
  --clusterrole admin \
  --serviceaccount "$NS:massdriver"

kubectl -n "$NS" apply -f - <<'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: massdriver-token
  annotations:
    kubernetes.io/service-account.name: massdriver
type: kubernetes.io/service-account-token
EOF
```

Kubernetes 1.24 and later do not create a token Secret for a ServiceAccount, so the Secret above makes one. It stays valid until the Secret is deleted.

Build the payload and import it:

```bash
cat > cluster.json <<EOF
{
  "cluster": {
    "server": "$(kubectl config view --minify --raw -o jsonpath='{.clusters[0].cluster.server}')",
    "certificate-authority-data": "$(kubectl -n "$NS" get secret massdriver-token -o jsonpath='{.data.ca\.crt}')"
  },
  "user": {
    "token": "$(kubectl -n "$NS" get secret massdriver-token -o jsonpath='{.data.token}' | base64 --decode)"
  },
  "namespace": "$NS"
}
EOF

mass resource create -n "platform.acme.com / $NS" -t massdriver-kubernetes-cluster -f cluster.json
mass resource grant create <cluster-resource-id> --condition md-project=automations
rm cluster.json
```

`user.token` is sensitive. Massdriver masks it in the UI and API, and downloading the resource's kubeconfig needs `resource:export`. Check what the token can do with that kubeconfig:

```bash
kubectl --kubeconfig ./kubeconfig.yaml auth can-i --list
kubectl --kubeconfig ./kubeconfig.yaml auth can-i create deployments   # yes
kubectl --kubeconfig ./kubeconfig.yaml auth can-i create namespaces    # no
```

The resource type's import instructions in the UI also cover EKS, GKE and AKS.

In Claude Code or opencode with the [Massdriver plugin](./05-brownfield.md#claude-code-and-opencode), `/massdriver:import` with **Register resource only** builds the same payload from your current kubeconfig context and creates the resource. It does not create the ServiceAccount or the RoleBinding: those need the cluster owners' access.

## Deploy pr-sync into the namespace

Publish `massdriver-pr-sync` (not `-ecs`) as in [Publish the bundle](./04-automations.md#publish-the-bundle), and [import a service account](./02-resource-types.md#import-a-service-account). Then:

```bash
mass project create automations --name "Automations"
mass environment create automations-main --name "Main"
mass component add automations massdriver-pr-sync --id prsync --name "pr-sync"

mass environment default automations-main <cluster-resource-id>
mass instance remote-reference set automations-main-prsync service_account <service-account-resource-id>
```

As the environment default, the namespace is where every Kubernetes automation in `automations-main` deploys. Set it as a remote reference instead to give one instance a different namespace.

Set the `GITHUB_TOKEN` secret on the instance in the UI, then deploy:

```yaml title="pr-sync.yaml"
image:
  repository: ghcr.io/massdriver-cloud/massdriver-automations
  tag: latest
ingress:
  host: pr-sync.platform.acme.com
  class_name: nginx
  cluster_issuer: letsencrypt-prod
config:
  interval: 2m
  projects:
    - project: billing
      repos: [acme/billing, acme/billing-infra]
```

```bash
mass instance deploy automations-main-prsync --params=pr-sync.yaml
```

Leave `class_name` empty for the cluster's default class. Set `tls_secret_name` in place of `cluster_issuer` when the owners hand you a certificate, or leave both empty when TLS ends in front of the ingress controller.

In the namespace, the bundle creates:

| Object | |
|---|---|
| Deployment | One replica of `massdriver-automations run pr-sync`, 25m CPU and 64Mi memory, up to 500m and 256Mi |
| Secret | The environment variables: the service account, `GITHUB_TOKEN`, the event destination's signing secret |
| ConfigMap | The settings, as the automation's config file |
| Service and Ingress | The host, every path to the automation, and the certificate annotation |

Nothing is created outside the namespace. A resource with no `namespace` deploys into `default`. In Massdriver, it creates the event destination.

```bash
kubectl -n team-platform get deploy,ingress -l app.kubernetes.io/name=pr-sync
kubectl -n team-platform logs -l app.kubernetes.io/name=pr-sync --since 10m
```

`pr sync started` with the interval means the settings loaded. `github query failed` names a repository the token cannot read; `stash entry write failed` carries the API error, most often a missing `stash:write` on that project. Then [pin the note](./04-automations.md#pin-the-note) on each project in its settings.

## Build more on the namespace

Any bundle with a `massdriver-kubernetes-cluster` dependency deploys into the same namespace: the other automations as `massdriver-<automation>`, and Helm bundles of your own. Refer to the [Helm provisioner](/bundle-development/provisioners/helm). The cluster stays someone else's; what runs in your namespace is versioned, configured and deployed through Massdriver.
