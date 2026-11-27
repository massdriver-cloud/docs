---
id: guides-dashboard-overview
slug: /guides/dashboard
title: Terminal Dashboard
sidebar_label: Overview
---

# Terminal Dashboard

:::caution Alpha
This feature is alpha. Names, fields, and behavior can change or be removed at any time without notice.
:::

`mass dashboard` is a live map of your organization in the terminal. It shows your environments, the resources they share, what is firing, what is deploying, what can upgrade, and what your deployments and scripts write to the stash, as it happens.

The `mass dashboard` command is not in a released version of `mass` yet. It will be available in a future `mass` release.

## Start it

```bash
mass dashboard
```

The dashboard centers on the environment with your organization's most recent deployment. To center on a specific environment, name it:

```bash
mass dashboard --env billing-dev
```

Use a profile the same way as every other `mass` command:

```bash
mass dashboard --profile production
```

Quit with `q` or `ctrl+c`.

## The screen

From top to bottom:

| Part | What it shows |
|---|---|
| Header | Your organization, the four tabs, and counts for what is in view: environments, projects, monthly cost, upgrades, deployments in flight, when the dashboard last read the organization, and how many instances are alarming |
| Map | The environment in focus and the environments around it. A banner from the stash runs across its top line. |
| Side panel | The selected environment: its instances, alarms, banner, links, notes, neighbors, and blast radius. It hides on terminals narrower than 90 columns. |
| Ticker | The newest events from the audit log and the stash, newest first |
| Footer | The keys for the tab you are on. Messages such as "opened …" show here for a few seconds. |

Press `?` on any tab to see what the marks and colors mean.

## Tabs

| Key | Tab | What it shows |
|---|---|---|
| `1` | Constellation | The map. See [Reading the map](/guides/dashboard/reading-the-map). |
| `2` | Runtimes | Which runtime versions your applications build on and your instances run, and what a release would leave behind |
| `3` | Alarms | Every firing alarm in view, and how far its blast radius reaches |
| `4` | Upgrades | Every instance in view that can move to a newer bundle version |

## Where to go next

- [Tour](/guides/dashboard/tour) walks through the dashboard, one feature at a time, against your own organization.
- [Reading the map](/guides/dashboard/reading-the-map) explains every mark, color, and animation, and the three themes.
- [Stash and annotations](/guides/dashboard/stash-and-annotations) shows how the dashboard draws the widgets and notes your deployments and scripts write.
- [Reference](/guides/dashboard/reference) lists every flag and key.
