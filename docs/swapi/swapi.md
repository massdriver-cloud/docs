---
id: schema
title: GraphQL API
sidebar_position: 1
---

# Massdriver GraphQL API

Massdriver provides a powerful GraphQL API that allows you to programmatically interact with your infrastructure and platform configurations. Whether you're automating deployments, managing resources, or integrating Massdriver with your existing tools, our GraphQL API provides a flexible and efficient way to accomplish your goals.

## Getting Started

### API Endpoint
The Massdriver GraphQL API is available at `https://api.massdriver.cloud/api/`

### Interactive Explorer
You can explore and test API queries using our GraphQL Playground:
[Launch GraphQL Playground](https://api.massdriver.cloud/api/graphiql)

### Authentication
To authenticate your API requests, you'll need to:
1. Generate an API key from your Massdriver account settings
2. Include it in your requests using the `Authorization` header:
```
Authorization: Bearer your-api-key-here
```

### Quick Example
Here's a simple query to get you started:

```graphql
query {
  projects {
    name
    slug
    environments {
      name
    }
  }
}
```

## Next Steps
- Browse the schema documentation below to discover available queries and mutations
- Join our [Slack community](https://join.slack.com/t/massdrivercommunity/shared_invite/zt-1sxag35w2-eYw7gatS1hwlH2y8MCmwXA) for API support


