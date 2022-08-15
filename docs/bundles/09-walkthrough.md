---
id: bundles-walk-through
slug: /bundles/walk-through
title: Terraform Bundle Development
sidebar_label: Walk Through
---

This tutorial will walk you through the process of building your own custom bundle for use in Massdriver.cloud.

## Setup

### Generate Massdriver API Token

You will need a Massdriver API token for this tutorial. You can generate one under [Organization > API Keys](https://app.massdriver.cloud/organization/api-keys). It’s easiest to set this in your environment as MASSDRIVER_API_KEY, though it can also be passed manually to all commands.

```shell-session
export MASSDRIVER_API_KEY=your-key-here
```

### Download the Massdriver CLI

The [Massdriver CLI](https://github.com/massdriver-cloud/massdriver-cli) is open sourced. You can download the most recent available version for your operating system and platform on the [release page](https://github.com/massdriver-cloud/massdriver-cli/releases). Untar the package and add it to your path.

## Write the Bundle

### Generate a New Bundle Template

In a terminal, use the massdriver CLI to generate a bundle template:

```shell-session
mass bundle generate
```

The CLI will walk you through this process by asking a series of questions about the bundle. Answer the questions with the following answers:

```shell-session title="Massdriver CLI Prompt"
Name: aws-sns-topic-tutorial
Access: private
Description: An AWS SNS topic for event driven workflows
```

:::note
We find it best to manage your bundle in its own source code repository. This allows you to develop, update, and publish the bundle independently. Thus, the bundle template will come with a set of useful git files for validation and maintenance.
:::

The bundle generator will create the `aws-sns-topic-tutorial` directory, and within it will be multiple files and folders.

The two most notable are:

* `massdriver.yaml` this is the configuration file which specifies the important details about the bundle, such as connections, artifacts, and configuration parameters.
* `src` this directory contains the terraform that will get executed as part of the bundle provisioning process.

### Write the terraform in the src directory

For this tutorial, we’re going to make a simple AWS SNS topic. Open the `main.tf` file in the `src` directory and create an `aws_sns_topic` resource.

```hcl title="./src/main.tf"
resource "aws_sns_topic" "main" {
  # We'll configure this to use a variable later in the tutorial
  name = "temporary"
}
```

Technically, this is all the terraform we need to create a SNS topic! However, we should add more configuration to it, such as enabling FIFO if the user selects that option. We’ll come back to this in a later section.

### Specify Connections

Connections are the dependencies your bundle has on other bundles. This is enforced through Massdrivers type system, and specifically through the concept of artifacts. For example, a bundle that requires an AWS VPC network, such as an RDS database, would need to declare a massdriver/aws-vpc artifact as a connection.

Most bundles will require at least one connection for authentication into the service where the bundle will provision resources. In this case, we need a massdriver/aws-iam-role connection. Open the `massdriver.yaml` file, scroll down to the `connections` section and update it to be the following:

```yaml title="./massdriver.yaml"
connections:
  required:
    - aws_authentication
  properties:
    aws_authentication:
      $ref: massdriver/aws-iam-role
```


This `connections` block is technically a yaml-formated JSON Schema block. We are declaring that this SNS bundle has exactly one dependency, named `aws_authentication`, it is required, and its type is a massdriver/aws-iam-role.

:::note
Massdriver has open sourced all of our artifact definitions so users can see the full structure. https://github.com/massdriver-cloud/artifact-definitions
:::

### Specify Parameters

Parameters are the configuration values for a bundle that can be specified by the user in the Massdriver console. Like the connections block, these parameters are defined using JSON Schema (draft-07). However, the parameters require the bundle author to define the JSON Schema structure as opposed to referencing an defined artifact.

For this SNS Topic bundle, we need to specify the AWS region to provision the topic into as well as the whether we want a FIFO topic, or a normal topic. Update the params block to be the following:

```yaml title="./massdriver.yaml"
params:
  examples:
    - __name: Standard
      fifo: false
    - __name: FIFO
      fifo: true
  required:
    - aws_region
 properties:
    aws_region:
      title: AWS region to deploy SNS topic into
      $ref: https://raw.githubusercontent.com/massdriver-cloud/artifact-definitions/main/definitions/types/aws-region.json
    fifo:
      type: boolean
      title: Enable FIFO topic
      description: A FIFO (first in, first out) topic enforces strict message ordering and deduplication
      default: false
```

First, in the `examples` section, we’ve created 2 configuration presets: one for a standard SNS topic, another for a FIFO topic. In this example it’s a bit trivial since we are only changing one parameter (the `fifo` boolean), but in other cases with more configuration options it can be useful to have a few selectable presets.

Next we are specifying two parameters: `aws_region` and `fifo`. We have marked the `aws_region` parameter as `required` to ensure a value is set before saving or deploying is allowed. We don’t have to do this for `fifo` since it is a boolean and an empty boolean is always treated as `false` (effectively, it is always set).

For the `aws_region` parameter, we are referencing a Massdriver managed type which is an enumerated list of our supported AWS regions. You can use the URL in the `$ref` to view the schema definition. When referencing a type through a `$ref` like this any fields defined within the parameter schema will override the values in the referenced schema in the event of a collision. Since we also declare `title` here, it will override the `title` in the referenced schema.

We are also creating a boolean field named `fifo`. We will use this boolean in a later step to determine whether to enable or disable the FIFO configuration of the SNS topic.

### Specify Artifacts
Artifacts are the types that are created and exported by your bundle, allowing other bundles to connect to it. This block is very similar to the connections block, except artifacts are bundle “outputs”, which connections are bundle “imports”.

In this case, we are exporting exactly one required artifact, an aws-sns-topic.

```yaml title="./massdriver.yaml"
artifacts:
  required:
    - topic
  properties:
    topic:
      $ref: massdriver/aws-sns-topic
```

### Generate Terraform Variables Declarations

Once we’ve made the above changes to our `massdriver.yaml` file, we need to generate our terraform variable declarations. It’s important to note that you should never write your own terraform variable declarations when creating a bundle. Your bundle inputs are strictly defined by the `params` and `connections` you’ve specified in your `massdriver.yaml` file. Any additional variables you declare will cause terraform to error during execution due to an “unset” variable since it will be impossible to specify a value for it.

In a terminal, run the following command:

```shell-session
mass bundle build
```

If you check your src directory, you should now have 2 generated files.
* `_connections_variables.tf.json`
* `_params_variables.tf.json`

If you open these files, you’ll see there are terraform variable declarations that match the params and connections you’ve specified in the `massdriver.yaml` file in previous steps. You’ll notice that all complex types (anything but strings, numbers and booleans) are converted to type `any`. This is a temporary workaround until [terraform can support optional arguments in variable definitions](https://github.com/hashicorp/terraform/issues/19898). Once that capability is supported we will be able to fully define complex types, such as arrays and objects.

### Define Local Variables

Now that we have variable declarations, we need to define the values for them in order to test our terraform code locally.

Let’s start with the params. Create a file named `dev.params.tfvars.json` in the `src` directory. Put the following contents into the file:

```json title="dev.params.tfvars.json"
{
    "aws_region": "us-west-2",
    "fifo": false,
    "md_metadata": {
        "name_prefix": "local-dev-sns-0000",
        "default_tags": {
          "local": "true"
        },
        "observability": {
            "alarm_webhook_url": "https://example.com"
        }
    }
}
```

In this file we are defining some testable values for the variables we generated in the previous step. We are setting the `aws_region` to `us-west-2` (though any region in the type definition is valid) and we’re setting `fifo` to `false` (though `true` would also be valid).

The last block is the `md_metadata` block. This block is dynamically generated by Massdriver for every bundle and contains naming, tagging and other information. This is how Massdriver enforces unique naming and common tagging conventions on our resources. We recommend using this `md_metadata.name_prefix` field wherever applicable for naming provisioned resources.

Now that params are defined, we need to do the same thing for connections. First create a `dev.connections.tfvars.json` file. The contents of this file is more complex than the params file since you need properly formatted artifacts. You have 2 options:
* You can download the JSON of an existing artifact in Massdriver and copy over the contents
* You reference the artifact schema and build a properly formatted artifact by hand

### Download the Artifact

This option is easier for complex artifacts (like networks or cloud infrastructure) but it doesn’t always work for authentication artifacts since you need local credentials to assume AWS roles (if you followed our guide for importing your AWS IAM Role credential, you likely don’t have permission to assume the role). First you would provision the resource you need using Massdriver (like an AWS VPC), then you would visit the [artifacts page](https://app.massdriver.cloud/artifacts) in the Massdriver console, navigate to the artifact for the bundle you just provisioned, and click the “Download Raw” button. This will download a JSON formatted version of your artifact. Open the file and copy the contents directly `dev.connections.tfvars.json` file like this:

```json
{
    "aws_authentication": <paste the copied JSON block here>
}
```

:::tip

Configuring manually may be the best option for the `aws_authentication` artifact since the structure is very simple and it’s unlikely you’ll have local credentials that allow you to assume the Massdriver role (which is a requirement to execute the terraform). You’ll need to use an AWS role that you have local permissions to assume and that has permissions in AWS to perform the actions needed (like creating an SNS topic). Simply copy the AWS role ARN and associated external ID into the template below and paste it into the file. If no external ID is needed to assume the role, you can leave it as an empty string.

```json
{
    "aws_authentication": {
       "data": {
            "arn": "<arn of AWS role>",
            "external_id": "<external ID of AWS role"
        }
    }
}
```
:::

### Validate Variables against Schemas

To ensure the `dev.params.tfvars.json` and `dev.connections.tfvars.json` files are valid, the CLI provides a command to perform JSON Schema. Run the following two commands to ensure the params and connections are valid.

```shell-session
mass schema validate -s schema-params.json -d src/dev.params.tfvars.json
mass schema validate -s schema-connections.json -d src/dev.connections.tfvars.json
```

If either of these commands returns an error, address the schema violations before continuing.

### Update Terraform to Use Parameters

Now that we have variables in our terraform, let’s use them. Re-open the `main.tf` file and update the terraform to look like the section below.

```hcl title="src/main.tf"
resource "aws_sns_topic" "main" {
  name                        = "${var.md_metadata.name_prefix}" + var.fifo ? ".fifo" : ""
  fifo_topic                  = var.fifo
  content_based_deduplication = var.fifo
}
```

We updated the `name` to use the `var.md_metadata.name_prefix` which ensures uniqueness and a common naming convention. We also conditionally add the “.fifo” suffix if `var.fifo` is true. This is a requirement of AWS for FIFO topics. We then also set `fifo_topic` and `content_based_deduplication` to the value of `var.fifo` as well, to conditionally turn these features on or off based on the user’s selection.

### Create Policies for Security
As part of Massdrivers managed security model, cloud IAM management is handled automatically for the user. In AWS, this means we need to create a set of IAM policies which govern the user of the resource. For an SNS topic, that will be subscribing, publishing and administering the topic. Create a new file named `policies.tf` and copy the contents below into it.

```hcl title="src/policies.tf"
resource "aws_iam_policy" "subscribe" {
  name        = "${var.md_metadata.name_prefix}-subscribe"
  path        = "/"
  description = "A policy with permissions to subscribe to the ${var.md_metadata.name_prefix} topic"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "sns:Subscribe",
        ]
        Effect   = "Allow"
        Resource = aws_sns_topic.main.arn
      },
    ]
  })
}

resource "aws_iam_policy" "publish" {
  name        = "${var.md_metadata.name_prefix}-publish"
  path        = "/"
  description = "A policy with permissions to publish to the ${var.md_metadata.name_prefix} topic"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "sns:Publish",
        ]
        Effect   = "Allow"
        Resource = aws_sns_topic.main.arn
      },
    ]
  })
}

resource "aws_iam_policy" "admin" {
  name        = "${var.md_metadata.name_prefix}-admin"
  path        = "/"
  description = "A policy with admin permissions to the ${var.md_metadata.name_prefix} topic"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "sns:*",
        ]
        Effect   = "Allow"
        Resource = aws_sns_topic.main.arn
      },
    ]
  })
}
```

This creates 3 policies specific to this SNS topic. One to subscribe, one to publish and one to administer the topic. You’ll need these policies in the next step when we create the artifact.

### Create Artifact in Terraform

You’re almost done. The last terraform we need to write is to create the artifact to send back to Massdriver so this bundle will be connectable by other bundles. Create a file named `./src/_artifacts.tf` and copy the contents below into the file.

```hcl title="./src/_artifacts.tf"
resource "massdriver_artifact" "topic" {
  field                = "topic"
  provider_resource_id = aws_sns_topic.main.arn
  name                 = "AWS SNS Topic ${var.md_metadata.name_prefix} (${aws_sns_topic.main.arn})"
  artifact = jsonencode(
    {
      data = {
        infrastructure = {
          arn              = aws_sns_topic.main.arn
        },
        security = {
          iam = {
            subscribe = {
              policy_arn = aws_iam_policy.subscribe.arn
            },
            publish = {
              policy_arn = aws_iam_policy.publish.arn
            },
            admin = {
              policy_arn = aws_iam_policy.admin.arn
            }
          }
        }
      }
      specs = {
        aws = {
          region = var.aws_region
        }
      }
    }
  )
}
```

You can see we are using of Massdriver’s own [terraform provider](https://registry.terraform.io/providers/massdriver-cloud/massdriver/latest) to create the artifact. Some resources in the provider, such as the `massdriver_artifact`, only provision properly when running in Massdriver’s internal environment. This is so resources like artifacts can’t be arbitrarily created by users outside of an official Massdriver deployment. The provider will detect that it’s not running within Massdriver and issue a warning without performing any meaningful actions.

### Plan and Apply Terraform

Now that the terraform is written, the last thing to do before publishing is testing to ensure the bundle runs. Run the following commands.

```shell-session
terraform init
terraform plan -var-file dev.params.tfvars.json -var-file dev.connections.tfvars.json
```
If both of these run successfully and the plan looks valid, then apply!

```shell-session
terraform apply -var-file dev.params.tfvars.json -var-file dev.connections.tfvars.json
```
Ensure all of the resource provision successfully. When you are done, it’s best to destroy the resources since they are only used for testing.

```shell-session
terraform destroy -var-file dev.params.tfvars.json -var-file dev.connections.tfvars.json
```

### Publish Bundle
You’re now ready to publish your bundle for use in Massdriver. The CLI has a command to do this for you.

```shell-session
mass bundle publish
```

Now you can log into Massdriver and check for you newly published bundle in the bundle sidebar.
