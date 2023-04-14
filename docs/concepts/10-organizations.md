---
id: concepts-organizations
slug: /concepts/organizations
title: Organizations
sidebar_label: Organizations
---

Organizations are the top-level entity in Massdriver. They are the primary way to manage access to Massdriver.

## Invite a user to your organization

To invite a user to your organization, click on `Users` in the sidebar, under `Organization Settings`.

Enter the email of the user you wish to invite and click `Invite`.

## Find your organization ID

To find your organization ID, hover over your organization name logo in the top left corner of the Massdriver UI and click the copy button next to your organization ID.

### Use your organization ID in the Massdriver CLI

To use your organization ID in the Massdriver CLI, export the `MASSDRIVER_ORG_ID` environment variable to the value of your Organization UUID.

```bash
export MASSDRIVER_ORG_ID=your-org-id
```