---
id: onboarding-greenfield-aws
slug: /onboarding/greenfield-aws
title: Greenfield AWS
sidebar_label: Greenfield AWS
description: Connect an AWS account, deploy vpc, dns-zone and ecs-cluster in a platform project, and share them with app projects as environment defaults.
---

Starting from an empty AWS account, the AWS catalog builds the network, DNS and container cluster that every app and automation runs on. They live in one `platform` project, one environment per stage, and every other project gets them as [environment defaults](/guides/sharing-infrastructure).

Before this page: the [AWS catalog is published](./01-catalogs.md#aws-catalog) and the [official resource types are installed](./02-resource-types.md).

## Connect an AWS account

Massdriver signs an identity token for every deployment. The account trusts those tokens through an OIDC provider and lets them assume a role. Run these with AWS CLI credentials for the account you deploy into, and `mass` signed in to your organization.

```bash
ORG_ID=$(mass whoami -o json | jq -r .organization.id)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
PROVIDER_ARN=arn:aws:iam::$ACCOUNT_ID:oidc-provider/api.massdriver.cloud

# One OIDC provider per issuer per account. Add your organization if it already exists.
aws iam create-open-id-connect-provider \
  --url https://api.massdriver.cloud \
  --client-id-list "massdriver:$ORG_ID" \
|| aws iam add-client-id-to-open-id-connect-provider \
  --open-id-connect-provider-arn "$PROVIDER_ARN" \
  --client-id "massdriver:$ORG_ID"

aws iam create-role \
  --role-name massdriver \
  --description "Massdriver provisioning" \
  --assume-role-policy-document "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Effect\": \"Allow\",
      \"Principal\": { \"Federated\": \"$PROVIDER_ARN\" },
      \"Action\": \"sts:AssumeRoleWithWebIdentity\",
      \"Condition\": {
        \"StringEquals\": {
          \"api.massdriver.cloud:aud\": \"massdriver:$ORG_ID\",
          \"api.massdriver.cloud:sub\": \"org:$ORG_ID\"
        }
      }
    }]
  }"

aws iam attach-role-policy \
  --role-name massdriver \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

Bundles create VPCs, databases and IAM roles, so the role needs administrator access. To limit a role to one project, use the subject `org:$ORG_ID:project:<project>` and the token level `project`. Self-hosted installations use their own API host in place of `api.massdriver.cloud`.

Add the role to Massdriver and share it:

```bash
ROLE_ARN=$(aws iam get-role --role-name massdriver --query Role.Arn --output text)
echo "{\"arn\": \"$ROLE_ARN\", \"token_level\": \"organization\"}" > aws-credential.json

mass resource create -n "AWS $ACCOUNT_ID" -t aws-iam-role -f aws-credential.json
mass resource grant create <resource-id> --all-environments
```

The AWS IAM Role form in the UI has the same steps for the AWS console. For a separate production account, repeat this in that account and grant its credential only to prod environments, such as `--condition md-environment=prod`.

## Stand up the platform project

```bash
mass project create platform --name "Platform"
mass environment create platform-dev --name "Dev"
mass environment create platform-prod --name "Prod"

mass component add platform vpc --id network --name "Network"
mass component add platform dns-zone --id dns --name "DNS"
mass component add platform ecs-cluster --id cluster --name "Cluster"

mass component link platform-network.network platform-cluster.network
mass component link platform-dns.zone platform-cluster.dns

mass environment default platform-dev <aws-credential-id>
mass environment default platform-prod <aws-credential-id>
```

Component IDs become the last part of every instance ID: `platform-dev-network`, `platform-dev-dns`, `platform-dev-cluster`.

Configure each instance from a preset in the UI, or from a file:

```yaml title="dev-dns.yaml"
domain: dev.example.com
region: us-east-1
hosted_zone:
  source: create
  dnssec: false
validation_timeout_minutes: 30
```

```bash
mass instance deploy platform-dev-dns --params=dev-dns.yaml

mass instance deploy platform-dev-network --params=- <<'JSON'
{"region": "us-east-1", "cidr": "10.0.0.0/16", "zone_count": 2, "egress": "nat_instance",
 "private_endpoints": [], "flow_log_retention_days": 1}
JSON
```

`--params` reads JSON, YAML, TOML or tfvars from a file, and only JSON from stdin.

| Instance | Development preset | Production preset |
|---|---|---|
| `network` | 2 zones, one NAT instance (~$7/month), 1 day of flow logs | 3 zones, a NAT gateway per zone, ECR/STS/Logs/Secrets Manager endpoints, 365 days of flow logs |
| `dns` | New hosted zone, no DNSSEC | New hosted zone, DNSSEC |
| `cluster` | No Container Insights, no access logs, no WAF | Container Insights, access logs, WAF, deletion protection |

`region` and `domain` are immutable. The zone, the cluster and every HTTP API must be in the same region.

To use a hosted zone that already exists in the account, set `hosted_zone.source` to `existing` and `zone_id` to its ID. The domain must match the zone's name exactly.

## Delegate the DNS zone

A new zone answers nothing until its parent domain points at it, and its certificate is not issued until then. Deploying `dns` creates the zone first, then waits up to `validation_timeout_minutes` for the certificate. Delegate while it waits; the certificate is issued seconds after the delegation resolves.

The `dns` instance's operator guide shows the name servers only after the deploy finishes, so look them up while it runs:

```bash
ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name dev.example.com \
  --query "HostedZones[?Name=='dev.example.com.'] | [0].Id" --output text)
aws route53 get-hosted-zone --id "$ZONE_ID" --query 'DelegationSet.NameServers' --output text
```

Add them as an `NS` record named `dev.example.com` in the parent zone. If the parent is in Route 53:

```bash
aws route53 change-resource-record-sets --hosted-zone-id <parent-zone-id> --change-batch '{
  "Changes": [{"Action": "UPSERT", "ResourceRecordSet": {
    "Name": "dev.example.com", "Type": "NS", "TTL": 300,
    "ResourceRecords": [{"Value": "<ns-1>"}, {"Value": "<ns-2>"}, {"Value": "<ns-3>"}, {"Value": "<ns-4>"}]
  }}]
}'
```

If the domain is registered elsewhere, set the name servers at the registrar.

Once the certificate is issued, deploy the cluster:

```bash
mass instance deploy platform-dev-cluster --params=- <<'JSON'
{"container_insights": "disabled", "access_logs": false, "access_log_retention_days": 7,
 "deletion_protection": false, "waf": false}
JSON
```

Or deploy the whole environment in dependency order after each instance has params:

```bash
mass environment deploy platform-dev --follow
```

## Share the platform with app projects

The platform's resources are produced by instances, so their IDs are `<instance>.<field>`: `platform-dev-network.network`, `platform-dev-dns.zone`, `platform-dev-cluster.cluster`. Grant them to the projects that run on them, and set them as defaults in each environment. For an app project `billing`:

```bash
for field in network.network dns.zone cluster.cluster; do
  mass resource grant create "platform-dev-$field" --condition md-environment=dev
  mass environment default billing-dev "platform-dev-$field"
done
```

A grant matches recipient environments by attribute. `md-environment=dev` covers every project's `dev`. Use `md-project=<project>` or a custom attribute such as `team` to narrow it. Refer to [Share Resources with Environments](/guides/share-resources).

`ecs-service` takes its VPC and zone from the cluster, so a service always lands in the load balancer's network and under its certificate. Give it **Subdomain** `api` and it answers at `https://api.dev.example.com`.

Next: [run automations on the cluster](./04-automations.md), or ship an app on a [runtime](/bundle-development/runtimes-and-applications).
