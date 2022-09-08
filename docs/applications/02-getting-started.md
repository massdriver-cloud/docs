---
id: applications-getting-started
slug: /applications/getting-started
title: Getting Started
sidebar_label: Getting Started
---

:::note

Before getting started you'll need the [Massdriver CLI](https://github.com/massdriver-cloud/massdriver-cli/releases) and a [Service Account key](/platform/service-accounts)

:::

To get started running an application on Massdriver, you'll need a containerized application.

Quick start application examples are available [here](https://github.com/massdriver-cloud/application-examples#source-code-for-example-applications).

First, create a new application bundle:

```shell
mass app new
```

Enter `k8s-phoenix-chat-example` as the name and a description. These will be used in the Massdriver UI to identify application bundles to users.

:::note

We recommend prefixing application and infrastructure bundles with where they run (i.e: `k8s-` to guide users in selecting the right bundle.

:::


```shell title="Prompt"
Name: phoenix-chat
Description: A phoenix chat app
```

Next an [application template](https://github.com/massdriver-cloud/application-templates) will need to be chosen.

For this example we'll choose `kubernetes-deployment`:

```shell
? Template:
    aws-lambda
    azure-function
    kubernetes-cronjob
  ▸ kubernetes-deployment
    kubernetes-job
```

Finally, [`connections`](/concepts/connections) (your application dependencies) will need to be selected.

For this example we'll choose [`massdriver/postgresql-authentication`](https://github.com/massdriver-cloud/artifact-definitions/blob/main/definitions/artifacts/postgresql-authentication.json).

```shell title="Prompt"
? What connections do you need?
  If you don't need any, just hit enter or select (None)
  [Use arrows to move, space to select, <right> to all, <left> to none, type to filter]
  [ ]  (None)
  [ ]  massdriver/aws-dynamodb-table
  ...
  [ ]  massdriver/mongo-authentication
  [ ]  massdriver/mysql-authentication
> [ ]  massdriver/postgresql-authentication
  [ ]  massdriver/redis-authentication
```

<!--
@@HERE
review YAML, what the choices did + `.app` + widgets

https://github.com/massdriver-cloud/phoenix-chat-example/
-->
