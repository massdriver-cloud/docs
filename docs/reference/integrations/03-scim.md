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
| --- | --- | --- |
| SCIM Endpoint URL | The URL your IdP sends provisioning requests to | Provided after integration creation |
| Bearer Token | Authentication token for SCIM requests | Provided after integration creation |

Refer to your identity provider's documentation for specific setup instructions:

- **Okta**: [SCIM Provisioning](https://help.okta.com/en-us/content/topics/apps/apps_app_integration_wizard_scim.htm)
- **Azure AD**: [SCIM Provisioning](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/use-scim-to-provision-users-and-groups)
- **OneLogin**: [SCIM Provisioning](https://onelogin.service-now.com/support?id=kb_article&sys_id=912c3ea0db5b20d0d86e305e0b961932)
- **JumpCloud**: [SCIM Provisioning](https://support.jumpcloud.com/s/article/getting-started-scim-integration)

### Step 3: Test the Connection

Most identity providers include a **Test Connection** button in their SCIM configuration. Use this to verify that your IdP can reach the Massdriver SCIM endpoint and authenticate successfully.

## Controlling Which Users Are Provisioned

By default, most identity providers will attempt to provision all assigned users to Massdriver. If you only want a subset of your directory to have access, each IdP offers its own mechanism for scoping which users are synced.

### Microsoft Entra ID (Azure AD): Scoping Filters

Entra ID supports **attribute-based scoping filters** that let you define rules for which users are provisioned. For example, you can provision only users whose `department` equals `Engineering` or whose `userPrincipalName` matches a specific domain.

Scoping filters are configured in the **Provisioning > Mappings** section of your enterprise application. Each filter consists of one or more clauses evaluated with AND logic. Multiple filters are evaluated with OR logic — a user matching any filter is provisioned.

Common examples include filtering by department, email domain (via regex on `userPrincipalName`), or employee ID range.

For full instructions, see [Scoping users or groups with scoping filters](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/define-conditional-rules-for-provisioning-user-accounts).

### Okta: User and Group Assignments

Okta controls provisioning scope through **application assignments**. Only users or groups explicitly assigned to the Massdriver application in Okta will be provisioned.

To scope provisioning, navigate to your Massdriver application in the Okta Admin Console and use the **Assignments** tab to add specific users or groups. Members of assigned groups are automatically provisioned when they are added and deprovisioned when they are removed.

For details, see [SCIM app integrations](https://help.okta.com/en-us/content/topics/apps/apps-about-scim.htm).

### OneLogin: Roles and Provisioning Rules

OneLogin controls which users are provisioned based on **application assignments and roles**. Only users assigned to the Massdriver application (directly or via a OneLogin role) are provisioned.

For more granular control, you can use **Rules** under the application's Rules tab. Rules let you filter users by attribute values (e.g., department, role name) and control which subset of users is provisioned or how they are mapped to groups.

For details, see [Introduction to User Provisioning](https://onelogin.service-now.com/kb_view_customer.do?sysparm_article=KB0010298).

### JumpCloud: User Group Assignments

JumpCloud scopes SCIM provisioning through **user groups**. Rather than assigning individual users, you assign user groups to the Massdriver application. Only users who are members of the assigned groups will be provisioned.

To configure scoping, navigate to your Massdriver application in the JumpCloud Admin Console, select the **User Groups** tab, and select the groups you want to sync. Users added to or removed from those groups will be provisioned or deprovisioned automatically.

For details, see [Get Started: SCIM Identity Management](https://jumpcloud.com/support/get-started-identity-management-connectors).

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

### Too many users are being provisioned

- Review the scoping configuration for your identity provider (see [Controlling Which Users Are Provisioned](#controlling-which-users-are-provisioned) above)
- For Entra ID, add a scoping filter to restrict provisioning to specific departments, domains, or user attributes
- For Okta, OneLogin, and JumpCloud, verify that only the intended users or groups are assigned to the Massdriver application
