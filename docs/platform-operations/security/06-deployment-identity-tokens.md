---
id: security-deployment-identity-tokens
slug: /platform-operations/security/deployment-identity-tokens
title: Deployment Identity Tokens
sidebar_label: Deployment Identity Tokens
---

Massdriver is an OpenID Connect (OIDC) identity provider for your deployments. Every deployment gets signed tokens that state which organization, project, environment, and instance it deploys. Your cloud accounts trust these tokens through workload identity federation, so a bundle can get short-lived cloud credentials without a stored secret.

A trust rule in your cloud decides which deployments get which permissions. For example, a role in your production AWS account can trust only deployments to the `prod` environment of the `ecomm` project.

:::info Self-Hosted Massdriver

The examples on this page use the Massdriver Cloud issuer, `https://api.massdriver.cloud`. A self-hosted installation has its own issuer URL and must be configured to sign tokens. See [Self-Hosted Deployment Identity Tokens](/platform-operations/self-hosted/deployment-identity-tokens).

:::

## Identity Tokens vs. Provisioner Workload Identity

Identity tokens are the recommended way to give deployments cloud access. Self-hosted installations also support [provisioner workload identity](/platform-operations/self-hosted/provisioner-workload-identity), which gives the provisioner Kubernetes ServiceAccount a cloud identity.

| | Identity tokens | Provisioner workload identity |
|---|---|---|
| Available on | Massdriver Cloud and self-hosted | Self-hosted only |
| Target clouds | AWS, GCP, and Azure, from any cluster | Only the cloud that runs the cluster: EKS to AWS, GKE to GCP, AKS to Azure |
| Cloud identity | One token per organization, project, environment, and instance | One identity for all deployments |
| Restrict access in the cloud | Yes. Trust rules match the organization, project, environment, or instance. | No. Any deployment can assume the credential. |
| Restrict access in Massdriver | [Resource grants](/guides/share-resources) | [Resource grants](/guides/share-resources) |
| Public endpoint | Self-hosted servers need a public issuer, or [hosted discovery documents](/platform-operations/self-hosted/deployment-identity-tokens#private-networks) | Not needed |

## How It Works

1. When Massdriver queues a deployment, it signs four tokens: one each for the organization, project, environment, and instance levels.
2. Massdriver writes the tokens as files into the provisioner pod.
3. The IaC in your bundle gives one of the tokens to your cloud's token exchange: AWS STS, GCP Security Token Service, or Microsoft Entra ID.
4. The cloud fetches Massdriver's public keys, verifies the token, checks it against your trust rule, and returns a short-lived credential.

```
Massdriver deployment
    └─ signed token (/massdriver/oidc/environment.jwt)
        └─ cloud token exchange verifies it against Massdriver's public keys
            └─ trust rule matches the token subject
                └─ short-lived credential in your cloud account
```

Massdriver publishes its public keys at the standard OIDC discovery paths of the issuer:

| URL | Content |
|-----|---------|
| `https://api.massdriver.cloud/.well-known/openid-configuration` | Discovery document with the issuer and the key set URL |
| `https://api.massdriver.cloud/.well-known/jwks.json` | JSON Web Key Set with the public signing keys |

Trust rules must match the issuer exactly, without a trailing slash.

## Tokens

### Subjects

Each token has a different `sub` claim. Each subject starts with the subject of the level above it. These examples are for an organization with the ID `acme`:

| Level | `sub` |
|-------|-------|
| `organization` | `org:acme` |
| `project` | `org:acme:project:ecomm` |
| `environment` | `org:acme:project:ecomm:env:prod` |
| `instance` | `org:acme:project:ecomm:env:prod:instance:db` |

The environment and instance parts of the subject use the short identifier. In this example, the full environment identifier is `ecomm-prod` and the full instance identifier is `ecomm-prod-db`.

### Claims

All four tokens of a deployment carry the same claims, except `sub`, `level`, and `jti`.

| Claim | Example | Description |
|-------|---------|-------------|
| `iss` | `https://api.massdriver.cloud` | The issuer. |
| `aud` | `massdriver:acme` | Always `massdriver:` followed by the organization identifier. |
| `sub` | `org:acme:project:ecomm:env:prod` | The subject for the token's level. |
| `level` | `environment` | `organization`, `project`, `environment`, or `instance`. |
| `organization` | `acme` | Organization identifier. |
| `project` | `ecomm` | Project identifier. |
| `environment` | `ecomm-prod` | Full environment identifier. |
| `instance` | `ecomm-prod-db` | Full instance identifier. |
| `deployment_id` | `4b7c1d2e-...` | ID of the deployment. |
| `jti` | `9f0a3b6c-...` | Unique token ID. |
| `iat`, `nbf`, `exp` | | Issue time, start of validity, and expiry. |

Every organization on a Massdriver server uses the same issuer. The `aud` claim is different for each organization, so always check `aud` in your trust rules. A rule that checks `aud` cannot accept tokens from a different organization.

Tokens are valid for 120 minutes. Massdriver signs them when it queues the deployment and does not refresh them, so the token lifetime must be longer than your longest deployment.

### Token Files

The provisioner pod has one file for each level. Each file contains one raw JWT. An environment variable holds the path to each file:

| Level | File | Environment variable |
|-------|------|----------------------|
| `organization` | `/massdriver/oidc/organization.jwt` | `MASSDRIVER_OIDC_ORGANIZATION_TOKEN_FILE` |
| `project` | `/massdriver/oidc/project.jwt` | `MASSDRIVER_OIDC_PROJECT_TOKEN_FILE` |
| `environment` | `/massdriver/oidc/environment.jwt` | `MASSDRIVER_OIDC_ENVIRONMENT_TOKEN_FILE` |
| `instance` | `/massdriver/oidc/instance.jwt` | `MASSDRIVER_OIDC_INSTANCE_TOKEN_FILE` |

## Choosing a Level

The cloud trust rule must match the subject of the token the bundle uses.

| Level | Use it when |
|-------|-------------|
| `organization` | One cloud identity serves all deployments in the organization, for example in a sandbox account. |
| `project` | One cloud identity serves all environments of a project. |
| `environment` | Each environment, for example `prod` or `staging`, has its own cloud identity. This is the usual choice. |
| `instance` | One instance needs a cloud identity that no other deployment can use. See [Avoid Instance-Level Trust](#avoid-instance-level-trust). |

A token at a lower level does not match a trust rule for a higher level, because the subjects are different. If a trust rule allows `org:acme:project:ecomm:env:prod`, the bundle must use the environment token.

:::warning Prefix wildcards

AWS and GCP let you match subjects with patterns. Always end the pattern with `:*`. The pattern `org:acme:project:ecomm:env:prod*` also matches `org:acme:project:ecomm:env:production`. The pattern `org:acme:project:ecomm:env:prod:*` matches only instance subjects in the `prod` environment.

:::

### Store the Level in the Credential

The level that works is set by the cloud trust rule, so store it in the credential, not in the bundle.

For example, a sandbox AWS role trusts the organization (`org:acme`), and a production AWS role trusts one environment (`org:acme:project:network:env:prod`). An `aws-vpc` bundle that always reads `organization.jwt` fails in production, and one that always reads `environment.jwt` fails in the sandbox.

Add a `token_level` field to each credential resource type, and build the token file path from it in the bundle. Each credential then states the level its trust rule accepts, and the same bundle works with both. The resource types in the cloud sections below include this field.

:::warning Replace the Placeholders

The commands and policies below use `ORG_ID` for your [organization ID](/concepts/organizations#find-your-organization-id), and `ecomm` and `prod` as an example project and environment. Replace them with your own values. A trust rule with another organization's ID gives that organization access to your cloud account.

:::

## AWS

### Step 1: Create the OIDC Identity Provider

Create one IAM OIDC identity provider for each AWS account. The client ID is the token audience:

```bash
aws iam create-open-id-connect-provider \
  --url https://api.massdriver.cloud \
  --client-id-list massdriver:ORG_ID
```

### Step 2: Create the Role

Create a role with a trust policy that matches the issuer, the audience, and the subject. The condition keys use the issuer host without `https://`:

```json trust-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::222222222222:oidc-provider/api.massdriver.cloud"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "api.massdriver.cloud:aud": "massdriver:ORG_ID",
          "api.massdriver.cloud:sub": "org:ORG_ID:project:ecomm:env:prod"
        }
      }
    }
  ]
}
```

```bash
aws iam create-role \
  --role-name massdriver-ecomm-prod \
  --assume-role-policy-document file://trust-policy.json
```

To trust instance tokens in an environment instead, use `StringLike` with `"org:ORG_ID:project:ecomm:env:prod:instance:*"`.

### Step 3: Create the Credential Resource Type

```yaml aws-iam-role/massdriver.yaml
name: aws-iam-role
version: 1.0.0
label: AWS IAM Role

ui:
  connectionOrientation: environmentDefault
  environmentDefaultGroup: credentials

schema:
  title: AWS IAM Role
  description: AWS IAM role assumed with a Massdriver deployment identity token
  type: object
  required:
    - arn
    - token_level
  properties:
    arn:
      title: Role ARN
      type: string
      pattern: ^arn:aws:iam::[0-9]{12}:role/.+$
    token_level:
      title: Token Level
      description: The token level the role's trust policy accepts
      type: string
      enum: [organization, project, environment, instance]
      default: environment
```

```bash
mass resource-type publish aws-iam-role/massdriver.yaml
```

### Step 4: Use the Credential in the Bundle

```yaml massdriver.yaml
dependencies:
  aws_authentication:
    resource_type: aws-iam-role@~1
    required: true
```

```hcl src/_providers.tf
provider "aws" {
  region = var.region

  assume_role_with_web_identity {
    role_arn                = var.aws_authentication.arn
    session_name            = var.md_metadata.name_prefix
    web_identity_token_file = "/massdriver/oidc/${var.aws_authentication.token_level}.jwt"
  }
}
```

The session name appears in the assumed role ARN and in CloudTrail, for example `arn:aws:sts::222222222222:assumed-role/massdriver-ecomm-prod/ecomm-prod-db`. Using the instance name prefix shows which instance made each call.

## GCP

Turn on these APIs in the GCP project that contains the workload identity pool:

- IAM API (`iam.googleapis.com`)
- Security Token Service API (`sts.googleapis.com`)
- IAM Service Account Credentials API (`iamcredentials.googleapis.com`)

```bash
gcloud services enable iam.googleapis.com sts.googleapis.com iamcredentials.googleapis.com
```

### Step 1: Create the Workload Identity Pool and Provider

```bash
gcloud iam workload-identity-pools create massdriver \
  --location=global

gcloud iam workload-identity-pools providers create-oidc massdriver \
  --location=global \
  --workload-identity-pool=massdriver \
  --issuer-uri=https://api.massdriver.cloud \
  --allowed-audiences=massdriver:ORG_ID \
  --attribute-mapping="google.subject=assertion.sub,attribute.project=assertion.project,attribute.environment=assertion.environment" \
  --attribute-condition="assertion.organization == 'ORG_ID'"
```

### Step 2: Grant Access to a Service Account

Let the environment token impersonate a service account. `PROJECT_NUMBER` is the number of the GCP project that contains the pool:

```bash
gcloud iam service-accounts add-iam-policy-binding \
  massdriver-ecomm-prod@my-gcp-project.iam.gserviceaccount.com \
  --role=roles/iam.workloadIdentityUser \
  --member="principal://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/massdriver/subject/org:ORG_ID:project:ecomm:env:prod"
```

To trust all tokens of an environment at all levels, use a mapped attribute:

```
principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/massdriver/attribute.environment/ecomm-prod
```

### Step 3: Create the Credential Resource Type

```yaml gcp-service-account/massdriver.yaml
name: gcp-service-account
version: 1.0.0
label: GCP Service Account

ui:
  connectionOrientation: environmentDefault
  environmentDefaultGroup: credentials

schema:
  title: GCP Service Account
  description: GCP service account impersonated with a Massdriver deployment identity token
  type: object
  required:
    - client_email
    - project_id
    - workload_identity_provider
    - token_level
  properties:
    client_email:
      title: Service Account Email
      type: string
      format: email
    project_id:
      title: Project ID
      type: string
    workload_identity_provider:
      title: Workload Identity Provider
      description: Full resource name, for example projects/123456789/locations/global/workloadIdentityPools/massdriver/providers/massdriver
      type: string
    token_level:
      title: Token Level
      description: The token level the service account's IAM binding accepts
      type: string
      enum: [organization, project, environment, instance]
      default: environment
```

```bash
mass resource-type publish gcp-service-account/massdriver.yaml
```

### Step 4: Use the Credential in the Bundle

```yaml massdriver.yaml
dependencies:
  gcp_authentication:
    resource_type: gcp-service-account@~1
    required: true
```

```hcl src/_providers.tf
provider "google" {
  project = var.gcp_authentication.project_id

  credentials = jsonencode({
    type               = "external_account"
    audience           = "//iam.googleapis.com/${var.gcp_authentication.workload_identity_provider}"
    subject_token_type = "urn:ietf:params:oauth:token-type:jwt"
    token_url          = "https://sts.googleapis.com/v1/token"
    credential_source = {
      file = "/massdriver/oidc/${var.gcp_authentication.token_level}.jwt"
    }
    service_account_impersonation_url = "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${var.gcp_authentication.client_email}:generateAccessToken"
  })
}
```

The `audience` in this file is the full resource name of the workload identity provider. It is not the `aud` claim of the token.

## Azure

### Step 1: Add a Federated Identity Credential

Add a federated identity credential to a user-assigned managed identity:

```bash
az identity federated-credential create \
  --name ecomm-prod \
  --identity-name massdriver-ecomm-prod \
  --resource-group massdriver-identities \
  --issuer https://api.massdriver.cloud \
  --subject org:ORG_ID:project:ecomm:env:prod \
  --audiences massdriver:ORG_ID
```

If you add the credential in the Azure portal, choose the **Other issuer** scenario. The portal fills in the audience `api://AzureADTokenExchange` by default. Change it to `massdriver:ORG_ID`, or Microsoft Entra ID rejects the token.

Microsoft Entra ID matches the subject exactly and does not support wildcards for custom issuers. Each managed identity or app registration can have at most 20 federated identity credentials. Use the environment or project level so that one credential covers many instances.

### Step 2: Create the Credential Resource Type

```yaml azure-service-principal/massdriver.yaml
name: azure-service-principal
version: 1.0.0
label: Azure Service Principal

ui:
  connectionOrientation: environmentDefault
  environmentDefaultGroup: credentials

schema:
  title: Azure Service Principal
  description: Azure managed identity federated with a Massdriver deployment identity token
  type: object
  required:
    - client_id
    - tenant_id
    - subscription_id
    - token_level
  properties:
    client_id:
      title: Client ID
      type: string
      format: uuid
    tenant_id:
      title: Tenant ID
      type: string
      format: uuid
    subscription_id:
      title: Subscription ID
      type: string
      format: uuid
    token_level:
      title: Token Level
      description: The token level the federated identity credential's subject matches
      type: string
      enum: [organization, project, environment, instance]
      default: environment
```

```bash
mass resource-type publish azure-service-principal/massdriver.yaml
```

### Step 3: Use the Credential in the Bundle

```yaml massdriver.yaml
dependencies:
  azure_service_principal:
    resource_type: azure-service-principal@~1
    required: true
```

```hcl src/_providers.tf
provider "azurerm" {
  features {}

  use_oidc             = true
  oidc_token_file_path = "/massdriver/oidc/${var.azure_service_principal.token_level}.jwt"
  client_id            = var.azure_service_principal.client_id
  tenant_id            = var.azure_service_principal.tenant_id
  subscription_id      = var.azure_service_principal.subscription_id
}
```

## Best Practices

### Avoid Instance-Level Trust

Trust the organization, project, or environment level. Use the instance level only for a bundle that needs broad cloud permissions that no other deployment may use.

Instance-level credentials have these costs:

- A credential that trusts one instance cannot be an environment default, because other instances in the environment cannot use it. You must connect it to the instance with a [remote reference](/guides/sharing-infrastructure).
- Every new instance of the bundle needs a new cloud role, service account, or federated identity credential.
- Many per-instance cloud identities lead to permission sprawl in your cloud accounts.

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| `/massdriver/oidc/` is empty or missing in the provisioner pod | On a self-hosted server, identity tokens are not turned on. See [Self-Hosted Deployment Identity Tokens](/platform-operations/self-hosted/deployment-identity-tokens). |
| AWS `InvalidIdentityToken` or `Incorrect token audience` | The IAM OIDC provider does not have `massdriver:ORG_ID` in its client ID list, or the provider URL does not match the `iss` claim. |
| AWS `AccessDenied` on `sts:AssumeRoleWithWebIdentity` | The `sub` condition does not match the token subject. The `token_level` in the credential is wrong, or the deployment is in a project or environment that the role does not trust. |
| GCP `The audience in ID Token does not match the expected audience` | The workload identity provider does not have `massdriver:ORG_ID` in `--allowed-audiences`. |
| GCP `PERMISSION_DENIED` for `iam.serviceAccounts.getAccessToken` | The workload identity pool accepted the token, but the service account has no `roles/iam.workloadIdentityUser` binding for the token subject. The `token_level` in the credential is wrong, or the deployment is in a project or environment that the binding does not trust. |
| Azure `AADSTS700213: No matching federated identity record found for presented assertion subject` | The subject, issuer, or audience of the federated identity credential does not exactly match the token. The error message shows the subject of the token. |
| The token is expired during a long deployment | The deployment ran longer than the token lifetime. Self-hosted servers can [increase the lifetime](/platform-operations/self-hosted/deployment-identity-tokens#optional-settings). |
