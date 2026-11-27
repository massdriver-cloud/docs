---
id: guides-stash-overview
slug: /guides/stash
title: Stash
sidebar_label: Overview
---

# Stash

:::caution Alpha
This feature is alpha. Names, fields, and behavior can change or be removed at any time without notice.
:::

A stash holds key and value entries on a project, an environment, a component, an instance, or a deployment. Each of these has its own stash. You own the data in it. Massdriver keeps it until you delete it or until it expires.

Deployments and scripts use the stash to pass values between steps, to record results, and to keep values for a set time. The Massdriver UI shows stash values as [metadata](/guides/annotations/metadata), in [notes](/guides/annotations/notes), and in [widgets](/guides/annotations/widgets).

Stashes do not inherit. A key on an environment is not visible from the stash of its instances or deployments. To read it, read the environment's stash.

## Entries

Each entry has these fields.

| Field | Rules |
|---|---|
| Key | Letters, digits, and the characters `_`, `.`, `/`, and `-`. Up to 255 characters. |
| Value | Always a string. Massdriver returns it exactly as written. It cannot contain the null character. |
| Format | `TEXT` (the default) or `JSON`. A `JSON` value must be a JSON object. The API also returns a `JSON` value parsed, in the `data` field. |
| Label | Optional. A name for the entry, up to 255 characters. Entries with a label show on the Metadata panels. The label is not encrypted, so do not put secrets in it. |
| TTL | Optional. Seconds until the entry expires, up to 315360000 (10 years). An expired entry is not returned and is deleted soon after. Without a TTL, the entry stays until you delete it. |
| Immutable | Optional. When true, the key cannot be set again until the entry expires or is deleted. You can still delete it. An immutable write fails when the key already has a value. |
| Sensitive | Optional. When true, the value is encrypted with your organization's key. It is masked for callers without `stash:export`. It is never sent in events, and it is never available to notes or widgets. |

A set replaces the whole entry: the value, the format, the label, the TTL, and both flags. A setting that you leave out goes back to its default.

## Limits

| Limit | Default | Setting for self-hosted installations |
|---|---|---|
| Value size | 65536 bytes | `MD_STASH_MAX_VALUE_BYTES` |
| Keys in one stash | 1000 | `MD_STASH_MAX_KEYS_PER_SCOPE` |

Expired entries do not count toward the key limit.

## Well-known `md/` keys

Keys that start with `md/` are reserved for [widgets](/guides/annotations/widgets). The server checks each `md/` write. See [Well-known keys](/guides/stash/well-known-keys).

## Permissions

The stash has its own [access control](/platform-operations/security/access-control) actions.

| Action | Lets you |
|---|---|
| `stash:view` | Read entries, without sensitive values, and subscribe to their changes |
| `stash:write` | Set and delete entries |
| `stash:export` | Read sensitive values |

Each action is checked against the entity that holds the entries: the project, environment, component, or instance. A deployment's entries belong to its instance. Conditions on that entity's attributes apply. `stash:view` does not come with `project:view`. Grant it on its own.

A deployment's own credentials do not use these actions. A deployment can read and write the stash of that deployment and of its instance, environment, component, and project.

## Events

Each set and delete sends an event. An entry that expires sends no event.

- The `projectEvents`, `environmentEvents`, `instanceEvents`, and `deploymentEvents` subscriptions send an `AlphaStashEntryEvent`. Which subscriptions get it depends on the entity that holds the entry.
- The audit log and [event destinations](/platform-operations/event-destinations) get `stash_entry.set` and `stash_entry.deleted` events.
- A sensitive entry never includes its value in an event.

| Stash | Subscriptions |
|---|---|
| Project | `projectEvents` |
| Environment | `projectEvents`, `environmentEvents` |
| Component | `projectEvents` |
| Instance | `environmentEvents`, `instanceEvents` |
| Deployment | `environmentEvents`, `instanceEvents`, `deploymentEvents` |

The [`alphaStashEvents`](/guides/stash/api#alphastashevents) subscription also sends sets and deletes for a project and one environment.

## Where stash values show

| Place | What shows |
|---|---|
| The **Metadata** tab of an instance | The instance's labeled entries and its widgets |
| The **Deployment metadata** section of a deployment's details | The deployment's labeled entries |
| The **Metadata** card on the project overview | The project's labeled entries |
| [Notes](/guides/annotations/notes) | Any value that you write into the note |
| [Widgets](/guides/annotations/widgets) | `md/` keys, and the keys that you choose for your own widgets |

These places update when a stash value changes. You do not need to reload the page. An entry that expires does not send an update. The UI removes it when its time ends.

## Next

- [Well-known keys](/guides/stash/well-known-keys)
- [GraphQL API](/guides/stash/api)
- [CLI](/guides/stash/cli)
- [Recipes](/guides/stash/recipes)
