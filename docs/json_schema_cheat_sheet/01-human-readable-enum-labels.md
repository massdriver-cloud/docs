---
id: json-schema-cheatsheet-human-readable-enums
slug: /json-schema-cheat-sheet/human-readable-enums
title: Human-readable Enum Labels
sidebar_label: Human-readable Enum Labels
---

It can be useful to have human-readable labels for drop downs (enums) while having a machine-readable value. Below is an example of presenting a color choice of red, green, or blue to a user while submitting a hex value to Massdriver.

```json
title: Human-readable Enum Labels
type: object
properties:
  color:
    title: Favorite Color
    type: string
    oneOf:
    - title: Red
      const: "#ff0000"
    - title: Green
      const: "#00ff00"
    - title: Blue
      const: "#0000ff"
```
