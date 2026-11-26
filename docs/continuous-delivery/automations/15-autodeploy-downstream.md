---
id: automation-autodeploy-downstream
slug: /continuous-delivery/automations/autodeploy-downstream
title: autodeploy-downstream
sidebar_label: autodeploy-downstream
description: Deploy the dependents of an instance after it deploys.
image: /img/og/automation-autodeploy-downstream.png
---

When an instance finishes a `PROVISION` deployment, deploy each instance that depends on it and has the
attribute `autodeploy=true`.

Set the attribute on a component to opt that component in across every environment. Set it on an
environment or a project to opt in everything below it. The key must be a declared
[custom attribute](/platform-operations/security/access-control#custom-attributes) with the value `true`.

An instance depends on the upstream when one of its dependencies resolves to a resource that the upstream
produces. All three sources count:

- a link on the project blueprint
- an environment default, in any environment
- a remote reference, in any project

The automation skips an instance that is not `PROVISIONED`, so it never creates infrastructure for the first time.

A downstream deploy that completes sends its own `deployment.completed` event, so changes cascade through
the graph one level at a time.

## Configuration

| Variable | Default | |
|---|---|---|
| `MASSDRIVER_ORGANIZATION_ID` | | Required. Your organization's identifier. |
| `MASSDRIVER_API_KEY` | | Required. An `md_` access token of a service account. |
| `MASSDRIVER_SIGNING_SECRET` | | Required. The `whsec_` signing secret of the event destination. |
| `MASSDRIVER_URL` | `https://api.massdriver.cloud` | The URL of your Massdriver installation. |
| `AUTO_DEPLOY_ATTR_KEY` | `autodeploy` | The attribute key that opts an instance in. |
| `AUTO_DEPLOY_ATTR_VALUE` | `true` | The attribute value that opts an instance in. |
| `PORT` | `8080` | |

The service account needs `instance:deploy` on the downstream instances, and view access to their projects.

## Event destination

Requires [mass](/reference/cli/overview) 2.6.0 or later.

```bash
mass event destination create \
  --name autodeploy-downstream \
  --url https://autodeploy.example.com/hooks/massdriver \
  --event-type deployment.completed \
  --condition '.data.metadata.deployment_action == "PROVISION"'
```

The condition drops `PLAN` and `DECOMMISSION` deployments, so Massdriver marks them `SKIPPED` and does not send
them. To act on one environment only, add `--attribute md-environment=prod`.

Copy the signing secret from the destination's **Overview** tab into `MASSDRIVER_SIGNING_SECRET`.

## Run

```bash
docker run -p 8080:8080 \
  -e MASSDRIVER_ORGANIZATION_ID=acme \
  -e MASSDRIVER_API_KEY=md_... \
  -e MASSDRIVER_SIGNING_SECRET=whsec_... \
  massdrivercloud/massdriver-automations:latest run autodeploy-downstream
```

## Limits

- Duplicate events are dropped by id for one hour, in memory. Run one replica.
- The automation responds before it deploys. A failed deploy is logged, and Massdriver does not retry it.
- Each downstream deploys with its saved params and its current version constraint.
