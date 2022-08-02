---
id: json-schema-cheatsheet-range-exclusion
slug: /json-schema-cheat-sheet/range-exclusion
title: Range Exclusion
sidebar_label: Range Exclusion
---

Cloud APIs have quirks :shrug: and its occassionally necessary to not permit some values in a range.

```yaml
title: Range Exclusion Example
type: object
properties:
  range:
    title: Zero or between 10 and 1000
    type: integer
    minimum: 0
    maximum: 1000
    not:
      minimum: 1
      maximum: 9
```
