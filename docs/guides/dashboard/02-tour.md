---
id: guides-dashboard-tour
slug: /guides/dashboard/tour
title: Tour
sidebar_label: Tour
---

# Tour

:::caution Alpha
This feature is alpha. Names, fields, and behavior can change or be removed at any time without notice.
:::

This tour uses your own organization. Some steps write to the stash of an environment and an instance, so pick ones you can change, for example a development environment. The examples use `billing-dev` and its instance `billing-dev-app`. Put your own ids in their place.

Use a terminal at least 120 columns wide, so the side panel shows next to the map.

## 1. Open the dashboard

```bash
mass dashboard --env billing-dev
```

The environments fly out from the center into place, and then the links between them draw in. `billing-dev` sits in the middle with a spinning white and teal halo, because it is both the focus and the selection.

The header counts what is in view. The map does not hold your whole organization. It holds `billing-dev`, the environments whose resources it uses, the environments that use its resources, and the environment it was forked from. That is one hop. Read further out with `--depth`:

```bash
mass dashboard --env billing-dev --depth 2
```

Environments one hop past the edge show as dim rings labeled **not loaded**. Environments you cannot view show as **no access**.

## 2. Move around

Press the arrow keys, or `h`, `j`, `k`, and `l`. The selection jumps to the nearest environment in that direction. `tab` and `shift+tab` step through every environment, top to bottom.

The side panel follows the selection. It lists the environment's instances, any firing alarms with their messages, the environments it uses resources from and the ones it feeds, and its blast radius.

Rest on an environment for a moment. It becomes the new focus. The map reads what is around it, every node glides to its new place, and environments that were not loaded come into frame from the new focus. Press `enter` to move the focus at once.

## 3. Find an environment

Press `/` and type part of a name, an id, a project, or an instance id. The selection jumps to the first match in view, and the other environments dim.

Press `enter`. When nothing in view matches, the dashboard searches every environment in your organization and moves the focus to the best match: an exact id first, then an id that starts with your text, then any name, id, or project that contains it.

Press `esc` to clear the search.

## 4. Follow the resources

Each link is drawn from the environment that produces a resource to the environment that uses it. Sparks run along each link in that direction. A link with more resources carries more sparks.

Press `b` to turn the blast radius on or off. With it on, everything downstream of the selected environment lights up: red at the source, orange one hop away, and yellow further out. When the selected environment has a firing alarm, the blast radius starts at the alarming instance, not the whole environment.

Turn on more detail:

| Key | What it adds |
|---|---|
| `a` | Each instance as a dot around its environment. Applications are larger dots. |
| `c` | Each ring sized by last month's spend, and the spend under each name |
| `g` | Project names colored by project, and each project's environments pulled together |
| `s` | Producers stacked above the environments that use their resources |

## 5. Change the theme

Press `v` to switch how the map is drawn:

- **constellation** scatters environments like stars, pulled together by the resources they share.
- **metro** draws environments as stations on transit lines: a band for each project, producers on the left, and sparks running down the track to their consumers.
- **radar** puts the focus at the center of a sweeping scope, with each environment on the ring as many hops out as it is. Blips light up as the sweep passes them.

Press `p` to switch colors. Start in a theme with `--theme`, and pick colors with `--palette`:

```bash
mass dashboard --theme radar --palette rain
```

## 6. Write to the stash and watch it land

The dashboard streams the stash, so each key shows the moment it is set. Open a second terminal and set a few [well-known keys](/guides/stash/well-known-keys):

```bash
mass stash set billing-dev-app.md/v1/health degraded
```

Within a few seconds, a yellow line lands on the ticker, `billing-dev` ripples, and `md/v1/health` floats up out of it. Under `app` in the side panel, the dot turns amber and the word **degraded** appears.

Give the instance some traffic:

```bash
mass stash set billing-dev-app.md/v1/traffic '{"rps": 1200, "errors_5m": 12, "p95_ms": 340}' --format json
```

The links that leave `billing-dev` pick up a label like `1.2k/s 340ms ✕12`. The sparks speed up, and some turn red, because 10 or more errors is many. With 1 to 9 errors they turn amber.

Put up a banner and some links:

```bash
mass stash set billing-dev.md/v1/banner '{"message": "Ledger failover test tonight", "level": "warning"}' --format json
mass stash set billing-dev.md/v1/links '{"links": [{"label": "Grafana", "url": "https://grafana.example.com"}]}' --format json
```

The banner runs across the top of the map in amber, and a ⚑ appears next to `billing-dev`. `↗ Grafana` appears under the environment's name in the side panel. In terminals that support links, such as iTerm2, Ghostty, WezTerm, and kitty, you can click it.

Show a usage bar:

```bash
mass stash set billing-dev-app.md/v1/usage '{"value": 86, "max": 100, "label": "connections"}' --format json
```

The bar is amber from 80% and red from 95%.

Set the health back when you are done:

```bash
mass stash set billing-dev-app.md/v1/health healthy
```

See [Stash and annotations](/guides/dashboard/stash-and-annotations) for every widget, and for the notes and widgets you pin yourself.

## 7. Check your runtimes

Press `2`. Each runtime has a bar that shows how its instances split across runtime versions: green on the latest version, yellow a patch behind, orange a minor behind, and red a major behind.

Use `↑` and `↓` to pick a runtime. Press `p`, `m`, or `M` to see what a patch, minor, or major release would leave behind. Press `0` to go back.

## 8. Find what is firing and what can upgrade

Press `3` for every firing alarm in view, with how long it has fired and how much depends on its instance. Press `4` for every instance that can move to a newer bundle version.

On either tab, press `enter` to show the selected row on the map with its blast radius, or `o` to open it in the Massdriver web app.

## 9. Replay the last hour

Press `1` to go back to the map, then press `t`. Pick how far back to go with `←` and `→`, from 5 minutes to 24 hours, and press `enter`.

The audit log plays back onto the map in order. Each event ripples its environment and floats its name up. The ticker shows the time being replayed and a progress bar. Press `]` to speed up, `[` to slow down, and `space` to pause. Press `t` to stop.

A replay of any window finishes in under a minute at its starting speed.

## 10. Leave it on a screen

```bash
mass dashboard --watch
```

With `--watch`, the dashboard reacts to a new alarm on its own:

1. It switches to the map and selects the alarm's environment.
2. Rings and crosshairs close in on the environment, and its blast radius lights up.
3. A red banner across the top names the alarm, its instance, its environment, and how much is downstream, and counts how long it has fired.
4. The terminal rings its bell and shows a desktop notification.

Press `esc` to put the banner away. When the alarm clears, the banner turns green and says how long it lasted. A few seconds later, the view goes back to where it was, unless you moved it during the incident.

Alarms that were already firing when the dashboard started do not count as new.

## 11. Use it in a script

When the output is not a terminal, `mass dashboard` prints the environments, firing alarms, and runtimes in view as tables:

```bash
mass dashboard --env billing-dev | less
```
