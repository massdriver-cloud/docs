---
id: guides-annotations-overview
slug: /guides/annotations
title: Annotations
sidebar_label: Overview
---

# Annotations

:::caution Alpha
This feature is alpha. Names, fields, and behavior can change or be removed at any time without notice.
:::

Annotations show [stash](/guides/stash) values in the Massdriver UI: on the environment canvas, in the environment header, and in the project header. Use them to see the state of your infrastructure where you already work, such as the health of an instance, the traffic between two instances, or the owner of a service. They update when a stash value changes. You do not need to reload the page.

## Choose a tool

| You want | Use | Who sees it | Setup |
|---|---|---|---|
| A built-in picture for everyone, such as a status dot, a usage bar, traffic, a banner, or header links | An automatic widget: write a well-known [`md/v1/` key](/guides/stash/well-known-keys) | Everyone with `stash:view` on the stash | None. The widget shows when the key has a valid value. |
| A built-in picture that reads your own keys | A [widget that you add](/guides/annotations/widgets#inputs-of-a-widget-that-you-add): choose a stash entry for each input | Only you | Right-click the canvas and choose **Add widget** |
| Your own text with stash values in it | A [note](/guides/annotations/notes): Liquid text that renders as markdown | Only you | Right-click the canvas and choose **Pin note** |
| A list of values on the Metadata panels | A labeled stash entry: write the entry with `--label` | Everyone with `stash:view` on the stash | None. See [Metadata](/guides/annotations/metadata). |

Notes and widgets that you add are yours. Other members of your organization do not see them, and you do not see theirs. Service accounts cannot add them. You need `project:view` on the project to add one. You can have up to 200 in each project.

## Add a widget from your own keys

This example shows a status dot on an instance from a key named `status/health`.

1. Write the key:

   ```bash
   mass alpha stash set billing-dev-app.status/health degraded
   ```

2. Open the environment canvas. Right-click the `billing-dev-app` instance node.
3. Choose **Add widget** > **Status dot**.
4. Optional: open **Data this widget reads** to see the inputs, the automatic `md/v1/` key, and example keys.
5. In the `state` row, set **Stash** to `instance` and **Key** to `status/health`. Leave **Path** empty. The status column shows `✓ degraded`.
6. Click **Add widget**.

**What you see:** an amber dot in the header of the instance node. Hover over it to see `Health: degraded` and when the value was last updated. Click the dot to see **Edit** and **Delete**.

## Pin a note

This example shows the owner of an instance.

1. Write the key:

   ```bash
   mass alpha stash set billing-dev-app.owner payments-team
   ```

2. Right-click the `billing-dev-app` instance node and choose **Pin note**.
3. Under **Show on**, keep **Canvas node** selected.
4. On the right, set **Stash** to **Instance**, then click `owner` to insert its tag. You can also type the note:

   ```liquid
   Owner: {{ instance.stash["owner"] | default: "not set" }}
   ```

5. Check the **Preview**. It shows `Owner: payments-team`.
6. Click **Pin**.

**What you see:** a pin icon on the instance node. Hover over the pin to read the note. Click the pin to keep the card open. The card has buttons to edit and delete the note.

## Where you can add notes and widgets

| Right-click on the environment canvas | Menu items | Note shows on |
|---|---|---|
| An instance node | **Pin note**, **Add widget** > **Status dot**, **Usage bar** | **Canvas node**: a pin on the node |
| A line between two instances | **Pin note**, **Add widget** > **Traffic** | **Canvas link**: a pin on the line |
| An empty part of the canvas | **Pin note**, **Add widget** > **Header link**, **Banner** | **Canvas legend**: a card in the canvas legend |

On a project page, click the **+** button next to the project name to pin a note to the **Project header**.

## Edit or delete

| What | How |
|---|---|
| A note on a node, a line, or the project header | Click its pin. In the card, use the edit or delete button. |
| A note in the canvas legend | Use the edit or delete button on its card. |
| A status dot, a usage bar, or traffic that you added | Click it, then choose **Edit** or **Delete**. |
| A header link that you added | Right-click it, then choose **Edit** or **Delete**. |
| A banner that you added | Click its menu button, then choose **Edit** or **Delete**. |

An automatic widget comes from a stash key. To change it, set the key again. To remove it, delete the key.

## Show or hide automatic widgets

Click the **Widgets** button in the canvas toolbar, after the inactive instances button. When it is off, automatic widgets, the widgets and deployment results on the instance **Metadata** tab, and the canvas warning badge do not show. Your own widgets and notes still show. The setting is saved in your browser and applies only to you.

When you add a widget in the same place as an automatic one, you see your widget. If your widget has no value, you see the automatic one.

## Troubleshooting

| Problem | Cause | What to do |
|---|---|---|
| A widget that you added shows nothing | A required input's key has no value, has expired, or is sensitive. The widget editor shows **No value yet**. | Write the key, without `--sensitive`. If it has a TTL, write it again before it expires. The widget shows when the value arrives. |
| A widget that you added shows nothing | The value has the wrong type, or the path is not in the JSON value. The widget editor shows the reason, such as **Not a number** or **Path not found**. | Fix the value, or choose another path. |
| An automatic widget does not show | The **Widgets** button is off. | Click **Widgets** in the canvas toolbar. |
| An automatic widget does not show | The `md/v1/` key has no value, or it expired. | Check the key with `mass alpha stash get`. |
| A note is empty | The key is missing, expired, or sensitive. | Write the key. Use the `default` filter to show text when the value is missing. |
| The key list in an editor is empty | The stash has no entries. The widget editor shows **This stash has no entries yet**. The note editor shows **No keys in this stash.** | Type the key in the widget editor's **Key** field, or write the key first. |

Sensitive stash values are never available to notes or widgets. A sensitive key is empty in a note, and a widget input that points to it shows **No value yet**.

## More

- [Notes](/guides/annotations/notes): Liquid, the stash values that a note can read, and examples.
- [Widgets](/guides/annotations/widgets): each widget, its key, and what it looks like.
- [Metadata](/guides/annotations/metadata): labeled entries and results on the Metadata panels.
- [Stash](/guides/stash): how to write the values that annotations show.
