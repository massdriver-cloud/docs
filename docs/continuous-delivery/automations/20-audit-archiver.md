---
id: automation-audit-archiver
slug: /continuous-delivery/automations/audit-archiver
title: audit-archiver
sidebar_label: audit-archiver
description: Archive every Massdriver event in S3, Splunk, or Datadog.
image: /img/og/automation-audit-archiver.png
---

Store every Massdriver event in one or more sinks: S3 (or an S3-compatible store), Splunk, and Datadog.

Each sink gets the request body exactly as Massdriver signed it. The automation responds `204` only after every
configured sink accepted the event. When a sink fails, the automation responds `500`, and Massdriver retries the
event. The retry writes only to the sinks that failed.

| Sink | What it writes |
|---|---|
| S3 | One object for each event, at `<prefix>/YYYY/MM/DD/HH/<time>-<id>.json`. The time is the event `time` in UTC, such as `20261124T055403.482913Z`. The object has the content type `application/cloudevents+json` and the metadata `webhook-id`. A redelivered event writes the same key. |
| Splunk | One HEC event. `event` is the body as a string. `time` is the event `time`. The indexed fields are `webhook_id` and `event_type`. |
| Datadog | One log. `message` is the body as a string, and Datadog parses it as JSON. The log also has `webhook_id`, `ddsource:massdriver`, and the `service` and `ddtags` that you set. |

## Configuration

Set at least one of `ARCHIVE_S3_BUCKET`, `SPLUNK_HEC_URL`, and `DD_API_KEY`.

| Variable | Default | |
|---|---|---|
| `MASSDRIVER_SIGNING_SECRET` | | Required. The `whsec_` signing secret of the event destination. |
| `ARCHIVE_S3_BUCKET` | | The bucket. Setting it turns on the S3 sink. |
| `ARCHIVE_S3_PREFIX` | `events` | The first part of each key. |
| `ARCHIVE_S3_ENDPOINT` | | The URL of an S3-compatible store, such as MinIO or Cloudflare R2. The sink then uses path-style URLs. |
| `ARCHIVE_S3_OBJECT_LOCK_MODE` | | `GOVERNANCE` or `COMPLIANCE`. Each object gets this retention mode. The bucket must have Object Lock turned on. |
| `ARCHIVE_S3_OBJECT_LOCK_DAYS` | | The number of days to retain each object, counted from when the sink writes it. Set it with `ARCHIVE_S3_OBJECT_LOCK_MODE`. |
| `AWS_REGION` | | Required for S3. The region of the bucket. Use `auto` for Cloudflare R2. |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | | The S3 credentials. The sink also reads the other standard AWS sources: a profile, web identity (IRSA, EKS Pod Identity), or the instance role. |
| `SPLUNK_HEC_URL` | | The base URL of the HTTP Event Collector, such as `https://splunk.example.com:8088`. Setting it turns on the Splunk sink. |
| `SPLUNK_HEC_TOKEN` | | Required with `SPLUNK_HEC_URL`. The HEC token. |
| `SPLUNK_INDEX` | | The index. When empty, Splunk uses the default index of the token. |
| `SPLUNK_SOURCE` | `massdriver` | |
| `SPLUNK_SOURCETYPE` | `massdriver:cloudevent` | |
| `DD_API_KEY` | | A Datadog API key. Setting it turns on the Datadog sink. |
| `DD_SITE` | `datadoghq.com` | Your Datadog site, such as `datadoghq.eu` or `us5.datadoghq.com`. |
| `DD_LOGS_URL` | `https://http-intake.logs.<DD_SITE>` | The intake URL, for a proxy. |
| `DD_SERVICE` | `massdriver` | |
| `DD_TAGS` | | Tags for each log, such as `env:prod,team:platform`. |
| `PORT` | `8080` | |

The S3 credentials need `s3:PutObject` on the bucket. With Object Lock, they also need `s3:PutObjectRetention`.

## Event destination

The destination selects every event: no event types, no attributes, and no condition. An attribute filter would
drop the events that have no attributes, such as access token and service account events.

```bash
mass event destination create \
  --name audit-archiver \
  --url https://audit-archiver.example.com/hooks/massdriver
```

Copy the signing secret from the **Overview** tab of the destination into `MASSDRIVER_SIGNING_SECRET`.

The destination receives events that occur after you create it. To archive older events, read them with the
`auditLogs` query.

## Run

```bash
docker run -p 8080:8080 \
  -e MASSDRIVER_SIGNING_SECRET=whsec_... \
  -e ARCHIVE_S3_BUCKET=acme-massdriver-audit \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=... \
  -e AWS_SECRET_ACCESS_KEY=... \
  -e SPLUNK_HEC_URL=https://splunk.example.com:8088 \
  -e SPLUNK_HEC_TOKEN=... \
  -e DD_API_KEY=... \
  massdrivercloud/massdriver-automations:latest run audit-archiver
```

## Limits

- The automation stores the `webhook-id` header, which equals the event `id`. It does not store the
  `webhook-timestamp` header. That header is the time of the delivery attempt, not of the event.
- Each sink has 8 seconds to accept an event. A slower sink makes the event fail, and Massdriver retries it.
- The automation remembers which sinks hold an event for one hour, in memory. After a restart, or on a second
  replica, a retry writes to every sink again. S3 writes the same key. Splunk and Datadog can then hold a
  duplicate; use `webhook_id` to drop it in a search.
- In a bucket with versioning, which Object Lock needs, a redelivered event adds a version of the same key.
- Splunk responds `200` when it receives an event, before it indexes it, unless the token uses indexer
  acknowledgment. The automation does not use acknowledgment.
- The automation refuses a body larger than 1 MB. Datadog accepts a log of up to 1 MB.
- Some S3-compatible stores refuse the checksum headers of new AWS SDKs. Set
  `AWS_REQUEST_CHECKSUM_CALCULATION=when_required` for such a store. Do not set it for AWS S3 with Object Lock,
  which needs a checksum on each write.
