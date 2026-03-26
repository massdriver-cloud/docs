---
id: self-hosted-oidc
slug: /platform-operations/self-hosted/oidc
title: OIDC Configuration
sidebar_label: OIDC
---

Massdriver uses the [OpenID Connect (OIDC)](https://openid.net/connect/) protocol for user authentication. This guide covers how to configure OIDC for your self-hosted Massdriver instance, including provider-specific setup instructions.

## Overview

Each OIDC provider is configured as an entry in the `oidc` array in your `values-custom.yaml` file. You can configure multiple providers to give users different sign-in options.

```yaml
oidc:
  - provider: "google"
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth"
    tokenUrl: "https://oauth2.googleapis.com/token"
    clientId: "your-client-id"
    clientSecret: "your-client-secret"
```

### Redirect URI

When configuring your OAuth application with a provider, you'll need to set the redirect (callback) URI. The format is:

```
https://api.<your-domain>/auth/<provider>/callback
```

Where `<provider>` is one of `google`, `github`, `microsoft`, or `okta`. For example, if your domain is `massdriver.example.com` and you're configuring GitHub:

```
https://api.massdriver.example.com/auth/github/callback
```

## Configuration Reference

| Field | Required | Description |
|---|---|---|
| `provider` | Yes | The OIDC provider: `google`, `github`, `microsoft`, or `okta` |
| `authorizeUrl` | Yes | The provider's OAuth authorization endpoint |
| `tokenUrl` | Yes | The provider's OAuth token endpoint |
| `clientId` | Yes | The client/application ID from your OAuth app |
| `clientSecret` | Yes | The client secret from your OAuth app |
| `autojoinOrganization` | No | Massdriver organization ID to auto-join after authentication |
| `uiLabel` | No | Custom label for the sign-in button in the Massdriver UI |
| `uiIconUrl` | No | URL of a custom icon for the sign-in button |
| `okta.site` | Yes (Okta only) | Your Okta organization URL, e.g., `https://your-org.okta.com` |
| `okta.authorizationServerId` | No (Okta only) | Custom Okta authorization server ID. Omit to use the org-level endpoints |
| `okta.userinfoUrl` | No (Okta only) | Custom userinfo endpoint URL. Auto-derived from `site` and `authorizationServerId` if omitted |

### Optional Fields

**`autojoinOrganization`** — Automatically associates new users who sign up via this OIDC provider with the specified Massdriver organization. Without this, new users will be prompted to create a new organization. Use the organization ID (e.g., `myorg`), not the display name (e.g., `"My First Organization"`).

**`uiLabel`** — Overrides the default button text on the login page. Useful if you want to show something like `"Sign in with Corporate SSO"` instead of the default provider name.

**`uiIconUrl`** — URL to a custom icon displayed on the sign-in button. Useful for branding the login experience with your company's identity provider icon.

## Provider Setup

### GitHub

#### 1. Create an OAuth App

1. Go to your GitHub organization's **Settings > Developer settings > OAuth Apps** (or your personal account settings for testing).
2. Click **New OAuth App**.
3. Fill in the required fields:
   - **Application name**: e.g., `Massdriver`
   - **Homepage URL**: `https://app.<your-domain>`
   - **Authorization callback URL**: `https://api.<your-domain>/auth/github/callback`
4. Click **Register application**.
5. Copy the **Client ID**.
6. Click **Generate a new client secret** and copy it.

For more details, see the [GitHub documentation on creating an OAuth App](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app).

#### 2. Configure Massdriver

```yaml
oidc:
  - provider: "github"
    authorizeUrl: "https://github.com/login/oauth/authorize"
    tokenUrl: "https://github.com/login/oauth/access_token"
    clientId: <your-github-client-id>
    clientSecret: <your-github-client-secret>
    autojoinOrganization: <your org>
    uiLabel: "GitHub"
    uiIconUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/github.svg"
```

### Google

#### 1. Create OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services > Credentials**.
3. Click **Create Credentials > OAuth client ID**.
4. Select **Web application** as the application type.
5. Set the **Authorized redirect URIs** to: `https://api.<your-domain>/auth/google/callback`
6. Click **Create** and copy the **Client ID** and **Client Secret**.

If you haven't already, you may need to configure the [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent) first.

For more details, see the [Google documentation on setting up OAuth 2.0](https://support.google.com/cloud/answer/6158849).

#### 2. Configure Massdriver

```yaml
oidc:
  - provider: "google"
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth"
    tokenUrl: "https://oauth2.googleapis.com/token"
    clientId: <your-google-client-id>
    clientSecret: <your-google-client-secret>
    autojoinOrganization: <your org>
    uiLabel: "Google"
    uiIconUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/google.svg"
```

### Microsoft (Entra ID)

#### 1. Register an Application

1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com/).
2. Browse to **Entra ID > App registrations** and click **New registration**.
3. Fill in the required fields:
   - **Name**: e.g., `Massdriver`
   - **Supported account types**: Choose based on your needs (single tenant, multi-tenant, etc.)
   - **Redirect URI**: Select **Web** and enter `https://api.<your-domain>/auth/microsoft/callback`
4. Click **Register**.
5. Copy the **Application (client) ID** from the app's Overview page.
6. Under **Manage**, go to **Certificates & secrets > New client secret**, create one, and copy the **Value**.
7. Note your **Directory (tenant) ID** from the app's Overview page — you'll need it for the URLs below.

For more details, see the [Microsoft documentation on registering an application](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app).

#### 2. Configure Massdriver

Replace `<tenant-id>` with your Entra ID tenant ID. If you want to allow any Microsoft account (multi-tenant), use `common` instead of the tenant ID.

```yaml
oidc:
  - provider: "microsoft"
    authorizeUrl: "https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/authorize"
    tokenUrl: "https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token"
    clientId: <your-microsoft-client-id>
    clientSecret: <your-microsoft-client-secret>
    autojoinOrganization: <your org>
    uiLabel: "Microsoft"
```

### Okta

#### 1. Create an OIDC Application

1. Sign in to your Okta admin console (e.g., `https://your-org-admin.okta.com`).
2. Navigate to **Applications > Applications** and click **Create App Integration**.
3. Select **OIDC - OpenID Connect** as the sign-in method and **Web Application** as the application type. Click **Next**.
4. Fill in the required fields:
   - **App integration name**: e.g., `Massdriver`
   - **Sign-in redirect URIs**: `https://api.<your-domain>/auth/okta/callback`
5. Under **Assignments**, choose who can access the application.
6. Click **Save**.
7. Copy the **Client ID** and **Client Secret** from the application's settings.

For more details, see the [Okta documentation on creating an OIDC app integration](https://help.okta.com/en-us/content/topics/apps/apps_app_integration_wizard_oidc.htm).

#### 2. Configure Massdriver

The Okta provider requires the `okta.site` field pointing to your Okta organization URL. The `authorizeUrl` and `tokenUrl` are derived from this, but must still be provided explicitly.

**Using the org-level authorization server** (default):

```yaml
oidc:
  - provider: "okta"
    authorizeUrl: "https://your-org.okta.com/oauth2/v1/authorize"
    tokenUrl: "https://your-org.okta.com/oauth2/v1/token"
    clientId: <your-okta-client-id>
    clientSecret: <your-okta-client-secret>
    autojoinOrganization: <your org>
    uiLabel: "Okta"
    okta:
      site: "https://your-org.okta.com"
```

**Using a custom authorization server:**

If you've configured a [custom authorization server](https://developer.okta.com/docs/concepts/auth-servers/#custom-authorization-server) in Okta, include the authorization server ID in the URLs and in the `okta` configuration:

```yaml
oidc:
  - provider: "okta"
    authorizeUrl: "https://your-org.okta.com/oauth2/<authorization-server-id>/v1/authorize"
    tokenUrl: "https://your-org.okta.com/oauth2/<authorization-server-id>/v1/token"
    clientId: <your-okta-client-id>
    clientSecret: <your-okta-client-secret>
    autojoinOrganization: <your org>
    uiLabel: "Okta"
    okta:
      site: "https://your-org.okta.com"
      authorizationServerId: "<authorization-server-id>"
```

## Multiple Providers

You can configure multiple OIDC providers simultaneously. Each will appear as a separate sign-in option on the login page:

```yaml
oidc:
  - provider: "github"
    authorizeUrl: "https://github.com/login/oauth/authorize"
    tokenUrl: "https://github.com/login/oauth/access_token"
    clientId: "github-client-id"
    clientSecret: "github-client-secret"
    uiLabel: "Sign in with GitHub"
  - provider: "google"
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth"
    tokenUrl: "https://oauth2.googleapis.com/token"
    clientId: "google-client-id"
    clientSecret: "google-client-secret"
    uiLabel: "Sign in with Google"
```

## Disabling QuickStart Login

Once OIDC is configured and verified, you should disable QuickStart login by removing the `quickstart` section from your `values-custom.yaml`, or setting it to an empty object:

```yaml
quickstart: {}
```

QuickStart login is intended only for initial setup and testing. See the [installation guide](./install#step-5-configure-access) for more details.
