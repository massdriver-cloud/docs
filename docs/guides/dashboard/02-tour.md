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

This tour uses your own organization. Some steps write to the stash, approve or reject a deployment, or start one, so pick an environment you can change, for example a development environment. The examples use `billing-dev` and its instance `billing-dev-app`. Put your own ids in their place.

Use a terminal at least 120 columns wide, so the side panel shows next to the map.

## 1. Open the map

```bash
mass dashboard --env billing-dev
```

The environments fly out from the center into place, and then the links between them draw in. `billing-dev` sits in the middle with a spinning white and teal halo, because it is both the focus and the selection.

The header counts what is in view. The map does not hold your whole organization. It holds `billing-dev`, the environments whose resources it uses, the environments that use its resources, and the environment it was forked from. That is one hop. Read further out with `--depth`:

```bash
mass dashboard --env billing-dev --depth 2
```

Environments one hop past the edge show dimmed, with a 🔭 under the name. Environments you cannot view show as **no access**.

The key line at the bottom shows only the keys that do something where you are. Press `?` to see every key, and what each mark and color means, in the side panel. Press `?` or `esc` to close it.

## 2. Move around

Press the arrow keys, or `h`, `j`, `k`, and `l`. The selection jumps to the nearest environment in that direction. `tab` and `shift+tab` step through every environment, top to bottom.

The side panel follows the selection. It lists the environment's instances with their health, firing alarms, running deployments, and deployments awaiting approval (`⏸`), then the environments it uses resources from and the ones it feeds, and its blast radius.

Rest on an environment for a moment. It becomes the new focus. The map reads what is around it, every node glides to its new place, and environments that were past the edge come into frame from the new focus. Select a 🔭 environment to bring it in. Press `enter` to move the focus at once.

## 3. Find an environment

Press `/` and type part of a name, an id, a project, or an instance id. The selection jumps to the first match in view, and the other environments dim.

Press `enter`. When nothing in view matches, Massdriver Constellation searches every environment in your organization and moves the focus to the best match: an exact id first, then an id that starts with your text, then any name, id, or project that contains it.

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

Each of these keys flips its toggle and shows where all five stand on the bottom line for a few seconds, such as `blast ●  ·  apps ○  ·  cost ○  ·  projects ○  ·  producers on top ○`.

## 5. Change how it looks

Press `v` to switch themes:

- **constellation** scatters environments like stars, pulled together by the resources they share.
- **metro** draws environments as stations on transit lines: a band for each project, producers on the left, and sparks running down the track to their consumers.
- **radar** puts the focus at the center of a sweeping scope, with each environment on the ring as many hops out as it is. Blips light up as the sweep passes them.
- **plain** lists environments by project, one line each, with their health, alarms, deployments in flight, failed instances, how many instances are up, upgrades, and banner. Nothing moves except the dot of an environment that is deploying. It is the quickest read of what is healthy and what needs a look.

Press `p` to switch palettes: `night`, `rain`, and `blueprint`. Start in a theme and palette with `--theme` and `--palette`:

```bash
mass dashboard --theme radar --palette rain
mass dashboard --theme plain
```

The map draws its dots in braille by default, which works in any terminal. In a terminal that draws block characters itself, such as Ghostty, fill the dots in as solid blocks so links and rings draw as solid lines:

```bash
mass dashboard --render blocks
```

Press `v` until you are back on `constellation` for the rest of the tour.

## 6. Write to the stash and watch it land

Massdriver Constellation streams the stash, so each key shows the moment it is set. Streaming needs a personal access token. With a service account, the stash is read every 3 seconds instead. See [The stash feed](/guides/dashboard/stash-and-annotations#the-stash-feed).

Open a second terminal and set a few [well-known keys](/guides/stash/well-known-keys):

```bash
mass stash set billing-dev-app.md/v1/health degraded
```

A yellow line lands on the ticker, `billing-dev` ripples, and a 📌 rises out of it. Start with `--flashes words` to see the key itself rise instead. In the side panel, the instance's dot turns amber.

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

## 7. Follow a deployment's logs

Select `billing-dev` and press `f`. The side panel widens to just over half the screen and follows the logs of the deployment running in the environment, or else its most recent one. On a terminal narrower than 90 columns, the logs take the whole screen.

The panel's heading names the instance, the action, and the status. Lines stream in as the deployment writes them. A long line wraps, and the rest of it is indented under the first part. When the deployment ends, the panel keeps its final status: `✓ completed`, `✕ failed`, `✕ aborted`, or `✕ rejected`.

Streaming logs needs a personal access token. With a service account, the logs are read every 2 seconds instead.

Scroll back through the logs:

| Key | What it does |
|---|---|
| `pgup`, `ctrl+u` | Back a page |
| `pgdown`, `ctrl+d` | Forward a page |
| `shift+↑`, `shift+↓` | Back or forward a line |
| `home` | Go to the first line |
| `end`, `G` | Go to the newest line and follow it again |

While you are scrolled back, the heading shows `↑ N lines back · end follows`, and new lines keep arriving without moving what you are reading.

Press `f` or `esc` to close the logs. Moving the selection or switching tabs closes them too.

## 8. Approve and deploy from the map

An instance in the side panel shows `⏸ awaiting approval` when it has a proposed deployment.

1. Press `n` to pick the first instance in the side panel. Press `n` again for the next one, or `N` for the one before. The picked instance is highlighted, and the key line shows what you can do with it: `y approve app` when it has a deployment awaiting approval, and `d deploy app` unless it is already deploying. Press `esc` to unpick it.
2. Press `y` to approve the picked instance's deployment awaiting approval, or `d` to deploy it again with its current configuration.
3. A box asks first. It names the instance and its environment, what you are about to do, and how many environments and instances depend on it downstream.
4. Press `y` or `enter` to go ahead. Any other key cancels. When approving, press `c` first to see the deployment's configuration, then `esc` to come back to the box.

The footer says what happened, such as `✓ approved billing-dev-app` or `⟳ deploying billing-dev-app`, and the map reads the organization again. A deployment you start with `d` is a provision with the message "Deployed from mass dashboard". `d` does nothing for an instance that is already deploying.

To leave these keys off, for example on a shared screen, start with `--read-only`:

```bash
mass dashboard --read-only
```

## 9. Decide deployments on the Deployments tab

Press `5`. The tab lists the deployments of the instances in view, in three sections:

| Section | Each row |
|---|---|
| **Awaiting approval** | `⏸`, the instance, its environment, the action, who proposed it, how long ago, and the first line of its message |
| **In flight** | `⟳`, the instance, its environment, the action, its status, and how long it has run |
| **Recent** | `✓` or `✕`, the instance, its environment, the action, its status, how long it took, how long ago, and who ran it. The 20 most recent to finish, dimmed. |

Use `↑` and `↓` to pick a deployment.

Press `c` to see its configuration: the action, status, who deployed it and when, the bundle version, the message, and each param it changes since the instance's last completed provision. `+` marks a param it adds, `-` one it removes, and `~` one it changes. Anything that looks like a secret shows as `••••••`. Scroll with `↑` and `↓`, and close the box with `esc`.

Press `y` to approve a deployment awaiting approval. The same box as on the map asks first, and `c` in it shows the configuration before you decide.

Press `x` to reject one. Type a reason if you want one, up to 200 characters, and press `enter`. `esc` cancels. The deployment API takes no message for a rejection, so the reason is kept in the deployment's stash under `review/rejection`. If the reason cannot be saved, the deployment is still rejected and the footer says so.

Only a deployment awaiting approval can be approved or rejected, so the key line shows `y` and `x` only when one is selected. `--read-only` turns off `y` and `x` here too.

The other keys on this tab:

| Key | What it does |
|---|---|
| `enter` | Show the deployment's environment on the map, with its blast radius |
| `o` | Open the deployment's instance in the Massdriver web app |
| `f` | Follow its logs across the whole screen. `f` or `esc` closes them. |

## 10. Check your runtimes

Press `2`. Each runtime has a bar that shows how its instances split across runtime versions: green on the latest version, yellow a patch behind, orange a minor behind, and red a major behind.

Use `↑` and `↓` to pick a runtime. Press `p`, `m`, or `M` to see what a patch, minor, or major release would leave behind. Press `0` to go back.

## 11. Find what is firing and what can upgrade

Press `3` for every firing alarm in view, with how long it has fired and how much depends on its instance. Press `4` for every instance that can move to a newer bundle version.

On either tab, press `enter` to show the selected row on the map with its blast radius, or `o` to open its instance in the Massdriver web app.

## 12. Replay the last hour

Press `1` to go back to the map, then press `t`. Pick how far back to go with `←` and `→`, from 5 minutes to 24 hours, and press `enter`.

The audit log plays back onto the map in order. Each event ripples its environment and raises its flash, such as 🚀 for a deployment starting. The ticker shows the time being replayed and a progress bar. Press `]` to speed up, `[` to slow down, and `space` to pause. Press `t` to stop.

A replay of any window finishes in under a minute at its starting speed.

## 13. Leave it on a screen

```bash
mass dashboard --watch
```

With `--watch`, Massdriver Constellation reacts to a new alarm on its own:

1. It switches to the map and selects the alarm's environment.
2. Rings and crosshairs close in on the environment, and its blast radius lights up.
3. A red banner across the top names the alarm, its instance, its environment, and how much is downstream, and counts how long it has fired.
4. The terminal rings its bell and shows a desktop notification.

Press `esc` to put the banner away. When the alarm clears, the banner turns green and says how long it lasted. A few seconds later, the view goes back to where it was, unless you moved it during the incident.

Alarms that were already firing when Massdriver Constellation started do not count as new.

## 14. Write up an incident and play it back

Press `w` on the map or on the Alarms tab. It writes up the incident behind the selected alarm or environment, or else the most recent incident. Two files land in the current directory, named for the alarmed instance, the alarm, and the minute the incident started, in UTC:

```text
incident-billing-dev-app-cpu-high-20261126-1402.md
incident-billing-dev-app-cpu-high-20261126-1402.json
```

The markdown file has when the incident started and resolved and how long it lasted, the alarm and its message, its blast radius, a timeline of the deployments, alarms, and stash changes in that blast radius from shortly before it fired until it cleared, and sections for the root cause and follow-ups. It ends with the command that plays it back.

The JSON file is a recording: the environments in view when the alarm fired, their stash, and that timeline. Both files are readable only by you, because stash values and alarm messages can be sensitive.

Play a recording back, offline:

```bash
mass dashboard --playback incident-billing-dev-app-cpu-high-20261126-1402.json
```

Massdriver Constellation opens on the recording and replays it on the map. `space` pauses, and `[` and `]` change the speed. Nothing is read from or sent to Massdriver, so approving, rejecting, deploying, and opening the web app are off.

## 15. Export the map

Press `e` on the map. The map as it stands is saved as an SVG in the current directory, named for the organization and the minute, such as `constellation-acme-20261126-0905.svg`.

The SVG keeps the theme, the palette, and the selection, and draws in vectors, so it stays sharp on a slide or in an incident write-up. The constellation theme also draws the blast radius, alarm pulses, and traffic. Metro and radar draw the blast radius in their links.

## 16. Use it in a script

When the output is not a terminal, `mass dashboard` prints the environments, firing alarms, and runtimes in view as tables:

```bash
mass dashboard --env billing-dev | less
```
