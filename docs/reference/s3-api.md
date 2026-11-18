---
id: s3-api
slug: /reference/s3-api
title: S3 API
sidebar_label: S3 API
---

The S3 API gives access to instance params with S3 tools: the AWS CLI, AWS SDKs, rclone, and other S3 clients. You can list and read params, read the params of each deployment, and propose new params.

## Endpoint

```
https://api.massdriver.cloud/s3
```

For a self-hosted installation, the endpoint is your API URL followed by `/s3`.

The API uses path-style addressing only (`<endpoint>/<bucket>/<key>`). The AWS CLI and the AWS SDKs use path style for a custom endpoint URL. If a client uses virtual-hosted style, set its path-style option (for example, `force_path_style` or `addressing_style = path`).

Any region name works. The signature carries the region, and Massdriver accepts the region the client signs with.

## Buckets and keys

| S3 | Massdriver |
|---|---|
| Bucket | Your organization ID |
| Key | `<project>/<environment>/<component>.json` |
| Object | The params of the instance |
| Version | One `PROVISION` deployment of the instance |

For example, the params of the `db` component in the `prod` environment of the `ecomm` project in the `acme` organization are at:

```
s3://acme/ecomm/prod/db.json
```

The object is a JSON document of the params that are set on the instance. It does not include defaults or remote references. Secret values are never in an object.

The tree contains only instance params. You cannot create or delete projects, environments, or components through the S3 API.

## Credentials

S3 clients sign each request with an access key ID and a secret access key (AWS Signature Version 4). Both come from a Massdriver [access token](/api/graphql/guides/authentication) (`md_...`):

| AWS setting | Value |
|---|---|
| Access key ID | The first 12 characters of the access token |
| Secret access key | The lowercase hex SHA-256 of the full access token |

The access token keeps its normal rules. It works only in the organization it was created in. When it expires or is revoked, its S3 credentials stop working.

### With the Massdriver CLI

[`mass credentials s3`](/cli/commands/mass_credentials_s3) prints the credentials from the access token in your active profile.

Set them in the current shell:

```bash
eval "$(mass credentials s3 --output env)"
aws s3 ls s3://acme/
```

`--output env` also sets `AWS_ENDPOINT_URL_S3`, so you do not have to pass `--endpoint-url`.

Or add an AWS profile that gets the credentials from the CLI each time:

```ini
# ~/.aws/config
[profile massdriver]
credential_process = mass credentials s3
endpoint_url = https://api.massdriver.cloud/s3
```

```bash
aws s3 ls s3://acme/ --profile massdriver
```

### Without the Massdriver CLI

```bash
export AWS_ACCESS_KEY_ID=$(printf %s "$MASSDRIVER_ACCESS_TOKEN" | cut -c1-12)
export AWS_SECRET_ACCESS_KEY=$(printf %s "$MASSDRIVER_ACCESS_TOKEN" | shasum -a 256 | cut -d' ' -f1)
export AWS_ENDPOINT_URL_S3=https://api.massdriver.cloud/s3
```

## Operations

| Operation | Behavior | Permission |
|---|---|---|
| `ListBuckets` | Returns the organization of the access token | — |
| `HeadBucket`, `GetBucketLocation`, `GetBucketVersioning` | Return fixed values so that clients can start. Versioning is always `Enabled`. | — |
| `ListObjects`, `ListObjectsV2` | Lists the instances in the projects you can view | `project:view` |
| `GetObject`, `HeadObject` | Returns the params of the instance. With `versionId`, returns the params of that deployment. | `project:view` |
| `PutObject` | Proposes a deployment with the params in the body | `project:view`, `instance:propose` |
| `ListObjectVersions` | Lists the `PROVISION` deployments of each instance, newest first | `project:view` |
| `GetObjectTagging` | Returns the default tags of the instance | `project:view` |

All other operations return `NotImplemented`. This includes `DeleteObject`, `CopyObject`, multipart uploads, and presigned URLs. Because `DeleteObject` is not supported, `aws s3 sync --delete` and `rclone sync` cannot decommission an instance.

See [Access Control](/platform-operations/security/access-control) for how permissions are granted.

## Proposing params

`PutObject` does not change the instance. It creates a `PROVISION` deployment in the `PROPOSED` state. The response header `x-amz-version-id` is the ID of the proposed deployment.

```bash
aws s3 cp s3://acme/ecomm/prod/db.json db.json
# edit db.json
aws s3 cp db.json s3://acme/ecomm/prod/db.json
```

Approve or reject the proposal in the Massdriver UI, with the CLI, or with the `approveDeployment` and `rejectDeployment` mutations. The S3 API has no operation to approve. When the environment uses separation of duty, a different person must approve the proposal.

Massdriver validates the body against the params schema of the bundle. A body that is not a JSON object, or that does not match the schema, returns `InvalidArgument` and creates no proposal. Missing required secrets or dependencies also return `InvalidArgument`.

`PutObject` does not create a duplicate proposal:

- When the body is equal to the current params, Massdriver creates no proposal.
- When the body is equal to the params of an open proposal, Massdriver returns that proposal.

Because of this, you can run `aws s3 sync` or `rclone sync` again before the proposals are approved.

## Versions

Each `PROVISION` deployment of an instance is a version of its object. The version ID is the deployment ID.

```bash
aws s3api list-object-versions --bucket acme --prefix ecomm/prod/db.json
aws s3api get-object --bucket acme --key ecomm/prod/db.json --version-id <deployment-id> db.json
```

`IsLatest` is `true` for the deployment that the current params came from. When the params were changed after the last deployment, no version has `IsLatest` set to `true`.

Proposed and rejected deployments are versions too. Their params never reached the instance, so they are never `IsLatest`.

## Object metadata

`GetObject` and `HeadObject` return these headers:

| Header | Current object | Version (`versionId`) |
|---|---|---|
| `x-amz-meta-md-status` | The instance status: `INITIALIZED`, `PROVISIONED`, `DECOMMISSIONED`, or `FAILED` | The deployment status: `PROPOSED`, `REJECTED`, `APPROVED`, `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, or `ABORTED` |
| `x-amz-version-id` | The deployment that the current params came from, when there is one | The deployment ID |
| `Last-Modified` | When the instance was last changed | When the deployment was created |
| `ETag` | The MD5 of the object body | The MD5 of the object body |

```bash
aws s3api head-object --bucket acme --key ecomm/prod/db.json --version-id <deployment-id>
```

`ListObjectVersions` does not return metadata. To get the status of each version, call `HeadObject` with each version ID.

## Tags

`GetObjectTagging` returns the [default tags](/concepts/organization-settings#default-tags) of the instance. These are the same tags that a deployment of the instance sends to its cloud resources.

```bash
aws s3api get-object-tagging --bucket acme --key ecomm/prod/db.json
```

An object can have more than 10 tags. S3 tools read them without a problem. You cannot change tags through the S3 API.

## rclone

```ini
# ~/.config/rclone/rclone.conf
[massdriver]
type = s3
provider = Other
endpoint = https://api.massdriver.cloud/s3
force_path_style = true
env_auth = true
```

```bash
eval "$(mass credentials s3 --output env)"
rclone ls massdriver:acme/ecomm/
rclone copy massdriver:acme/ ./acme-config
```

## Errors

Errors use the S3 error format. These codes are specific to Massdriver:

| Code | Cause |
|---|---|
| `InvalidAccessKeyId` | No active access token has this access key ID |
| `SignatureDoesNotMatch` | The secret access key is not the SHA-256 of the access token |
| `NoSuchBucket` | The bucket is not the organization of the access token |
| `NoSuchKey` | The key is not an instance you can view |
| `InvalidArgument` | The `PutObject` body is not valid params |
| `NotImplemented` | The S3 API does not support the operation |
