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

## Rolling back to a version from before encryption

A version from before encryption reads only the plaintext columns. The current version clears those columns for instance secrets, event destination credentials and integration credentials. If you roll back without a restore, the older version reads empty values:

- Deployments get empty secrets.
- Event destinations have no credentials.
- Integrations have no credentials.

Restore the plaintext values before you roll back.

### Restore the plaintext values

Run the restore on the current version, while it still runs, just before the rollback. Replace `<namespace>` with the namespace of the Massdriver release and `<release>` with the Helm release name. The Helm chart names the deployment `{{ fullname }}-massdriver`.

```bash
kubectl exec -n <namespace> deploy/<release>-massdriver -- \
  /app/bin/massdriver rpc 'IO.inspect(Massdriver.Encryption.restore_plaintext())'
```

| Output | Meaning | Next step |
|---|---|---|
| `:ok` | Massdriver restored every value. | Roll back. |
| `{:error, ...}` | Some values did not decrypt. | Do not roll back. Make sure that Massdriver can read the `row-level-encryption/` prefix in the Massdriver bucket. |

### Timing

The current version encrypts the values again in some conditions, and clears the plaintext each time:

- Roll back right after the restore.
- Do not run the restore near 04:41 UTC. At this time, a daily sweep encrypts the values.
- Do not run the restore near 03:23 UTC on Sunday. At this time, the weekly key rotation encrypts the values.
- A pod of the current version that restarts runs the same sweep at boot.
- Between the restore and the end of the rollback, do not change instance secrets, event destinations or integrations. The current version writes them encrypted only, and the older version cannot read those changes.

### After the rollback

After the rollback is complete, you do not need to do more. When you upgrade again, Massdriver encrypts the values again at boot.

A rollback from one version with encryption to a different version with encryption does not need a restore.
