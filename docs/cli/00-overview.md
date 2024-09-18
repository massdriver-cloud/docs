---
id: cli-overview
slug: /cli/overview
title: Mass CLI Overview
sidebar_label: Overview
---

The Mass CLI is a powerful command line interface for interacting with the Massdriver platform. It is used to build and publish bundles, manage deployments, and more.

## Installation

### Brew Installation

To install the Mass CLI using [Homebrew](https://formulae.brew.sh/formula/massdriver), run the following command:

```bash
brew install massdriver
```

<details>
    <summary>Installing a specific version</summary>

To install a specific version of the Mass CLI, follow these steps:


1. Find the version you want to install from the [Mass CLI homebrew-core commit history](https://github.com/Homebrew/homebrew-core/commits/HEAD/Formula/m/massdriver.rb)
2. Copy the commit hash of the version you want to install. **NOTE:** Copy the commit hash for `massdriver: update x.y.z bottle` commit.
3. Run the following command to install the specific version:

*(If you have already installed the Mass CLI, you will need to uninstall it first using `brew uninstall massdriver`)*

```bash
curl -L https://raw.githubusercontent.com/Homebrew/homebrew-core/<commit-hash-here>/Formula/m/massdriver.rb > massdriver.rb && brew install massdriver.rb
```

If you want to pin the version you installed, run the following command:

```bash
brew pin massdriver
```

</details>

### Go Installation

To install using go:

```shell
go install github.com/massdriver-cloud/mass@latest
```

Make sure that your `$GOPATH/bin` is in your path.

### Manual Installation

To install (or update) the Mass CLI manually, download the latest release from the [Mass CLI releases page](https://github.com/massdriver-cloud/mass/releases).

Select the file that matches your operating system and architecture, i.e. `mass_darwin_amd64.zip` for Mac OS users.

Unzip the `mass` file and move it to a directory in your `$PATH`, i.e. `/usr/local/bin`.

:::note

For Mac OS users, you will need to allow `mass` to run by opening the `System Preferences` app, clicking on `Security & Privacy`, and clicking on the `Open Anyway` button. You may need to do this a second time after attempting to invoke the `mass` command.

:::

### Setup

In order to execute commands against your Massdriver organization, you must set environment variables for the CLI to use.

#### Find your organization ID

To find your organization slug, hover over your organization name logo in the top left corner of the Massdriver UI and click the copy button next to your organization slug.

#### Use your organization ID in the Massdriver CLI

To use your organization slug in the Massdriver CLI, export the `MASSDRIVER_ORG_ID` environment variable to the value of your organization slug.

```bash
export MASSDRIVER_ORG_ID=your-org-id
```
![Finding your Org ID](../applications/org-id.png)

#### Setting The Serivce Account

1. Visit the [Service Accounts page](https://app.massdriver.cloud/organization/api-keys)
2. Click 'Add Service Account'
3. Give the service account a name
4. Click the 'clipboard' icon.

![](../security/service-accounts.png)

You'll need to export your key to the following environment variable:

```bash
export MASSDRIVER_API_KEY=fookey9000!
```

### See the Commands

* [mass](/cli/commands/mass)	 - Massdriver Cloud CLI
