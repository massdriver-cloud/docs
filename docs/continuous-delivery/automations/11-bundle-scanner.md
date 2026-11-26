---
id: automation-bundle-scanner
slug: /continuous-delivery/automations/bundle-scanner
title: bundle-scanner
sidebar_label: bundle-scanner
description: Scan each new bundle version with Trivy and Checkov.
image: /img/og/automation-bundle-scanner.png
---

When a new bundle version is published, pull it from the Massdriver OCI registry and scan its IaC with
[Trivy](https://trivy.dev) (`trivy config`) and [Checkov](https://www.checkov.io). Post a summary of the findings
to a Slack incoming webhook.

The `repo.published` event names the bundle but not the version. The automation scans the newest version of the
bundle that was published at or before the time of the event.

A version fails when a finding has the severity in `SCAN_FAIL_SEVERITY` or higher. Checkov reports no severity
without a Prisma Cloud API key, so its findings count as `unrated` and do not fail a version. The Slack message
has the count for each severity and lists the first 10 findings that cause a failure.

Scans run one at a time, after the automation responds to Massdriver. Each bundle version is scanned once.

### Scan attribute

Set `SCAN_ATTRIBUTE_KEY` to record the result on the bundle's repo as the attribute `<key>=passed` or
`<key>=failed`. The automation keeps the repo's other attributes. A scan that cannot finish does not change the
attribute.

The attribute is on the repo, not on the bundle version, so it shows the result of the newest scanned version
only. Bundle versions do not carry attributes of their own. Repo attributes do not cascade to instances, so a
policy on `instance:deploy` cannot use the attribute to block a deploy of a failed version. Use the attribute to
find failed bundles, and use the Slack message to act.

## Configuration

| Variable | Default | |
|---|---|---|
| `MASSDRIVER_ORGANIZATION_ID` | | Required. Your organization's identifier. |
| `MASSDRIVER_API_KEY` | | Required. An `md_` access token of a service account. |
| `MASSDRIVER_SIGNING_SECRET` | | Required. The `whsec_` signing secret of the event destination. |
| `MASSDRIVER_URL` | `https://api.massdriver.cloud` | The URL of your Massdriver installation. The registry is at the same URL. |
| `SLACK_WEBHOOK_URL` | | A Slack incoming webhook URL. Without it, results go to the logs only. |
| `SCANNERS` | `trivy,checkov` | The scanners to run, separated by commas. |
| `SCAN_FAIL_SEVERITY` | `HIGH` | `UNKNOWN`, `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`. |
| `SCAN_ATTRIBUTE_KEY` | | The repo attribute that records the result. Leave it empty to not set an attribute. |
| `SCAN_TIMEOUT` | `10m` | The longest time for one bundle version: pull and every scanner. |
| `PORT` | `8080` | |

The service account needs `repo:view` and `repo:pull` on the bundle repos. With `SCAN_ATTRIBUTE_KEY`, it also
needs `repo:update`, and the key must be a custom attribute of your organization for repos.

A `.checkov.yml` at the root of the bundle applies to the Checkov scan. Trivy uses the checks built into its
pinned version.

## Event destination

Requires [mass](/reference/cli/overview) 2.6.0 or later.

```bash
mass event destination create \
  --name bundle-scanner \
  --url https://bundle-scanner.example.com/hooks/massdriver \
  --event-type repo.published \
  --condition '.data.entity.artifact_type == "application/vnd.massdriver.bundle.v1+json"'
```

To scan one bundle only, add `--attribute md-repo=aws-aurora`.

Copy the signing secret from the destination's **Overview** tab into `MASSDRIVER_SIGNING_SECRET`.

## Run

The scanners are not in the `massdriver-automations` image. Build the image that adds them, from the root of the
repository:

```bash
docker build -f automations/bundle-scanner/Dockerfile -t bundle-scanner .
docker run -p 8080:8080 \
  -e MASSDRIVER_ORGANIZATION_ID=acme \
  -e MASSDRIVER_API_KEY=md_... \
  -e MASSDRIVER_SIGNING_SECRET=whsec_... \
  -e SLACK_WEBHOOK_URL=https://hooks.slack.com/services/... \
  bundle-scanner
```

The image pins Trivy 0.76.1 and Checkov 3.4.3. Change the versions in the `Dockerfile`.

## Limits

- The queue holds 100 bundle versions, in memory. When it is full, the automation responds `500`, and Massdriver
  sends the event again later. A restart loses the queue.
- Duplicate events are dropped by id for one hour, and each version is scanned once per process. Run one replica.
- A failed pull or scanner is posted to Slack and logged. Massdriver does not send the event again.
- A bundle larger than 512 MiB is not scanned.
