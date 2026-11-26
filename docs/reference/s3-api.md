---
id: s3-api
slug: /reference/s3-api
title: S3 API
sidebar_label: S3 API
---

The S3 API gives read access to instance params with S3 tools: the AWS CLI, AWS SDKs, rclone, and other S3 clients.

## Endpoint

```
https://api.massdriver.cloud/s3
```

For a self-hosted installation, the endpoint is your API URL followed by `/s3`. The [`s3Credentials`](#credentials) query also returns it.

The API uses path-style addressing only (`<endpoint>/<bucket>/<key>`). The AWS CLI and the AWS SDKs use path style for a custom endpoint URL. If a client uses virtual-hosted style, set its path-style option (for example, `force_path_style` or `addressing_style = path`).

Any region name works. The signature carries the region, and Massdriver accepts the region the client signs with.

## Buckets and keys

| S3 | Massdriver |
|---|---|
| Bucket | Your organization ID |
| Folder | An instance: `<project>/<environment>/<component>/` |
| `params.json` | The params of the instance |

For example, the params of the `db` component in the `prod` environment of the `ecomm` project in the `acme` organization are at:

```
s3://acme/ecomm/prod/db/params.json
```

The object is a JSON document of the params that are set on the instance. It does not include defaults or remote references. Secret values are never in an object.

## Credentials

S3 clients sign each request with an access key ID and a secret access key (AWS Signature Version 4). Massdriver gives these credentials to a Massdriver [access token](/api/graphql/guides/authentication) (`md_...`).

The credentials belong to the access token. They work only in the organization of the access token, and they stop working when the access token expires or is revoked.

### With the Massdriver CLI

[`mass credentials s3`](/cli/commands/mass_credentials_s3) prints the credentials for the access token in your active profile.

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

### With the GraphQL API

Send the `s3Credentials` query with an access token:

```graphql
query {
  s3Credentials(organizationId: "acme") {
    accessKeyId
    secretAccessKey
    endpointUrl
  }
}
```

Use the values that the query returns. Do not compute them from the access token.

## Operations

| Operation | Behavior | Permission |
|---|---|---|
| `ListBuckets` | Returns the organization of the access token | — |
| `HeadBucket`, `GetBucketLocation` | Return fixed values so that clients can start | — |
| `ListObjects`, `ListObjectsV2` | Lists the instances in the projects you can view | `project:view` |
| `GetObject`, `HeadObject` | Returns the params of the instance | `project:view` |

All other operations return `NotImplemented`. This includes `PutObject`, `DeleteObject`, versions, tags, and presigned URLs.

See [Access Control](/platform-operations/security/access-control) for how permissions are granted.

## Object headers

`GetObject` and `HeadObject` return these headers:

| Header | Value |
|---|---|
| `ETag` | The MD5 of the object body |
| `Last-Modified` | When the instance was last changed |
| `Content-Type` | `application/json` |

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
| `InvalidAccessKeyId` | The access key ID is not an active access token |
| `SignatureDoesNotMatch` | The secret access key is not the one that `s3Credentials` returned |
| `NoSuchBucket` | The bucket is not the organization of the access token |
| `NoSuchKey` | The key is not the params of an instance you can view |
| `NotImplemented` | The S3 API does not support the operation |
