---
id: onboarding-brownfield
slug: /onboarding/brownfield
title: "Brownfield: Chip Away at a Terraform Monolith"
sidebar_label: Brownfield AWS
description: Import a VPC that a Terraform monolith owns as a Massdriver resource, then deploy new bundles into it without moving anything.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

A Terraform monolith is one state file and one pipeline for the network, the clusters, the databases and the IAM of an environment. Every change plans all of it, and every new service makes it bigger.

Moving all of it into bundles at once means rewriting it and splitting its state. Instead, leave the monolith in charge of what it already owns, publish the parts other things build on as Massdriver resources, and build everything new as bundles on top of them. New work stops landing in the monolith, and each piece moves out later, when there is a reason to change it.

<TerralithSeam />

## Pick the seam

A seam is something many new services need and that rarely changes. The VPC is almost always first.

| Seam in the monolith | Import as | Then deploy on it |
|---|---|---|
| VPC and subnets | `aws-vpc` | `ecs-cluster`, `postgres`, `mariadb`, `valkey` |
| Route 53 zone | Nothing to import. Deploy `dns-zone` with **Hosted zone** `existing` and the zone ID. | `ecs-cluster`, `http-api` |
| EKS, GKE or AKS cluster, or one namespace | `massdriver-kubernetes-cluster` | Helm bundles, the Kubernetes automation bundles. Refer to [Brownfield Kubernetes](./06-brownfield-kubernetes.md). |
| RDS instance | `aws-postgres` or `aws-mariadb` | Apps on `ecs-service` or `lambda-function` that connect to it |

Import with the same resource type the catalog's bundles produce. A bundle cannot tell an imported `aws-vpc` from one the `vpc` bundle deployed, so everything that connects to a VPC works with both.

## Import the VPC

`aws-vpc` holds the VPC ID, region, CIDR, availability zones, and every subnet with its tier:

| Tier | Route for `0.0.0.0/0` |
|---|---|
| `public` | An internet gateway |
| `private` | A NAT gateway or NAT instance |
| `internal` | None |

`internet_egress` is `true` when the private subnets have a route out.

<Tabs>
<TabItem value="terraform" label="From the monolith" default>

Add the Massdriver provider to the monolith and let it write its own VPC to Massdriver. Every apply keeps the resource current, so a new subnet shows up in Massdriver with no extra step.

```hcl
terraform {
  required_providers {
    massdriver = {
      source  = "massdriver-cloud/massdriver"
      version = "~> 2.5"
    }
  }
}

# Reads MASSDRIVER_ORGANIZATION_ID and MASSDRIVER_API_KEY from the pipeline's environment.
provider "massdriver" {}

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

resource "massdriver_imported_resource" "vpc" {
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

  # The API returns the type with its version (aws-vpc@0.0.0). Without this, every plan replaces the resource.
  lifecycle {
    ignore_changes = [resource_type]
  }
}

resource "massdriver_resource_grant" "vpc" {
  resource_id          = massdriver_imported_resource.vpc.id
  recipient_conditions = jsonencode({ "md-environment" = ["prod"] })
}

output "massdriver_vpc_resource_id" {
  value = massdriver_imported_resource.vpc.id
}
```

Rename `aws_subnet.public`, `aws_subnet.private`, `aws_subnet.database` and `aws_nat_gateway.this` to the monolith's addresses. With [terraform-aws-modules/vpc](https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest), build the lists from `module.vpc.public_subnet_objects`, `private_subnet_objects` and `database_subnet_objects`.

</TabItem>
<TabItem value="cli" label="From the AWS CLI">

Read the VPC as it is, from any account, without touching the monolith. Re-run it when the network changes.

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
```

Update it after the network changes:

```bash
mass resource update <resource-id> -f aws-vpc.json
```

</TabItem>
</Tabs>

Massdriver checks the payload against the `aws-vpc` schema and refuses one that does not match. Check the tiers before importing: a subnet the monolith tags `private` with no NAT route is `internal` here, and `postgres` places databases in `internal` subnets.

## Make it the environment default

Create the project for the new work and make the imported VPC its network:

```bash
mass project create orders --name "Orders"
mass environment create orders-prod --name "Prod"

mass environment default orders-prod <vpc-resource-id>
mass environment default orders-prod <aws-credential-id>
```

Every bundle in `orders-prod` with an `aws-vpc` dependency now connects to the monolith's VPC. To use it for one instance only, set a [remote reference](/guides/sharing-infrastructure) instead:

```bash
mass instance remote-reference set orders-prod-db network <vpc-resource-id>
```

## Build on the imported VPC

Add the new infrastructure as bundles. They deploy into the existing subnets, in their own state, through their own deployments. Pick a preset for each in the UI, or deploy from a params file:

```bash
mass component add orders postgres --id db --name "Orders DB"
mass component add orders dns-zone --id dns --name "DNS"
mass component add orders ecs-cluster --id cluster --name "Cluster"
mass component link orders-dns.zone orders-cluster.dns

mass instance deploy orders-prod-db --params=postgres.yaml
mass instance deploy orders-prod-dns --params=dns.yaml
mass instance deploy orders-prod-cluster --params=cluster.yaml
```

```yaml title="dns.yaml"
domain: orders.example.com
region: us-east-1
hosted_zone:
  source: existing
  zone_id: Z0123456789ABCDEFGHIJ
validation_timeout_minutes: 30
```

`dns-zone` with **Hosted zone** `existing` adopts a Route 53 zone that the monolith or someone else made, and adds a certificate for the domain and every name directly under it. The domain must be the zone's name exactly. The cluster's load balancer serves HTTPS only with a zone connected, and automations need a public `https://` host.

`postgres` puts the database in the VPC's `internal` subnets with its own client security group. `ecs-cluster` puts its load balancer in the `public` subnets and its services in the `private` ones; it needs public subnets in at least two availability zones and at least one private subnet, and its plan fails with that message otherwise. Neither touches the VPC's route tables, gateways or the monolith's security groups.

The monolith's state, pipeline and plan are unchanged. The next database, cache, queue or cluster is a component on a canvas.

To run automations on the new cluster, continue at [Run Automations](./04-automations.md#deploy-pr-sync-on-ecs), with the imported VPC, `orders-prod-dns.zone` and `orders-prod-cluster.cluster` in place of the three `platform-dev` resources.

## Move a piece out later

When the monolith's VPC needs a change anyway, move its code into a bundle of your own that produces `aws-vpc`:

1. Copy the monolith's VPC, subnet, route table and gateway code into the bundle's `src/`, and populate the `aws-vpc` resource with `massdriver_resource` from it.
2. Add [`import` blocks](https://opentofu.org/docs/language/import/) for the existing IDs. Publish with `mass bundle publish --development` and run `mass instance deploy <instance> --plan` until the plan only imports.
3. Deploy it. Then `tofu state rm` the same addresses from the monolith and delete their code there.
4. Set the bundle's `aws-vpc` resource as the environment default in place of the imported one, and delete the imported resource.

Bundles connected to the VPC keep working through the switch: the new resource has the same type and the same IDs.
