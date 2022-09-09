---
id: applications-container-repositories-aws
slug: /applications/container-repositories/aws
title: AWS Container Repositories
sidebar_label: AWS Container Repositories
---

To push your container image to AWS ECR from GitHub, you'll need to follow this guide. We'll start by creating a new repository, then go through creating a CI IAM User with access to your repo.

## Creating an AWS Container Repository

```shell
export AWS_REGION=us-west-2
export AWS_REPO_NAME=my-org/my-repo
export AWS_CI_USERNAME=my-ci-user
# Set the ARN into a variable for use w/ the IAM Policy.
export REPOSITORY_ARN=$(aws ecr create-repository --repository-name ${AWS_REPO_NAME} --region ${AWS_REGION} --query 'repository.repositoryArn')
```

## Creating the IAM User and Policy

Next we will create an IAM user and access key and assign it permissions to access our repo.

:::note

Below is a permissive policy, feel free to fine tune `ecr:*` actions.

:::

```shell
aws iam create-user --user-name ${AWS_CI_USERNAME}
aws iam create-access-key --user-name ${AWS_CI_USERNAME}
# Note the AccessKeyId and SecretAccessKey these will be used by GitHub Actions.

aws iam put-user-policy --user-name ${AWS_CI_USERNAME} --policy-name ${AWS_CI_USERNAME}-ecr --policy-document "$(cat <<EOF
{
  "Version":"2012-10-17",
  "Statement":[
    {
      "Sid":"AllowPushPull",
      "Effect":"Allow",
      "Resource": [
        ${REPOSITORY_ARN}
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

:::note

WIP

:::
