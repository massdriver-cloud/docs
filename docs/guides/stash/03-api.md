---
id: guides-stash-api
slug: /guides/stash/api
title: Stash GraphQL API
sidebar_label: GraphQL API
---

# Stash GraphQL API

:::caution Alpha
This feature is alpha. Names, fields, and behavior can change or be removed at any time without notice.
:::

The stash operations are in the V2 GraphQL API. Their names start with `alpha`. For authentication, see [Authentication](/api/graphql/guides/authentication).

Each operation names a stash with a scope. Set exactly one field of the scope: `project`, `environment`, `component`, `instance`, or `deployment`. A deployment is its UUID. The others are identifiers, such as `billing-dev-app`.

## alphaStashEntry

Gets one entry. Expired entries are not returned. You need `stash:view`. A sensitive value is null unless you have `stash:export`.

```graphql
query {
  alphaStashEntry(organizationId: "my-org", scope: { instance: "billing-dev-app" }, key: "schema.version") {
    key
    value
    label
    expiresAt
  }
}
```

## alphaStashEntries

Lists the entries in one stash, ordered by key. You need `stash:view`. Sensitive values are null unless you have `stash:export`.

```graphql
query {
  alphaStashEntries(organizationId: "my-org", scope: { environment: "billing-dev" }) {
    items { key value format }
    cursor { next }
  }
}
```

## alphaStashEntriesForScopes

Lists the entries in up to 200 stashes in one project. You need `stash:view` on every scope. Sensitive entries are never returned. The `filter.keys` argument returns only the keys that you name.

```graphql
query {
  alphaStashEntriesForScopes(
    organizationId: "my-org"
    scopes: [{ project: "billing" }, { environment: "billing-dev" }, { instance: "billing-dev-app" }]
    filter: { keys: ["owner"] }
  ) {
    items {
      scope { kind id }
      key
      value
    }
    cursor { next }
  }
}
```

## alphaSetStashEntry

Sets a key. You need `stash:write`. The input replaces the whole entry. The mutation fails when the key has an immutable entry that has not expired, or when the stash has its maximum number of keys.

```graphql
mutation {
  alphaSetStashEntry(
    organizationId: "my-org"
    scope: { instance: "billing-dev-app" }
    key: "schema.version"
    input: { value: "42", label: "Schema version", ttl: 86400 }
  ) {
    successful
    result { key value expiresAt }
    messages { field message }
  }
}
```

The input fields are `value`, `format`, `label`, `ttl`, `immutable`, and `sensitive`. Only `value` is required.

## alphaDeleteStashEntry

Deletes a key. You need `stash:write`. Immutable entries can be deleted. The result has the deleted entry. Its value is null when the entry is sensitive.

```graphql
mutation {
  alphaDeleteStashEntry(organizationId: "my-org", scope: { project: "billing" }, key: "release") {
    successful
    result { key }
  }
}
```

## alphaStashEvents

A subscription to entries that are set or deleted in a project. You need `stash:view` on the project, and on the environment when you pass `environmentId`. An event's `entry` is null when you do not have `stash:view` on the entity that holds it. Without `environmentId`, you get events for the project, its environments, and its components. With `environmentId`, you also get events for that environment's instances and their deployments.

The `action` is `SET` or `DELETED`. A sensitive value is always null in an event. An entry that expires sends no event.

```graphql
subscription {
  alphaStashEvents(organizationId: "my-org", projectId: "billing", environmentId: "billing-dev") {
    action
    scope { kind id }
    key
    entry { value expiresAt }
    timestamp
  }
}
```

## alphaWidgetCatalog

Lists every version of every widget, with its well-known key, the version, the kind of entity that holds the key, the format, the JSON Schema, and the inputs.

```graphql
query {
  alphaWidgetCatalog {
    name
    entity
    key
    version
    scope
    format
    schema
    inputs { name type required field }
  }
}
```

## alphaWidgetsForScopes

Lists the widgets of up to 200 stashes in one project. You need `stash:view` on every scope. It returns a widget for each well-known key that has a valid value. When a stash has more than one version of a key, it uses the highest version. A page can have fewer widgets than its limit, or none. Read pages until `cursor.next` is null.

```graphql
query {
  alphaWidgetsForScopes(
    organizationId: "my-org"
    scopes: [{ environment: "billing-dev" }, { instance: "billing-dev-app" }]
  ) {
    items {
      name
      scope { kind id }
      values
      expiresAt
    }
    cursor { next }
  }
}
```

`values` has the widget's inputs by name, for example `{"value": 37, "max": 100}`.
