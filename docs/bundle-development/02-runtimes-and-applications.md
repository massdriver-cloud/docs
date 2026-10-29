---
id: runtimes-and-applications
slug: /bundle-development/runtimes-and-applications
title: Runtimes and Applications
sidebar_label: Runtimes and Applications
---

# Runtimes and Applications

A **runtime** is a bundle that defines how applications run on a cloud: a Lambda function, a Kubernetes deployment, an ECS service, a worker. Its IaC decides scheduling, networking, IAM, and logging, and developers cannot change it.

An **application** is a bundle that runs on a runtime. It adds only what is specific to that application: its name and version, the dependencies it needs, the environment variables and secrets it reads, and the resources it emits for other services to depend on. An application is a single `massdriver.yaml` with no IaC of its own.

## Why runtimes

Most applications in an organization run on a handful of shapes. Without runtimes, each application either deploys a generic bundle and is wired up by hand in every environment, or carries a copy of the IaC in its own repository. Copies drift. Every developer can change what their infrastructure looks like, a security fix has to be applied to every copy, and the platform team ends up reviewing many modules that are mostly the same.

With runtimes, the IaC exists once. Applications carry only what differs between them, and that difference is small enough to review at a glance.

```mermaid
flowchart LR
  subgraph platform[Platform team]
    lambda["lambda runtime<br/>IaC, params, UI"]
  end
  subgraph apps[Application teams]
    payments["payments-api<br/>+ postgres, STRIPE_KEY"]
    search["search-api<br/>+ opensearch"]
    reports["reports-worker<br/>+ s3 bucket, schedule env"]
  end
  lambda --> payments
  lambda --> search
  lambda --> reports
```

The split follows who consumes a dependency and when. The runtime owns provision-time dependencies, the ones its IaC uses while it runs: the IAM role, the VPC, the cluster, the cloud credential. The application owns run-time dependencies, the ones its process talks to after deploy: Postgres, Redis, a queue, another service's endpoint.

Each application is still a complete, versioned bundle. It appears in the catalog under its own name, deploys like any other bundle, and records exactly which runtime release it was built from.

## Use cases

**A golden path for application teams.** The platform team publishes an `ecs-service` runtime with networking, logging, autoscaling, and IAM already decided. `orders-api` runs on it, adds a database and two environment variables, and ships. Developers see a form with only the params the platform team chose to expose.

**Rolling out a fix across many applications.** `lambda@1.2.8` scopes the IAM role more tightly. Every application on `lambda@~1.2` is rebuilt on 1.2.8 the next time it is published, from CI or a quick `mass bundle publish`. Nobody edits an application.

```mermaid
flowchart LR
  fix["lambda 1.2.8<br/>IAM fix"] --> ci["application CI runs<br/>mass bundle publish"]
  ci --> p["payments-api 0.4.1<br/>on lambda 1.2.8"]
  ci --> s["search-api 1.0.3<br/>on lambda 1.2.8"]
```

**Applications that publish their own contract.** `billing-api` runs on `lambda` but emits a `billing-api` resource, so other services depend on billing by type and never see the function underneath.

## Publishing a runtime

Set `provides: [runtime]`. Applications pass envs and secrets through their own `app` block, and the runtime's IaC decides how those reach the process, so a runtime that supports them must consume them. A runtime can add envs and secrets of its own in an `app` block, but it does not need one.

```yaml
name: lambda
version: 1.2.7
provides: [runtime]

app:
  envs:
    LOG_LEVEL: .params.log_level
```

`runtime` is the only value `provides` accepts. A bundle that both provides `runtime` and sets `app.runtime` fails to publish. A runtime does not need `resources`; many applications, such as a migration or cleanup task, have nothing for other bundles to depend on.

## Writing an application

Set `app.runtime` to the runtime the application runs on:

```yaml
name: payments-api
description: Handles card captures.
version: 0.1.0

dependencies:
  db:
    resource_type: postgres@~1
    required: true

app:
  runtime: lambda@~1.2
  envs:
    DB_HOST: .dependencies.db.host
  secrets:
    STRIPE_KEY:
      required: true
```

## How it works

`mass bundle build` and `mass bundle publish`:

1. Resolve the `app.runtime` constraint to the newest matching runtime version.
2. Pull that runtime from your organization's registry and check that its `provides` includes `runtime`.
3. Merge the application's `massdriver.yaml` onto the runtime's.
4. Copy the application's `README.md`, `CHANGELOG.md`, `icon.svg`, and `operator.md` over the runtime's.

`publish` then pushes the result as an ordinary bundle. Instances, deployments, and the UI treat it like any other bundle; the runtime is not consulted again after publish.

## Choosing a runtime version

`app.runtime` takes `<runtime>@<constraint>`, using the same constraint forms as [dependency versions](/bundle-development/dependencies-resources/version-resolution):

| Form | Builds against |
|------|----------------|
| `lambda@1.2.7` | that exact version |
| `lambda@~1.2` | the newest `1.2.x` |
| `lambda@~1` | the newest `1.x` |
| `lambda@latest` or `lambda` | the newest stable version |
| `lambda@~1.2+dev` | the newest `1.2.x`, including development releases |

The constraint resolves each time you build, so a new runtime release reaches the application the next time the application is published. Existing application releases keep the runtime code they were built with.

The published `massdriver.yaml` pins `app.runtime` to the exact runtime version it was built on:

```yaml
app:
  runtime: lambda@1.2.7
```

The runtime must be in your organization, and you need `repo:pull` access to its repository.

## What an application can set

The runtime owns everything that shapes the infrastructure: `steps`, `params`, `ui`, its `resources`, and its IaC. The application supplies:

| Key | Behavior |
|-----|----------|
| `name` | Required. The application's own bundle name. |
| `version` | Required. The application's own version, independent of the runtime's. |
| `description`, `source_url` | Replace the runtime's. The runtime's `source_url` is never inherited. |
| `provides` | Never inherited from the runtime. An application cannot provide `runtime`. |
| `dependencies` | Added to the runtime's dependencies. |
| `app.runtime` | Required. The runtime the application runs on. |
| `app.envs`, `app.secrets` | Added to the runtime's. Any other `app` key fails the build. |
| `resources` | Added to the runtime's resources. Each must be emitted by a step (see below). |
| `steps` | Attaches resource templates to the runtime's steps. Cannot add, remove, or reconfigure steps. |

Any other key, such as `params` or `ui`, fails the build. An application cannot be a runtime, so applications cannot run on other applications.

## Adding dependencies

Application dependencies are added alongside the runtime's and become inputs to the runtime's IaC like any other dependency. Use them from `app.envs`:

```yaml
dependencies:
  cache:
    resource_type: redis@~1
    required: true

app:
  envs:
    CACHE_URL: .dependencies.cache.url
```

A dependency name must not match a dependency or param the runtime already declares.

## Environment variables and secrets

`app.envs` and `app.secrets` are added to the runtime's. Each name must be new; redefining a runtime env or secret fails the build.

Every `app.envs` expression must reference params and dependencies that exist in the merged bundle. An expression that reads an optional dependency builds with a warning, because deployments fail while that dependency is not connected.

## Emitting resources

An application can publish resources of its own, for example a `billing-api` resource that other bundles depend on. Declare the resource, then attach a jq template to the runtime step that should emit it:

```yaml
resources:
  billing:
    resource_type: billing-api@1.0.0
    required: true

steps:
  - path: src
    resources:
      billing:
        template: |
          {
            url: .outputs.function_url,
            region: .params.region
          }
```

The template renders after that step applies. It can read the step's IaC outputs as `.outputs` and the instance's params as `.params`.

- `path` must name one of the runtime's steps. An application step can set only `path` and `resources`.
- Each entry under a step's `resources` is a map with a `template` key holding the jq.
- Every application resource needs exactly one template, and every template must belong to a declared resource.
- An application resource must not reuse a runtime resource name.

Output names belong to the runtime's IaC. If a runtime release renames an output, the template breaks at deploy time, so pin the runtime to a range that keeps its outputs stable.

## Building and publishing

Build locally to inspect the merged bundle:

```bash
mass bundle build
```

The merged bundle is assembled in `.massdriver/build/` next to the application's `massdriver.yaml`. The `.massdriver/` directory contains its own `.gitignore`, so nothing is committed. Each build starts from a clean directory.

Publish as usual:

```bash
mass bundle publish --development
mass bundle publish
```

`publish` assembles in a temporary directory, so it always uses the newest matching runtime regardless of what is in `.massdriver/build/`.

## Requirements

- The runtime must use `dependencies` and `resources`. A runtime that still uses the legacy `connections` or `artifacts` fields must be republished in the current format before applications can run on it.
- The application must use the current format as well.
- The application's own IaC is not used. Directories such as `src/` in the application repository are ignored.

## Example: services connected over mTLS

`payments-api` serves an mTLS endpoint, and `checkout-api` calls it. Both run on the `lambda` runtime. `payments-api` publishes a `payments-api-server` resource, and `checkout-api` depends on that type, so checkout connects to payments by contract and never needs to know which function serves it.

```mermaid
flowchart LR
  lambda["lambda runtime"] -.runs.-> payments["payments-api"]
  lambda -.runs.-> checkout["checkout-api"]
  payments -- "payments-api-server<br/>url, ca_cert, server_name" --> checkout
```

### The resource type

The resource holds only what a client needs to verify the server. The server's private key never goes in a resource, because every bundle connected to it can read it.

```yaml
name: payments-api-server
version: 1.0.0
label: Payments API Server

schema:
  title: Payments API Server
  description: mTLS endpoint other services bind to for payments.
  type: object
  additionalProperties: false
  required: [url, ca_cert, server_name]
  properties:
    url:
      title: URL
      type: string
      pattern: ^https://
    ca_cert:
      title: CA certificate
      description: PEM bundle clients use to verify the server.
      type: string
    server_name:
      title: Server name
      description: Name clients verify in the server certificate.
      type: string
```

### The server

`payments-api` declares the resource and fills it from the runtime's outputs. The output names here are illustrative; use the outputs your runtime's IaC produces.

```yaml
name: payments-api
description: Handles card captures.
version: 0.1.0

dependencies:
  db:
    resource_type: postgres@~1
    required: true

resources:
  server: # mTLS endpoint other services depend on to call this API: its URL, CA certificate, and server name
    resource_type: payments-api-server@1.0.0
    required: true

steps:
  - path: src
    resources:
      server:
        template: |
          {
            url: .outputs.function_url,
            ca_cert: .outputs.mtls_ca_cert,
            server_name: .outputs.mtls_server_name
          }

app:
  runtime: lambda@~1.2
  envs:
    DB_HOST: .dependencies.db.authentication.hostname
  secrets:
    STRIPE_KEY:
      required: true
```

### The client

`checkout-api` depends on `payments-api-server` and maps its fields to environment variables:

```yaml
name: checkout-api
description: Shopping cart and checkout service.
version: 0.1.0

dependencies:
  payments:
    resource_type: payments-api-server@~1
    required: true

app:
  runtime: lambda@~1.2
  envs:
    PAYMENTS_URL: .dependencies.payments.url
    PAYMENTS_CA_CERT: .dependencies.payments.ca_cert
    PAYMENTS_SERVER_NAME: .dependencies.payments.server_name
```

### Where the handshake happens

Massdriver delivers the connection details. The TLS handshake happens in one of two places:

- **In the application.** The service's HTTP client loads `PAYMENTS_CA_CERT`, verifies `PAYMENTS_SERVER_NAME`, and presents its own client certificate. The runtime only has to pass envs and secrets through.
- **In the runtime.** A runtime that configures a service mesh or mTLS sidecar reads the dependency and sets up the connection itself, and the application calls a local endpoint without handling certificates. The runtime has to be built for this, so it is a platform decision rather than a per-application one.

Either way, `checkout-api`'s own client certificate does not come from `payments-api-server`. It is issued separately, by the runtime or as a secret or resource of its own.

## Related documentation

- [Bundle YAML Specification](/bundle-development/bundle-yaml-spec)
- [Version Resolution](/bundle-development/dependencies-resources/version-resolution)
- [Bundle Versioning](/bundle-development/publishing/versioning)
