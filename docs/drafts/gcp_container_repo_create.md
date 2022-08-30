# Creating a GCP Container Reposiotory

To create a Container Repository for a workload on GCP, simply visit the Container Repository page in Massdiver.

<>

Enter a name, select the credentials and location you'd like to use, then click submit. Your container repository will be created and you'll be ready for the next step.

## Authentication Setup

To authenticate with GCP Artifact Registry, we need to create a [Workload Identity Pool](https://cloud.google.com/iam/docs/workload-identity-federation). This allows us to authenticate with the Artifact Registry, without using a service account key.

Create the pool.

```
 export PROJECT_ID="my-gcp-project"
 export WORKLOAD_IDENTITY_POOL=my-pool
 gcloud iam workload-identity-pools create "${WORKLOAD_IDENTITY_POOL}" \
   --project="${PROJECT_ID}" \
   --location="global" \
   --display-name="${WORKLOAD_IDENTITY_POOL}"
```

Create a provider within the pool for GitHub to access.

```
export WORKLOAD_PROVIDER=my-provider
gcloud iam workload-identity-pools providers create-oidc "${WORKLOAD_PROVIDER}" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="${WORKLOAD_IDENTITY_POOL}" \
  --display-name="${WORKLOAD_PROVIDER}" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

This needs to be done once per Google Artifact Repository.

`gcloud iam workload-identity-pools list --location=global`

```
---
displayName: my-pool
name: projects/68804004948/locations/global/workloadIdentityPools/my-pool
state: ACTIVE
```

```
export REPO=container-labs/test-azure
export SERVICE_ACCOUNT_NAME=massdriver-sa
export WORKLOAD_IDENTITY_POOL_NAME=projects/68804004948/locations/global/workloadIdentityPools/my-pool
gcloud iam service-accounts add-iam-policy-binding "${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_POOL_NAME}/attribute.repository/${REPO}"
```

## GitHub Action To Build And Push your Image

Save the action in `.github/workflows/docker-push.yaml`. If you use another branch besides `main`, make sure to replace it below.

- CONTAINER_REPO - us-west2-docker.pkg.dev/my-project/my-repo
- WORKLOAD_IDENTITY_PROVIDER_ID - projects/68804004948/locations/global/workloadIdentityPools/my-pool/providers/my-provider
- SERVICE_ACCOUNT_EMAIL - massdriver-sa@xyz
- REGISTRY_LOCATION - us-west2

```yaml
# .github/workflows/docker-push.yaml
name: Push Docker Image to GCP Artifact Registry
on:
  push:
    branches:
      - main

jobs:
  docker-release:
    name: Tagged Docker release to Google Artifact Registry
    runs-on: ubuntu-latest
    permissions:
      contents: 'read'
      id-token: 'write'

    steps:
      - id: checkout
        name: Checkout
        uses: actions/checkout@v3

      - id: auth
        name: Authenticate with Google Cloud
        uses: google-github-actions/auth@v0
        with:
          token_format: access_token
          workload_identity_provider: ${{ secrets.WORKLOAD_IDENTITY_PROVIDER_ID }}
          service_account: ${{ secrets.SERVICE_ACCOUNT_EMAIL}}
          access_token_lifetime: 300s

      - name: Login to Artifact Registry
        uses: docker/login-action@v1
        with:
          registry: ${{ secrets.REGISTRY_LOCATION }}-docker.pkg.dev
          username: oauth2accesstoken
          password: ${{ steps.auth.outputs.access_token }}

      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v3
        with:
          flavor: |
            latest=true
          images: ${{ secrets.CONTAINER_REPO }}/${{ github.repository }}
          tags: |
            type=ref,event=branch
            type=sha

      - id: docker-push-tagged
        name: Tag Docker image and push to Google Artifact Registry
        uses: docker/build-push-action@v2
        with:
          push: true
          tags: ${{ steps.meta.outputs.tags }}
```
