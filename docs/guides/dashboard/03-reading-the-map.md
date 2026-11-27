---
id: guides-dashboard-reading-the-map
slug: /guides/dashboard/reading-the-map
title: Reading the Map
sidebar_label: Reading the Map
---

# Reading the Map

:::caution Alpha
This feature is alpha. Names, fields, and behavior can change or be removed at any time without notice.
:::

Press `?` on the map to see a short version of this page in the side panel.

## What is in view

The map holds one neighborhood of your organization, not all of it:

- **The focus.** The environment named with `--env`, or else the environment of the most recent deployment.
- **Its neighbors**, out to `--depth` hops (1 by default). A neighbor is an environment whose resources an instance uses, an environment that uses this environment's resources through a remote reference or an environment default, or the environment this one was forked from.

| Label | Meaning |
|---|---|
| **not loaded** | One hop past the edge. A loaded environment links to it. Select it to move the focus there. |
| **no access** | An instance in view uses a resource from this environment, but you cannot view the environment. |

The focus moves when a selection rests for a moment, when you press `enter`, and when a search moves it. Every node glides from its old place to its new one.

## What moves

| Mark | Meaning |
|---|---|
| Sparks along a link | Resources flowing from the environment that produces them to the environment that uses them. With traffic from `md/traffic`, the rate sets how many sparks run and how fast. |
| Red or amber sparks | Errors on the link: amber for 1 to 9, red for 10 or more |
| Ring around an environment | The environment's instances by status, as arcs: green provisioned, red failed, blue not deployed, gray decommissioned |
| Red pulse | An alarm is firing in the environment |
| Comet around a ring | A provision or decommission is running or queued. A plan does not count. |
| Ripple with floating text | Something just happened there: an audit log event or a stash change. The text is the event or the stash key. |
| Spinning white and teal halo | The selected environment |
| Closing rings and crosshairs | `--watch` just took the view to a new alarm |
| Twinkling stars, falling streams, or a grid | The palette's backdrop |

## Badges and labels

| Mark | Meaning |
|---|---|
| `▲N` | N alarms firing |
| `↑N` | N instances can upgrade |
| `⚑` | The environment has a banner |
| `1.2k/s 340ms ✕12` on a link | Requests per second, p95 latency, and errors in the last 5 minutes, from `md/traffic` |
| `stale` on a link | No traffic report for 10 minutes |
| Banner across the top line | The selected environment's banner, or else the most urgent banner in view: error, then warning, then info |

## Blast radius

With blast radius on (`b`), everything downstream of the selected environment lights up by how many hops away it is:

| Color | Hops |
|---|---|
| Red | The source |
| Orange | 1 hop |
| Yellow | 2 or more hops |

The links between them take the same colors. When the selected environment has a firing alarm, the blast radius starts at the alarming instance rather than the whole environment.

## Themes

`--theme` sets how the map is drawn, and `v` switches themes while the dashboard runs.

| Theme | Layout | How links are drawn |
|---|---|---|
| `constellation` | A force layout. Environments that share resources pull together, and the focus holds the center. | Curved lines with sparks |
| `metro` | A band for each project, and a column for each layer of producers, so resources flow left to right | Track drawn with box characters, with sparks running down it. Each project's line has its own color. |
| `radar` | The focus at the center of a scope. Each environment sits on the ring as many hops out as it is, and environments the focus cannot reach sit on the edge. | Straight lines. A sweep turns around the scope, and blips light up as it passes them. |

In `metro`, a station shows as `◉` in its environment's health color. It blinks red while an alarm fires and spins while a deployment runs.

## Palettes

`--palette` sets the colors and the backdrop. Red, orange, and yellow mean alarms, warnings, and the blast radius in every palette.

| Palette | Backdrop |
|---|---|
| `night` | A starfield |
| `rain` | Falling green streams |
| `blueprint` | A drafting grid |

## Toggles

| Key | Toggle |
|---|---|
| `b` | Blast radius |
| `a` | Instances as dots around each environment. Applications are larger dots. |
| `c` | Rings sized by last month's spend, and the spend under each name |
| `g` | Project names colored by project, and each project's environments pulled together |
| `s` | Producers stacked above the environments that use their resources |
| `v` | The next theme |

The footer shows each toggle with `●` when it is on and `○` when it is off.
