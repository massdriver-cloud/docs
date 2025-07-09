---
id: getting-started-connecting-bundles
slug: /getting-started/connecting-bundles
title: Connecting Bundles
sidebar_label: Connecting Bundles
---

Welcome to part 2 of the Massdriver getting started guide! In part 1, you learned how to publish, configure, and deploy a bundle. Now you'll learn how to connect bundles together to share information between them using **artifacts** - one of Massdriver's most powerful features.

## What You'll Learn

By the end of this guide, you'll understand:

✅ **What artifacts are** - How bundles share data with each other  
✅ **Artifact definitions** - The schema contracts that ensure type safety  
✅ **Publishing artifact definitions** - Making reusable data contracts available  
✅ **Producing artifacts** - Updating bundles to output structured data  
✅ **Consuming artifacts** - Using artifacts as inputs to other bundles  
✅ **Bundle connections** - Connecting bundles visually in the UI  

## Understanding Artifacts and Artifact Definitions

### What Are Artifacts?

**Artifacts** are structured JSON outputs that bundles produce to share data with other bundles. Think of them as the "public API" of your infrastructure - they expose specific data that other bundles can consume. This is managed via two fields in the `massdriver.yaml` file:

- Bundles produce the artifacts that are specified in the `artifacts` field
- Bundles consume the artifacts that are specified in the `connections` field

### What Are Artifact Definitions?

**Artifact definitions** are JSON Schema specifications that define the structure and type of data that artifacts must contain. They create an enforceable "contract" between bundles:

- Bundles which produce artifacts are guaranteed to output JSON that matches the artifact definition schemas
- Bundles which consume artifacts are guaranteed to receive JSON that matches the expected artifact definition schema

:::tip Artifact Definitions vs Bundles

Artifact definitions are **not** paired 1-to-1 with bundles. This is intentional. Consider:
- You might have one `aws-s3-bucket` artifact definition which contains information relevant to an S3 bucket
- But multiple bundles that create different S3 buckets (logging bucket, data lake bucket, CloudFront bucket)
- All these bundles produce the same S3 artifact type

This separation allows for **reusable contracts** across your infrastructure ecosystem. Massdriver also maintains a set of artifact definitions which are used by our own internal bundles and public bundle templates. These artifact definitions are available to re-use in your own bundles, or modify and republish as your own.

:::

## Step 1: Create and Publish an Artifact Definition

First, you'll create an artifact definition that contains data from the `getting-started` bundle in the previous guide.

### Navigate to the Artifact Definitions Directory

1. In the `getting-started` repository, you should see an `artifact-definitions` directory
2. Inside, you'll find a `getting-started.json` file that defines the schema for your bundle's outputs

### Examine the Artifact Definition

Open `artifact-definitions/getting-started.json` and examine its structure:

```json
{
    "$schema": "http://json-schema.org/draft-07/schema",
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
* The name of the artifact definition is in the top level `$md` block. In this case it's named `getting-started`.
* There are two top level fields: `data` and `specs`. These are **`required`** and have significance in Massdriver. Review the [artifact definition docs](https://docs.massdriver.cloud/concepts/artifact-definitions#structure) for more information.
* Within the `data` block there are separate fields each piece of data produced in the `getting-started` bundle: a `pet-name` string, a `password` string, and a list of strings called `shuffle`. All 3 of these fields are **`required`**.
* The `specs` field is empty.

### Publish the Artifact Definition

1. From your getting-started repository root, run:

    ```bash
    mass definition publish -f artifact-definitions/getting-started.json
    ```

2. You should see output like:

    ```
    Artifact definition <your-org>/getting-started published successfully!
    ```

3. Make note of your organization name - you'll need it in the next steps!

## Step 2: Update `getting-started` Bundle to Produce an Artifact

Now you'll modify your `getting-started` bundle from the previous guide to produce an artifact defined by your schema.

### Update the Bundle Configuration

1. Navigate to your `01-deploying` directory
2. Open `massdriver.yaml`
3. Find the commented `artifacts` section and uncomment it:

    ```yaml
    artifacts:
      required:
        - your_first_artifact
      properties:
        your_first_artifact:
          $ref: <your-org>/getting-started  # Replace with your org name
    ```

4. **Important**: Replace `<your-org>` with your actual organization name from the previous step

### Update the Artifact Resource

1. Open `src/_artifacts.tf`
2. Uncomment the `massdriver_artifact` resource:

    ```terraform
    resource "massdriver_artifact" "example" {
      field = "your_first_artifact"
      name  = "A human friendly name. This is the artifact for ${var.md_metadata.name_prefix}"

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

You'll notice the structure of the `artifact` field matches the JSON schema: a top level `data` and `specs` field, with `pet-name`, `password` and `shuffle` nested under `data`.

### Republish and Redeploy

1. Publish the updated bundle:

    ```bash
    mass bundle publish
    ```

2. In the Massdriver UI, navigate to the project from previous guide that has `getting-started` deployed.
3. **Notice**: Your bundle now has a connection port on the right side!
4. Click on the `getting-started` bundle, and deploy it from the config tab so it will run the terraform and create the new artifact.
4. **Explore**: Click on the "Artifacts" tab to view and download the produced artifact

## Step 3: Deploy the Connecting Bundle

Now you'll deploy a second bundle that consumes a `getting-started` artifact.

### Update the Connection Reference

1. Navigate to your `02-connecting` directory
2. Open `massdriver.yaml`
3. Scroll near the bottom of the file where the `connections` block is located. This is where you specify incoming required artifacts, known as "connections".
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

2. **Notice**: This updates `src/_massdriver_variables.tf` to create a typed variable that matches the artifact definition from the connection
3. **Examine**: Look at how the artifact definition became a typed Terraform variable:

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
2. **Notice**: The left side has a connection port that matches your artifact definition
3. **Connect**: Draw a line from the output port of your `getting-started` bundle to the input port of your `connecting-bundles` bundle
4. **Deploy**: Click on `connecting-bundles` and click **Deploy** from the Config tab

## Step 2.4: Explore the Results

Once deployed, explore what the connecting bundle created:

### View the Outputs

1. Click on your deployed connecting bundle
2. Check the outputs in the deployment logs to see how the connected data was used:
   - **extended_pet_name**: A new pet name using the original as a prefix
   - **password_based_port**: A port number derived from the password length
   - **reshuffled_words**: A new ordering of the original shuffled words

### Key Observations

🔍 **Type Safety**: The artifact definition ensured the connecting bundle received exactly the expected data structure  
🔍 **Data Sharing**: Artifacts allowed important data to be passed from one bundle to another 
🔍 **Dependency Management**: The connecting bundle couldn't deploy without the required connection  
🔍 **Visual Connections**: The UI clearly shows the dependencies between bundles  

## Key Takeaways

🎯 **Artifacts enable bundle composition** - Complex systems are built by connecting simple bundles  
🎯 **Artifact definitions ensure contracts** - Type-safe data exchange between bundles  
🎯 **Definitions are reusable** - One definition can be used by many bundles  
🎯 **Visual connections** - The UI makes infrastructure dependencies clear and manageable  
🎯 **Dependency enforcement** - Required connections prevent incomplete deployments  

## What's Next?

Now that you understand bundle connections, you can:

1. **Create more complex architectures** - Chain multiple bundles together
2. **Design reusable artifact definitions** - Create contracts for your infrastructure patterns
3. **Build custom bundles** - Create your own infrastructure bundles with meaningful artifacts
4. **Explore advanced features** - Learn about alarms, monitoring, and advanced bundle patterns

Congratulations! You've mastered the fundamental concepts of Massdriver's bundle system. You're ready to build real infrastructure architectures using these powerful composability patterns.

## Need Help?

- 📄 [Documentation](https://docs.massdriver.cloud)
- 💬 [Community Slack](https://join.slack.com/t/massdrivercommunity/shared_invite/zt-1smvckvdj-jVFpBG2jF5XiYzX2njDCWA)
- 🐛 [Report Issues](https://github.com/massdriver-cloud/getting-started/issues)
