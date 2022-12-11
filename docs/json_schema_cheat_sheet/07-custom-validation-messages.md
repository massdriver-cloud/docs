---
id: json-schema-cheatsheet-custom-validation-messages
slug: /json-schema-cheat-sheet/custom-validation-messages
title: Custom Validation Messages 
sidebar_label: Custom Validation Messages
---

Massdriver provides a straightforward way of adding custom validation messages for complex properties. Here is a simple example

```yaml
---
read_capacity:
    type: integer
    title: "Read Capacity"
    minimum: 1
    maximum: 3000
    message:
      minimum: "must be larger than 1."
      maxiumum: "must be less than 3000."
```

This example is overly simple. The stock validation messages for maximum and minimum are exactly this. However in situations with really complex regular expression matching, a simple message for the user will always be more useful than returing the regular expression and making a user parse it, which is the default behavior for RJSF.

Here is an example of a GCP GRN.

```yaml
---
grn:
  type: string
  title: "GCP Resoruce Name (GRN)"
  description: "Resrouce identifier provider by GCP"
  examples:
    - "projects/my-project/global/networks/my-global-network"
    - "projects/my-project/regions/us-west2/subnetworks/my-subnetwork"
    - "projects/my-project/topics/my-pubsub-topic"
    - "projects/my-project/subscriptions/my-pubsub-subscription"
    - "projects/my-project/locations/us-west2/instances/my-redis-instance"
    - "projects/my-project/locations/us-west2/clusters/my-gke-cluster"
  pattern: "^projects\/[a-z0-9-]+\/[a-z]+\/[a-z0-9-]+(?:\/[a-zA-Z0-9-_.]+){0,6}$"
  message:
    pattern: "The provided GRN does not follow the expected pattern. See the examples for valid GRNs."
```
