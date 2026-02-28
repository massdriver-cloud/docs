---
id: swapi
title: GraphQL API Reference
sidebar_label: API Reference
---

# GraphQL API Reference

Welcome to the Massdriver GraphQL API documentation. This section provides detailed information about all available queries, mutations, types, and other GraphQL schema elements.

## Getting Started

To use the Massdriver GraphQL API, you'll need to:

1. Authenticate with your API credentials (see below)
2. Send requests to the GraphQL endpoint
3. Use the queries and mutations documented below

## API Endpoint

The GraphQL API is available at: `https://api.massdriver.cloud/graphql`

## Authentication

All API requests require authentication using a **service account key**. You'll need to create a service account and obtain a key. [Learn more about service accounts here.](/platform-operations/security/service-accounts)

**Authorization header format:**

```
Authorization: Basic BASE64ENCODED(org_slug:service_account.secret)
```

Replace `org_slug` and `service_account.secret` with your actual organization slug and service account secret.

## GraphQL Playground

You can explore and test the API using the [GraphQL Playground](https://api.massdriver.cloud/api/graphiql). This playground uses your logged-in user session and does **not** require a service account key.
