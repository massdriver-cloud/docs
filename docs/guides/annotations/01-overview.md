---
id: guides-annotations-overview
slug: /guides/annotations
title: Annotations
sidebar_label: Overview
---

# Annotations

Annotations show stash values on the canvas and in the project header. They update live when a stash value changes. You do not need to reload the page.

The stash holds small key and value entries on a project, environment, component, instance, or deployment. Deployments and scripts write them with `mass stash set`.

Annotations are an alpha feature. They can change or be removed at any time, without notice.

## Notes and widgets

There are two kinds of annotation.

| Kind | What it shows | How you make it |
|---|---|---|
| Note | Text that you write with [Liquid](/guides/annotations/notes). The text can include stash values. It renders as markdown. | You pin it and write the text. |
| Widget | A built-in picture, such as traffic on a line, a status dot on an instance, or a banner on an environment. | It shows on its own when the stash has a well-known `md/` key. You can also pin your own and choose the stash entries that feed it. See [Widgets](/guides/annotations/widgets). |

A note shows on the canvas node, line, legend, or project header that it is pinned to. A widget shows only when each of its required inputs has a valid value.

## Who can see an annotation

Only you can see the notes and widgets that you pin. Other members of your organization do not see them, and you do not see theirs. Service accounts cannot pin annotations. You need `project:view` on the project to pin one. You can pin up to 200 annotations in each project.

Automatic widgets are different. When a stash has a well-known `md/` key with a valid value, everyone who can view the project sees its widget.

When you pin a widget in the same spot as an automatic one, you see your widget instead. If your widget has no value, you see the automatic one.

To hide automatic widgets, click the **Widgets** button in the canvas toolbar, after the inactive instances button. The setting is saved in your browser and applies only to you. Your pinned widgets still show.

## Pin an annotation

On an environment canvas, right-click a spot.

| Right-click | Entity | Menu items |
|---|---|---|
| An instance | The instance | **Pin note**, **Add widget** > **Status dot**, **Usage bar** |
| A line between two instances | The link | **Pin note**, **Add widget** > **Traffic** |
| An empty part of the canvas | The environment | **Pin note**, **Add widget** > **Header link**, **Banner** |

On a project page, click the **+** button next to the project name to pin a note to the project header.

To change or delete a note, click it. To change or delete a pinned widget, click it. For a header link, right-click it. For a banner, click its menu button.

## Where the values come from

Annotations read values from the stash of the project, the environment, the component, the instance, and the instances at each end of a line. A deployment, a script, or the `mass stash set` command writes these values. For example:

```bash
mass stash set billing-dev-app.owner "payments-team"
```

Sensitive stash values are never available to annotations. A sensitive key renders as empty in a note, and a widget input that points to a sensitive key is not found.

Stash entries that have a label also show as [metadata](/guides/annotations/metadata) to everyone who can view the project.
