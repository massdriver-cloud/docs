# Creating a GCP Container Reposiotory

<!-- https://biglocalnews.org/content/news/2022/01/27/docker-google-artifact-action.html -->

```
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

```
export REPO=my-username/my-repo
gcloud iam service-accounts add-iam-policy-binding "${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_POOL_ID}/attribute.repository/${REPO}"
```

## GitHub Action To Build And Push your Image

Save file in `.github/workflows/docker-push.yaml`. If you use another branch besides `main`, make sure to replace it below.

```yaml
# .github/workflows/docker-push.yaml
name: Push Docker Image to GCP Artifact Registry
on:
  push:
    branches:
      # replace this with the branch you want to build your images from
      - main
permissions:
  id-token: write
  contents: read
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - id: auth
        name: Authenticate with Google Cloud
        uses: google-github-actions/auth@v0
        with:
          token_format: access_token
          workload_identity_provider: <your-provider-id>
          service_account: <your-service-account>@<your-project-id>.iam.gserviceaccount.com
          access_token_lifetime: 300s
      - name: Login to Artifact Registry
        uses: docker/login-action@v1
        with:
          registry: us-west2-docker.pkg.dev
          username: oauth2accesstoken
          password: $
      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v3
        with:
          flavor: |
            latest=true
          images: GCP_REPO_XYZ/${{ github.repository }}
          tags: |
            type=ref,event=branch
            type=sha
      - name: Build and push
        id: docker-build
        uses: docker/build-push-action@v2
        with:
          file: Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
```
