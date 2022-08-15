---
id: concepts-artifact-definitions
slug: /concepts/artifact-definitions
title: Artifact Definitions
sidebar_label: Artifact Definitions
---

Artifact definitions are a type system in Massdriver that determines:

* _which_ [artifacts](#artifacts) a bundles produces
* _what_ infrastructure or application dependencies a bundle has

They typically carry metadata like region, policies, and cloud resource identifiers.

:::caution

To avoid bundle-user error, `additonalProperties` should always be `false` or an `object` using [`patternProperties`](http://json-schema.org/understanding-json-schema/reference/object.html#pattern-properties).

:::
