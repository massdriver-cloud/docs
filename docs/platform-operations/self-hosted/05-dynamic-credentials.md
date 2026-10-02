---
id: self-hosted-dynamic-credentials
slug: /platform-operations/self-hosted/dynamic-credentials
title: Dynamic Cloud Credentials
sidebar_label: Dynamic Credentials
---

The [resource types](/guides/customizing-cloud-support) system in Massdriver allows you to define your credential structure for cloud authentication. **Dynamic credentials are the recommended approach.** Instead of storing a long-lived secret — an AWS Secret Access Key, GCP service account key or an Azure client secret — the provisioner pod is given a cloud identity through its Kubernetes ServiceAccount, and the IaC provider exchanges the pod's projected ServiceAccount token for a credential that expires in minutes.

:::info Self-Hosted Only

Dynamic credentials require control over the Kubernetes cluster running the provisioners, so they are only available in self-hosted Massdriver installations.

:::

## How It Works

Every deployment step runs in an Argo Workflow pod using the **provisioner ServiceAccount** created by the Massdriver Helm chart. That ServiceAccount is the anchor for workload identity:

1. The chart annotates the provisioner ServiceAccount with a cloud identity (`provisioner.serviceAccount.annotations`).
2. Your cloud provider's admission webhook or metadata server projects a signed OIDC token for that ServiceAccount into every provisioner pod.
3. The cloud SDK inside the provisioner image exchanges that token for a short-lived credential — this is the **provisioner identity**.
4. The IaC in your bundle uses the provisioner identity to reach the **target account**: AWS by assuming a role, GCP by impersonating a service account, Azure by exchanging the federated token for a managed identity.

```
Argo workflow pod (massdriver-provisioner ServiceAccount)
    └─ projected OIDC token
        └─ provisioner identity in your platform account
            └─ assume role / impersonate SA / federated identity
                └─ target cloud account
```

No secret ever leaves the target cloud account, and nothing long-lived is stored in Massdriver.

## Prerequisites

- Massdriver self-hosted running on a cluster with a workload identity mechanism enabled:
  - **EKS** with an IAM OIDC provider (IRSA) or EKS Pod Identity
  - **GKE** with Workload Identity Federation
  - **AKS** with the OIDC issuer and Microsoft Entra Workload ID enabled
- Permission to create identities and role bindings in both your platform account (where the cluster runs) and each target account.
- The [`mass` CLI](/reference/cli/overview) authenticated against your self-hosted instance, for publishing resource types and bundles.

Find the provisioner ServiceAccount name before you start — it is `RELEASE_NAME-provisioner`, so `massdriver-provisioner` for the default release name:

```bash
kubectl get serviceaccount -n massdriver -l app.kubernetes.io/component=provisioner
```

:::warning Republish Bundles After Publishing a Resource Type

Bundles burn in their dependency schema when they are published, and Massdriver validates every dependency against that schema before a deployment runs. Whenever you change the schema of any resource type, be sure to run `mass bundle build` and `mass bundle publish` on the bundles that depend on it.

:::

## AWS

### Step 1: Create the Provisioner IAM Role (IRSA)

Get the cluster's OIDC issuer and make sure an IAM OIDC provider exists for it:

```bash
aws eks describe-cluster --name my-cluster \
  --query "cluster.identity.oidc.issuer" --output text
# https://oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E

eksctl utils associate-iam-oidc-provider --cluster my-cluster --approve
```

In the AWS account where Massdriver is installed, create the provisioner role with a trust policy scoped to the provisioner ServiceAccount:

```json trust-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::111111111111:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E:sub": "system:serviceaccount:massdriver:massdriver-provisioner",
          "oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E:aud": "sts.amazonaws.com"
        }
      }
    }
  ]
}
```

```bash
aws iam create-role \
  --role-name massdriver-provisioner \
  --assume-role-policy-document file://trust-policy.json
```

Allow it to assume the roles you will create in your target accounts in Step 3. Scope this as tightly as your naming conventions allow:

```bash
aws iam put-role-policy \
  --role-name massdriver-provisioner \
  --policy-name assume-target-roles \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "*"
    }]
  }'
```

:::tip EKS Pod Identity

If you prefer [EKS Pod Identity](https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html) over IRSA, skip the OIDC trust policy and create an association instead. No ServiceAccount annotation is needed in that case:

```bash
aws eks create-pod-identity-association \
  --cluster-name my-cluster \
  --namespace massdriver \
  --service-account massdriver-provisioner \
  --role-arn arn:aws:iam::111111111111:role/massdriver-provisioner
```

:::

### Step 2: Annotate the Provisioner ServiceAccount

```yaml values-custom.yaml
provisioner:
  serviceAccount:
    annotations:
      eks.amazonaws.com/role-arn: arn:aws:iam::111111111111:role/massdriver-provisioner
```

```bash
helm upgrade massdriver massdriver/massdriver -n massdriver -f values-custom.yaml
```

### Step 3: Trust the Provisioner Role from Each Target Account

In every AWS account you deploy into, create a `massdriver-deployments` role (or whatever name you choose) with the permissions Massdriver needs, and give it a trust policy that allows the provisioner role in your platform account to assume it:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "MassdriverDeployments",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::111111111111:role/massdriver-provisioner"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "a-unique-external-id"
        }
      }
    }
  ]
}
```

### Step 4: Create the AWS Credential Resource Type

The credential holds no secret — just the role to assume and the external ID to assume it with:

```yaml aws-iam-role/massdriver.yaml
name: aws-iam-role
label: AWS IAM Role

ui:
  connectionOrientation: environmentDefault
  environmentDefaultGroup: credentials

schema:
  title: AWS IAM Role
  description: AWS IAM role assumed by the Massdriver provisioner
  type: object
  required:
    - arn
  properties:
    arn:
      title: Role ARN
      description: ARN of the role the provisioner will assume in the target account
      type: string
      pattern: ^arn:aws:iam::[0-9]{12}:role/.+$
    external_id:
      title: External ID
      description: Value the target role's trust policy requires in the sts:ExternalId condition
      type: string
```

```bash
mass resource-type publish aws-iam-role/massdriver.yaml
```

### Step 5: Use the Credential in Your Bundles

Declare the credential as a dependency:

```yaml massdriver.yaml
connections:
  required:
    - aws_authentication
  properties:
    aws_authentication:
      $ref: aws-iam-role
```

The AWS provider assumes the role with the provisioner's identity as the base credential:

```hcl src/_providers.tf
provider "aws" {
  region = var.region
  assume_role {
    role_arn    = var.aws_authentication.arn
    external_id = var.aws_authentication.external_id
  }
  default_tags {
    tags = var.md_metadata.default_tags
  }
}
```

:::tip External ID

It is strongly recommended to use the `external_id` field to prevent the ["Confused Deputy"](https://docs.aws.amazon.com/IAM/latest/UserGuide/confused-deputy.html) attack.

:::

### Verify

```bash
kubectl run aws-identity-check -n massdriver --rm -it --restart=Never \
  --overrides='{"spec":{"serviceAccountName":"massdriver-provisioner"}}' \
  --image=amazon/aws-cli -- sts get-caller-identity
```

You should see the assumed-role ARN for the provisioner role in your platform account. If you see credentials errors instead, the ServiceAccount annotation or the OIDC trust policy `sub` claim is wrong.

---

## GCP

### Step 1: Enable Workload Identity and Create the Provisioner Service Account

```bash
gcloud container clusters update my-cluster \
  --workload-pool=my-platform-project.svc.id.goog

gcloud iam service-accounts create massdriver-provisioner \
  --project my-platform-project

gcloud iam service-accounts add-iam-policy-binding \
  massdriver-provisioner@my-platform-project.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:my-platform-project.svc.id.goog[massdriver/massdriver-provisioner]"
```

### Step 2: Annotate the Provisioner ServiceAccount

```yaml values-custom.yaml
provisioner:
  serviceAccount:
    annotations:
      iam.gke.io/gcp-service-account: massdriver-provisioner@my-platform-project.iam.gserviceaccount.com
```

### Step 3: Allow Impersonation in Each Target Project

Create a `massdriver-deployments` service account (or whatever name you choose) in the target project with the roles Massdriver needs, then let the provisioner identity in the platform project mint tokens for it:

```bash
gcloud services enable iamcredentials.googleapis.com --project my-target-project

gcloud iam service-accounts create massdriver-deployments --project my-target-project

gcloud projects add-iam-policy-binding my-target-project \
  --member "serviceAccount:massdriver-deployments@my-target-project.iam.gserviceaccount.com" \
  --role roles/owner

gcloud iam service-accounts add-iam-policy-binding \
  massdriver-deployments@my-target-project.iam.gserviceaccount.com \
  --project my-target-project \
  --role roles/iam.serviceAccountTokenCreator \
  --member "serviceAccount:massdriver-provisioner@my-platform-project.iam.gserviceaccount.com"
```

Impersonation keeps a per-project boundary: the provisioner can only act in projects that have explicitly granted it token creation. If you would rather skip impersonation, grant the provisioner service account roles directly on each target project and omit `impersonate_service_account` from the provider block below.

### Step 4: Create a GCP Service Account Resource Type

The credential holds no secret — just the service account to impersonate and the project it lives in:

```yaml gcp-service-account/massdriver.yaml
name: gcp-service-account
label: GCP Service Account

ui:
  connectionOrientation: environmentDefault
  environmentDefaultGroup: credentials

schema:
  title: GCP Service Account
  description: GCP service account impersonated by the Massdriver provisioner
  type: object
  required:
    - client_email
    - project_id
  properties:
    client_email:
      title: Service Account Email
      description: The service account the provisioner will impersonate
      type: string
      format: email
    project_id:
      title: Project ID
      description: The GCP project the service account belongs to
      type: string
```

```bash
mass resource-type publish gcp-service-account/massdriver.yaml
```

### Step 5: Use the Credential in Your Bundles

Declare the credential as a dependency:

```yaml massdriver.yaml
connections:
  required:
    - gcp_authentication
  properties:
    gcp_authentication:
      $ref: gcp-service-account
```

The Google providers impersonate the target service account using the provisioner's identity:

```hcl src/_providers.tf
provider "google" {
  project                     = var.gcp_authentication.project_id
  impersonate_service_account = var.gcp_authentication.client_email
  region                      = var.region
}

provider "google-beta" {
  project                     = var.gcp_authentication.project_id
  impersonate_service_account = var.gcp_authentication.client_email
  region                      = var.region
}
```

### Verify

```bash
kubectl run gcp-identity-check -n massdriver --rm -it --restart=Never \
  --overrides='{"spec":{"serviceAccountName":"massdriver-provisioner"}}' \
  --image=google/cloud-sdk:slim -- \
  gcloud auth print-access-token \
  --impersonate-service-account=massdriver-deployments@my-target-project.iam.gserviceaccount.com
```

If the pod's own identity is wrong, `gcloud auth list` in the same pod will show the compute default service account instead of `massdriver-provisioner@my-platform-project.iam.gserviceaccount.com`.

---

## Azure

Azure needs one extra step: its webhook only injects the federated token into pods carrying a specific **label**, and provisioner pods are created by Argo Workflows rather than by the Massdriver chart. You add the label through the Argo Workflows controller defaults.

### Step 1: Create the Managed Identity and Federated Credential

```bash
az aks show -g my-rg -n my-cluster --query oidcIssuerProfile.issuerUrl -o tsv
# https://eastus.oic.prod-aks.azure.com/<tenant>/<uuid>/

az identity create -g my-rg -n massdriver-provisioner

az identity federated-credential create \
  --name massdriver-provisioner \
  --identity-name massdriver-provisioner \
  -g my-rg \
  --issuer "https://eastus.oic.prod-aks.azure.com/<tenant>/<uuid>/" \
  --subject "system:serviceaccount:massdriver:massdriver-provisioner" \
  --audience api://AzureADTokenExchange
```

The cluster must have been created (or updated) with `--enable-oidc-issuer --enable-workload-identity`.

### Step 2: Annotate the ServiceAccount and Label the Workflow Pods

```yaml values-custom.yaml
provisioner:
  serviceAccount:
    annotations:
      azure.workload.identity/client-id: "00000000-0000-0000-0000-000000000000"
      azure.workload.identity/tenant-id: "11111111-1111-1111-1111-111111111111"

argo-workflows:
  controller:
    workflowDefaults:
      spec:
        podMetadata:
          labels:
            azure.workload.identity/use: "true"
```

### Step 3: Grant Access in Each Target Subscription

```bash
az role assignment create \
  --assignee 00000000-0000-0000-0000-000000000000 \
  --role Owner \
  --scope /subscriptions/22222222-2222-2222-2222-222222222222
```

For multiple subscriptions you can either give one identity a role assignment in each, or — to keep a per-subscription boundary — create one managed identity per subscription and add a federated credential for the same provisioner ServiceAccount to each. The projected token belongs to the ServiceAccount, not to any single identity, so the provider picks the identity based on the `client_id` in the credential resource.

### Step 4: Create an Azure Service Principal Resource Type

The credential holds no secret — just the managed identity to authenticate as and the subscription it can reach:

```yaml azure-service-principal/massdriver.yaml
name: azure-service-principal
label: Azure Service Principal

ui:
  connectionOrientation: environmentDefault
  environmentDefaultGroup: credentials

schema:
  title: Azure Service Principal
  description: Azure managed identity used by the Massdriver provisioner
  type: object
  required:
    - client_id
    - tenant_id
    - subscription_id
  properties:
    client_id:
      title: Client ID
      description: Client ID of the managed identity federated with the provisioner service account
      type: string
      format: uuid
    tenant_id:
      title: Tenant ID
      type: string
      format: uuid
    subscription_id:
      title: Subscription ID
      description: The subscription the identity has a role assignment in
      type: string
      format: uuid
```

```bash
mass resource-type publish azure-service-principal/massdriver.yaml
```

### Step 5: Use the Credential in Your Bundles

Declare the credential as a dependency:

```yaml massdriver.yaml
connections:
  required:
    - azure_service_principal
  properties:
    azure_service_principal:
      $ref: azure-service-principal
```

The `azurerm` provider has first-class support for AKS workload identity (`use_aks_workload_identity`, available since provider v3.85). The `azuread` provider does not, so it reads the same token through the generic OIDC arguments:

```hcl src/_providers.tf
provider "azurerm" {
  features {}

  use_aks_workload_identity = true
  use_cli                   = false

  client_id       = var.azure_service_principal.client_id
  tenant_id       = var.azure_service_principal.tenant_id
  subscription_id = var.azure_service_principal.subscription_id
}

provider "azuread" {
  use_oidc             = true
  oidc_token_file_path = "/var/run/secrets/azure/tokens/azure-identity-token"

  client_id = var.azure_service_principal.client_id
  tenant_id = var.azure_service_principal.tenant_id
}
```

### Verify

```bash
kubectl run azure-identity-check -n massdriver --rm -it --restart=Never \
  --overrides='{"spec":{"serviceAccountName":"massdriver-provisioner","metadata":{"labels":{"azure.workload.identity/use":"true"}}}}' \
  --image=mcr.microsoft.com/azure-cli -- \
  sh -c 'az login --service-principal -u "$AZURE_CLIENT_ID" -t "$AZURE_TENANT_ID" --federated-token "$(cat $AZURE_FEDERATED_TOKEN_FILE)" && az account show'
```

If `AZURE_FEDERATED_TOKEN_FILE` is unset inside the pod, the webhook did not mutate it — the pod label is missing or Workload ID is not enabled on the cluster.

---

## Rolling Out

1. Apply the Helm changes and confirm the provisioner identity with the verification command for your cloud.
2. Publish your credential resource type and republish the bundles that connect to it.
3. In **Organization Settings → Configure Credentials**, create the new credential and set it as the environment default for a **non-production environment first**.
4. Run a plan and a deployment against that environment.
5. Roll the remaining environments, then delete the old static credentials and revoke the underlying keys, client secrets, or trust relationships in your cloud accounts.

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| `NoCredentialProviders` / `could not find default credentials` in a deployment log | The ServiceAccount annotation is missing, or the pod ran before the Helm upgrade. Confirm with `kubectl get sa massdriver-provisioner -n massdriver -o yaml`. |
| AWS `AccessDenied` on `sts:AssumeRoleWithWebIdentity` | The `sub` claim in the trust policy does not match `system:serviceaccount:massdriver:massdriver-provisioner`. It includes the namespace and the release name. |
| AWS `AccessDenied` on `sts:AssumeRole` | Either the provisioner role lacks `sts:AssumeRole` on the target role, or the target role's trust policy or external ID condition does not match. |
| GCP `Permission 'iam.serviceAccounts.getAccessToken' denied` | The provisioner service account is missing `roles/iam.serviceAccountTokenCreator` on the target service account, or the IAM Credentials API is not enabled in the target project. |
| Azure `AZURE_FEDERATED_TOKEN_FILE` not set | The `azure.workload.identity/use: "true"` pod label is not reaching the workflow pods. Check `kubectl get pod -n massdriver POD_NAME -o jsonpath='{.metadata.labels}'`. |
| Deployment fails validation with a missing required property on a dependency | A bundle still carries the old burned-in credential schema. Re-run `mass bundle build` and `mass bundle publish`. |

## Related Configuration

- Dynamic credentials cover **provisioning only**. Massdriver's blob storage access is a separate identity configured through `massdriver.blobStorage.serviceAccount.annotations` — see [Cloud Storage](/platform-operations/self-hosted/cloud-storage).
- The [AWS Cost and Usage Report](/reference/integrations/aws-cost-and-usage-reports) and [Azure Cost Management](/reference/integrations/azure-cost-management-exports) integrations provision their own credentials and are unaffected.
- For background on shaping credential resource types, see [Customizing Cloud Support](/guides/customizing-cloud-support) and [Crafting Custom Resource Types](/guides/custom-resource-type).
