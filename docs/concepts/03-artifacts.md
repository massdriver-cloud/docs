---
id: concepts-artifacts
slug: /concepts/artifacts
title: Artifacts
sidebar_label: Artifacts
---

## Overview

Artifacts are resources created by a [deployment](/concepts/deployments) that adhere to a specific type ([artifact definition](/concepts/artifact-definitions)) and can be attached to other bundles.

Artifacts are the _output_ of provisioning and the _input_ connections to downstream bundles.

Artifacts have two top-level fields:

* `data` - secret or sensitive information about what was provisioned. This may contain Cloud IDs, IAM configuration, and authentication secrets.
* `specs` - non-sensitive data used to filter and search for artifacts.

## Artifact ID

If you need to reference an artifact, you can use the artifact's ID. The artifact ID is a UUID that is generated when the artifact is created.

To find this value, click on `Artifacts` in the sidebar, select the artifact you want to reference, and click on `Copy Artifact ID` in the top right corner of the artifact's page.