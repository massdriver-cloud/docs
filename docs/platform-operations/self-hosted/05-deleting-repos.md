---
id: self-hosted-deleting-repos
slug: /platform-operations/self-hosted/deleting-repos
title: Deleting Bundle Repos
sidebar_label: Deleting Repos
---

The Massdriver bundle registry is **immutable by design**. Once a bundle version is published to a repo, it cannot be overwritten or deleted through the API, CLI, or UI. Immutability guarantees that what is running in your environments is exactly what was published — a version tag can never silently change out from under a deployed instance.

As a **self-hosted operator**, you have direct access to the Postgres database and the object storage bucket, so you can remove a repo (and all of its bundle versions) manually when you're certain it's no longer needed.

:::info Coming in Q3
First-class support for **archiving and renaming repos** and **yanking bundle versions** is planned for Q3 2026. Once available, prefer those over manual deletion — they preserve the registry's audit history.
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
