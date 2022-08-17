# Creating An AWS Container Repository

```yaml
name: Push Docker Image To ECR

on:
  push:
    branches:
      - main

jobs:
  build_and_push:
    name: Build and push
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2

      - name: Login to ECR
        id: ecr-Login
        uses: aws-actions/amazon-ecr-login@v1

      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v3
        with:
          flavor: |
            latest=true
          images: 005022811284.dkr.ecr.us-west-2.amazonaws.com/massdriver-cloud/provisioner-terraform
          tags: |
            type=ref,event=branch
            type=sha

      - name: Build and push
        id: docker-build
        uses: docker/build-push-action@v2
        with:
          push: true
          file: Dockerfile
          tags: ${{ steps.meta.outputs.tags }}
```
