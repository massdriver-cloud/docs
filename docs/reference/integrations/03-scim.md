---
id: scim
slug: /reference/integrations/scim
title: SCIM
sidebar_label: SCIM
---

# SCIM

SCIM (System for Cross-domain Identity Management) is an open standard for automating the exchange of user identity information between identity providers (IdPs) and service providers. It enables your organization to automatically provision, update, and deprovision user accounts in Massdriver based on changes made in your identity provider.

## Prerequisites

- An active Massdriver organization
- An identity provider that supports SCIM 2.0 (e.g., Okta, Azure AD, OneLogin, JumpCloud)

## Setup

### Step 1: Create the SCIM Integration

1. Navigate to your organization's **Integrations** page in Massdriver
2. Click **Integrate** on the SCIM integration
3. Select **Token** in the Authentication Type dropdown

Massdriver provisions a SCIM endpoint and generates a bearer token for authentication.

### Step 2: Configure Your Identity Provider

Using the values provided by Massdriver, configure SCIM provisioning in your IdP:

| Field | Description | Source |
|-------|-------------|--------|
| SCIM Endpoint URL | The URL your IdP sends provisioning requests to | Provided after integration creation |
| Bearer Token | Authentication token for SCIM requests | Provided after integration creation |

Refer to your identity provider's documentation for specific setup instructions:

- **Okta**: [SCIM Provisioning](https://help.okta.com/en-us/content/topics/apps/apps_app_integration_wizard_scim.htm)
- **Azure AD**: [SCIM Provisioning](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/use-scim-to-provision-users-and-groups)
- **OneLogin**: [SCIM Provisioning](https://onelogin.service-now.com/support?id=kb_article&sys_id=912c3ea0db5b20d0d86e305e0b961932)
- **JumpCloud**: [SCIM Provisioning](https://support.jumpcloud.com/s/article/getting-started-scim-integration)

### Step 3: Test the Connection

Most identity providers include a **Test Connection** button in their SCIM configuration. Use this to verify that your IdP can reach the Massdriver SCIM endpoint and authenticate successfully.

## Supported Operations

Once configured, your identity provider can automatically:

- **Create** users in Massdriver when they are assigned in your IdP
- **Update** user attributes when changes are made in your IdP
- **Deactivate** users in Massdriver when they are unassigned or deprovisioned in your IdP

## Troubleshooting

### Test connection fails

- Verify the SCIM Endpoint URL is entered correctly in your IdP
- Confirm the Bearer Token has not been modified or truncated
- Check that your IdP can reach the Massdriver SCIM endpoint (no firewall or network restrictions)

### Users are not being provisioned

- Confirm that users or groups are assigned to the Massdriver application in your IdP
- Check your IdP's provisioning logs for errors
- Verify that SCIM provisioning is enabled (not just SSO)
