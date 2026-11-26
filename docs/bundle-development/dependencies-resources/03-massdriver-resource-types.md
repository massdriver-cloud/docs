---
id: massdriver-resource-types
slug: /bundle-development/dependencies-resources/massdriver-resource-types
title: Massdriver Resource Types
sidebar_label: Massdriver Resource Types
description: Official resource types for Massdriver service accounts, Kubernetes clusters, WireGuard tunnels, and event destinations.
---

[massdriver-resource-types](https://github.com/massdriver-cloud/massdriver-resource-types) holds the official resource types for Massdriver platform features. Install them in your organization, then use them as dependencies of your bundles, or import resources of these types.

| Resource type | Holds | Export |
|---|---|---|
| [`massdriver-service-account`](#massdriver-service-account) | The credentials of a Massdriver service account: `url`, `organization_id`, and `api_key`. These are the settings of the Massdriver CLI, Go SDK, and Terraform provider. | |
| [`massdriver-kubernetes-cluster`](#massdriver-kubernetes-cluster) | Access to a Kubernetes API server, in kubeconfig format: `cluster`, `user` (token, client certificate, or exec plugin), and `namespace`. | `kubeconfig.yaml` |
| [`massdriver-wireguard-tunnel`](#massdriver-wireguard-tunnel) | A WireGuard client configuration in wg-quick format, so that deployments can reach private networks of remote environments. | `wg0.conf` |
| [`massdriver-event-destination-https`](#massdriver-event-destination-https) | A Massdriver event destination that posts signed CloudEvents to an HTTPS URL, with its signing secret. | |

Each type's directory has a `massdriver.yaml` with the JSON Schema of the type, the instructions that Massdriver shows when you import a resource, and export templates.

## Install

You need the [Massdriver CLI](/reference/cli/overview), and a profile or API key with `repo:create` and `repo:push`.

```bash
git clone https://github.com/massdriver-cloud/massdriver-resource-types.git
cd massdriver-resource-types

for type in massdriver-service-account massdriver-kubernetes-cluster massdriver-wireguard-tunnel massdriver-event-destination-https; do
  mass resource-type create "$type"
  mass resource-type publish "$type"
done
```

`mass resource-type create` creates the type's repository in your organization. Run it once for each type. `mass resource-type publish` publishes the `version` in the type's `massdriver.yaml`. A published version cannot change.

## Use a type in a bundle

Reference the type in the `dependencies` of the bundle's `massdriver.yaml`:

```yaml
dependencies:
  kubernetes_cluster:
    resource_type: massdriver-kubernetes-cluster@~0.1
    required: true
```

Fields marked `$md.sensitive`, such as API keys, tokens, private keys, and signing secrets, are masked in the Massdriver UI and API. A deployment gets the full values. A person needs `resource:export` to download them. Refer to [Resource Type Specification](/bundle-development/dependencies-resources/resource-type-spec) and [Version Resolution](/bundle-development/dependencies-resources/version-resolution).

## massdriver-service-account

The credentials of a [service account](/platform-operations/security/service-accounts). A bundle uses them to manage Massdriver: create projects, environments, and event destinations, publish bundles, or deploy instances. The [automations bundles](/continuous-delivery/automations/deploy) depend on this type.

| Field | Value | Environment variable |
|---|---|---|
| `url` | `https://api.massdriver.cloud`, or the URL of your self-hosted installation | `MASSDRIVER_URL` |
| `organization_id` | Your organization identifier, such as `acme`. It is the short identifier in the organization's URLs, not a UUID. | `MASSDRIVER_ORGANIZATION_ID` |
| `api_key` | The access token, `md_...`. Sensitive. | `MASSDRIVER_API_KEY` |

Create a service account on the **Service Accounts** page of the organization settings, or with the `massdriver_service_account` resource of the [Massdriver Terraform provider](https://registry.terraform.io/providers/massdriver-cloud/massdriver/latest/docs/resources/service_account). Massdriver shows the token one time. Then import it:

```bash
mass resource create \
  --name "Platform automation" \
  --type massdriver-service-account \
  --file service-account.json
```

In the bundle, pass the fields to the Terraform provider:

```hcl
provider "massdriver" {
  url             = var.massdriver.url
  organization_id = var.massdriver.organization_id
  api_key         = var.massdriver.api_key
}
```

A new service account has no permissions. Add it to a group with policies that allow only the actions the bundle uses:

| The bundle | Actions |
|---|---|
| Creates preview environments in one project | `project:view`, `environment:create`, `environment:deploy`, `environment:decommission`, `environment:delete` |
| Deploys instances | `project:view`, `instance:configure`, `instance:deploy` |
| Publishes bundles and resource types | `repo:view`, `repo:create`, `repo:push` |
| Manages event destinations | `organization:manageEventDestinations` |

Limit each policy with conditions, such as `{"md-project": ["api"]}`. Refer to [Access control](/platform-operations/security/access-control).

Set an expiration on the token, and make a new token with the `createServiceAccountAccessToken` mutation before it expires. Update the resource, then revoke the old token.

## massdriver-kubernetes-cluster

Access to a Kubernetes API server. The fields use the names and formats of a kubeconfig file: `cluster` is one entry of `clusters`, `user` is one entry of `users`, and `namespace` is the namespace of the context. The resource's **kubeconfig** download renders them as a kubeconfig.

| Field | |
|---|---|
| `cluster.server` | Required. The `https://` URL of the API server. |
| `cluster.certificate-authority-data` | The base64 PEM certificate of the cluster's certificate authority. Leave it empty only when a public authority signed the server certificate. |
| `cluster.tls-server-name` | The name to check on the server certificate, when it is not the host in `server`. |
| `cluster.insecure-skip-tls-verify` | Do not check the server certificate. Only for a test cluster. Cannot be set with certificate authority data. |
| `cluster.proxy-url` | An HTTP, HTTPS, or SOCKS5 proxy for requests to the API server. |
| `user.token` | A bearer token, such as the token of a Kubernetes ServiceAccount. Sensitive. |
| `user.client-certificate-data`, `user.client-key-data` | A base64 PEM client certificate and its key. The key is sensitive. |
| `user.exec` | A command that prints an ExecCredential, such as `aws eks get-token`, `gke-gcloud-auth-plugin`, or `kubelogin`. The command must be installed where the kubeconfig is used. Its `env` values are sensitive. |
| `namespace` | The default namespace. For a token that can use only one namespace, set that namespace. Default `default`. |

`user` has exactly one of `token`, the client certificate and key, or `exec`.

### Service account token

This method works on every cluster, and the deployment needs no cloud credentials. Run these commands with a kubeconfig that is an administrator of the cluster:

```bash
kubectl create namespace massdriver
kubectl create serviceaccount massdriver --namespace massdriver

# Manage one namespace. For cluster-wide access, bind cluster-admin with a ClusterRoleBinding instead.
kubectl create namespace apps
kubectl create rolebinding massdriver-admin \
  --namespace apps \
  --clusterrole admin \
  --serviceaccount massdriver:massdriver

kubectl apply -f - <<'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: massdriver-token
  namespace: massdriver
  annotations:
    kubernetes.io/service-account.name: massdriver
type: kubernetes.io/service-account-token
EOF
```

Read the values:

```bash
# cluster.server
kubectl config view --minify --raw -o jsonpath='{.clusters[0].cluster.server}'

# cluster.certificate-authority-data
kubectl get secret massdriver-token -n massdriver -o jsonpath='{.data.ca\.crt}'

# user.token
kubectl get secret massdriver-token -n massdriver -o jsonpath='{.data.token}' | base64 --decode
```

Set `namespace` to the namespace that the token can use, such as `apps`. The token stays valid until you delete the Secret. To rotate it, delete the Secret, create it again, and update the resource.

To check the resource, download its kubeconfig and run `kubectl --kubeconfig ./kubeconfig.yaml auth can-i --list`.

### Exec plugins

Use an exec plugin when the deployment already has cloud credentials, such as from an AWS IAM role or a GCP service account resource.

| Provider | `command` | `args` |
|---|---|---|
| Amazon EKS | `aws` | `eks`, `get-token`, `--cluster-name`, `<cluster>`, `--output`, `json`. Set `AWS_REGION` in `env`. The IAM role needs an EKS access entry. |
| Google GKE | `gke-gcloud-auth-plugin` | None. The Google service account needs access to the cluster, such as `roles/container.developer`. |
| Azure AKS | `kubelogin` | `get-token`, `--login`, `spn`, `--environment`, `AzurePublicCloud`, `--server-id`, `6dae42f8-4368-4678-94ff-3960e28e3630`, `--tenant-id`, `<tenant>`, `--client-id`, `<application ID>`. Set `AAD_SERVICE_PRINCIPAL_CLIENT_SECRET` in `env`. |

Set `apiVersion` to `client.authentication.k8s.io/v1beta1` and `interactiveMode` to `Never`, because a deployment has no person to answer a prompt.

When the API server has a private endpoint only, the deployment must reach its network, for example with a [WireGuard tunnel](#massdriver-wireguard-tunnel).

## massdriver-wireguard-tunnel

A WireGuard client configuration that lets a deployment reach a private network, such as a VPC with a private Kubernetes API server or database. A WireGuard server runs in the private network, and the deployment is the client. The fields use the names of a wg-quick configuration: `interface` is the `[Interface]` section, and each item of `peers` is a `[Peer]` section. The resource's **wg0.conf** download renders them.

Generate a key pair for the client and a preshared key with `wireguard-tools`:

```bash
umask 077
wg genkey | tee client.key | wg pubkey > client.pub
wg genpsk > tunnel.psk
```

Add the client to the server's configuration, then reload the server with `sudo wg syncconf wg0 <(sudo wg-quick strip wg0)`:

```ini
[Peer]
# Massdriver
PublicKey = <contents of client.pub>
PresharedKey = <contents of tunnel.psk>
AllowedIPs = 10.200.0.2/32
```

The server must forward traffic from the tunnel to the private network, and allow UDP on its WireGuard port, such as `51820`.

| Field | Value |
|---|---|
| `interface.private_key` | Contents of `client.key`. Sensitive. |
| `interface.address` | The client's tunnel address, such as `10.200.0.2/32`. The same as `AllowedIPs` of the client on the server. |
| `interface.dns` | Optional. The resolver of the private network, such as `10.0.0.2` for an AWS VPC with CIDR `10.0.0.0/16`. |
| `interface.mtu` | Optional. wg-quick chooses it when empty, usually 1420. |
| `peers[].public_key` | The server's public key. |
| `peers[].preshared_key` | Contents of `tunnel.psk`. Sensitive. |
| `peers[].endpoint` | The public address and UDP port of the server, such as `vpn.example.com:51820`. |
| `peers[].allowed_ips` | The private networks to reach, such as `10.0.0.0/16`. Not `0.0.0.0/0` unless all traffic must go through the tunnel. |
| `peers[].persistent_keepalive` | `25` when the client is behind NAT or a firewall. |

Delete the key files after you save the resource. Use one key pair for each tunnel, so that you can revoke Massdriver's access alone by removing its `[Peer]` from the server.

The type has no `PreUp`, `PostUp`, `PreDown`, or `PostDown` fields. wg-quick runs those as shell commands as root, so a resource cannot carry them.

## massdriver-event-destination-https

An [event destination](/platform-operations/event-destinations) with the [HTTP adapter](/platform-operations/event-destinations/http) and an `https://` URL. A bundle that runs the receiver of the events depends on this type, and uses `url` and `signing_secret`.

| Field | Value |
|---|---|
| `id` | The destination ID, a UUID. |
| `name` | The destination name. |
| `url` | The `https://` URL of the receiver. Massdriver refuses hosts with private addresses. |
| `signing_secret` | The signing secret, `whsec_...`. Sensitive. |
| `event_types` | The selected event types, such as `deployment.failed` or `deployment.*`. Empty for every event. |
| `attributes` | The attribute filter, such as `{"md-environment": "prod"}`. `{}` for none. |
| `condition` | The jq condition. Leave it out for none. |

Create the destination, then read it with its signing secret:

```bash
mass event destination create \
  --name "Production deployments" \
  --url https://hooks.example.com/massdriver \
  --event-type 'deployment.*' \
  --attribute md-environment=prod \
  --condition '.data.metadata.deployment_action == "PROVISION"'

mass event destination get <id> -o json
```

Update the resource when you change the destination. The receiver verifies each request with the signing secret. Refer to [Verify the signature](/platform-operations/event-destinations/http#verify-the-signature).

## Validate a change

Pull requests to the repository run `scripts/validate.exs`. It checks each type against the Massdriver resource type metaschema, checks each schema and its examples with ExJsonSchema, the JSON Schema library of Massdriver, and renders each export with each example with Solid, the Liquid library of Massdriver. Run it on a copy that you change:

```bash
curl -fsSL https://api.massdriver.cloud/json-schemas/resource-type.json -o /tmp/resource-type.json
elixir scripts/validate.exs /tmp/resource-type.json /tmp/rendered
```
