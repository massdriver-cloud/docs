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
