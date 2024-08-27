---
id: getting-started-prerequisites
slug: /getting-started/prerequisites
title: Prerequisites
sidebar_label: Prerequisites
---

In this section, we will cover the basics of getting started with the platform. We will cover the following topics:

- Installing prerequisite tools
- Installing the Mass CLI
- Setting Massdriver environment variables

:::note

You'll need to have created your Massdriver account and organization to complete this guide. If you haven't done so already, you can create a **free** account [here](https://app.massdriver.cloud/register).

Also, for any help with any of these steps, please feel free to reach out to us on [Slack](https://join.slack.com/t/massdrivercommunity/shared_invite/zt-1smvckvdj-jVFpBG2jF5XiYzX2njDCWA).

:::

## Installing prerequisite tools

### Install terminal

You'll need a terminal to run commands in. We'll be using a terminal to run Mass CLI commands for managing your application bundle.

**Linux/MacOS**

The default terminal on MacOS is Terminal. You can find it in the Applications folder. The MacOS Terminal will work fine for this tutorial. If you're using Linux, you can use the default terminal for your distribution.

**Windows**

For Windows, we highly recommend installing [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install). WSL (_Windows Subsystem for Linux_) is a compatibility layer for running Linux binary executables natively on Windows. WSL2 is the latest version of WSL and is a full Linux kernel built by Microsoft.

:::note

Docker does not support WSL1. If you need to update your WSL version from WSL1 to WSL2, you can follow the instructions [here](https://learn.microsoft.com/en-us/windows/wsl/install#upgrade-version-from-wsl-1-to-wsl-2).

:::

In regards to a terminal to use, the Windows Terminal app on the Windows Store is a great option as it integrates well with WSL. You can find it [here](https://apps.microsoft.com/store/detail/windows-terminal/9N0DX20HK701?hl=en-us&gl=us&activetab=pivot%3Aoverviewtab). (_Requires Windows 10 version 19041 or higher_)

### Install Docker

Massdriver uses Docker images to run applications. Our Mass CLI tool also uses the Docker Daemon for the `mass image push` command.

You can install Docker Desktop by following the instructions [here](https://docs.docker.com/get-docker/).

### Install IDE

An IDE of some type is also required. We'll be using an IDE to work in your application's source directory to create a Dockerfile and set your app's environment variables in Massdriver.

We recommend [VS Code](https://code.visualstudio.com/).

### Install Git

We recommend installing Git to clone your application repositories to access your application's source code.

You can install Git by following the instructions [here](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git).

## Installing the Mass CLI

The Mass CLI is a command line tool that allows you to interact with the Massdriver platform. You can use it to create applications, push images, and more.

You can install the Mass CLI by following the instructions [here](/docs/cli/00-overview.md).

## Setting Massdriver environment variables

The Mass CLI uses environment variables to authenticate with the Massdriver platform. You can set these environment variables by following the instructions [here](/docs/cli/00-overview.md###setup).

For ease of use, it's recommended to set these environment variables in your shell's profile. For example, if you're using bash, you can add the following to your `~/.bashrc` file:

```bash
echo 'export MASSDRIVER_API_KEY=<your-api-key>' >> ~/.bashrc
echo 'export MASSDRIVER_ORG_ID=<your-org-id>' >> ~/.bashrc
```

You are now ready to move onto setting up your Cloud Provider credentials. You can find the next section [here](/docs/getting_started/02-credentials.md).
