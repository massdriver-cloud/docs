---
id: version-resolution
slug: /bundle-development/connections-artifacts/version-resolution
title: Version Resolution
sidebar_label: Version Resolution
---

# Version Resolution

A bundle names the resource types it consumes and produces, and the versions of those resource types it accepts. Massdriver resolves each range to one specific resource when the bundle deploys, using what is available in the target environment at that moment.

## Declaring a range

`dependencies` are the resource types a bundle consumes. `resources` are the resource types it produces for other bundles to consume. Both take a `resource_type` in the form `name@version`:

```yaml
dependencies:
  network:
    resource_type: aws-vpc@~1.2
    required: true
  database:
    resource_type: postgres-authentication@2.1.0
    required: false

resources:
  api:
    resource_type: aws-ecs-service@~2
    required: true
```

`required` means different things on each side. On a dependency it means the slot must be filled before the bundle can deploy. On a resource it means the bundle always creates it.

A resource pins the single version it produces. A dependency accepts a range:

| Form | Accepts |
|------|---------|
| `aws-vpc@1.2.3` | that exact version |
| `aws-vpc@~1.2` | the newest `1.2.x` |
| `aws-vpc@~1` | the newest `1.x` |
| `aws-vpc@latest` | the newest stable version |
| `aws-vpc@latest+dev` | the newest version, including development releases |

The `+dev` suffix also applies to a tilde range. `~1+dev` accepts the newest `1.x` including development releases; `~1` on its own skips them.

## What fills a slot

At deploy time Massdriver looks for a resource of the right type whose version the range accepts. It checks three sources and takes the first match:

<SlotResolution />

1. **A remote reference** set on the instance. This is a hand-picked resource, so both its resource type and its version are checked. The check runs again on every deploy, which catches a reference that was assigned before the bundle moved to a narrower range.
2. **A connection** drawn on the project blueprint. The resource type was matched when the connection was drawn, so only the version is re-checked here.
3. **An environment default**. Among the environment's defaults of that resource type, Massdriver takes the highest version the range accepts.

A source that does not match is skipped, and the next source is tried. If no source matches, a `required` dependency blocks the deploy.

## One default per version

An environment holds one default per version of a resource type. Two bundles asking for different ranges each draw the version they asked for, from the same environment, with no per-instance configuration.

This is also how a dependency picks up a newer version without the consuming bundle being republished. Add a newer `aws-vpc` default to the environment, and a bundle declaring `aws-vpc@~1` resolves to it on its next deploy as long as the new version is still in the `1.x` line.

## Remote references are checked when you assign them

Choosing a remote reference for a slot validates the pick against the slot's resource type and version range. An out-of-range or wrong-type resource is rejected at that point rather than during a deployment.

## The legacy format

`connections` and `artifacts` are the previous names for `dependencies` and `resources`. They still work and publish with a warning.

A slot declared in the legacy format carries no version range. It matches an environment default of its resource type at any version, and it trusts a blueprint connection without re-checking the version. Moving the slot to `dependencies` or `resources` is what turns the version checks on.

The two forms are mutually exclusive. Setting both `connections` and `dependencies`, or both `artifacts` and `resources`, is an error, so migrate one block at a time.

## Related documentation

- [Bundle YAML: dependencies and resources](/bundle-development/bundle-yaml-spec#dependencies) — full field reference
- [Connections](/concepts/connections) — version ranges on the blueprint connection itself
- [Resource Type Spec](/bundle-development/connections-artifacts/artifact-definition-spec) — authoring and publishing a versioned resource type
