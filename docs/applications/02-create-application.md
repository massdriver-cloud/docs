---
id: applications-create
slug: /applications/create
title: Create
sidebar_label: Create
---

:::note

Before getting started you'll need:

* [Massdriver CLI](https://github.com/massdriver-cloud/mass/releases)
* [Service Account key](/platform-operations/security/service-accounts)
* A containerized application. Quick start application examples are available [here](https://github.com/massdriver-cloud/application-examples#source-code-for-example-applications).
* A runtime in your organization. This guide uses a runtime named `kubernetes-deployment`. Use the name of a runtime that your organization publishes.

:::

In this guide we'll write an **application bundle** and **publish** it to Massdriver. An application bundle runs on a [runtime](/applications) that your platform team publishes. The runtime holds the IaC. The application bundle holds only the configuration that is specific to your application: its dependencies (databases, queues), its environment variables, and its secrets. After you publish the application bundle, we'll configure it in the UI and set up continuous deployments from GitHub Actions.

First, make a directory for the application bundle and add a `massdriver.yaml`:

```yaml title="massdriver.yaml"
name: k8s-phoenix-chat-example
description: A phoenix chat app
version: 0.1.0

dependencies:
  postgres:
    resource_type: postgresql-authentication@~1
    required: true

app:
  runtime: kubernetes-deployment@~1
  envs:
    POSTGRES_USERNAME: .dependencies.postgres.authentication.username
```

The `name` and `description` identify the application bundle to users in the Massdriver UI. The `version` is the application's own version. It does not change with the runtime's version.

:::note

We recommend prefixing application and infrastructure bundles with where they run (i.e: `k8s-`) to guide users in selecting the right bundle.

:::

`app.runtime` takes `<runtime>@<constraint>`. Each build resolves the constraint to the newest matching runtime version. The published application pins `app.runtime` to that exact version, for example `kubernetes-deployment@1.4.2`. See [Choosing a runtime version](/bundle-development/runtimes-and-applications#choosing-a-runtime-version).

Then, add the [`dependencies`](/concepts/dependencies) that your application uses. Give each dependency a simple name, like `postgres`. If you have more complex dependencies, use names like `inventory_database` for an inventory database or `website_cache` for a Redis website cache. A dependency name must not match a dependency or param that the runtime declares.

There are different schools of thought as to if your application's cloud configuration should be stored alongside your application code or in a different directory. For `private` applications, we suggest keeping it alongside your application code to simplify CI/CD.

## Files in the Application Bundle

An application bundle has these files:

* `massdriver.yaml` - The application's name, version, runtime, dependencies, resources, environment variables, and secrets.
* `README.md` - Optional. Replaces the runtime's README.
* `CHANGELOG.md`, `icon.svg`, `operator.md` - Optional. Each one replaces the runtime's file.

An application bundle has no IaC. Massdriver ignores directories such as `src/` in the application bundle.

:::info

The `massdriver.yaml` is covered in detail in the [Bundle YAML Specification](/bundle-development/bundle-yaml-spec). The keys that an application can set are listed in [What an application can set](/bundle-development/runtimes-and-applications#what-an-application-can-set).

:::

## Configuring Apps

The `app` block of an application bundle accepts three keys:

* `app.runtime` - The runtime that the application runs on.
* `app.envs` - _Map_ of environment variables to set on the running application.
* `app.secrets` - _Map_ of secret **definitions**. These will be presented in your application's configuration interface in Massdriver and can be set per-instance or for preview environments.

The runtime can also have its own envs and secrets. The application inherits them and cannot change them. Your envs and secrets are added to the runtime's. Each name must be new. If you use the name of a runtime env or secret, the build fails.

`app.envs` expects [jq](https://stedolan.github.io/jq/manual/) queries to extract values from `params` or `dependencies`.

### Environment Variable Examples

Environment variables can be extracted from `params` and/or `dependencies`. Massdriver parses `jq` expressions to allow for rich composition of values into environment variables:

The following would set the `LOG_LEVEL` in your application based on the value a users selects from the `log_level` dropdown.

The `.params` prefix tells Massdriver where to pull the value from. The field names can be any complex expression with JQ as we'll see in the next example.

```yaml title="Simple param-based environment variable"
app:
  envs:
    LOG_LEVEL: .params.log_level
    PORT: .params.port | tostring
```

Here we set the `POSTGRES_USERNAME` to the `username` field in our Postgres dependency's authentication object.

```yaml title="Simple dependency-based environment variable"
app:
  envs:
    POSTGRES_USERNAME: .dependencies.postgres.authentication.username
```

Secrets are automatically converted to environment variables. More on secrets [below](#secret-examples).

:::info

The structure of each resource type is documented [in the artifact-definitions repo](https://github.com/massdriver-cloud/artifact-definitions/tree/main/definitions/artifacts) (the GitHub repository name retains its legacy form).

:::

In the following example we compose all of the components of the Postgres authentication object into a `POSTGRES_URL` environment variable.

```yaml title="Build a complex environment variable"
app:
  envs:
    POSTGRES_URL: '"postgres://" + .dependencies.postgres.authentication.username + ":" + .dependencies.postgres.authentication.password + "@" + .dependencies.postgres.authentication.hostname + ":" + (.dependencies.postgres.authentication.port|tostring) + "/chat?sslmode=disable"'
```

### Secret Examples

Secrets can be defined in your `massdriver.yaml` file. This will create forms in the Massdriver UI where 3rd party secrets can be set for your application.

Secrets will be turned into environment variables at deploy time. The environment variable has the same name as the secret. The `envs` jq queries can read only `.params` and `.dependencies` [above](#environment-variable-examples). They cannot read secrets.


```yaml title="Defining a secret"
app:
  secrets:
    SOME_SECRET: # This is env var name this will be converted to
      required: true # if a secret is required, Massdriver will block deployments that are missing this secret
      title: "A nice name for the UI"
      description: "A great description for the UI"
```
## Parameters

The runtime owns the `params` and the `ui`. An application bundle cannot set them. If your `massdriver.yaml` sets `params` or `ui`, the build fails. Your application inherits the runtime's params, and users configure them on each instance.

A good example is the container image repository (`.params.image.repository`). If the runtime exposes it as a param, set it on the instance's **Config** tab. If you need a different default or a param that the runtime does not have, ask your platform team to change the runtime.

To run this example, set the image repository on the instance to `massdrivercloud/phoenix-chat-example`.

The repository is available [here](https://hub.docker.com/repository/docker/massdrivercloud/phoenix-chat-example) and the code is on [GitHub](https://github.com/massdriver-cloud/phoenix-chat-example).

### Dependencies

In this example the application has two required dependencies:

* `kubernetes_cluster` - the cluster the app will deploy to. The runtime declares it, and the application inherits it.
* `postgres` - the database the app needs. The application declares it.

The runtime can also declare optional cloud credentials, such as an AWS IAM role or a GCP service account. The runtime uses the credential that is connected in the UI to create IAM roles and permissions for your application.

Declare only the dependencies that your application uses after it deploys. The runtime declares the dependencies that its IaC uses, such as the cluster and the cloud credential.

```yaml
dependencies:
  postgres:
    resource_type: postgresql-authentication@~1
    required: true
```

To see the merged bundle before you publish it, build it locally:

```shell
mass bundle build
```

The merged bundle is in `.massdriver/build/`.

At this point the application bundle can be published to the Massdriver bundle manager:

```yaml
mass bundle publish
```

You should see a success message. On any project canvas, open the **Bundles** panel and search for the bundle name — `k8s-phoenix-chat-example` — and it'll be in the results.

Click the bundle to add it to the project. Give the component a friendly **Component Name** (e.g. `Checkout Service`) and a short **Component ID** (the first segment of every instance identifier the bundle creates). Connect it to the Kubernetes cluster and PostgreSQL instances it depends on, configure the **Config** tab, and click **Provision** — or follow [Deploy](/applications/deploy) for the full walk-through.

If you would like to automatically publish your application bundle in CI/CD, see the [GitHub Actions guide](/platform-operations/ci-cd/github-action).

:::info

To write a runtime for your applications, see [Runtimes and Applications](/bundle-development/runtimes-and-applications#publishing-a-runtime).

:::
