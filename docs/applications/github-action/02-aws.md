---
id: applications-github-action-aws
slug: /applications/github-action/aws
title: AWS
sidebar_label: AWS
---

To push your container image to AWS ECR from GitHub, you'll need to follow this guide. We'll start by creating a new repository, then go through creating a CI IAM User with access to your repo.

## Creating an AWS Container Repository

```shell
export AWS_REPO_NAME=my-org/my-repo
export AWS_CI_USERNAME=my-ci-user
export AWS_REGION=us-west-2

aws ecr create-repository --repository-name ${AWS_REPO_NAME} --region ${AWS_REGION} --query 'repository.repositoryArn' --output=text

REPOSITORY_ARN=$(aws ecr describe-repositories --region us-west-2 --repository-names foobar --query 'repositories[0].repositoryArn' --output text)
```

You'll need ARN to create an IAM Policy.

## Creating the IAM User and Policy

Next we will create an IAM user and access key and assign it permissions to access our repo.

:::note

Below is a permissive policy, feel free to fine tune [`ecr:*` actions](https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazonelasticcontainerregistry.html).

:::

```shell
aws iam create-user --user-name ${AWS_CI_USERNAME}
aws iam put-user-policy --user-name ${AWS_CI_USERNAME} --policy-name ${AWS_CI_USERNAME}-ecr --policy-document "$(cat <<EOF
{
  "Version":"2012-10-17",
  "Statement":[
    {
      "Sid":"AllowPushPull",
      "Effect":"Allow",
      "Resource": [
        "${REPOSITORY_ARN}"
      ],
      "Action": [
        "ecr:*"
      ]
    }
  ]
}
EOF
)"
```

## Configuring GitHub Action to Push to ECR

Once the CI user and container repo have been created, you can add a GitHub action to push your docker image after building.

First create an access key for your CI user:

```shell
aws iam create-access-key --user-name ${AWS_CI_USERNAME}
# Note the AccessKeyId and SecretAccessKey these will be used by GitHub Actions.
```

You'll need to set two GitHub action secrets. You can do this per organization or GitHub repository based on your company's security posture.

* `AWS_ACCESS_KEY_ID` - `AccessKeyId` from previous command
* `AWS_SECRET_ACCESS_KEY` - `SecretAccessKey` from previous command

Add the following action to `.github/workflows/docker.yaml` and replace `YOUR_REPO_NAME_HERE` with the value in `${AWS_REPO_NAME}` from the first set of commands.

This will push docker images with `latest` and the _git SHA_ as the tags.

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
          aws-region: us-west-2 # Set the applicable region here

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build, tag, and push image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: YOUR_REPO_NAME_HERE # Put your repo name here
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG -t $ECR_REGISTRY/$ECR_REPOSITORY:latest .
          docker image push --all-tags $ECR_REGISTRY/$ECR_REPOSITORY
```
