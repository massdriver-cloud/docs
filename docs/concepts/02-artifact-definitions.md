---
id: concepts-artifact-definitions
slug: /concepts/artifact-definitions
title: Artifact Definitions
sidebar_label: Artifact Definitions
---

Artifact definitions are types in Massdriver that determines:

* _which_ [artifacts](/concepts/artifacts) a bundles produces
* _what_ infrastructure or application dependencies a bundle has

They typically carry metadata like region, policies, authentication, and cloud resource identifiers.

:::caution

To avoid bundle-user error, `additonalProperties` should always be `false` or an `object` using [`patternProperties`](http://json-schema.org/understanding-json-schema/reference/object.html#pattern-properties).

:::
