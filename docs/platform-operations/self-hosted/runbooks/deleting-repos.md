---
id: self-hosted-runbook-deleting-repos
slug: /platform-operations/self-hosted/runbooks/deleting-repos
title: "Runbook: Deleting a Repo or Resource Type"
sidebar_label: Deleting a Repo or Resource Type
---

The Massdriver bundle registry is **immutable by design**. Once a bundle version is published to a repo, that version cannot be overwritten or individually deleted through the API, CLI, or UI. Immutability guarantees that what is running in your environments is exactly what was published — a version tag can never silently change out from under a deployed instance.

**Deleting a whole repo is now first-class.** From a repo's **Settings → Danger zone** in the UI, or the `deleteOciRepo` API mutation, you can delete a repo and all of its published versions. It requires the `repo:delete` permission and is refused while the repo is still in use — placed on a project canvas, or deployed. Prefer that over the manual steps below.

As a **self-hosted operator** you still have direct access to the Postgres database and the object storage bucket, so this runbook covers what the product does not yet do: deleting a **single** published version, and the resource-type cases the UI doesn't surface. It's also a fallback for removing content the API won't. The same manual steps apply to resource types; see [Deleting a resource type](#deleting-a-resource-type).

:::info Still planned
Deleting a **single published version** (yanking), and **archiving or renaming repos**, are still planned. Until then, use the manual steps below for version-level removal.
:::

:::warning
Manual deletion is permanent. Only delete a repo that is not used on any project canvas. The database's foreign keys will refuse the delete if the repo is still in use — if you hit a foreign key error, **stop and investigate** rather than forcing the delete.
:::

## Prerequisites

- `psql` access to the Massdriver database
- Access to the Massdriver object storage bucket (the bucket configured as `MD_REPOSITORY_BUCKET` — see [Cloud Storage](/platform-operations/self-hosted/cloud-storage))
- The **organization identifier** and **repo name** — a repo's full name is `<org-identifier>/<repo-name>`, e.g. `acme/aws-vpc`

The examples below use `acme` as the organization identifier and `aws-vpc` as the repo name. Substitute your own values.

## Step 1: Verify the repo is unused

Confirm the repo exists and see how many bundle versions it has:

```sql
SELECT r.id, o.identifier AS org, r.name, count(b.id) AS versions
FROM repos r
JOIN organizations o ON o.id = r.organization_id
LEFT JOIN bundles b ON b.repo_id = r.id
WHERE o.identifier = 'acme' AND r.name = 'aws-vpc'
GROUP BY r.id, o.identifier, r.name;
```

Confirm nothing on a project canvas uses it — this **must return 0**:

```sql
SELECT count(*) AS manifests_using_repo
FROM manifests m
JOIN repos r ON r.id = m.repo_id
JOIN organizations o ON o.id = r.organization_id
WHERE o.identifier = 'acme' AND r.name = 'aws-vpc';
```

If the count is not 0, the bundle is still placed on a project canvas. Remove it from the canvas first.

## Step 2: Delete from Postgres

A single delete on `repos` is all you need:

- `bundles` (the published versions) and grants sourced from the repo cascade automatically.
- References from `manifests`, `packages`, and `deployments` are **restricted** — Postgres refuses the delete if the bundle is still in use anywhere. This is your safety net.

```sql
BEGIN;

DELETE FROM repos r
USING organizations o
WHERE r.organization_id = o.id
  AND o.identifier = 'acme'
  AND r.name = 'aws-vpc';

-- Expect: DELETE 1. If you see DELETE 0, check the org identifier and repo name.
COMMIT;
```

## Step 3: Delete from object storage

All registry objects for a repo — blobs, manifests, version tags, and referrers (SBOMs, signatures) — live under a single prefix:

```
s3://<massdriver-bucket>/registry/<org-identifier>/<repo-name>/
```

Review, then delete:

```bash
# Review what will be removed
aws s3 ls --recursive "s3://massdriver/registry/acme/aws-vpc/"

# Remove it
aws s3 rm --recursive "s3://massdriver/registry/acme/aws-vpc/"
```

If you're using the bundled MinIO instead of cloud storage:

```bash
mc rm --recursive --force myminio/massdriver/registry/acme/aws-vpc/
```

Don't skip this step. Version immutability is enforced against the tag objects in storage, so leftover objects will block republishing any previously used version of a repo with the same name.

## Deleting a single bundle version

To remove one version instead of the whole repo:

```sql
DELETE FROM bundles b
USING repos r, organizations o
WHERE b.repo_id = r.id
  AND r.organization_id = o.id
  AND o.identifier = 'acme'
  AND r.name = 'aws-vpc'
  AND b.version = '1.2.3';
```

As with the full repo delete, Postgres refuses if the version is deployed anywhere.

Then remove the version's tag pointer from storage:

```bash
aws s3 rm "s3://massdriver/registry/acme/aws-vpc/manifest/tags/1.2.3"
```

Leave the repo's `blobs/` directory alone when deleting a single version. Blobs are content-addressed and may be shared by other versions of the repo. Orphaned blobs are harmless.

## Deleting a resource type

A resource type is also a repo, with an `artifact_type` of `application/vnd.massdriver.resource-type.v1+json`. Each published version of the type is a row in `resource_types`. Use the steps in this section instead of the bundle repo steps above: the storage path and the safety checks are different.

The examples below use `acme` as the organization identifier and `aws-iam-role` as the resource type name. Substitute your own values.

### Step 1: Verify the resource type is unused

Confirm the resource type exists, and record its `repo_id`. You need the `repo_id` for Step 3.

```sql
SELECT r.id AS repo_id, o.identifier AS org, r.name, count(rt.id) AS versions
FROM repos r
JOIN organizations o ON o.id = r.organization_id
LEFT JOIN resource_types rt ON rt.repo_id = r.id
WHERE o.identifier = 'acme'
  AND r.name = 'aws-iam-role'
  AND r.artifact_type = 'application/vnd.massdriver.resource-type.v1+json'
GROUP BY r.id, o.identifier, r.name;
```

Confirm no resource uses any version of the type. This **must return 0**:

```sql
SELECT count(*) AS resources_using_type
FROM resources res
JOIN resource_types rt ON rt.id = res.resource_type_id
JOIN repos r ON r.id = rt.repo_id
JOIN organizations o ON o.id = r.organization_id
WHERE o.identifier = 'acme' AND r.name = 'aws-iam-role';
```

If the count is not 0, resources of this type still exist. Decommission the instances that produce them, or delete the imported resources, before you continue.

Confirm no published bundle references the type. This **must return no rows**:

```sql
SELECT o2.identifier AS bundle_org, br.name AS bundle_repo, b.version, brt.kind, brt.field
FROM bundle_resource_types brt
JOIN repos r ON r.id = brt.repo_id
JOIN organizations o ON o.id = r.organization_id
JOIN bundles b ON b.id = brt.bundle_id
JOIN repos br ON br.id = b.repo_id
JOIN organizations o2 ON o2.id = br.organization_id
WHERE o.identifier = 'acme' AND r.name = 'aws-iam-role';
```

Each row is a bundle version with a connection or resource field of this type. **Postgres does not protect you here.** These references cascade on delete, so the fields silently lose their type. Delete those bundle versions first (see [Deleting a single bundle version](#deleting-a-single-bundle-version)), or stop.

### Step 2: Delete from Postgres

A single delete on `repos` is all you need:

- `resource_types` (the published versions) and grants sourced from the repo cascade automatically.
- References from `resources` and environment default connections (`target_connections`) are **restricted**. Postgres refuses the delete if the type is still in use.

```sql
BEGIN;

DELETE FROM repos r
USING organizations o
WHERE r.organization_id = o.id
  AND o.identifier = 'acme'
  AND r.name = 'aws-iam-role'
  AND r.artifact_type = 'application/vnd.massdriver.resource-type.v1+json';

-- Expect: DELETE 1. If you see DELETE 0, check the org identifier and resource type name.
COMMIT;
```

### Step 3: Delete from object storage

Resource type objects are stored under the repo's **ID**, not its name, so a rename never moves them. Use the `repo_id` from Step 1:

```
s3://<massdriver-bucket>/registry/<org-identifier>/<repo-id>/
```

Review, then delete:

```bash
# Review what will be removed
aws s3 ls --recursive "s3://massdriver/registry/acme/<repo-id>/"

# Remove it
aws s3 rm --recursive "s3://massdriver/registry/acme/<repo-id>/"
```

If you're using the bundled MinIO instead of cloud storage:

```bash
mc rm --recursive --force myminio/massdriver/registry/acme/<repo-id>/
```

The listing can be empty. Resource types published before OCI publishing have database rows but no registry objects.

### Deleting a single resource type version

To remove one version instead of the whole resource type:

```sql
DELETE FROM resource_types rt
USING repos r, organizations o
WHERE rt.repo_id = r.id
  AND r.organization_id = o.id
  AND o.identifier = 'acme'
  AND r.name = 'aws-iam-role'
  AND rt.version = '1.2.3';
```

Postgres refuses if a resource uses the version. Bundles reference the type, not a version: Massdriver selects the version at deploy time from the field's declared range. Before you delete a version, make sure each bundle from the Step 1 query has another version in its range.

Then remove the version's tag pointer from storage:

```bash
aws s3 rm "s3://massdriver/registry/acme/<repo-id>/manifest/tags/1.2.3"
```

As with bundle versions, leave the `blobs/` directory alone.

## Older installations

Installations that predate the mid-2026 table rename use different table and column names. If `SELECT 1 FROM repos LIMIT 1;` fails with `relation "repos" does not exist`, apply this mapping to the SQL above:

| Current name             | Older name                       |
| ------------------------ | -------------------------------- |
| `repos`                  | `bundles`                        |
| `bundles`                | `bundle_releases`                |
| `bundles.repo_id`        | `bundle_releases.bundle_id`      |
| `manifests.repo_id`      | `manifests.bundle_id`            |
| `packages.bundle_id`     | `packages.bundle_release_id`     |
| `deployments.bundle_id`  | `deployments.bundle_release_id`  |

The object storage layout is the same on all versions.

The [Deleting a resource type](#deleting-a-resource-type) steps need resource types stored as repos. If `SELECT repo_id FROM resource_types LIMIT 1;` fails, your installation predates this change, and the steps do not apply.
