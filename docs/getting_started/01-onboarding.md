---
id: getting-started-onboarding
slug: /getting-started/onboarding
title: Onboarding
sidebar_label: Onboarding
---

In this section, we will cover the basics of getting started with the platform. We will cover the following topics:
* Setting up your cloud credentials in Massdriver
* Installing pre-requisite tools
* Installing the Mass CLI
* Setting Massdriver environment variables

:::note

You'll need to have created your Massdriver account and organization to complete this onboarding process. If you haven't done so already, you can create your account [here](https://app.massdriver.cloud/register).

Also, for any help with any of these steps, please feel free to reach out to us on [Slack](https://join.slack.com/t/massdrivercommunity/shared_invite/zt-1smvckvdj-jVFpBG2jF5XiYzX2njDCWA).

:::

## Setting up your cloud credentials in Massdriver

Massdriver uses your cloud credentials to provision resources on your behalf. You can set up your cloud credentials by following the instructions in the cloud provider you want [here](https://app.massdriver.cloud/organization/credentials).

## Installing pre-requisite tools

### Install terminal

You'll need a terminal to run commands in. We'll be using a terminal to run Mass CLI commands for managing your application bundle.

**MacOS**

The default terminal on MacOS is Terminal. You can find it in the Applications folder. The MacOS Terminal will work fine for this tutorial.

**Windows**

For Windows, we highly recommend installing [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install). WSL (*Windows Subsystem for Linux*) is a compatibility layer for running Linux binary executables natively on Windows. WSL2 is the latest version of WSL and is a full Linux kernel built by Microsoft.

In regards to a terminal to use, the Windows Terminal app on the Windows Store is a great option as it integrates well with WSL. You can find it [here](https://apps.microsoft.com/store/detail/windows-terminal/9N0DX20HK701?hl=en-us&gl=us&activetab=pivot%3Aoverviewtab). (*Requires Windows 10 version 19041 or higher*)

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
