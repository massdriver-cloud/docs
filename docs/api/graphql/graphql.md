---
id: graphql
title: GraphQL API Reference
sidebar_label: API Reference
---

# GraphQL API Reference

Welcome to the Massdriver GraphQL API documentation. The API offers a consistent, paginated interface for managing every entity in the platform — projects, environments, instances, resources, OCI repos, policies, and grants.

## Getting Started

To use the Massdriver GraphQL API, you'll need to:

1. Authenticate with a service account key (see below)
2. Send requests to the GraphQL endpoint
3. Use the queries and mutations documented below

## API Endpoint

The GraphQL API is available at: `https://api.massdriver.cloud/api/v1`

The endpoint path retains `v1` for backwards compatibility — there is one current API and one set of docs.

## Authentication

All API requests require authentication using a **service account key**. Create a service account and obtain a key. [Learn more about service accounts.](/platform-operations/security/service-accounts)

**Authorization header format:**

```
Authorization: Basic BASE64ENCODED(org_slug:service_account.secret)
```

Replace `org_slug` and `service_account.secret` with your actual organization slug and service account secret.

## GraphQL Playground

You can explore and test the API using the [GraphQL Playground](https://api.massdriver.cloud/api/v1/graphiql). The playground uses your logged-in user session and does **not** require a service account key.

## Authorization

Every query and mutation runs through Massdriver's [attribute-based access control (ABAC)](/platform-operations/security/access-control). Each operation requires a specific permission such as `project:view`, `instance:deploy`, or `resource:export`. See the [GraphQL permissions reference](/platform-operations/security/graphql-permissions) for the full mapping of operations to required permissions.
