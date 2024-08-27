---
id: getting-started-credentials
slug: /getting-started/credentials
title: Credentials
sidebar_label: Credentials
---

Follow the specific cloud and preferred method to create the necessary credentials below:

## AWS

<details>
<summary>One Click Role</summary>

</details>

<details>
<summary>CLI</summary>

</details>

<details>
<summary>Console</summary>

</details>

## Azure

<details>
<summary>CLI</summary>

### Install Azure CLI

To get started, you'll need the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed locally on your machine. The Azure Cloud Shell available in the Azure Portal does **not** have the ability to grant the service principal the required permissions.

2. Obtain your **subscription ID**

Paste this script into the command-line to list your subscriptions:

```bash
az account list --output table
```

Copy the value of the `SubscriptionId` and `TenantId` you want to use and paste it into Massdriver under **Subscription ID** and **Tenant ID**, and also store the `SubscriptionId` for the next step.

3. Paste this script in the command-line to create an Azure service principal, and replace `<mySubscriptionID>` with the subscription ID you copied from the last step:

```bash
az ad sp create-for-rbac --name massdriver-service-principal \
                         --role owner \
                         --scopes /subscriptions/<mySubscriptionID>
```

4. Copy the following attributes and paste them into Massdriver:

- appId &rarr; **Client ID**
- password &rarr; **Client Secret**

Once finished, click the **Submit** button in Massdriver to create your credential.

</details>

<details>
<summary>Console</summary>

</details>

## GCP

<details>
<summary>CLI</summary>

</details>

<details>
<summary>Console</summary>

</details>
