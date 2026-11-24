---
id: self-hosted-secret-encryption
slug: /platform-operations/self-hosted/secret-encryption
title: Secret Encryption
sidebar_label: Secret Encryption
---

Massdriver encrypts instance secrets at rest. You do not need to configure anything.

## How keys are stored

Each organization has its own keys. Each key has two parts, and they are stored in different places:

| Part | Location |
|---|---|
| Envelope key | Postgres, table `encryption_keys` |
| Data key, encrypted with the envelope key | The Massdriver bucket (`massdriverBucket`), under the `row-level-encryption/` prefix |

Secret values are encrypted with the data key and stored in Postgres. A secret can only be decrypted when Massdriver can read both Postgres and the Massdriver bucket.

Massdriver makes a new key for each organization every week and moves the organization's secrets to it. It deletes a retired key 30 days after it was retired, when no secret still uses it.

## Backups

Back up Postgres and the Massdriver bucket together. A Postgres backup without the bucket objects under `row-level-encryption/` cannot decrypt secrets.

- Do not put an expiration or lifecycle rule on the `row-level-encryption/` prefix.
- Turn on object versioning for the Massdriver bucket if your storage supports it.
- When you [move to a different storage backend](/platform-operations/self-hosted/cloud-storage), copy the full Massdriver bucket. The `rclone copy` commands on that page include `row-level-encryption/`.

## Key retention

A restored Postgres backup can decrypt only the secrets whose keys were not yet deleted. If you keep Postgres backups longer than 30 days, set the retention to at least your backup retention:

```yaml
massdriver:
  additionalEnvs:
    MD_ENCRYPTION_KEY_RETENTION_DAYS: "90"
```
