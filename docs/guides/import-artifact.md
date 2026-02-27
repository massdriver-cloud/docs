---
id: import-artifact
slug: /guides/import-artifact
title: Import an Artifact
sidebar_label: Import Artifact
---

This guide will show you how to import a custom artifact into your organization. Why might you want to import an artifact? Here are some possible scenarios:
* You want to connect resources in Massdriver to resources outside of Massdriver
* You want to customize the artifact data for a specific use case

## Prerequisites

To import an artifact, you need a schema ([artifact definition](/concepts/artifact-definitions)). You can either create a [custom artifact definition](/guides/custom-artifact-definition) or use an official [Massdriver artifact definition](https://github.com/massdriver-cloud/artifact-definitions/tree/main/definitions/artifacts). 

We'll also need a custom artifact that meets that schema, populated with actual values. Here's an example:

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
```json title="artifact.json"
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

If you haven't already, be sure to install the [CLI](../cli/00-overview.md).

:::

Once you have a schema and the custom artifact, you can import the artifact using the following command:

```bash
mass artifact import -n my-artifact-name -t mymdorg/myartifactdef -f /path/to/artifact.json
```

You'll then see the following output:
```bash title="Output"
Creating artifact my-artifact-name of type mymdorg/myartifactdef...
Artifact my-artifact-name created! (Artifact ID: 12345678-1234-1234-1234-123456789012)
```

You can now view the artifact in the Massdriver UI.

## API

To import an artifact using the API, you can do so using GraphiQL, GraphQL, Fetch, or a cURL request.

### GraphiQL

You can access our GraphiQL interface [here](https://api.massdriver.cloud/api/graphiql).

```graphql title="createArtifact.gql"
mutation importVpc($orgId: ID!) {
  createArtifact(
    payload: "{\"infrastructure\":{\"arn\":\"arn:aws:ec2:us-west-2:123456789012:vpc/vpc-1234567890abcdef0\",\"cidr\":\"10.0.0.0/16\"},\"aws\":{\"region\":\"us-west-2\"}}"
    name: "my-artifact-name"
    organizationId: $orgId
    type: "mymdorg/myartifactdef"
  ){
    result{id}
    messages{message}
    successful
  }
}
```
```graphql title="query variables"
{
  "orgId": "12345678-1234-1234-1234-123456789012"
}
```

### GraphQL-Request

```javascript title="createArtifact.js"
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('https://api.massdriver.cloud/api/graphiql', {
  headers: {
    Authorization: 'Bearer YOUR_AUTH_TOKEN',
  },
});


function setItem() {
  return client.request(`
    {
      createArtifact(
        payload: "{\"infrastructure\":{\"arn\":\"arn:aws:ec2:us-west-2:123456789012:vpc/vpc-1234567890abcdef0\",\"cidr\":\"10.0.0.0/16\"},\"aws\":{\"region\":\"us-west-2\"}}"
        name: "my-artifact-name"
        organizationId: $orgId
        type: "mymdorg/myartifactdef"
      ){
        result{id}
        messages{message}
        successful
      }
    }
  `)
}
```

### Fetch

```javascript title="createArtifact.js"
require('es6-promise').polyfill()
require('isomorphic-fetch')
      
function setItem() { 
  return fetch('https://api.massdriver.cloud/api/graphiql', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    //'Authorization': 'Bearer YOUR_AUTH_TOKEN'
    },
    body: '{"query":"mutationimportVpc($orgId:ID!){createArtifact(payload:\"{\\\"infrastructure\\\":{\\\"arn\\\":\\\"arn:aws:ec2:us-west-2:123456789012:vpc/vpc-1234567890abcdef0\\\",\\\"cidr\\\":\\\"10.0.0.0/16\\\"},\\\"aws\\\":{\\\"region\\\":\\\"us-west-2\\\"}}\"name:\"my-artifact-name\"organizationId:$orgIdtype:\"mymdorg/myartifactdef\"){result{id}messages{message}successful}}"}', 
  }) 
}
```


### CURL

```bash title="cURL"
curl 'https://api.massdriver.cloud/api/graphiql'  
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN'  
  -d '{"query":"mutationimportVpc($orgId:ID!){createArtifact(payload:\"{\\\"infrastructure\\\":{\\\"arn\\\":\\\"arn:aws:ec2:us-west-2:123456789012:vpc/vpc-1234567890abcdef0\\\",\\\"cidr\\\":\\\"10.0.0.0/16\\\"},\\\"aws\\\":{\\\"region\\\":\\\"us-west-2\\\"}}\"name:\"my-artifact-name\"organizationId:$orgIdtype:\"mymdorg/myartifactdef\"){result{id}messages{message}successful}}"}'
```

