---
id: security-changing-custom-attributes
slug: /platform-operations/security/changing-custom-attributes
title: Changing Custom Attributes
sidebar_label: Changing Attributes
---

# Changing Custom Attributes

Your attribute structure changes as your organization does. A team is renamed, a
domain is retired, a tier is added. This page covers what happens to your
policies, your grants, and your naming convention when you add a value, remove a
value, delete an attribute, or change whether one is required.

See [Access Control](/platform-operations/security/access-control) for what
custom attributes are and how they cascade.

## Changes never change who has access

Access is decided from the attribute values stored on your projects,
environments, components, and resources — not from the attribute definition. A
policy that allows `project:view where DOMAIN: [payments]` keeps matching every
project tagged `DOMAIN: payments`, whatever you later do to the `DOMAIN`
definition.

The same is true of instance names. A name is resolved once, when the instance
is first created, and is never recomputed.

So no change to a custom attribute silently takes access away, and none renames
infrastructure that already exists.

What a change does affect is what you can do next: which values you can pick in
a form, which values you can write into a policy condition, and which attributes
you can name in your naming convention.

## Adding a value

Always accepted. The new value appears in the dropdown for anyone whose policies
allow it, and becomes available for new policy conditions.

## Removing a value

**Massdriver refuses the change if it would leave a policy or grant matching
nothing.**

If a group's policy says `project:view where DOMAIN: [payments]` and you remove
`payments`, that policy would match no project from then on. It would still be
listed, still look correct, and grant nothing. Massdriver refuses the removal
and names the policy:

```
would leave policy on group "payments-eng" (project:view) matching no value
— edit or delete it first
```

Edit or delete the policy, then remove the value.

If the condition lists more than one value, and at least one of them survives,
the removal is accepted.

Once removed:

- The value disappears from the dropdown. Nobody can set it on anything new.
- Projects, environments, components, and bundles **already tagged with it keep
  the value**. They stay editable, and everything else about them can be changed
  without touching the attribute.
- To clear an old value, set the attribute to one of the current values, or
  remove it.

## Deleting an attribute

**Massdriver refuses the delete if a policy or grant conditions on the
attribute, or if your naming convention uses it.**

A naming convention that reads `{{attrs.DOMAIN}}-{{instance.id}}` depends on
`DOMAIN` existing. Deleting it would mean every instance created afterwards got
a name with that segment missing. Massdriver refuses and tells you which token
to edit:

```
the organization naming convention uses {{attrs.DOMAIN}} — edit the convention first
```

Once nothing references it and the delete goes through:

- The attribute disappears from every form and from the naming convention
  editor's atom list.
- Values already set are **not** removed. Entities keep them and stay fully
  editable.
- The key cannot be set on anything new.

## Adding a new attribute

The new attribute appears in the form for the scope you declared it at, and
becomes available in policy conditions and naming conventions.

Nothing that already exists is tagged with it. A policy conditioned on the new
attribute matches nothing until you tag entities with it. Tag first, then write
the policy, or the policy grants nothing.

## Making an attribute required

`required` applies when an entity is **created**. It is not a rule that every
later edit repeats.

Marking an attribute required does not block edits to projects, environments,
components, or bundles that already exist without it, and it does not backfill
them. If you need every existing entity tagged, tag them — marking the attribute
required will not do it, and a policy conditioned on it will not match them
until you do.

## Summary

| Change | Refused when | Existing infrastructure |
|---|---|---|
| Add a value | Never | Unaffected |
| Remove a value | A policy or grant condition would match nothing | Keeps the old value, stays editable |
| Delete an attribute | A policy or grant conditions on it, or the naming convention uses it | Keeps the value, stays editable |
| Add an attribute | Never | Untagged until you tag it |
| Make one required | Never | Unaffected, and not backfilled |
