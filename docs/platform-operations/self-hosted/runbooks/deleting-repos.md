---
id: self-hosted-runbook-deleting-repos
slug: /platform-operations/self-hosted/runbooks/deleting-repos
title: "Deleting a Repo or Resource Type"
sidebar_label: Deleting a Repo or Resource Type
---

The Massdriver bundle registry is **immutable by design**: once a bundle version is published, that version cannot be overwritten or individually deleted, so what is running in your environments is exactly what was published.

Deleting a **whole repo** is first-class. From a repo's **Settings → Danger zone** in the UI, or the `deleteOciRepo` API mutation, you can delete a repo and all of its published versions. It requires the `repo:delete` permission and is refused while the repo is still in use — placed on a project canvas, or deployed. Resource-type repos delete the same way.

Deleting a **single published version** is not yet available; it is planned (yanking), along with archiving and renaming repos.
