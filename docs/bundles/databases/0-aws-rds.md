---
id: bundles-databases-rds-manual
slug: /bundles/databases/rds-manual-snapshot
title: RDS Manual Snapshot
sidebar_label: AWS RDS
---


# Table of contents
1. [Create A Manual Snapshot](#create-a-manual-snapshot)
2. [Rollback / Restore From Snapshot](#rollback-or-restore-from-snapshot)

## Create A Manual Snapshot

1. Get the Database Instance Identifier from the Massdriver UI.

2. Change `replace_me` to a name of your choosing.

```
export DATABASE_ID=name_prefix
export SNAPSHOT_ID=replace_me

aws rds create-db-cluster-snapshot \
    --db-cluster-identifier ${DATABASE_ID} \
    --db-cluster-snapshot-identifier ${SNAPSHOT_ID}
```

## Rollback Or Restore From Snapshot

AWS doesn't support downgrading major versions of RDS. To do this, you'll need to create a new RDS instance and restore from the snapshot. Luckily, we can do that easily with Massdriver.

+ restore from snapshot

`source_snapshot`

https://github.com/massdriver-cloud/aws-aurora-serverless-postgres#params


```
"arn:aws:rds::ACCOUNT_NUMBER:db/prod"
"arn:aws:ec2::ACCOUNT_NUMBER:vpc/vpc-foo"
```
