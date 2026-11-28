---
id: guides-dashboard-reference
slug: /guides/dashboard/reference
title: Massdriver Constellation Reference
sidebar_label: Reference
---

# Massdriver Constellation Reference

:::caution Alpha
This feature is alpha. Names, fields, and behavior can change or be removed at any time without notice.
:::

## Command

```bash
mass dashboard [flags]
```

## Flags

| Flag | Default | What it does |
|---|---|---|
| `--env` | The environment of the most recent deployment | The environment to center on, by id |
| `--depth` | `1` | How many hops from the focus to read |
| `--refresh` | `30s` | How often to read the organization again. `0` reads it once. |
| `--events` | `5s` | How often to read new audit log events. `0` turns the ticker off. |
| `--stash` | `3s` | How often to read the stash when it cannot be streamed: with a service account, while a stream reconnects, or with more than 20 environments in view. `0` reads it with each refresh. |
| `--watch` | Off | Jump to any alarm that starts firing in view, and send a desktop notification |
| `--theme` | `constellation` | How the map is drawn: `constellation`, `metro`, `radar`, or `plain` |
| `--palette` | `night` | Colors and backdrop: `night`, `rain`, or `blueprint` |
| `--render` | `braille` | How the map's dots are drawn: `braille` dots, or solid `blocks` for terminals that draw block characters themselves, such as Ghostty |
| `--read-only` | Off | Turn off approving, rejecting, and deploying |
| `--playback` | None | Replay an incident recording written with `w`, offline. Takes the path to the `.json` file. |
| `--profile` | The active profile | The configuration profile to sign in with |

With `--playback`, only `--theme`, `--palette`, and `--render` apply. A playback reads nothing from Massdriver and is always read-only.

## Keys

### Everywhere

| Key | What it does |
|---|---|
| `1` to `5` | Switch tabs: Constellation, Runtimes, Alarms, Upgrades, Deployments |
| `←` `↑` `↓` `→`, or `h` `j` `k` `l` | Move the selection |
| `tab`, `shift+tab` | Step through the list |
| `o` | Open the selection in the Massdriver web app: the environment on the map, the runtime on Runtimes, and the instance on Alarms, Upgrades, and Deployments |
| `w` | Write up an incident: the one behind the selected alarm or environment, or else the most recent |
| `r` | Read the organization again now |
| `?` | Show or hide the help for the tab |
| `esc` | Clear the search, close the help, close the logs, or put away an incident banner |
| `q`, `ctrl+c` | Quit |

### Constellation

| Key | What it does |
|---|---|
| `enter` | Move the focus to the selection now |
| `/` | Find an environment, in view or anywhere in the organization |
| `f` | Follow the selected environment's deployment logs: the one running, or else the most recent. `f` again closes them. |
| `n`, `N` | Pick the next or previous instance in the side panel |
| `y` | Approve the picked instance's deployment awaiting approval |
| `d` | Deploy the picked instance again with its current configuration |
| `t` | Replay the audit log |
| `e` | Save the map as an SVG in the current directory |
| `b` `a` `c` `g` `s` | Toggles. See [Reading the map](/guides/dashboard/reading-the-map#toggles). |
| `v` | The next theme |
| `p` | The next palette |

### Search

| Key | What it does |
|---|---|
| Any text | Select the first environment in view that matches |
| `backspace` | Delete a character |
| `enter` | Move the focus to the match, or search the whole organization when nothing in view matches |
| `esc` | Cancel the search and go back to the earlier selection |

### Replay

| Key | What it does |
|---|---|
| `←` `→` | Choose how far back, from 5 minutes to 24 hours |
| `enter`, `space` | Start the replay |
| `esc` | Cancel before it starts |
| `space` | Pause or resume. At the end, start over. |
| `[` `]` | Slower or faster, from 1 to 16 events a step |
| `t` | Stop |

A replay reads up to the newest 1,000 events in its window. When the window holds more, the ticker says **newest 1000 only**.

`space`, `[`, and `]` also control a `--playback` replay.

### Runtimes

| Key | What it does |
|---|---|
| `↑` `↓` | Choose a runtime |
| `p` `m` `M` | Show what a patch, minor, or major release would leave behind |
| `0` | Show the runtime as it is |
| `o` | Open the runtime in the web app |

### Alarms and Upgrades

| Key | What it does |
|---|---|
| `↑` `↓` | Choose a row |
| `enter` | Show it on the map, with its blast radius |
| `o` | Open its instance in the web app |
| `w` | Write up the selected alarm's incident (Alarms only) |

### Deployments

| Key | What it does |
|---|---|
| `↑` `↓` | Choose a deployment |
| `enter` | Show its environment on the map, with its blast radius |
| `o` | Open its instance in the web app |
| `f` | Follow its logs across the whole screen. `f` or `esc` closes them. |
| `c` | Show its configuration: the message, the bundle version, and the params it changes since the instance's last completed provision, with secrets masked |
| `y` | Approve a deployment awaiting approval |
| `x` | Reject a deployment awaiting approval, with an optional reason |

### Confirmation box

Opened by `y` and `d` on the map and `y` on the Deployments tab. It names the instance, its environment, and how many environments and instances depend on it downstream.

| Key | What it does |
|---|---|
| `y`, `enter` | Go ahead |
| `c` | Show the configuration of the deployment awaiting approval (approve only). `esc` comes back to the box. |
| Any other key | Cancel |

### Rejection box

Opened by `x` on the Deployments tab.

| Key | What it does |
|---|---|
| Any text | Type a reason, up to 200 characters. It is kept in the deployment's stash under `review/rejection`. |
| `backspace` | Delete a character |
| `enter` | Reject |
| `esc` | Cancel |

### Configuration box

Opened by `c` on the Deployments tab or in the confirmation box.

| Key | What it does |
|---|---|
| `↑` `↓`, or `j` `k` | Scroll a line |
| `space`, `pgdown`, `f` | Scroll down a page |
| `pgup`, `b` | Scroll up a page |
| `g`, `home` | Go to the top |
| `G`, `end` | Go to the bottom |
| `esc`, `c`, `q` | Close |

## Files

| Key | File | Name |
|---|---|---|
| `w` | Incident write-up, in markdown | `incident-<instance>-<alarm>-<YYYYMMDD-HHMM>.md` |
| `w` | Incident recording, for `--playback` | `incident-<instance>-<alarm>-<YYYYMMDD-HHMM>.json` |
| `e` | The map, as an SVG | `constellation-<organization>-<YYYYMMDD-HHMM>.svg` |

Every file goes in the current directory. Incident files are named for the minute the incident started, in UTC, and only you can read them. The SVG is named for the minute you saved it.

## Output to a file or a pipe

When the output is not a terminal, `mass dashboard` prints three tables instead of drawing the screen: the environments in view, the firing alarms with how much is downstream of each, and the runtimes with how many of their instances run the latest version. `--env` and `--depth` choose what is in view.

## Large organizations

Massdriver Constellation reads one neighborhood at a time, so the size of your organization does not change how much it reads. What it reads grows with `--depth` and with how many environments share resources with the focus. Search reads the list of environment ids and names once, the first time a search finds nothing in view. With more than 20 environments in view, the stash is read every `--stash` interval rather than streamed.

## Troubleshooting

| What you see | Why |
|---|---|
| Notes and pinned widgets are missing | The profile signs in as a service account. Use a profile with your personal access token. |
| Stash changes and logs arrive a few seconds late | The profile signs in as a service account, so the stash is read every `--stash` interval and logs every 2 seconds. Use a profile with your personal access token to stream them. |
| An environment shows as **🔭 out of view** | It is past `--depth`. Select it, or raise `--depth`. |
| An environment shows as **no access** | You cannot view its project. |
| A link says `stale` | Its traffic has not been reported for 10 minutes. |
| No widgets show | Nothing in view has a well-known `md/` key. See [Well-known keys](/guides/stash/well-known-keys). |
| `y`, `x`, or `d` says it is read-only | It was started with `--read-only` or `--playback`. Start it again without them. |
| `y` says to pick an instance first | Press `n` to pick an instance in the side panel. |
| Approving or rejecting says only a proposed deployment can be | The deployment is no longer awaiting approval. |
| A rejection says the reason was not saved | The deployment was rejected, but its stash could not be written. |
| Links in the side panel are not clickable | The terminal does not support hyperlinks. iTerm2, Ghostty, WezTerm, and kitty do. |
| No desktop notification with `--watch` | The terminal does not support OSC 9 notifications. The bell still rings. |
