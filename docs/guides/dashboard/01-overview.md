---
id: guides-dashboard-overview
slug: /guides/dashboard
title: Massdriver Constellation
sidebar_label: Overview
---

# Massdriver Constellation

:::caution Alpha
This feature is alpha. Names, fields, and behavior can change or be removed at any time without notice.
:::

Massdriver Constellation is a live map of your organization in the terminal. It shows your environments, the resources they share, what is firing, what is deploying, what is waiting for approval, what can upgrade, and what your deployments and scripts write to the stash, as it happens. You can approve, reject, and redeploy from it, follow a deployment's logs, and write up an incident when one ends.

Massdriver Constellation runs in your terminal with `mass dashboard`. The command is not in a released version of `mass` yet. It will be available in a future `mass` release.

## Quick start

```bash
mass dashboard
```

The map centers on the environment with your organization's most recent deployment. To center on a specific environment, name it:

```bash
mass dashboard --env billing-dev
```

Use a profile the same way as every other `mass` command:

```bash
mass dashboard --profile production
```

To look without being able to change anything, turn off approving, rejecting, and deploying:

```bash
mass dashboard --read-only
```

Press `?` on any tab to see what the marks and keys mean. Quit with `q` or `ctrl+c`.

## The screen

From top to bottom:

| Part | What it shows |
|---|---|
| Header | Your organization, the five tabs, and counts for what is in view: environments, projects, monthly cost, upgrades, deployments in flight, when the organization was last read, and how many instances are alarming |
| Map | The environment in focus and the environments around it. A banner from the stash runs across its top line. |
| Side panel | The selected environment: its instances, alarms, deployments, banner, links, notes, neighbors, and blast radius, or the logs of a deployment you follow. It hides on terminals narrower than 90 columns. |
| Ticker | The newest events from the audit log and the stash, newest first |
| Key line | The keys that do something where you are: on the tab, for the picked instance, for the selected deployment, or in the logs you follow. `?` lists every key. Messages such as "✓ approved …" show here for a few seconds. |

## Tabs

| Key | Tab | What it shows |
|---|---|---|
| `1` | Constellation | The map. See [Reading the map](/guides/dashboard/reading-the-map). |
| `2` | Runtimes | Which runtime versions your applications build on and your instances run, and what a release would leave behind |
| `3` | Alarms | Every firing alarm in view, and how far its blast radius reaches |
| `4` | Upgrades | Every instance in view that can move to a newer bundle version |
| `5` | Deployments | Deployments awaiting approval, in flight, and recently finished, to approve, reject, inspect, or follow |

## Where to go next

- [Tour](/guides/dashboard/tour) walks through Massdriver Constellation one feature at a time, against your own organization.
- [Reading the map](/guides/dashboard/reading-the-map) covers every mark, color, and animation, and the four themes.
- [Stash and annotations](/guides/dashboard/stash-and-annotations) covers the widgets and notes your deployments and scripts write.
- [Reference](/guides/dashboard/reference) lists every flag and key.
