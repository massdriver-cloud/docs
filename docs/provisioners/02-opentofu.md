---
id: provisioners-opentofu
slug: /provisioners/opentofu
title: OpenTofu Provisioner
sidebar_label: OpenTofu
---

# OpenTofu Provisioner

[Massdriver](https://www.massdriver.cloud/) provisioner for managing resources with [OpenTofu](https://opentofu.org/).

## Structure

This provisioner expects the `path` to contain an OpenTofu module.

If you wish to use a [dependency lock file](https://opentofu.org/docs/language/files/dependency-lock/) (`.terraform.lock.hcl`) with your module, be sure it is in the module directory when you publish with the [Massdriver CLI](https://github.com/massdriver-cloud/mass). For this reason, it's best to check this dependency lock file into source control.

## Tooling

The following tools are included in this provisioner:

* [Checkov](https://www.checkov.io/): Included to scan terraform configurations for common policy and compliance violations.
* [Open Policy Agent](https://www.openpolicyagent.org/): Included to scan terraform configurations against custom policies.

## Configuration

The following configuration options are available:

| Configuration Option | Type | Default | Description |
|-|-|-|-|
| `json` | boolean | `false` | Enables JSON output for OpenTofu. |
| `checkov.enable` | boolean | `true` | Enables Checkov policy evaluation. If `false`, Checkov will not be run. |
| `checkov.quiet` | boolean | `true` | Only display failed checks if `true` (adds the `--quiet` flag). |
| `checkov.halt_on_failure` | boolean | `false` | Halt provisioning run and mark deployment as failed on a policy failure (removes the `--soft-fail` flag). |


## Inputs

Since OpenTofu is [compatible with variables expressed in JSON syntax](https://opentofu.org/docs/language/values/variables/#variable-definitions-tfvars-files), both the params and connections are left unmodified and simply copied into the module directory as `_params.auto.tfvars.json` and `_connections.auto.tfvars.json`, respectively.

In order to view the structure of the params and connections fields you can run `mass bundle build` with the Massdriver CLI, and it will generate a `_massdriver_variables.tf` file with full type expressions for each parameter and connection. If modifications to fields are required, use a [`locals`](https://opentofu.org/docs/language/values/locals/) block to manipulate the data as needed.

## Artifacts

Artifacts can be created two ways using this provisioner: using OpenTofu `outputs`, and using the [Massdriver](https://registry.terraform.io/providers/massdriver-cloud/massdriver/latest) OpenTofu provider.

### OpenTofu Outputs

After every provision, this provider will scan the module directory for files matching the pattern `artifact_<name>.jq`. If a file matching this pattern is present, it will be used as a JQ template to render and publish a Massdriver artifact. The inputs to the JQ template will be a JSON object with the params, connections, envs, secrets and module outputs as top level fields.

```json
{
    "params": {
        ...
    },
    "connections": {
        ...
    },
    "envs": {
        ...
    },
    "secrets": {
        ...
    },
    "outputs": {
        ...
    }
}
```

To demonstrate, let's say there is a AWS S3 bucket bundle with a single param (`region`), a single connection (`aws_iam_role`), and a single artifact (`bucket`). The `massdriver.yaml` would be similar to:


```yaml massdriver.yaml
params:
  required:
    - region
  properties:
    region:
      type: string

connections:
  required:
  - aws_authentication
  properties:
    aws_authentication:
      $ref: massdriver/aws-iam-role

artifacts:
  required:
    - bucket
  properties:
    bucket:
      $ref: massdriver/aws-s3-bucket
```

Since the artifact is named `bucket` a file named `artifact_bucket.jq` would need to be in the module directory and the provisioner would use this file as a JQ template, passing the params, connections and outputs to it. There are two approaches to building the proper artifact structure:
1. Fully render the artifact in the OpenTofu output
2. Build the artifact using the jq template

Here are examples of each approach.

#### Fully Render as OpenTofu Output

If you choose to fully render the artifact in OpenTofu, it would be similar to:

```hcl
output "artifact_bucket" {
  value = {
    data = {
      infrastructure = {
        arn = aws_s3_bucket.main.arn
      }
    }
    specs = {
      aws = {
        region = var.region
      }
    }
  }
}
```

In this case, the input to the `artifact_bucket.jq` template file would be:

```json
{
    "params": {
        "region": "us-east-1"
    },
    "connections": {
        "aws_authentication": {
            "data": {
                "arn": "arn:aws:iam::012345678910:role/role_name",
                "external_id": "s0mes3cr3tv@lue"
            }
        }
    },
    "envs": {},
    "secrets": {},
    "outputs": {
        "artifact_bucket": {
            "data": {
                "infrastructure": {
                    "arn": "arn:aws:s3:::the_bucket_name"
                }
            },
            "specs": {
                "aws": {
                    "region": "us-east-1"
                }
            }
        }
    }
}
```

Thus, the `artifact_bucket.jq` file would simply be:

```jq artifact_bucket.jq
.outputs.artifact_bucket
```

#### Build Artifact in JQ Template

Alternatively, you can build the artifact using the JQ template. This approach is best if you are attempting to minimize changes to your OpenTofu module. With this approach, all you would need to output is the bucket ARN.

```hcl
output "bucket_arn" {
  value = aws_s3_bucket.main.arn
}
```

In this case, the input to the `artifact_bucket.jq` template file would be:

```json
{
    "params": {
        "region": "us-east-1"
    },
    "connections": {
        "aws_authentication": {
            "data": {
                "arn": "arn:aws:iam::012345678910:role/role_name",
                "external_id": "s0mes3cr3tv@lue"
            }
        }
    },
    "outputs": {
        "bucket_arn": "arn:aws:s3:::the_bucket_name"
    }
}
```

Now the artifact structure must be built through the `artifact_bucket.jq` template:

```jq artifact_bucket.jq
{
    "data": {
        "infrastructure": {
            "arn": .outputs.bucket_arn
        }
    },
    "specs": {
        "aws": {
            "region": .params.region
        }
    }
}
```

### Massdriver OpenTofu Provider

This is the legacy approach to creating artifacts since it is unique to Terraform and OpenTofu provisioners. It may be deprecated and removed in the future.

Refer to the [provider documentation](https://registry.terraform.io/providers/massdriver-cloud/massdriver/latest/docs/resources/massdriver_artifact) for the `massdriver_artifact` resource. An example is below:

```hcl
resource "massdriver_artifact" "bucket" {
  field                = "bucket"
  provider_resource_id = aws_s3_bucket.main.arn
  name                 = "AWS S3 Bucket: ${aws_s3_bucket.main.arn}"
  artifact = jsonencode(
    {
      data = {
        infrastructure = {
          arn = aws_s3_bucket.main.arn
        }
      }
      specs = {
        aws = {
          region = var.bucket.region
        }
      }
    }
  )
}
```