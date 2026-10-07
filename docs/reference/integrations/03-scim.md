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
  (see [Seats](#seats))

Massdriver never refuses a SCIM request because the organization has no free seats.

## Seats

Each user who has access to your organization holds a **seat**. `billing.seatsUsed` on the
API is the number of seats in use, and `holdsSeat` on each member shows who holds one.

### Users your identity provider provisions

For a user your IdP provisions, the SCIM `active` value decides the seat. Group membership
does not.

- A user your IdP marks active wants a seat. If you set a [seat rule](#seat-rule), the user
  must also match it.
- A user who wants a seat gets one if the organization has a free seat. If every seat is in
  use, the user waits. When a seat becomes free, or when you add seats to your plan, the
  user who has waited longest gets it. Organization owners get one email each day while
  users wait.
- `active: false` releases the user's seat. Their group memberships stay, so when your IdP
  sets `active: true` again, they get their groups back with their seat.
- A `DELETE` removes the user's seat, provisioning record, and group memberships in that
  organization. The account itself is retained.
- If your IdP does not send `active` when it creates a user, the user starts active.

Groups decide what a user can do. A user who holds a seat but is in no group has no access,
and still uses a seat.

### Members you add in Massdriver

- An invitation does not hold a seat. The invited person gets a seat when they accept, if
  the organization has a free seat. If it does not, the accept fails with a message to
  contact the organization owner, and the invitation stays so they can accept it later.
- Single sign-on autojoin also needs a free seat.
- A member who leaves their last group releases their seat. Deleting a group releases the
  seats of members it leaves in no group.

The organization owner always holds a seat.

### Seat rule

Some identity providers mark licensed users with an attribute instead of `active`. For
example, an Entra app role named **Licensed** with the value `licensed`. A seat rule tells
Massdriver to give a seat only to active users whose attribute has that value.

Set the rule with two optional fields in the SCIM integration's config:

| Field | Description |
| --- | --- |
| `seat_attribute` | A top-level SCIM user attribute, for example `roles`. Sub-attributes such as `name.givenName` and extension attributes are not supported. |
| `seat_value` | The value the attribute must have, for example `licensed`. |

Set both fields, or neither. Matching ignores case and reads values only, never display
names:

- For a multi-valued attribute such as `roles`, a user matches when any entry's `value`
  matches. Entra sends each app role as a JSON string inside `value`; Massdriver reads the
  `value` inside it.
- For a boolean attribute, `true` and `false` match their string forms, such as `"True"`.
- For any other string attribute, the strings must be equal.

To set or change the rule on an existing integration, use the `updateIntegration` mutation:

```graphql
mutation {
  updateIntegration(
    organizationId: "your-org"
    id: "scim"
    input: { config: "{\"seat_attribute\": \"roles\", \"seat_value\": \"licensed\"}" }
  ) {
    successful
    messages { field message }
  }
}
```

The rule applies to every provisioned user immediately. Users who no longer match release
their seats, and users who now match get a seat or wait for one. Set `config` to `"{}"` to
remove the rule.

Massdriver stores the attributes your IdP sends for each user, so the rule works for users
provisioned before you set it. Users whose attributes Massdriver has not stored yet do not
match. Before you set a rule, restart provisioning in your IdP so it sends every user's
attributes again, and wait for the cycle to complete.

#### Example: Entra app roles

1. In your Entra enterprise app, open **Provisioning > Mappings > Provision Microsoft Entra
   ID Users**. Add a mapping from `AppRoleAssignmentsComplex([appRoleAssignments])` to
   `roles`.
2. Create an app role with the value `licensed`, and assign it to the users or groups that
   must hold a seat.
3. Open **Provisioning** and click **Restart provisioning**. Wait for the cycle to complete.
4. Set `seat_attribute` to `roles` and `seat_value` to `licensed` with `updateIntegration`.

Removing the app role from a user, or unassigning them from the app, releases their seat.

### What sets `active` in your identity provider

#### Okta

Okta uses a soft-delete model: rather than sending `DELETE`, it sends a `PATCH` that sets
`active` to `false`.

```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
  "Operations": [{ "op": "replace", "value": { "active": false } }]
}
```

Deactivation is triggered when you:

- Unassign the user from the Massdriver application on the **Assignments** tab
- Remove the user from a group that is assigned to the application
- Deactivate or deprovision the user in Okta

Reassigning or reactivating the user sends the same `PATCH` with `active` set to `true`.

See [Okta and SCIM Version 2.0](https://developer.okta.com/docs/api/openapi/okta-scim/guides/scim-20).

#### Microsoft Entra ID

Entra sends a disable as an update setting `active` to `false`. Four events trigger it:

- The user is unassigned from the application
- The user goes out of scope, meaning they no longer pass a scoping filter
- The user is soft-deleted in Entra, which includes being blocked from sign-in
- The user is permanently deleted from Entra

Disabling on out-of-scope is the default and can be turned off with
[skip out-of-scope deletions](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/skip-out-of-scope-deletions).
If `IsSoftDeleted` appears in your attribute mappings, it is the attribute Entra uses to
decide whether to send `active = false`.

Thirty days after a user is soft-deleted, Entra permanently deletes them and sends a
`DELETE` request.

Note that Entra cannot provision a user who is disabled in the directory. The user must be
active in Entra before they can be provisioned to Massdriver.

See [Deprovisioning in Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/how-provisioning-works#deprovisioning).

#### OneLogin and JumpCloud

Both follow the same model: removing the user from the Massdriver application, or from an
assigned role or user group, deprovisions them and releases the seat. Consult the vendor
links in [Setup](#step-2-configure-your-identity-provider) for the exact behavior of your
configuration.

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
