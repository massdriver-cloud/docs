---
id: security-deployment-identity-tokens
slug: /platform-operations/security/deployment-identity-tokens
title: Deployment Identity Tokens
sidebar_label: Deployment Identity Tokens
---

Massdriver is an OpenID Connect (OIDC) identity provider for your deployments. Every deployment gets signed tokens that state which organization, project, environment, and instance it deploys. Your cloud accounts trust these tokens through workload identity federation, so a bundle can get short-lived cloud credentials without a stored secret.

A trust rule in your cloud decides which deployments get which permissions. For example, a role in your production AWS account can trust only deployments to `prod` environments of the `ecomm` project.

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

Massdriver publishes its public keys at the standard OIDC discovery paths of the Massdriver API:

| Path | Content |
|------|---------|
| `/.well-known/openid-configuration` | Discovery document with the issuer and the key set URL |
| `/.well-known/jwks.json` | JSON Web Key Set with the public signing keys |

The issuer is the Massdriver API URL, for example `https://api.massdriver.example.com`. Get the exact value from the `issuer` field of the discovery document. Trust rules must match it exactly, without a trailing slash.

## Tokens

### Subjects

Each token has a different `sub` claim. Each subject starts with the subject of the level above it:

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
| `iss` | `https://api.massdriver.example.com` | The Massdriver API URL. |
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

Tokens are valid for 120 minutes by default. Massdriver signs them when it queues the deployment and does not refresh them, so the token lifetime must be longer than your longest deployment.

### Token Files

The provisioner pod has one file for each level. Each file contains one raw JWT. An environment variable holds the path to each file:

| Level | File | Environment variable |
|-------|------|----------------------|
| `organization` | `/massdriver/oidc/organization.jwt` | `MASSDRIVER_OIDC_ORGANIZATION_TOKEN_FILE` |
| `project` | `/massdriver/oidc/project.jwt` | `MASSDRIVER_OIDC_PROJECT_TOKEN_FILE` |
| `environment` | `/massdriver/oidc/environment.jwt` | `MASSDRIVER_OIDC_ENVIRONMENT_TOKEN_FILE` |
| `instance` | `/massdriver/oidc/instance.jwt` | `MASSDRIVER_OIDC_INSTANCE_TOKEN_FILE` |

## Choosing a Level

The bundle selects the token level to use. The cloud trust rule must match the subject of that level.

| Level | Use it when |
|-------|-------------|
| `organization` | One cloud identity serves all deployments in the organization. |
| `project` | One cloud identity serves all environments of a project. |
| `environment` | Each environment, for example `prod` or `staging`, has its own cloud identity. This is the usual choice. |
| `instance` | Each instance needs its own cloud identity and permissions. |

A token at a lower level does not match a trust rule for a higher level, because the subjects are different. If a trust rule allows `org:acme:project:ecomm:env:prod`, the bundle must use the environment token.

:::warning Prefix wildcards

AWS and GCP let you match subjects with patterns. Always end the pattern with `:*`. The pattern `org:acme:project:ecomm:env:prod*` also matches `org:acme:project:ecomm:env:production`. The pattern `org:acme:project:ecomm:env:prod:*` matches only instance subjects in the `prod` environment.

:::

## AWS

### Step 1: Create the OIDC Identity Provider

Create one IAM OIDC identity provider for each AWS account. The client ID is the token audience:

```bash
aws iam create-open-id-connect-provider \
  --url https://api.massdriver.example.com \
  --client-id-list massdriver:acme
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
        "Federated": "arn:aws:iam::222222222222:oidc-provider/api.massdriver.example.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "api.massdriver.example.com:aud": "massdriver:acme",
          "api.massdriver.example.com:sub": "org:acme:project:ecomm:env:prod"
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

To trust instance tokens in an environment instead, use `StringLike` with `"org:acme:project:ecomm:env:prod:instance:*"`.

### Step 3: Use the Token in the Bundle

```hcl
provider "aws" {
  region = var.region

  assume_role_with_web_identity {
    role_arn                = var.aws_role_arn
    session_name            = "massdriver"
    web_identity_token_file = "/massdriver/oidc/environment.jwt"
  }
}
```

## GCP

### Step 1: Create the Workload Identity Pool and Provider

```bash
gcloud iam workload-identity-pools create massdriver \
  --location=global

gcloud iam workload-identity-pools providers create-oidc massdriver \
  --location=global \
  --workload-identity-pool=massdriver \
  --issuer-uri=https://api.massdriver.example.com \
  --allowed-audiences=massdriver:acme \
  --attribute-mapping="google.subject=assertion.sub,attribute.project=assertion.project,attribute.environment=assertion.environment" \
  --attribute-condition="assertion.organization == 'acme'"
```

### Step 2: Grant Access to a Service Account

Let the environment token impersonate a service account. `PROJECT_NUMBER` is the number of the GCP project that contains the pool:

```bash
gcloud iam service-accounts add-iam-policy-binding \
  massdriver-ecomm-prod@my-gcp-project.iam.gserviceaccount.com \
  --role=roles/iam.workloadIdentityUser \
  --member="principal://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/massdriver/subject/org:acme:project:ecomm:env:prod"
```

To trust all tokens of an environment at all levels, use a mapped attribute:

```
principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/massdriver/attribute.environment/ecomm-prod
```

### Step 3: Use the Token in the Bundle

```hcl
provider "google" {
  project = var.gcp_project_id

  credentials = jsonencode({
    type               = "external_account"
    audience           = "//iam.googleapis.com/projects/${var.gcp_project_number}/locations/global/workloadIdentityPools/massdriver/providers/massdriver"
    subject_token_type = "urn:ietf:params:oauth:token-type:jwt"
    token_url          = "https://sts.googleapis.com/v1/token"
    credential_source = {
      file = "/massdriver/oidc/environment.jwt"
    }
    service_account_impersonation_url = "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${var.gcp_service_account_email}:generateAccessToken"
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
  --issuer https://api.massdriver.example.com \
  --subject org:acme:project:ecomm:env:prod \
  --audiences massdriver:acme
```

Microsoft Entra ID matches the subject exactly and does not support wildcards for custom issuers. Each managed identity or app registration can have at most 20 federated identity credentials. Use the environment or project level so that one credential covers many instances.

### Step 2: Use the Token in the Bundle

```hcl
provider "azurerm" {
  features {}

  use_oidc             = true
  oidc_token_file_path = "/massdriver/oidc/environment.jwt"
  client_id            = var.azure_client_id
  tenant_id            = var.azure_tenant_id
  subscription_id      = var.azure_subscription_id
}
```

## Self-Hosted Configuration

A self-hosted Massdriver server issues tokens only when it has a signing key. Without a signing key, deployments get no token files and the discovery paths return `404`.

:::info Reachable issuer

Your cloud provider fetches the discovery document and the key set from the issuer URL. The Massdriver API must be reachable over HTTPS from the public internet, with a certificate from a public certificate authority.

:::

### Environment Variables

All variables are optional.

| Variable | Default | Description |
|----------|---------|-------------|
| `MD_OIDC_SIGNING_KEY` | | PEM-encoded RSA private key that signs tokens. Set it to turn on token issuance. |
| `MD_OIDC_PREVIOUS_PUBLIC_KEYS` | | One or more PEM-encoded RSA public keys to publish in addition to the signing key. Use it during key rotation. |
| `MD_OIDC_ISSUER` | The Massdriver API URL | Value of the `iss` claim and base URL of the discovery document. |
| `MD_OIDC_TOKEN_TTL_MINUTES` | `120` | Token lifetime in minutes. |

If `MD_OIDC_SIGNING_KEY` or `MD_OIDC_PREVIOUS_PUBLIC_KEYS` contains an invalid key, the server does not start and logs the name of the variable.

All trust rules contain the issuer. If you change `MD_OIDC_ISSUER` after you create trust rules, you must update all of them.

### Step 1: Generate a Signing Key

```bash
openssl genrsa -out massdriver-oidc.pem 2048
```

### Step 2: Configure the Helm Chart

Add the key as a secret in your `values-custom.yaml`:

```yaml
massdriver:
  additionalSecrets:
    MD_OIDC_SIGNING_KEY: |
      -----BEGIN PRIVATE KEY-----
      ...
      -----END PRIVATE KEY-----
```

Set the optional variables in `massdriver.additionalEnvs`:

```yaml
massdriver:
  additionalEnvs:
    MD_OIDC_TOKEN_TTL_MINUTES: "240"
```

Apply the change with `helm upgrade`, then make sure the key set is published:

```bash
curl https://api.massdriver.example.com/.well-known/jwks.json
```

### Rotating the Signing Key

1. Extract the public key from the current signing key:

   ```bash
   openssl rsa -in massdriver-oidc.pem -pubout -out massdriver-oidc-previous.pub
   ```

2. Generate a new signing key.
3. Set `MD_OIDC_SIGNING_KEY` to the new key and `MD_OIDC_PREVIOUS_PUBLIC_KEYS` to the old public key, then apply the change. Tokens signed with the old key stay valid until they expire.
4. After the token lifetime has passed, remove `MD_OIDC_PREVIOUS_PUBLIC_KEYS`.

To publish more than one previous key, put the PEM blocks one after the other in `MD_OIDC_PREVIOUS_PUBLIC_KEYS`.

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| `/massdriver/oidc/` is empty or missing in the provisioner pod | The server has no `MD_OIDC_SIGNING_KEY`. |
| AWS `InvalidIdentityToken` or `Incorrect token audience` | The IAM OIDC provider does not have `massdriver:ORG` in its client ID list, or the provider URL does not match the `iss` claim. |
| AWS `AccessDenied` on `sts:AssumeRoleWithWebIdentity` | The `sub` condition does not match the token level the bundle uses. |
| GCP `The audience in ID Token does not match the expected audience` | The workload identity provider does not have `massdriver:ORG` in `--allowed-audiences`. |
| Azure `AADSTS70021: No matching federated identity record found` | The subject, issuer, or audience of the federated identity credential does not exactly match the token. |
| The token is expired during a long deployment | Increase `MD_OIDC_TOKEN_TTL_MINUTES`. |
