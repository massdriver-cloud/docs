---
id: applications-container-repositories-aws
slug: /applications/container-repositories/aws
title: AWS Container Repositories
sidebar_label: AWS Container Repositories
---

:::note

WIP

:::

```shell
export AWS_REGION=us-west-2
export AWS_REPO_NAME=my-org/my-repo
export AWS_CI_USERNAME=my-ci-user

aws iam create-user --user-name ${AWS_CI_USERNAME}
aws iam create-access-key --user-name ${AWS_CI_USERNAME}
# Note the AccessKeyId and SecretAccessKey these will be used by GitHub Actions.

export REPOSITORY_ARN=$(aws ecr create-repository --repository-name ${AWS_REPO_NAME} --region ${AWS_REGION} --query 'repository.repositoryArn')
# Note the ECR Arn
```

Below is a permissive policy, feel free to fine tune `ecr:*` actions.

```
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
