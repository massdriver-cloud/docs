---
id: guides-dashboard-reference
slug: /guides/dashboard/reference
title: Dashboard Reference
sidebar_label: Reference
---

# Dashboard Reference

:::caution Alpha
This feature is alpha. Names, fields, and behavior can change or be removed at any time without notice.
:::

## Flags

| Flag | Default | What it does |
|---|---|---|
| `--env` | The environment of the most recent deployment | The environment to center on, by id |
| `--depth` | `1` | How many hops from the focus to read |
| `--theme` | `constellation` | How the map is drawn: `constellation`, `metro`, or `radar` |
| `--palette` | `night` | Colors and backdrop: `night`, `rain`, or `blueprint` |
| `--refresh` | `30s` | How often to read the environments in view. `0` reads them once. |
| `--events` | `5s` | How often to read new audit log events. `0` turns the ticker off. |
| `--stash` | `3s` | How often to read the stash when it cannot be streamed: with a service account, or while a stream reconnects. `0` reads it with each refresh. |
| `--watch` | Off | Jump to any alarm that starts firing, and send a desktop notification |
| `--profile` | The active profile | The configuration profile to sign in with |

## Keys

### Everywhere

| Key | What it does |
|---|---|
| `1` to `4` | Switch tabs |
| `←` `↑` `↓` `→`, or `h` `j` `k` `l` | Move the selection |
| `tab`, `shift+tab` | Step through the list |
| `o` | Open the selection in the web app |
| `r` | Read the environments in view now |
| `?` | Explain the tab |
| `esc` | Clear the search, close the help, or put away an incident banner |
| `q`, `ctrl+c` | Quit |

### Constellation

| Key | What it does |
|---|---|
| `enter` | Move the focus to the selection now |
| `/` | Find an environment, in view or anywhere in the organization |
| `t` | Replay the audit log |
| `b` `a` `c` `g` `s` | Toggles. See [Reading the map](/guides/dashboard/reading-the-map#toggles). |
| `v` | The next theme |
| `p` | The next palette |

### Replay

| Key | What it does |
|---|---|
| `←` `→` | Choose how far back, from 5 minutes to 24 hours |
| `enter`, `space` | Start the replay |
| `space` | Pause or resume. At the end, start over. |
| `[` `]` | Slower or faster, from 1 to 16 events a step |
| `t` | Stop |

A replay reads up to the newest 1,000 events in its window. When the window holds more, the ticker says **newest 1000 only**.

### Runtimes

| Key | What it does |
|---|---|
| `↑` `↓` | Choose a runtime |
| `p` `m` `M` | Show what a patch, minor, or major release would leave behind |
| `0` | Show the runtime as it is |

### Alarms and Upgrades

| Key | What it does |
|---|---|
| `↑` `↓` | Choose a row |
| `enter` | Show it on the map, with its blast radius |
| `o` | Open its instance in the web app |

## Output to a file or a pipe

When the output is not a terminal, `mass dashboard` prints three tables instead of drawing the screen: the environments in view, the firing alarms with how much is downstream of each, and the runtimes with how many of their instances run the latest version. `--env` and `--depth` choose what is in view.

## Large organizations

The dashboard reads one neighborhood at a time, so the size of your organization does not change how much it reads. What it reads grows with `--depth` and with how many environments share resources with the focus. Search reads the list of environment ids and names once, the first time a search finds nothing in view.

## Troubleshooting

| What you see | Why |
|---|---|
| Notes and pinned widgets are missing | The profile signs in as a service account. Use a profile with your personal access token. |
| An environment shows as **not loaded** | It is past `--depth`. Select it, or raise `--depth`. |
| An environment shows as **no access** | You cannot view its project. |
| A link says `stale` | Its traffic has not been reported for 10 minutes. |
| No widgets show | Nothing in view has a well-known `md/` key. See [Well-known keys](/guides/stash/well-known-keys). |
| Links in the side panel are not clickable | The terminal does not support hyperlinks. iTerm2, Ghostty, WezTerm, and kitty do. |
| No desktop notification with `--watch` | The terminal does not support OSC 9 notifications. The bell still rings. |
