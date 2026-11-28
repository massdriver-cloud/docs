---
id: onboarding-resource-types
slug: /onboarding/official-resource-types
title: Install the Official Resource Types
sidebar_label: Official Resource Types
description: Install massdriver-service-account, massdriver-kubernetes-cluster and massdriver-wireguard-tunnel, and import the service account the automations use.
---

[massdriver-resource-types](https://github.com/massdriver-cloud/massdriver-resource-types) holds the resource types for Massdriver's own platform features. Catalogs and the automations depend on them, so install them before you publish bundles that reference them.

| Resource type | Holds | Used by |
|---|---|---|
| `massdriver-service-account` | `url`, `organization_id` and `api_key` of a Massdriver service account | Every automation bundle, and the AWS catalog's `massdriver-project`, `github-repo`, `codebase`, `ecs-agent` and `dev-workspace` |
| `massdriver-kubernetes-cluster` | A kubeconfig's `cluster`, `user` and `namespace` | The Kubernetes automation bundles, and any bundle that deploys into a cluster Massdriver did not build |
| `massdriver-wireguard-tunnel` | A wg-quick client configuration | Deployments that must reach a private network, and the AWS catalog's `developer-vpn` |

## Install

The AWS catalog's `make publish-platforms` and its publish workflow already install all three. Otherwise:

```bash
git clone https://github.com/massdriver-cloud/massdriver-resource-types.git
cd massdriver-resource-types

for type in massdriver-service-account massdriver-kubernetes-cluster massdriver-wireguard-tunnel; do
  mass resource-type create "$type"
  mass resource-type publish "$type"
done
```

`mass resource-type create` makes the type's repository. It fails when the repository exists, which is safe to ignore. A published version cannot change, so publishing a version the organization already has fails too.

Each type's page in the UI shows its import instructions next to the form. The full field reference is in [Massdriver Resource Types](/bundle-development/dependencies-resources/massdriver-resource-types).

## Import a service account

Automations and onboarding bundles call the Massdriver API. A deployment cannot create event destinations, projects or groups with its own identity, so these bundles take a `massdriver-service-account` resource and use its token.

1. Create a service account under **Settings → Service Accounts**, such as `automations`, and copy its `md_` token. Massdriver shows it once.
2. Add it to a group whose policies cover what the automations do. pr-sync needs `organization:manageEventDestinations` and `stash:write` on the projects it writes to. Each automation's page lists its permissions; refer to [Service accounts](/platform-operations/security/service-accounts) and [Access control](/platform-operations/security/access-control).
3. Import it:

```bash
cat > automations-sa.json <<EOF
{
  "url": "https://api.massdriver.cloud",
  "organization_id": "$(mass whoami -o json | jq -r .organization.id)",
  "api_key": "md_..."
}
EOF

mass resource create -n "Automations service account" -t massdriver-service-account -f automations-sa.json
```

The command prints the resource ID. Grant it to the environments that use it, then connect it to each bundle's `service_account` slot as a remote reference. It could be an environment default instead, but a remote reference lets each automation run as a service account with only the permissions it needs:

```bash
mass resource grant create <resource-id> --condition md-project=automations
mass instance remote-reference set automations-main-prsync service_account <resource-id>
```

`api_key` is sensitive. Massdriver masks it in the UI and API, and a deployment gets the full value.

Next: [stand up the platform](./03-greenfield-aws.md), or [import the one you have](./05-brownfield.md).
