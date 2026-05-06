---
id: import-artifact
slug: /guides/import-resource
title: Import a Resource
sidebar_label: Import Resource
---

This guide walks through importing a custom resource into your organization. The page slug retains `/guides/import-artifact` for backwards compatibility, but the workflow itself uses the new GraphQL nouns (`createResource`, `Resource`, `resourceTypeId`).

Why import a resource? A few common scenarios:

* You want to connect resources in Massdriver to resources outside Massdriver
* You want to customize the resource payload for a specific use case

## Prerequisites

To import a resource, you need a [resource type](/concepts/resources-and-types) (its schema). You can create a [custom resource type](/guides/custom-artifact-definition) or use an [official Massdriver resource type](https://github.com/massdriver-cloud/artifact-definitions/tree/main/definitions/artifacts).

You also need a payload that conforms to that resource type. Example schema and payload:

```json title="schema.json"
{
  "type": "object",
  "title": "AWS VPC",
  "description": "My custom AWS VPC",
  "required": [
    "infrastructure"
  ],
  "properties": {
    "infrastructure": {
      "title": "Infrastructure configuration",
      "required": [
        "arn",
        "cidr"
      ],
      "type": "object",
      "properties": {
        "arn": {
          "type": "string",
          "title": "AWS ARN",
          "description": "Amazon Resource Name"
        },
        "cidr": {
          "type": "string",
          "title": "CIDR",
          "description": "CIDR block for the VPC"
        }
      }
    },
    "aws": {
      "type": "object",
      "properties": {
        "region": {
          "type": "string",
          "title": "Region",
          "description": "AWS Region to provision in."
        }
      }
    }
  }
}
```

```json title="resource.json"
{
  "infrastructure": {
    "arn": "arn:aws:ec2:us-west-2:123456789012:vpc/vpc-1234567890abcdef0",
    "cidr": "10.0.0.0/16"
  },
  "aws": {
    "region": "us-west-2"
  }
}
```

## CLI

:::note
If you haven't already, install the [Massdriver CLI](/reference/cli/overview). The CLI command names are being updated; this guide will follow shortly.
:::

The current CLI invocation imports the resource (the command name still uses the legacy `artifact` noun):

```bash
mass artifact import -n my-resource-name -t mymdorg/myresourcetype -f /path/to/resource.json
```

Output:

```text title="Output"
Creating resource my-resource-name of type mymdorg/myresourcetype...
Resource my-resource-name created! (Resource ID: 12345678-1234-1234-1234-123456789012)
```

You can now view the resource in the Massdriver UI.

## API

To import a resource via the GraphQL API, use the `createResource` mutation. Example via GraphiQL or any GraphQL client:

```graphql title="createResource.gql"
mutation ImportVpc($organizationId: ID!, $resourceTypeId: ID!, $input: CreateResourceInput!) {
  createResource(
    organizationId: $organizationId
    resourceTypeId: $resourceTypeId
    input: $input
  ) {
    successful
    messages { field message }
    result { id name origin }
  }
}
```

```json title="Variables"
{
  "organizationId": "my-org-id",
  "resourceTypeId": "mymdorg/myresourcetype",
  "input": {
    "name": "my-resource-name",
    "payload": {
      "infrastructure": {
        "arn": "arn:aws:ec2:us-west-2:123456789012:vpc/vpc-1234567890abcdef0",
        "cidr": "10.0.0.0/16"
      },
      "aws": {
        "region": "us-west-2"
      }
    }
  }
}
```

### cURL

```bash title="cURL"
curl 'https://api.massdriver.cloud/api/v1' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Basic <BASE64(org_slug:service_account_secret)>' \
  --data @- <<'JSON'
{
  "query": "mutation ImportVpc($organizationId: ID!, $resourceTypeId: ID!, $input: CreateResourceInput!) { createResource(organizationId: $organizationId, resourceTypeId: $resourceTypeId, input: $input) { successful messages { field message } result { id name origin } } }",
  "variables": {
    "organizationId": "my-org-id",
    "resourceTypeId": "mymdorg/myresourcetype",
    "input": {
      "name": "my-resource-name",
      "payload": {
        "infrastructure": { "arn": "arn:aws:ec2:us-west-2:123456789012:vpc/vpc-1234567890abcdef0", "cidr": "10.0.0.0/16" },
        "aws": { "region": "us-west-2" }
      }
    }
  }
}
JSON
```

See the [GraphQL API reference](/api/graphql) for the full operation set, and the [GraphQL permissions reference](/platform-operations/security/graphql-permissions) for the permission required by `createResource` (`resource:import`).
