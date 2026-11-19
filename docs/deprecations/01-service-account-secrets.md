---
id: deprecations-service-account-secrets
slug: /deprecations/service-account-secrets
title: Service Account Secrets
sidebar_label: Service Account Secrets
---

**End of life:** December 31, 2026. After this date, service account secrets do not authenticate.

**Replacement:** [Access tokens](/api/graphql/guides/authentication#access-tokens-recommended).

## Service account secrets

Each [service account](/platform-operations/security/service-accounts) has one long-lived secret. Clients use the secret in these places:

| Use | How the client sends the secret |
|---|---|
| GraphQL and REST API requests | `Authorization: Bearer <service account secret>` |
| Deprecated API header | `x-md-api-key: <service account secret>` |
| Mass CLI | `MASSDRIVER_API_KEY` environment variable, or `api_key` in the CLI configuration file |
| Terraform and OpenTofu state backend | `TF_HTTP_PASSWORD`, with the organization identifier as `TF_HTTP_USERNAME` |
| Bundle registry | `Authorization` header |

A service account secret does not expire. It is not scoped. You cannot revoke a secret and keep the service account.

## Access tokens

Access tokens replace service account secrets in all of the places above.

- An access token starts with `md_`.
- An access token has scopes.
- An access token has an expiry date. A service account token can be valid for a maximum of 10 years.
- You can revoke an access token with the [`revokeAccessToken`](/api/graphql/operations/mutations/revoke-access-token) mutation. Other tokens for the same service account continue to work.
- Massdriver shows the token value one time, when you create the token. Copy it and keep it in your secret store.

When you create a service account, Massdriver also creates an access token named "Default" for it. To create more tokens for a service account, use the [`createServiceAccountAccessToken`](/api/graphql/operations/mutations/create-service-account-access-token) mutation.

Send an access token in the same places as the secret:

```bash
# API requests
curl -X POST https://api.massdriver.cloud/api/v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer md_xxxxxxxxxxxxxxxxxxxxxxxx" \
  -d '{"query": "{ viewer { __typename } }"}'

# Mass CLI
export MASSDRIVER_API_KEY=md_xxxxxxxxxxxxxxxxxxxxxxxx

# Terraform and OpenTofu state backend
export TF_HTTP_USERNAME=your-org-identifier
export TF_HTTP_PASSWORD=md_xxxxxxxxxxxxxxxxxxxxxxxx
```

Use the `Authorization` header. Do not use the `x-md-api-key` header.

## Migration checklist

1. **Find each integration that uses a service account secret.** Examine these locations:
   - CI/CD pipelines, for example the [GitHub Action](/platform-operations/ci-cd/github-action) and [Azure DevOps](/platform-operations/ci-cd/azure-devops) secrets that set `MASSDRIVER_API_KEY`.
   - Terraform and OpenTofu [state backends](/platform-operations/state-management) that set `TF_HTTP_PASSWORD`.
   - Mass CLI configuration files and shell profiles.
   - Scripts and API clients that send an `Authorization: Bearer` header or an `x-md-api-key` header.
2. **Create an access token** for each service account. Use one token for each integration. Then you can revoke one integration's token and not stop the other integrations.
3. **Replace the secret** with the access token in each integration. If an integration sends the `x-md-api-key` header, change it to send `Authorization: Bearer <access token>`.
4. **Verify** each integration. Run the pipeline, `tofu init`, `terraform init`, or the script. To examine an API credential, send the `viewer` query from the [authentication guide](/api/graphql/guides/authentication#verifying-your-credentials). The response must show `ServiceAccountViewer`.
5. **Set a reminder** to replace each access token before its expiry date.
