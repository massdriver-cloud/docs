---
id: bundles-development
slug: /bundles/development
title: Bundle Development
sidebar_label: Development
---

Massdriver bundles wrap IaC tools like Terraform and Helm (more coming soon).

This guide will cover some of the key components and best practices for integrating your IaC module with the Massdriver UI and provisioning system.

:::note

A tl;dr full walkthrough on building an AWS SNS Topic bundle can be found [here](/bundles/walk-through) if you want to jump straight to the code.

:::

For developing infrastructure bundles and applications you'll need the [Massdriver CLI](https://github.com/massdriver-cloud/mass/releases).

## Where Are My Variable Files?

Let's generate a bundle:

```shell
mass bundle new
```

You'll notice that in your `./src` directory there are no Terraform variable files. Massdriver uses JSON Schema to present a rich user interface to end-users and uses that interface to also generate Terraform and Helm variable files.

You can generate your variables by running:

```shell
mass bundle build
```

## Building the Right-Sized Bundle

We recommend building single use-case scoped bundles rather than bundles that encapsulate an entire cloud service.

Complex infrastructure modules are confusing to end-users (S3 Buckets have over 90 attributes) and there are many fields in the cloud resource APIs that are incompatible with each other.

We've also seen how bloated general purpose modules can be. EKS modules

**Bad scopes**:

* AWS RDS - End-users are looking for a specific database type; there are many fields in RDS configs that only work for MySQL or Postgres.
* AWS S3 - As noted above, S3 has a lot of fields that may not apply to an end-user use case.

**Good scopes**:

* AWS RDS MySQL
* AWS RDS Postgres
* AWS S3 CDN Bucket
* AWS S3 Logging Bucket
* AWS S3 Application Assets Bucket

Smaller scopes mean simpler use cases. This makes it easier for the user to configure and manage, while having simpler IAM policies that follow least privileges for their specific use case.

Massdriver bundles should do one thing and do it well.

## Bundle Naming Guidelines

Massdriver recommends (and follows) the following naming convention for bundles:

* `$cloud`-`$service`-`$use-case`
* `$cloud`-`$service`-`$use-case`-`$component`

**Bad names**:

* rds
* aws-rds

**Good names**:

* aws-rds-mysql
* aws-rds-postgres
* aws-sns-pubsub-topic
* aws-sqs-pubsub-subscription
* aws-lambda-pubsub-subscriber

## Massdriver Metadata

Massdriver provides metadata to your IaC tool during provisioning. We publish a [JSON Schema](https://github.com/massdriver-cloud/metaschemas/blob/main/md_metadata.json) of the metadata and provide backwards compatibility in the data provided to your bundle.

The metadata will be a top-level value provided to your IaC tool.

For example, in Terraform:

```hcl
var.md_metadata
```

There are various fields that your IaC tool can use to integrate with the Massdriver platform.

**MD Metadata Properties**:

- **`name_prefix`** *(string)*: Standardized cloud agnostic naming convention prefix to be used on all resources created by a bundle. The name prefix is the project slug, environment slug, manifest slug, and a random 4 character slug joined by hyphens. This should be the name/identifier of the primary resource in your bundle and used a prefix for other resources created. The name prefix also happens to be the Massdriver package name. Minimum: `33`. Maximum: `33`.
- **`default_tags`** *(object)*: Default tags to be applied to all bundle resources.
  - **`managed-by`** *(string)*: Provisioning tool managing the resource. Must be one of: `['massdriver']`.
  - **`md-manifest`** *(string)*: Massdriver manifest slug. Minimum: `1`. Maximum: `12`.
  - **`md-package`** *(string)*: Massdriver package name. Minimum: `33`. Maximum: `33`.
  - **`md-project`** *(string)*: Massdriver project slug. Minimum: `1`. Maximum: `7`.
  - **`md-environment`** *(string)*: Massdriver environment slug. Minimum: `1`. Maximum: `7`.
- **`environment`** *(object)*: Environment metadata for this deployment.
  - **`contact_email`** *(string)*: The email address of the contact for this environment. This email address may be used by services like Lets Encrypt or to validate AWS SES domains.
- **`observability`** *(object)*: Observability integration metadata for this deployment.
  - **`alarm_webhook_url`** *(string)*: A webhook URL to process metrics from AWS SNS Notifications, GCP Notification Channels, and Azure Monitor Action Groups. This will be a Massdriver URL used to present alerts from cloud resources.


**Example MD Metadata**:

```json
{
  "default_tags": {
    "managed-by": "massdriver",
    "md-manifest": "caching",
    "md-package": "ecomm-prod-caching-1234",
    "md-project": "ecomm",
    "md-target": "prod"
  },
  "name_prefix": "ecomm-prod-caching-1234",
  "observability": {
    "alarm_webhook_url": "http://host.docker.internal:4000/alarms/a1ac80a5-b577-41a6-b247-682514aff51d/9a32bf1dd94f857fe57c264d7e0deaa8"
  },
  "organization": {
    "owner_email": "chauncy@kewld00d.info"
  }
}
```

### Using `md_metadata.name_prefix`

:::note

WIP : As identifier for primary resources, prefix for all other resource names/identifiers.

:::

### Integrated Monitoring & Alarms

:::note

WIP : Alarm integrations using TF modules

* https://github.com/massdriver-cloud/terraform-modules/tree/main/aws-alarm-channel
* https://github.com/massdriver-cloud/terraform-modules/tree/main/aws-cloudwatch-alarm
* https://github.com/massdriver-cloud/terraform-modules/tree/main/gcp-alarm-channel
* https://github.com/massdriver-cloud/terraform-modules/tree/main/gcp-monitoring-utilization-threshold
* https://github.com/massdriver-cloud/terraform-modules/tree/main/azure-alarm-channel
* https://github.com/massdriver-cloud/terraform-modules/tree/main/azure-monitor-metrics-alarm

:::


## Params & Connections

:::note

WIP : How params and connections are routed to variable files. Using JSON Schema for rich validation.

:::

### Recommend Params Field Sets

* `_resource_type_` i.e.: `database` for RDS, `topic` for SNS
- `networking`
- `storage`
- `backup`
- `observability`


### Local Development

:::info

Coming soon we will be releasing a UI visualizer for `massdriver.yaml`.

:::

Two files are useful for local development:

* `_params.auto.tfvars.json`
* `_connections.auto.tfvars.json`

[Artifacts](https://app.massdriver.cloud/artifacts)

:::note

If you generated your bundle using `mass bundle new` a `.gitignore` file should have been created for you excluding all `.tfvars.json` files from git.

:::

## Artifacts

[Artifacts](/concepts/artifacts) are outputs of a bundle that adhere to a specific type ([artifact definition](/concepts/artifact-definitions)) and can be attached to other bundles.

There are two types of artifacts: provisioned and imported.

### Provisioned Artifacts

Provisioned artifacts are created during the deployment process, and therefore cannot be altered or removed outside of a provisioning run. Massdriver provides tooling to simplify the process of creating provisioned artifacts.

**Massdriver Terraform Provider**:

Massdriver maintains a terraform provider with a resource ([massdriver_artifact](https://registry.terraform.io/providers/massdriver-cloud/massdriver/latest/docs/resources/massdriver_artifact)) for creating provisioned artifacts within a terraform based bundle. Refer to the terraform provider documentation for more information.

**JQ extraction**

Massdriver provisioners have the ability to convert provisioning inputs (params, connections) and outputs (provsioner-specific) into an artifact using the powerful `jq` syntax for JSON querying and manipulation. Using this method, you can create a file named `artifact_<name>.jq` at the top level of the provisioner step. The `<name>` field refers to the name of the artifact in the `massdriver.yaml` file. The structure of the file should reflect the artifact structure, with `jq` syntax supported for querying. The input data will be a JSON object with the input params under a top level `params` key, connections under a `connections` key, and the outputs of the provisioning run under an `outputs` key.

Below is an example of an artifact file using this method:

```json title="./src/artifact_foo.jq"
{
  "data": {
    "value": .outputs.someblock.somevalue,
    "another": .connections.database.data.field
  },
  "specs": {
    "version": .params.version
  }
}
```

In this example, we are creating the content for an artifact named `foo` that must be declared in the `massdriver.yaml` file. The artifact will be created as follows:
* The `.data.value` field will be set to the value of `someblock.somevalue` from the provisioning output
* The `.data.another` field is being set to the `.data.field` value from the incoming connection named `database`
* The `.spec.version` field will be set to the value of the top-level parameter named `version`

Refer to the documentation on each provisioner for more information on the structure of the provisioner outputs.

### Imported Artifacts

Imported artifacts are created outside of the deployment process in the Massdriver platform. This type of artifact is useful for representing existing infrastructure that isn't managed by Massdriver, but you would like to connect to it with bundles managed inside the Massdriver platform.

The easiest way to create an imported artifact is to use the [`mass artifact import`](/cli/commands/mass_artifact_import) command in the CLI.

###

:::

## Local Provider Overrides

:::note

WIP

:::

## Preset Configurations

:::note

WIP - Defining useful presets using JSON Schema examples

:::
