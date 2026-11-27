---
id: onboarding-brownfield
slug: /onboarding/brownfield
title: "Brownfield: Choose a Jumping-Off Point"
sidebar_label: Brownfield
description: Import a network, a Kubernetes cluster, or a whole landing zone from the Terraform that already owns it, and let developers deploy on top of it in Massdriver.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

A Terraform monolith is one state file and one pipeline for the network, the clusters, the databases and the IAM of an environment. Every change plans all of it, and every new service makes it bigger.

Moving all of it into bundles at once means rewriting it and splitting its state. Instead, leave the monolith in charge of what it already owns, and have it publish the parts developers build on as Massdriver resources. Developers then deploy new work as bundles on top of them. New work stops landing in the monolith, and each piece moves out later, when there is a reason to change it.

<TerralithSeam />

## Jumping-off points

Pick how much of the existing estate developers start from. Each one is imported by the Terraform that already owns it, with [`massdriver_imported_resource`](https://registry.terraform.io/providers/massdriver-cloud/massdriver/latest/docs/resources/imported_resource), and every apply keeps the resources current.

| Jumping-off point | The monolith imports | Developers deploy in Massdriver |
|---|---|---|
| [Network](#network) | The VPC or VNet and its subnets | VMs, databases, caches, queues and clusters, in the existing subnets |
| [Kubernetes](#kubernetes) | Credentials for one namespace of each cluster, as the official `massdriver-kubernetes-cluster` type | Helm charts and the Kubernetes automation bundles, in that namespace |
| [Landing zone](#landing-zone) | Everything one environment needs together: the cloud credential, network, DNS zone, cluster, key vault or log workspace | Their app on a runtime, and the few data bundles it uses |

| Cloud | Network type | Kubernetes type | Landing zone types | Catalog |
|---|---|---|---|---|
| AWS | `aws-vpc` | `massdriver-kubernetes-cluster` | `aws-iam-role`, `aws-vpc`, `aws-dns-zone`, `aws-ecs-cluster` | [massdriver-catalogs/aws](https://github.com/massdriver-catalogs/aws) |
| Azure | `virtual-network` | `massdriver-kubernetes-cluster` | `azure-service-principal`, `virtual-network`, `private-dns-zone`, `key-vault`, `log-workspace` | [massdriver-catalogs/azure](https://github.com/massdriver-catalogs/azure) |
| GCP | `virtual-network` (pets catalog) | `massdriver-kubernetes-cluster` | `gcp-service-account`, `virtual-network` | No GCP catalog yet. Start from the [pets catalog](./01-catalogs.md#pets-catalog). |

Import with the same resource type the catalog's bundles depend on. A bundle cannot tell an imported resource from one a bundle deployed, so everything that connects to an `aws-vpc` works with both.

### Every import has the same shape

Add the Massdriver provider to the monolith. It reads `MASSDRIVER_ORGANIZATION_ID` and `MASSDRIVER_API_KEY` from the pipeline's environment; use a service account that can create resources and grants.

```hcl
terraform {
  required_providers {
    massdriver = {
      source  = "massdriver-cloud/massdriver"
      version = "~> 2.5"
    }
  }
}

provider "massdriver" {}
```

Each imported resource is a `massdriver_imported_resource` with a JSON payload that matches the type's schema, and a `massdriver_resource_grant` that lets the environments that use it connect to it:

```hcl
resource "massdriver_imported_resource" "network" {
  name          = "prod network (monolith)"
  resource_type = "aws-vpc"
  resource      = jsonencode({ /* the payload */ })

  # The API returns the type with its version (aws-vpc@0.0.0). Without this, every plan replaces the resource.
  lifecycle {
    ignore_changes = [resource_type]
  }
}

resource "massdriver_resource_grant" "network" {
  resource_id          = massdriver_imported_resource.network.id
  recipient_conditions = jsonencode({ "md-environment" = ["prod"] })
}
```

Massdriver checks the payload against the schema and refuses one that does not match. The provider has no environment default resource, so set defaults once with the CLI:

```bash
mass environment default <project>-prod <resource-id>
```

## Network

The smallest jumping-off point. The monolith keeps owning the network, routing and gateways; developers deploy everything that sits in a subnet.

<Tabs groupId="cloud">
<TabItem value="aws" label="AWS" default>

`aws-vpc` holds the VPC, its availability zones, and every subnet with its tier:

| Tier | Route for `0.0.0.0/0` |
|---|---|
| `public` | An internet gateway |
| `private` | A NAT gateway or NAT instance |
| `internal` | None |

```hcl
data "aws_region" "current" {}
data "aws_availability_zones" "available" {}

locals {
  zone_names = zipmap(data.aws_availability_zones.available.zone_ids, data.aws_availability_zones.available.names)

  massdriver_subnets = concat(
    [for s in aws_subnet.public : { id = s.id, cidr = s.cidr_block, availability_zone_id = s.availability_zone_id, tier = "public" }],
    [for s in aws_subnet.private : { id = s.id, cidr = s.cidr_block, availability_zone_id = s.availability_zone_id, tier = "private" }],
    [for s in aws_subnet.database : { id = s.id, cidr = s.cidr_block, availability_zone_id = s.availability_zone_id, tier = "internal" }],
  )
}

resource "massdriver_imported_resource" "network" {
  name          = "prod VPC (monolith)"
  resource_type = "aws-vpc"
  resource = jsonencode({
    id     = aws_vpc.main.id
    region = data.aws_region.current.region # .name on AWS provider 5.x
    cidr   = aws_vpc.main.cidr_block
    availability_zones = [
      for z in distinct([for s in local.massdriver_subnets : s.availability_zone_id]) : { id = z, name = local.zone_names[z] }
    ]
    subnets         = local.massdriver_subnets
    internet_egress = length(aws_nat_gateway.this) > 0
  })

  lifecycle {
    ignore_changes = [resource_type]
  }
}
```

Rename `aws_subnet.public`, `aws_subnet.private`, `aws_subnet.database` and `aws_nat_gateway.this` to the monolith's addresses. With [terraform-aws-modules/vpc](https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest), build the lists from `module.vpc.public_subnet_objects`, `private_subnet_objects` and `database_subnet_objects`. Check the tiers: a subnet the monolith calls `private` with no NAT route is `internal` here, and `postgres` places databases in `internal` subnets.

<details>
<summary>Without changing the monolith: from the AWS CLI</summary>

Read the VPC as it is and import it with the CLI. Re-run it when the network changes.

```bash
VPC_ID=vpc-0abc1234def567890
REGION=us-east-1

aws ec2 describe-vpcs --region "$REGION" --vpc-ids "$VPC_ID" > vpc.json
aws ec2 describe-subnets --region "$REGION" --filters "Name=vpc-id,Values=$VPC_ID" > subnets.json
aws ec2 describe-route-tables --region "$REGION" --filters "Name=vpc-id,Values=$VPC_ID" > routes.json
aws ec2 describe-availability-zones --region "$REGION" > azs.json
```

```jq title="vpc-payload.jq"
# A subnet without its own route table uses the VPC's main one.
def route_table($tables; $subnet):
  ($tables | map(select(any(.Associations[]?; .SubnetId == $subnet))) | first)
  // ($tables | map(select(any(.Associations[]?; .Main == true))) | first);

def tier($table):
  ($table.Routes | map(select(.DestinationCidrBlock == "0.0.0.0/0")) | first) as $default
  | if $default == null then "internal"
    elif ($default.GatewayId // "" | startswith("igw-")) then "public"
    else "private" end;

$routes[0].RouteTables as $tables
| $subnets[0].Subnets as $all
| ($all | map({
    id: .SubnetId,
    cidr: .CidrBlock,
    availability_zone_id: .AvailabilityZoneId,
    tier: tier(route_table($tables; .SubnetId))
  })) as $tiered
| {
    id: $vpc[0].Vpcs[0].VpcId,
    region: $region,
    cidr: $vpc[0].Vpcs[0].CidrBlock,
    availability_zones: ($azs[0].AvailabilityZones
      | map(select(.ZoneId as $z | $all | any(.AvailabilityZoneId == $z)))
      | map({id: .ZoneId, name: .ZoneName})),
    subnets: $tiered,
    internet_egress: ($tiered | any(.tier == "private"))
  }
```

```bash
jq -n --arg region "$REGION" \
  --slurpfile vpc vpc.json --slurpfile subnets subnets.json \
  --slurpfile routes routes.json --slurpfile azs azs.json \
  -f vpc-payload.jq > aws-vpc.json

mass resource create -n "prod VPC (monolith)" -t aws-vpc -f aws-vpc.json
mass resource grant create <resource-id> --condition md-environment=prod
mass resource update <resource-id> -f aws-vpc.json   # after the network changes
```

</details>

</TabItem>
<TabItem value="azure" label="Azure">

The Azure catalog's `virtual-network` holds the VNet and its subnets by name. `azure-postgres-flexible-server`, `azure-container-app` and `azure-kubernetes-service` depend on it.

```hcl
data "azurerm_client_config" "current" {}

resource "massdriver_imported_resource" "network" {
  name          = "prod VNet (monolith)"
  resource_type = "virtual-network"
  resource = jsonencode({
    id             = azurerm_virtual_network.main.id
    name           = azurerm_virtual_network.main.name
    cidr           = tolist(azurerm_virtual_network.main.address_space)[0]
    region         = azurerm_virtual_network.main.location
    account_id     = data.azurerm_client_config.current.subscription_id
    resource_group = azurerm_virtual_network.main.resource_group_name
    subnets = [
      for s in azurerm_subnet.this : { id = s.id, name = s.name, cidr = s.address_prefixes[0] }
    ]
  })

  lifecycle {
    ignore_changes = [resource_type]
  }
}
```

</TabItem>
<TabItem value="gcp" label="GCP">

There is no GCP catalog yet. The pets catalog's cloud-neutral `virtual-network` holds a network ID, a range and subnets. A GCP VPC has no range of its own, so set `cidr` to the block the network's subnets are allocated from.

```hcl
resource "massdriver_imported_resource" "network" {
  name          = "prod VPC (monolith)"
  resource_type = "virtual-network"
  resource = jsonencode({
    id     = google_compute_network.main.id
    cidr   = "10.0.0.0/16"
    region = "us-central1"
    subnets = [
      for s in google_compute_subnetwork.this : { id = s.id, cidr = s.ip_cidr_range, type = "private" }
    ]
  })

  lifecycle {
    ignore_changes = [resource_type]
  }
}
```

The pets bundles that connect to it still deploy `random_pet`. Write the GCP bundles on top of it with `/massdriver:develop`; refer to [Claude Code and opencode](#claude-code-and-opencode).

</TabItem>
</Tabs>

### Build on the network

Create the project for the new work, make the imported network its default, and add bundles. On AWS:

```bash
mass project create orders --name "Orders"
mass environment create orders-prod --name "Prod"
mass environment default orders-prod <network-resource-id>
mass environment default orders-prod <aws-credential-id>

mass component add orders postgres --id db --name "Orders DB"
mass instance deploy orders-prod-db --params=postgres.yaml
```

`postgres` puts the database in the VPC's `internal` subnets with its own client security group. It does not touch the VPC's route tables, gateways or the monolith's security groups. Neither do `mariadb` or `valkey`. A VM bundle you write takes its subnet from the network resource in the same way.

To run containers and automations on the imported network without importing a cluster, add `dns-zone` and `ecs-cluster`:

```bash
mass component add orders dns-zone --id dns --name "DNS"
mass component add orders ecs-cluster --id cluster --name "Cluster"
mass component link orders-dns.zone orders-cluster.dns
```

Set the `dns` instance's **Hosted zone** to `existing` with the ID of a Route 53 zone the monolith already has; it adds a certificate for the domain and every name directly under it. The cluster's load balancer serves HTTPS only with a zone connected, and automations need a public `https://` host. `ecs-cluster` needs public subnets in at least two availability zones and at least one private subnet. Then continue at [Run Automations](./04-automations.md#deploy-pr-sync-on-ecs) with these three resources in place of the `platform-dev` ones.

To use the network for one instance only, set a [remote reference](/guides/sharing-infrastructure) instead of a default:

```bash
mass instance remote-reference set orders-prod-db network <network-resource-id>
```

## Kubernetes

The monolith keeps owning the clusters, node pools, ingress controllers and cert-manager. For each team, it creates a namespace and a ServiceAccount that is admin of that namespace and nothing else, and imports its credentials as the official [`massdriver-kubernetes-cluster`](/bundle-development/dependencies-resources/massdriver-resource-types#massdriver-kubernetes-cluster) type. Developers deploy Helm charts into that namespace.

This works the same on EKS, GKE, AKS and any other cluster. Only the API server address and its certificate authority come from a different resource:

<Tabs groupId="cloud">
<TabItem value="aws" label="AWS" default>

```hcl
locals {
  cluster_server = aws_eks_cluster.main.endpoint
  cluster_ca     = aws_eks_cluster.main.certificate_authority[0].data
}
```

</TabItem>
<TabItem value="azure" label="Azure">

```hcl
locals {
  cluster_server = azurerm_kubernetes_cluster.main.kube_config[0].host
  cluster_ca     = azurerm_kubernetes_cluster.main.kube_config[0].cluster_ca_certificate
}
```

</TabItem>
<TabItem value="gcp" label="GCP">

```hcl
locals {
  cluster_server = "https://${google_container_cluster.main.endpoint}"
  cluster_ca     = google_container_cluster.main.master_auth[0].cluster_ca_certificate
}
```

</TabItem>
</Tabs>

```hcl
resource "kubernetes_namespace_v1" "team" {
  metadata { name = "team-orders" }
}

resource "kubernetes_service_account_v1" "massdriver" {
  metadata {
    name      = "massdriver"
    namespace = kubernetes_namespace_v1.team.metadata[0].name
  }
}

resource "kubernetes_role_binding_v1" "massdriver" {
  metadata {
    name      = "massdriver-admin"
    namespace = kubernetes_namespace_v1.team.metadata[0].name
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = "admin"
  }
  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account_v1.massdriver.metadata[0].name
    namespace = kubernetes_namespace_v1.team.metadata[0].name
  }
}

resource "kubernetes_secret_v1" "massdriver" {
  metadata {
    name      = "massdriver-token"
    namespace = kubernetes_namespace_v1.team.metadata[0].name
    annotations = {
      "kubernetes.io/service-account.name" = kubernetes_service_account_v1.massdriver.metadata[0].name
    }
  }
  type                           = "kubernetes.io/service-account-token"
  wait_for_service_account_token = true
}

resource "massdriver_imported_resource" "team_orders_namespace" {
  name          = "prod cluster / team-orders"
  resource_type = "massdriver-kubernetes-cluster"
  resource = jsonencode({
    cluster = {
      server                     = local.cluster_server
      certificate-authority-data = local.cluster_ca
    }
    user      = { token = kubernetes_secret_v1.massdriver.data["token"] }
    namespace = kubernetes_namespace_v1.team.metadata[0].name
  })

  lifecycle {
    ignore_changes = [resource_type]
  }
}

resource "massdriver_resource_grant" "team_orders_namespace" {
  resource_id          = massdriver_imported_resource.team_orders_namespace.id
  recipient_conditions = jsonencode({ "md-project" = ["orders"] })
}
```

Repeat the namespace, ServiceAccount, RoleBinding, Secret and import for each team, or `for_each` over a map of teams. Nothing in the token reaches outside its namespace.

`massdriver-kubernetes-cluster` connects by link, not as an environment default, so each instance sets it as a remote reference. [Brownfield Kubernetes](./06-brownfield-kubernetes.md) covers what to ask the cluster's owners for, the same import without Terraform, and deploying pr-sync into the namespace.

## Landing zone

The widest jumping-off point. The monolith already builds a complete environment: the account or subscription, its credential, the network, DNS, a container cluster, keys and logging. It imports all of them, and each becomes an environment default. A developer's environment then needs only their app on a runtime and the two or three data bundles it uses.

<Tabs groupId="cloud">
<TabItem value="aws" label="AWS" default>

| Imported | Type | From the monolith |
|---|---|---|
| Credential | `aws-iam-role` | An IAM role that trusts Massdriver's identity tokens. Refer to [Connect an AWS account](./03-greenfield-aws.md#connect-an-aws-account). |
| Network | `aws-vpc` | [Network](#network) |
| DNS | `aws-dns-zone` | `zone_id`, `domain`, `region` and `certificate_arn` of a Route 53 zone with an ACM certificate for `*.<domain>` |
| Cluster | `aws-ecs-cluster` | An ECS cluster and its shared load balancer: the HTTPS listener, the load balancer's security group, the VPC and private subnets, and the zone |

```hcl
resource "massdriver_imported_resource" "dns" {
  name          = "prod DNS (monolith)"
  resource_type = "aws-dns-zone"
  resource = jsonencode({
    zone_id         = aws_route53_zone.main.zone_id
    domain          = aws_route53_zone.main.name
    region          = data.aws_region.current.region
    certificate_arn = aws_acm_certificate.wildcard.arn
    name_servers    = aws_route53_zone.main.name_servers
  })
  lifecycle { ignore_changes = [resource_type] }
}

resource "massdriver_imported_resource" "cluster" {
  name          = "prod ECS (monolith)"
  resource_type = "aws-ecs-cluster"
  resource = jsonencode({
    name   = aws_ecs_cluster.main.name
    arn    = aws_ecs_cluster.main.arn
    region = data.aws_region.current.region
    load_balancer = {
      arn               = aws_lb.main.arn
      dns_name          = aws_lb.main.dns_name
      zone_id           = aws_lb.main.zone_id
      security_group_id = aws_security_group.lb.id
      listener_arn      = aws_lb_listener.https.arn
      protocol          = "HTTPS"
    }
    network = {
      id                 = aws_vpc.main.id
      private_subnet_ids = [for s in aws_subnet.private : s.id]
      internet_egress    = length(aws_nat_gateway.this) > 0
    }
    zone = {
      zone_id = aws_route53_zone.main.zone_id
      domain  = aws_route53_zone.main.name
    }
  })
  lifecycle { ignore_changes = [resource_type] }
}
```

Developers then add `ecs-service` (or an app built on it) with `postgres`, `s3-bucket`, `sqs-queue` or `valkey`. A service with **Subdomain** `orders` answers at `https://orders.<domain>` behind the existing load balancer. The [automation `-ecs` bundles](./04-automations.md) run on the same imported cluster.

</TabItem>
<TabItem value="azure" label="Azure">

| Imported | Type |
|---|---|
| Credential | `azure-service-principal` |
| Network | `virtual-network`. Refer to [Network](#network). |
| Private DNS | `private-dns-zone` |
| Secrets | `key-vault` |
| Logging | `log-workspace` |

Each type's schema is in the catalog's [`resource-types/`](https://github.com/massdriver-catalogs/azure/tree/main/resource-types). Developers then add `azure-container-app` or `azure-app-service` with `azure-postgres-flexible-server`, `azure-sql-database`, `azure-cosmos-account` or `azure-storage-account`.

</TabItem>
<TabItem value="gcp" label="GCP">

There is no GCP catalog yet, so a GCP landing zone is the `gcp-service-account` credential from the pets catalog, the [network](#network), and [namespaces](#kubernetes) on the GKE clusters. Runtime and data bundles for GCP are yours to write.

</TabItem>
</Tabs>

Set every imported resource as a default of the environment that uses it:

```bash
for id in <credential-id> <network-id> <dns-id> <cluster-id>; do
  mass environment default orders-prod "$id"
done
```

Each stage the monolith builds (dev, staging, prod) imports its own landing zone and grants it to that stage's environments, such as `md-environment=dev`.

## Move a piece out later

When a piece of the monolith needs a change anyway, move it into a bundle. State in Massdriver is per instance, so the resources are imported into one instance's state, not written into the bundle's code. A bundle with [`import` blocks](https://opentofu.org/docs/language/import/) would carry one environment's resource IDs into every instance made from it.

1. Write or pick a bundle whose OpenTofu matches the monolith's code for that piece, and that produces the same resource type, such as `aws-vpc`. Publish it with `mass bundle publish --development` and add it as a component. Do not deploy the instance.
2. From the bundle's step directory, point `tofu` at the instance's state with an `http` backend, and import each resource. Refer to [State management](/platform-operations/state-management#4-importing-resources-into-state). `tofu import` runs locally, so it needs AWS credentials for the account and a value for every variable without a default (`mass bundle build` writes them to `_massdriver_variables.tf`). Keep the backend file, the credentials and the variable values out of the bundle: none of it may be published.

   ```bash
   echo 'terraform { backend "http" {} }' > backend_import.tf

   export TF_HTTP_USERNAME=<organization-id>
   export TF_HTTP_PASSWORD=<api-key>
   export TF_HTTP_ADDRESS="https://api.massdriver.cloud/state/orders-prod-network/src"
   export TF_HTTP_LOCK_ADDRESS=$TF_HTTP_ADDRESS TF_HTTP_UNLOCK_ADDRESS=$TF_HTTP_ADDRESS

   tofu init
   tofu import aws_vpc.main vpc-0abc1234def567890
   tofu import 'aws_subnet.private["use1-az1"]' subnet-0123456789abcdef0
   tofu state list
   rm backend_import.tf
   ```

   The `/massdriver:import` agent does this step for you, including the backend, the variables and the cleanup. Refer to [Claude Code and opencode](#claude-code-and-opencode).

3. Run `mass instance deploy orders-prod-network --plan` until the plan changes nothing in AWS. Change the bundle's code or params, not the cloud, until it does.
4. Deploy it, or propose the deployment for a second person to approve. Then `tofu state rm` the same addresses from the monolith and delete their code there.
5. Set the instance's resource as the environment default in place of the imported one, and delete the imported resource.

Bundles connected to the VPC keep working through the switch: the new resource has the same type and the same IDs.

## Claude Code and opencode

The [Massdriver plugin for Claude Code](https://github.com/massdriver-cloud/claude-plugins) and the [plugin for opencode](https://github.com/massdriver-cloud/opencode-plugin) share the same agents and commands. Brownfield work is where they save the most time, because most of it is reading an existing cloud account and matching it to a schema.

```bash
# Claude Code
/plugin marketplace add massdriver-cloud/claude-plugins
/plugin install massdriver@massdriver
```

```json title="opencode.json"
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@massdriver/opencode"]
}
```

Both run the [Massdriver MCP server](https://github.com/massdriver-cloud/mcp-server) in Docker and read `MASSDRIVER_API_KEY` and `MASSDRIVER_ORGANIZATION_ID`, or your `mass` profile, from the environment the editor starts in.

| Step on this page | Command | What the agent does |
|---|---|---|
| [Network](#network) | `/massdriver:import`, **Register resource only** | Reads the resource type's schema, collects the values from your cloud account, and creates the imported resource. No IaC, no lifecycle. |
| [Build on the network](#build-on-the-network), when the catalog has no bundle for it | `/massdriver:develop` | Designs the bundle, deploys it to a throwaway environment, fixes failures and compliance findings, and tears it down |
| [Move a piece out later](#move-a-piece-out-later) into a new bundle | `/massdriver:import`, **New bundle** | Writes and publishes the bundle, adds the component, runs `tofu import` into the instance's state, and plans in Massdriver until the plan is clean |
| [Move a piece out later](#move-a-piece-out-later) into a catalog bundle, such as `vpc` | `/massdriver:import`, **Existing bundle** | Uses an undeployed instance of the bundle, imports into its state, and plans until it is clean |

When the plan is clean, the agent proposes the deployment instead of running it, and a person approves it. It publishes only development releases. The plugin's guard blocks `mass` commands and MCP calls against production, but not a `tofu import` the agent runs in a shell, so the agent asks you to confirm the target instance before it writes state.
