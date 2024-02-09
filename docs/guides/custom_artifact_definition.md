---
id: custom-artifact-definition
slug: /guides/custom-artifact-definition
title: Crafting Custom Artifact Definitions
sidebar_label: Custom Artifact Definition
---

# Crafting Custom Artifact Definitions

In this guide, we're going to walk through the steps to create your own custom artifact definitions in Massdriver. This is for those moments when the existing definitions just don't cut it for your unique needs. Let's demystify the process and make it as straightforward as possible. And, just in case you're looking for a primer on what artifacts and artifact definitions actually are, make sure to check out our dedicated docs for [artifacts](../concepts/03-artifacts.md) and [artifact definitions](../concepts/02-artifact-definitions.md).

Want a video walkthrough? Check out our [YouTube video](https://www.youtube.com/watch?v=Am2_CJAsuSQ)!

## How to Create Your Own Custom Artifact Definition

### Step 1: Spotting the Need

Check out the Massdriver [artifact definitions GitHub repo](https://github.com/massdriver-cloud/artifact-definitions/tree/main/definitions/artifacts) first. If what you need is nowhere to be found, that's your green light to craft something custom.

### Step 2: Getting Started

With the [Massdriver CLI](../cli/00-overview.md), you've got the toolkit you need to forge your own definitions. It's usually easier to tweak an existing one than to start from scratch:

1. **Pick a Starting Point**: Hunt down an existing artifact definition that's close to what you need, or use this starting template:
```json artifact-definition-name.json
{
  "$schema": "http://json-schema.org/draft-07/schema",
  "$md": {
    "access": "private",
    "name": "artifact-definition-name"
  },
  "type": "object",
  "title": "Artifact Definition Name",
  "description": "",
  "additionalProperties": false,
  "required": [
    "data",
    "specs"
  ],
  "properties": {
    "data": {
      "title": "Artifact Data",
      "type": "object",
      "properties": {}
    },
    "specs": {
      "title": "Artifact Specs",
      "type": "object",
      "properties": {}
    }
  }
}
```
2. **Make It Your Own**: Copy its content into your favorite editor (like VS Code) and start tweaking it to suit your requirements.

### Step 3: Key Components of an Artifact Definition

Every custom artifact definition should include:

- **Data Block**: This is where you stash the sensitive details (passwords, connection strings, you name it).
- **Specs Block**: Here's where the non-sensitive details go, like API versions and cloud regions.

### Step 4: Tailoring Your Definition

1. **Refine the Data and Specs Blocks**: Adapt these sections to match your specific artifact needs.
2. **Prune What You Don't Need**: If the copied definition includes irrelevant bits (like RBAC settings you're not using), cut them out or alter them.

By the end of this step, your definition should look something like this:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema",
  "$md": {
    "access": "private",
    "name": "artifact-definition-name"
  },
  "type": "object",
  "title": "Artifact Definition Name",
  "description": "",
  "additionalProperties": false,
  "required": [
    "data",
    "specs"
  ],
  "properties": {
    "data": {
      "title": "Artifact Data",
      "type": "object",
      "required": [
        "infrastructure",
        "authentication",
        "security"
      ],
      "properties": {
        "infrastructure": {
          "title": "Infrastructure configuration",
          "type": "object",
          "required": [
            "foo",
            "bar"
          ],
          "properties": {
            "foo": {
              "type": "string",
              "title": "Foo",
              "description": "Foo description",
              "examples": [
              ],
              "pattern": "^.*+$",
              "message": {
                "pattern": "Must be a valid format for foo."
              }
            },
            "bar": {
              "title": "Bar",
              "description": "Bar description",
              "additionalProperties": false,
              "examples": [
              ],
              "type": "string"
            }
          }
        },
        "authentication": {
          "title": "Authentication configuration",
          "type": "object",
          "required": [
            "foobar"
          ],
          "properties": {
            "foobar": {
              "title": "Foobar",
              "type": "string"
            }
          }
        },
        "security": {
          "title": "Security",
          "description": "Security Configuration",
          "additionalProperties": false,
          "required": [],
          "properties": {
            "iam": {
              "title": "IAM",
              "description": "IAM Roles And Scopes",
              "additionalProperties": false,
              "patternProperties": {
                "^[a-z]+[a-z_]*[a-z]$": {
                  "type": "object",
                  "required": [
                    "role",
                    "scope"
                  ],
                  "properties": {
                    "role": {
                      "title": "Role",
                      "description": "Cloud Role",
                      "pattern": "^[a-zA-Z ]+$",
                      "message": {
                        "pattern": "Must be a valid Cloud Role (uppercase, lowercase letters and spaces)"
                      },
                      "examples": [
                        "Data Reader"
                      ]
                    },
                    "scope": {
                      "title": "Scope",
                      "description": "Cloud IAM Scope (cloud resource identifier)",
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "specs": {
      "title": "Artifact Specs",
      "type": "object",
      "properties": {
        "cloud": {
          "properties": {
            "region": {
              "type": "string",
              "title": "Cloud Region",
              "description": "Select the cloud region you'd like to provision your resources in."
            }
          }
        }
      }
    }
  }
}
```

### Step 5: Publishing to Massdriver

Got your definition looking sharp? Use the `mass definition publish -f /path/to/definition.json` command in the CLI to send it out into the world. Remember to set your `$md.access` field to `private` to keep it just between you and your team.

### Step 6: Fetching Your Masterpiece

Once published, snag your artifact definition with the `mass definition get org/definition-name` command to confirm it's ready for action in your bundles.

### Step 7: Using Your Custom Artifact Definition

Now that your custom artifact definition is published, you can use it in your bundles. Just reference it in your bundle's `artifacts` field and structure your `_artifacts.tf` file, and you're good to go.

``` yaml massdriver.yaml
artifacts:
  required:
    - artifact_definition_name
  properties:
    artifact_definition_name:
      $ref: acme/artifact-definition-name
```

``` hcl src/_artifacts.tf
resource "massdriver_artifact" "artifact_definition_name" {
  field                = "artifact_definition_name"
  provider_resource_id = artifact_dummy_resource.main.id
  name                 = "Artifact Dummy Resource ${var.md_metadata.name_prefix}"
  artifact = jsonencode(
    {
      data = {
        infrastructure = {
          foo = artifact_dummy_resource.main.foo
          bar = artifact_dummy_resource.main.bar
        }
        authentication = {
          foobar = artifact_dummy_resource.main.foobar
        }
        security = {
          iam = {
            "read" = {
              role  = "Data Reader"
              scope = artifact_dummy_resource.main.id
            }
          }
        }
      }
      specs = {
        cloud = {
          region = artifact_dummy_resource.main.region
        }
      }
    }
  )
}
```

To confirm that your custom artifact definition is working as expected for your bundle, run the `mass bundle lint` and `mass bundle build` commands to check for any issues. When you're ready to publish your bundle changes, `mass bundle publish` will publish your bundle to your Bundle Catalog.

## Wrapping Up

And there you have it! Creating your own artifact definitions in Massdriver opens up a world of customization for your cloud infrastructure projects. By following these steps, you're well on your way to tailoring Massdriver to your project's unique requirements. If you've got any questions or need a hand, don't hesitate to reach out to our team. We're here to help you make the most of Massdriver's powerful features. Happy crafting!
