---
id: self-hosted-secret-encryption
slug: /platform-operations/self-hosted/secret-encryption
title: Encryption at Rest
sidebar_label: Encryption at Rest
---

Massdriver encrypts instance secrets, event destination credentials, integration credentials and resource payloads at rest. You do not need to configure anything.

## What is encrypted

The same per-organization keys encrypt these values:

| Value | Encrypted fields |
|---|---|
| Instance secrets | Secret value |
| Event destination credentials | Config, auth and signing secret |
| Integration credentials | Credentials |
| Resource payloads | Payload |

In the current release, Massdriver stores each resource payload encrypted and also as plaintext. Pods from an older version can then still read it during a rolling upgrade. A later release removes the plaintext.

## How keys are stored

Each organization has its own keys. Each key has two parts, and they are stored in different places:

| Part | Location |
|---|---|
| Envelope key | Postgres, table `encryption_keys` |
| Data key, encrypted with the envelope key | The Massdriver bucket (`massdriverBucket`), under the `row-level-encryption/` prefix |

Massdriver encrypts the values with the data key and stores them in Postgres. Massdriver can decrypt a value only when it can read both Postgres and the Massdriver bucket.

Massdriver makes a new key for each organization every week and moves the organization's encrypted values to it. It deletes a retired key 30 days after it was retired, when no value still uses it.

## Backups

Back up Postgres and the Massdriver bucket together. A Postgres backup without the bucket objects under `row-level-encryption/` cannot decrypt the encrypted values.

- Do not put an expiration or lifecycle rule on the `row-level-encryption/` prefix.
- Turn on object versioning for the Massdriver bucket if your storage supports it.
- When you [move to a different storage backend](/platform-operations/self-hosted/cloud-storage), copy the full Massdriver bucket. The `rclone copy` commands on that page include `row-level-encryption/`.

## Key retention

A restored Postgres backup can decrypt only the values whose keys were not yet deleted. If you keep Postgres backups longer than 30 days, set the retention to at least your backup retention:

```yaml
massdriver:
  additionalEnvs:
    MD_ENCRYPTION_KEY_RETENTION_DAYS: "90"
```
