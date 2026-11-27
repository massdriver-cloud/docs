---
id: guides-annotations-overview
slug: /guides/annotations
title: Annotations
sidebar_label: Overview
---

# Annotations

An annotation is a note or a small feature that you pin to a project, an environment, an instance, or a line between two instances on the canvas. Annotations read values from the stash and update live when a stash value changes. You do not need to reload the page.

The stash holds small key and value entries on a project, environment, component, instance, or deployment. Deployments and scripts write them with `mass stash set`.

Annotations are an alpha feature. They can change or be removed at any time, without notice.

## Who can see an annotation

Only you can see your annotations. Other members of your organization do not see them, and you do not see theirs. Service accounts cannot have annotations.

You need `project:view` on the project to add an annotation. You can have up to 200 annotations in each project.

## Kinds of annotation

There are two kinds of annotation.

| Kind | What it shows | How you make it |
|---|---|---|
| Template | Text that you write with [Liquid](/guides/annotations/templates). The text can include stash values. It renders as markdown. | You write the template. |
| Binding | A built-in feature, such as traffic on a line, a status dot on an instance, or a banner on an environment. | You choose the stash entry that feeds each input of the feature. See the [bindings reference](/guides/annotations/bindings). |

A template annotation shows on the canvas node, line, legend, or project header that it is pinned to. A binding annotation shows as its feature. When an input of a binding is missing, expired, or has the wrong type, the feature does not show.

## Add an annotation

On an environment canvas, right-click a spot and choose an item from the **Pin annotation** menu.

| Right-click | Entity | Menu items |
|---|---|---|
| An instance | The instance | **Template note**, **Status dot**, **Usage bar** |
| A line between two instances | The link | **Template note**, **Traffic** |
| An empty part of the canvas | The environment | **Legend note**, **Header link**, **Banner** |

On a project page, click the **+** button next to the project name to add a template note to the project header.

To change or delete an annotation, click it. For a header link, right-click it. For a banner, click its menu button.

## Where the values come from

Annotations read values from the stash of the project, the environment, the component, the instance, and the instances at each end of a line. A deployment, a script, or the `mass stash set` command writes these values. For example:

```bash
mass stash set billing-dev-app.owner "payments-team"
```

Sensitive stash values are never available to annotations. A sensitive key renders as empty in a template, and a binding input that points to a sensitive key is not found.

Stash entries that have a label also show as [metadata](/guides/annotations/metadata) to everyone who can view the project.
