---
id: self-hosted-deployment-identity-tokens
slug: /platform-operations/self-hosted/deployment-identity-tokens
title: Self-Hosted Deployment Identity Tokens
sidebar_label: Deployment Identity Tokens
---

A self-hosted Massdriver server can sign [deployment identity tokens](/platform-operations/security/deployment-identity-tokens) for your deployments. This page shows how to turn them on in the Helm chart and how cloud trust setup differs from Massdriver Cloud. For the token format, levels, and bundle configuration, see [Deployment Identity Tokens](/platform-operations/security/deployment-identity-tokens).

Identity tokens are off until you give the chart a signing key. Without a signing key, deployments get no token files and the discovery paths return `404`.

:::tip Provisioner Workload Identity

Identity tokens are the recommended approach. [Provisioner workload identity](/platform-operations/self-hosted/provisioner-workload-identity) is still supported, but it only reaches the cloud that runs the cluster and gives every deployment the same cloud identity. See [Identity Tokens vs. Provisioner Workload Identity](/platform-operations/security/deployment-identity-tokens#identity-tokens-vs-provisioner-workload-identity).

:::

## Prerequisites

Your cloud provider fetches the discovery document and the key set from the issuer URL. The issuer must be reachable over HTTPS from the public internet, with a certificate from a public certificate authority.

By default, the issuer is your Massdriver API URL, for example `https://api.massdriver.example.com`. If the API is not reachable from the internet, [host the discovery documents elsewhere](#private-networks).

## Step 1: Generate a Signing Key

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out massdriver-oidc.pem
```

Store this key securely. Anyone with the key can sign tokens that your cloud accounts trust.

## Step 2: Configure the Helm Chart

Set the signing key in the `provisioner.identityTokens` section of your `values-custom.yaml`. Use one of the following options.

### Option A: Key in the Values File

The chart creates a Secret with the key:

```yaml values-custom.yaml
provisioner:
  identityTokens:
    signingKey: |-
      -----BEGIN PRIVATE KEY-----
      ...
      -----END PRIVATE KEY-----
```

### Option B: Existing Secret

Create the Secret yourself, for example with `kubectl` or an external secrets operator. The key must be stored under `signingKey`:

```bash
kubectl create secret generic massdriver-identity-tokens \
  -n massdriver \
  --from-file=signingKey=massdriver-oidc.pem
```

Reference the Secret in `values-custom.yaml`:

```yaml values-custom.yaml
provisioner:
  identityTokens:
    existingSecret: massdriver-identity-tokens
```

If `existingSecret` is set, the chart ignores `signingKey` and `previousPublicKeys`.

### Optional Settings

| Value | Default | Description |
|-------|---------|-------------|
| `provisioner.identityTokens.ttlMinutes` | `120` | Token lifetime in minutes. Set it longer than your longest deployment. |
| `provisioner.identityTokens.issuer` | The Massdriver API URL | The `iss` claim and the base URL of the discovery documents. Set it only to [host the discovery documents elsewhere](#private-networks). |

All trust rules contain the issuer. If you change the issuer after you create trust rules, you must update all of them.

## Step 3: Apply and Verify

```bash
helm upgrade massdriver massdriver/massdriver \
  -n massdriver \
  -f values-custom.yaml
```

If the signing key is invalid, the Massdriver server does not start and logs the cause.

Check that the discovery document is published and that `issuer` has the expected value:

```bash
curl https://api.massdriver.example.com/.well-known/openid-configuration
```

## Step 4: Set Up Cloud Trust

Follow the cloud steps in [Deployment Identity Tokens](/platform-operations/security/deployment-identity-tokens#aws), but replace `https://api.massdriver.cloud` with your issuer. Replace `ORG_ID` with your [organization ID](/concepts/organizations#find-your-organization-id). The bundle and resource type configuration does not change.

### AWS

```bash
aws iam create-open-id-connect-provider \
  --url https://api.massdriver.example.com \
  --client-id-list massdriver:ORG_ID
```

In the trust policy, use the issuer host without `https://` in the federated principal and the condition keys:

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
          "api.massdriver.example.com:aud": "massdriver:ORG_ID",
          "api.massdriver.example.com:sub": "org:ORG_ID:project:ecomm:env:prod"
        }
      }
    }
  ]
}
```

### GCP

```bash
gcloud iam workload-identity-pools providers create-oidc massdriver \
  --location=global \
  --workload-identity-pool=massdriver \
  --issuer-uri=https://api.massdriver.example.com \
  --allowed-audiences=massdriver:ORG_ID \
  --attribute-mapping="google.subject=assertion.sub,attribute.project=assertion.project,attribute.environment=assertion.environment" \
  --attribute-condition="assertion.organization == 'ORG_ID'"
```

### Azure

```bash
az identity federated-credential create \
  --name ecomm-prod \
  --identity-name massdriver-ecomm-prod \
  --resource-group massdriver-identities \
  --issuer https://api.massdriver.example.com \
  --subject org:ORG_ID:project:ecomm:env:prod \
  --audiences massdriver:ORG_ID
```

## Private Networks

If the Massdriver API is not reachable from the internet, your cloud provider cannot fetch the discovery documents from it. Host the two documents on a public static site, such as an S3 bucket, and set the issuer to that site's URL.

The discovery document's `jwks_uri` is the issuer followed by `/.well-known/jwks.json`, so upload both files under `.well-known/` at the root of the site.

1. Create the bucket and allow public reads of `.well-known/*`:

   ```bash
   aws s3api create-bucket --bucket acme-massdriver-oidc --region us-east-1

   aws s3api put-public-access-block --bucket acme-massdriver-oidc \
     --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false

   aws s3api put-bucket-policy --bucket acme-massdriver-oidc --policy '{
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::acme-massdriver-oidc/.well-known/*"
     }]
   }'
   ```

2. Set the issuer to the bucket URL, without a trailing slash, and apply the change with `helm upgrade`:

   ```yaml values-custom.yaml
   provisioner:
     identityTokens:
       existingSecret: massdriver-identity-tokens
       issuer: https://acme-massdriver-oidc.s3.us-east-1.amazonaws.com
   ```

3. From a host on the private network, download the documents from the Massdriver API. The server builds them from the new issuer:

   ```bash
   curl -o openid-configuration https://api.massdriver.example.com/.well-known/openid-configuration
   curl -o jwks.json https://api.massdriver.example.com/.well-known/jwks.json
   ```

4. Upload the documents:

   ```bash
   aws s3 cp openid-configuration s3://acme-massdriver-oidc/.well-known/openid-configuration --content-type application/json
   aws s3 cp jwks.json s3://acme-massdriver-oidc/.well-known/jwks.json --content-type application/json
   ```

5. Check that the documents are public:

   ```bash
   curl https://acme-massdriver-oidc.s3.us-east-1.amazonaws.com/.well-known/openid-configuration
   ```

Use the bucket URL as the issuer in your cloud trust setup. For AWS, the condition keys are `acme-massdriver-oidc.s3.us-east-1.amazonaws.com:aud` and `acme-massdriver-oidc.s3.us-east-1.amazonaws.com:sub`.

:::warning Re-upload After Key Changes

The hosted `jwks.json` does not update itself. Upload it again every time you rotate or change the signing key, before deployments use the new key.

:::

## Rotating the Signing Key

1. Extract the public key from the current signing key:

   ```bash
   openssl pkey -in massdriver-oidc.pem -pubout -out massdriver-oidc-previous.pub
   ```

2. Generate a new signing key.
3. Set the new signing key, and set the old public key as a previous public key:
   - **Option A:** set `provisioner.identityTokens.signingKey` to the new key and `provisioner.identityTokens.previousPublicKeys` to the old public key.
   - **Option B:** update the Secret. Store the new key under `signingKey` and the old public key under `previousPublicKeys`:

     ```bash
     kubectl create secret generic massdriver-identity-tokens \
       -n massdriver \
       --from-file=signingKey=massdriver-oidc-new.pem \
       --from-file=previousPublicKeys=massdriver-oidc-previous.pub \
       --dry-run=client -o yaml | kubectl apply -f -
     ```

4. Apply the change. For Option A, run `helm upgrade`. For Option B, restart the server with `kubectl rollout restart deployment/massdriver-massdriver -n massdriver`. Tokens signed with the old key stay valid until they expire.
5. If you [host the discovery documents elsewhere](#private-networks), download and upload `jwks.json` again.
6. After the token lifetime has passed, remove the previous public key and apply the change again.

To publish more than one previous key, put the PEM blocks one after the other in `previousPublicKeys`.

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| `/massdriver/oidc/` is empty or missing in the provisioner pod | Neither `signingKey` nor `existingSecret` is set. |
| The Massdriver server does not start after the upgrade | The signing key or a previous public key is not valid PEM. The server log names the setting. |
| The discovery paths return `404` | Identity tokens are not turned on. |
| AWS `InvalidIdentityToken: Couldn't retrieve verification key from your identity provider` | The cloud cannot reach the issuer. Make the API public or [host the discovery documents elsewhere](#private-networks). |
| Token verification fails after a key rotation | The hosted `jwks.json` is out of date. Upload it again. |
| The token is expired during a long deployment | Increase `provisioner.identityTokens.ttlMinutes`. |
