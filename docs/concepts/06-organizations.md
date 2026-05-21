---
id: concepts-organizations
slug: /concepts/organizations
title: Organizations
sidebar_label: Organizations
---

Organizations are the top-level entity in Massdriver. They are the primary way to manage access to Massdriver.

## Add a member to your organization

Members are added through groups — every user belongs to one or more groups, and the group's policies determine what they can do.

1. Open the [**Groups**](https://app.massdriver.cloud/orgs?destination=/settings/groups) tab in your org's settings.
2. Click the group you want to add the user to (e.g., `Developers`, `Organization Admin`).
3. In the **Members** section, click **Add member**.
4. Enter the user's email address and click **Add member** in the modal.

If the email belongs to an existing organization member they're added to the group directly; otherwise an invitation email is sent.

<video controls loop muted playsInline width="100%">
  <source src="/img/screenshots/add-member-to-group.webm" type="video/webm" />
</video>


## Find your organization ID

To find your organization ID, hover over your organization name logo in the top left corner of the Massdriver UI and click the copy button next to your organization ID.

### Use your organization ID in the Massdriver CLI

To use your organization ID in the Massdriver CLI, export the `MASSDRIVER_ORG_ID` environment variable to the value of your organization ID.

```bash
export MASSDRIVER_ORG_ID=your-org-id
```
