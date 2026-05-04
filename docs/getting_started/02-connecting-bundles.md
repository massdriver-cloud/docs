---
id: getting-started-connecting-bundles
slug: /getting-started/connecting-bundles
title: Connecting Bundles
sidebar_label: Connecting Bundles
---

Welcome to part 2 of the Massdriver getting started guide! In part 1, you learned how to publish, configure, and deploy a bundle. Now you'll learn how to connect bundles together to share information between them using **resources** - one of Massdriver's most powerful features.

## What You'll Learn

By the end of this guide, you'll understand:

✅ **What resources are** - How bundles share data with each other  
✅ **Resource types** - The schema contracts that ensure type safety  
✅ **Publishing resource types** - Making reusable data contracts available  
✅ **Producing resources** - Updating bundles to output structured resource data  
✅ **Consuming resources** - Using resources as inputs to other bundles  
✅ **Bundle connections** - Connecting bundles visually in the UI  

## Understanding Resources and Resource Types

### What Are Resources?

**Resources** are structured JSON outputs that bundles produce to share data with other bundles. Think of them as the "public API" of your infrastructure - they expose specific data that other bundles can consume. This is managed via two fields in the `massdriver.yaml` file:

- Bundles produce the resources that are specified in the `artifacts` field
- Bundles consume the resources that are specified in the `connections` field

### What Are Resource Types?

**Resource types** are JSON Schema specifications that define the structure and type of data that resources must contain. They create an enforceable "contract" between bundles:

- Bundles which produce resources are guaranteed to output JSON that matches the resource type schemas
- Bundles which consume resources are guaranteed to receive JSON that matches the expected resource type schema

:::tip Resource Types vs Bundles

Resource types are **not** paired 1-to-1 with bundles. This is intentional. Consider:
- You might have one `aws-s3-bucket` resource type which contains information relevant to an S3 bucket
- But multiple bundles that create different S3 buckets (logging bucket, data lake bucket, CloudFront bucket)
- All these bundles produce the same S3 resource type

This separation allows for **reusable contracts** across your infrastructure ecosystem. Massdriver also maintains a set of resource types which are used by our own internal bundles and public bundle templates. These resource types are available to re-use in your own bundles, or modify and republish as your own.

:::

## Step 1: Create and Publish an Resource Type

First, you'll create an resource type that contains data from the `getting-started` bundle in the previous guide.

### Navigate to the Resource Types Directory

1. In the `getting-started` repository, you should see an `artifact-definitions` directory
2. Inside, you'll find a `getting-started.json` file that defines the schema for your bundle's outputs

### Examine the Resource Type

Open `artifact-definitions/getting-started.json` and examine its structure:

```json
{
    "$md": {
        "name": "getting-started"
    },
    "required": [
        "data",
        "specs"
    ],
    "properties": {
        "data": {
            "properties": {
                "pet-name": {
                    "type": "string"
                },
                "password": {
                    "type": "string"
                },
                "shuffle": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                }
            },
            "required": [
                "pet-name",
                "password",
                "shuffle"
            ],
        },
        "specs": {
            "properties": {},
            "required": [],
        }
    }
}
```

This schema defines exactly what JSON structure bundles must produce and consume. Some key points:
* The name of the resource type is in the top level `$md` block. In this case it's named `getting-started`.
* There are two top level fields: `data` and `specs`. These are **`required`** and have significance in Massdriver. Review the [resource type docs](https://docs.massdriver.cloud/concepts/resources-and-types#structure) for more information.
* Within the `data` block there are separate fields each piece of data produced in the `getting-started` bundle: a `pet-name` string, a `password` string, and a list of strings called `shuffle`. All 3 of these fields are **`required`**.
* The `specs` field is empty.

### Publish the Resource Type

1. From your getting-started repository root, run:

    ```bash
    mass definition publish -f artifact-definitions/getting-started.json
    ```

2. You should see output like:

    ```
    Artifact definition <your-org>/getting-started published successfully!
    ```

3. Make note of your organization name - you'll need it in the next steps!

## Step 2: Update `getting-started` Bundle to Produce a Resource

Now you'll modify your `getting-started` bundle from the previous guide to produce a resource defined by your schema.

### Update the Bundle Configuration

1. Navigate to your `01-deploying` directory
2. Open `massdriver.yaml`
3. Find the commented `artifacts:` section (the YAML key remains `artifacts:` for backwards compatibility) and uncomment it:

    ```yaml
    artifacts:
      required:
        - your_first_artifact
      properties:
        your_first_artifact:
          $ref: <your-organization-id>/getting-started  # Replace with your org name
    ```

4. **Important**: Replace `<your-organization-id>` with your actual organization name from the previous step

### Update the Resource Output

1. Open `src/artifacts.tf` (file kept under its original name)
2. Uncomment the `massdriver_artifact` resource (the Terraform resource type retains its legacy name):

    ```hcl
    resource "massdriver_artifact" "example" {
      field = "your_first_artifact"
      name  = "A human friendly name. This is the resource for ${var.md_metadata.name_prefix}"

      artifact = jsonencode({
        data = {
          pet-name = random_pet.name.id
          password = random_password.password.result
          shuffle  = random_shuffle.shuffle.result
        }
        specs = {}
      })
    }
    ```

You'll notice the structure of the `artifact` field matches the JSON schema: a top-level `data` and `specs` field, with `pet-name`, `password` and `shuffle` nested under `data`.

### Republish and Redeploy

1. Publish the updated bundle:

    ```bash
    mass bundle publish
    ```

2. In the Massdriver UI, navigate to the project from previous guide that has `getting-started` deployed.
3. **Notice**: Your bundle now has a connection port on the right side!
4. Click on the `getting-started` bundle, and deploy it from the config tab so it will run the terraform and create the new resource.
4. **Explore**: Click on the "Resources" tab to view and download the produced resource

## Step 3: Deploy the Connecting Bundle

Now you'll deploy a second bundle that consumes a `getting-started` resource.

### Update the Connection Reference

1. Navigate to your `02-connecting` directory
2. Open `massdriver.yaml`
3. Scroll near the bottom of the file where the `connections` block is located. This is where you specify incoming required resources, known as "connections".
3. Update the connection reference to match your organization:

    ```yaml
    connections:
      required:
        - your_first_connection
      properties:
        your_first_connection:
          $ref: <your-org>/getting-started  # Replace with your org name
    ```

### Generate Variables from Connections

1. Run the bundle build command to generate variables from your connections:

    ```bash
    mass bundle build
    ```

2. **Notice**: This updates `src/_massdriver_variables.tf` to create a typed variable that matches the resource type from the connection
3. **Examine**: Look at how the resource type became a typed Terraform variable:

    ```hcl
    variable "your_first_connection" {
      type = object({
        data = object({
          password = string
          pet-name = string
          shuffle  = list(string)
        })
        specs = object({})
      })
    }
    ```

### Publish the Connecting Bundle

1. Publish the connecting bundle:

    ```bash
    mass bundle publish
    ```

### Connect the Bundles in the UI

1. In the Massdriver UI, drag your `connecting-bundles` bundle onto the canvas and name it
2. **Notice**: The left side has a connection port that matches your resource type
3. **Connect**: Draw a line from the output port of your `getting-started` bundle to the input port of your `connecting-bundles` bundle
4. **Deploy**: Click on `connecting-bundles` and click **Deploy** from the Config tab

## Step 4: Explore the Results

Once deployed, explore what the connecting bundle created:

### View the Outputs

1. Click on your deployed connecting bundle
2. Check the outputs in the deployment logs to see how the connected data was used:
   - **extended_pet_name**: A new pet name using the original as a prefix
   - **password_based_port**: A port number derived from the password length
   - **reshuffled_words**: A new ordering of the original shuffled words

## Key Takeaways

🧩 **Resources enable bundle composition** - Complex systems are built by connecting simple bundles  
📜 **Resource types ensure contracts** - Type-safe data exchange between bundles  
🔄 **Definitions are reusable** - One definition can be used by many bundles  
👀 **Visual connections** - The UI makes infrastructure dependencies clear and manageable  
🔗 **Dependency enforcement** - Required connections prevent incomplete deployments  

## What's Next?

Now that you understand bundle connections, you can:

1. **Create more complex architectures** - Chain multiple bundles together
2. **Design reusable resource types** - Create contracts for your infrastructure patterns
3. **Build custom bundles** - Create your own infrastructure bundles with meaningful resources
4. **Explore advanced features** - Learn about alarms, monitoring, and advanced bundle patterns

Congratulations! You've mastered the fundamental concepts of Massdriver's bundle system. You're ready to build real infrastructure architectures using these powerful composability patterns.

## Need Help?

- 📄 [Documentation](https://docs.massdriver.cloud)
- 💬 [Community Slack](https://join.slack.com/t/massdrivercommunity/shared_invite/zt-1smvckvdj-jVFpBG2jF5XiYzX2njDCWA)
- 🐛 [Report Issues](https://github.com/massdriver-cloud/getting-started/issues)
