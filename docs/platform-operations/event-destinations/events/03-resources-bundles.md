---
id: event-reference-resources-bundles
slug: /platform-operations/event-destinations/events/resources-bundles
title: Resource and Bundle Events
sidebar_label: Resources and bundles
---

For the fields that every event has, refer to [Event Reference](/platform-operations/event-destinations/events).

## Resource

A deployment provisions a resource, or a person or service account imports one.

| Event type | Occurs when |
|---|---|
| `resource.provisioned` | A deployment created a resource, or replaced the resource that it created before. |
| `resource.imported` | A resource was imported into the organization. |
| `resource.updated` | The fields of a resource changed. |
| `resource.deleted` | A resource was deleted. |
| `resource.exported` | The data of a resource was exported from Massdriver. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the resource. |
| `name` | string | The name of the resource. |
| `field` | string or null | The name of the resource on the instance that provisioned it. `null` for an imported resource. |
| `payload` | map | The data of the resource. Each value of a field that the resource type marks as sensitive is `"[SENSITIVE]"`. |
| `tags` | map | The tags of the resource. |
| `attributes` | map | The custom attributes set on the resource. |
| `resource_type_id` | UUID | The ID of the resource type. |
| `package_id` | UUID or null | The ID of the instance that provisioned the resource. `null` for an imported resource. |
| `deployment_id` | UUID or null | The ID of the deployment that provisioned the resource. `null` for an imported resource. |
| `organization_id` | UUID | The ID of the organization. |
| `created_at`, `updated_at` | time | |

### `data.metadata`

On `resource.exported`, `contains_secrets` is `true` when the export revealed a sensitive value.

### `data.attributes`

| Resource | Attributes |
|---|---|
| Provisioned | `md-project`, `md-environment`, `md-component`, `md-instance`, `md-repo`, `md-bundle`, and the custom attributes of the instance. `md-resource-type`, such as `aws-iam-role@1.0.0`. `md-id` is `<instance>.<field>`, such as `api-prod-database.writer`. |
| Imported | The custom attributes of the resource, `md-resource-type`, and `md-id`, the ID of the resource. |

### Example

```json
{
  "type": "resource.exported",
  "data": {
    "entity": {
      "id": "e2a4c6f8-1b3d-4f5a-8c7e-9d0b2a4c6e81",
      "name": "writer",
      "field": "writer",
      "payload": {
        "arn": "arn:aws:iam::123456789012:role/api-prod-database-writer",
        "external_id": "[SENSITIVE]"
      },
      "tags": {},
      "attributes": {},
      "resource_type_id": "9b1d3f5a-7c2e-4a6b-8d0f-1e3c5a7b9d24",
      "package_id": "e4a7b2c9-15d3-4f86-a0b1-9c3e5d7f2a68",
      "deployment_id": "5c1de0a7-92b4-4f1e-8d3a-6e27c9f0b815",
      "organization_id": "5a2c8e4f-1b7d-4e3a-9c6f-8d0b2a4e6c17",
      "created_at": "2026-11-19T15:04:11Z",
      "updated_at": "2026-11-19T15:04:11Z"
    },
    "actor": {
      "account_id": "8d2f4c61-7a0e-4b9d-9c53-1f6a2e8b4d07",
      "name": "Jane Doe",
      "organization_id": "5a2c8e4f-1b7d-4e3a-9c6f-8d0b2a4e6c17"
    },
    "metadata": { "credential": "access_token", "access_token_id": "6f0e2d4c-8a1b-4c3d-9e5f-7a2b4c6d8e01", "contains_secrets": true },
    "attributes": {
      "md-id": "api-prod-database.writer",
      "md-project": "api",
      "md-environment": "prod",
      "md-component": "database",
      "md-instance": "api-prod-database",
      "md-repo": "aws-rds-postgres",
      "md-bundle": "aws-rds-postgres@1.4.2",
      "md-resource-type": "aws-iam-role@1.0.0"
    }
  }
}
```

### Example conditions

| To send | Events | Condition |
|---|---|---|
| Exports that reveal a secret | `resource.exported` | `.data.metadata.contains_secrets == true` |
| Exports of every version of one resource type | `resource.exported` | `.data.attributes["md-resource-type"] // "" \| startswith("aws-iam-role@")` |
| Imported resources only | `resource.*` | `.data.entity.package_id == null` |
| Resources with an ARN in one AWS account | `resource.provisioned` | `.data.entity.payload.arn // "" \| contains(":123456789012:")` |

## Resource type

A resource type is the JSON schema of a kind of resource.

| Event type | Occurs when |
|---|---|
| `resource_type.published` | A version of a resource type was published. |
| `resource_type.deleted` | A resource type was deleted. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of this version of the resource type. |
| `identifier` | string | The name of the resource type, such as `aws-iam-role`. |
| `label` | string or null | The display name of the resource type. |
| `version` | string | The version, such as `1.0.0`. |
| `version_major`, `version_minor`, `version_patch` | integer | The parts of `version`. |
| `version_pre_release` | string or null | The pre-release part of `version`, such as `dev.20261119T150411Z`. |
| `schema` | map | The JSON schema of the resource type. |
| `organization_id` | UUID | The ID of the organization. |
| `repo_id` | UUID or null | The ID of the repository of the resource type. |
| `created_at`, `updated_at` | time | |

### `data.attributes`

`md-id`, the identifier of the resource type.

### Example conditions

| To send | Events | Condition |
|---|---|---|
| New major versions | `resource_type.published` | `.data.entity.version_minor == 0 and .data.entity.version_patch == 0 and .data.entity.version_pre_release == null` |
| Released versions only, not development versions | `resource_type.published` | `.data.entity.version_pre_release == null` |

## Repo

A repo is a bundle or resource type repository in the organization's catalog. It holds the versions of one bundle.

| Event type | Occurs when |
|---|---|
| `repo.created` | A repo was added to the catalog. |
| `repo.updated` | The settings of a repo changed. |
| `repo.published` | A new bundle version was published to a repo. |
| `repo.deleted` | A repo and its bundle versions were deleted. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the repo. |
| `name` | string | The name of the repo, such as `aws-rds-postgres`. |
| `artifact_type` | string | `application/vnd.massdriver.bundle.v1+json` for a bundle, or `application/vnd.massdriver.resource-type.v1+json` for a resource type. |
| `readme` | string or null | The README of the repo. |
| `changelog` | string or null | The changelog of the repo. |
| `attributes` | map | The custom attributes set on the repo. |
| `organization_id` | UUID | The ID of the organization. |
| `created_at`, `updated_at` | time | |

### `data.attributes`

`md-repo`, `md-repo-artifact-type` (`bundle` or `resource-type`), the custom attributes of the repo, and `md-id`, the name of the repo.

### Example conditions

| To send | Events | Condition |
|---|---|---|
| Bundle repos only | `repo.*` | `.data.attributes["md-repo-artifact-type"] == "bundle"` |
| New versions of every AWS bundle | `repo.published` | `.data.entity.name \| startswith("aws-")` |
| New versions that a CI service account published | `repo.published` | `.data.metadata.credential == "service_account"` |
