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
✅ **Resource types** - The versioned schema contracts that ensure type safety  
✅ **Publishing resource types** - Making reusable data contracts available  
✅ **Producing resources** - Updating bundles to output structured resource data  
✅ **Consuming resources** - Declaring dependencies on resources from other bundles  
✅ **Bundle connections** - Connecting bundles visually in the UI  

## Understanding Resources and Resource Types

### What Are Resources?

**Resources** are structured JSON outputs that bundles produce to share data with other bundles. Think of them as the "public API" of your infrastructure - they expose specific data that other bundles can consume. This is managed via two fields in the `massdriver.yaml` file:

- Bundles produce the resources that are declared in the `resources` block
- Bundles consume the resources that are declared in the `dependencies` block

### What Are Resource Types?

**Resource types** are JSON Schema specifications that define the structure and type of data that resources must contain. They create an enforceable "contract" between bundles:

- Bundles which produce resources are guaranteed to output JSON that matches the resource type schema
- Bundles which consume resources are guaranteed to receive JSON that matches the expected resource type schema

Resource types are **versioned**. A bundle that produces a resource pins the exact version it emits, and a bundle that consumes one names the range of versions it accepts. That is how the contract can evolve without breaking the bundles already wired to it.

:::tip Resource Types vs Bundles

Resource types are **not** paired 1-to-1 with bundles. This is intentional. Consider:
- You might have one `aws-s3-bucket` resource type which contains information relevant to an S3 bucket
- But multiple bundles that create different S3 buckets (logging bucket, data lake bucket, CloudFront bucket)
- All these bundles produce the same S3 resource type

This separation allows for **reusable contracts** across your infrastructure ecosystem. Massdriver also maintains a set of resource types which are used by our own internal bundles and public bundle templates. These resource types are available to re-use in your own bundles, or modify and republish as your own.

:::

## Step 1: Create and Publish a Resource Type

First, you'll publish a resource type that describes the data produced by the `getting-started` bundle from the previous guide.

### Navigate to the Resource Types Directory

1. In the `getting-started` repository, you should see a `resource-types` directory
2. Inside, you'll find a `getting-started` directory containing a `massdriver.yaml` that defines the schema for your bundle's outputs

### Examine the Resource Type

Open `resource-types/getting-started/massdriver.yaml` and examine its structure:

```yaml
name: getting-started
version: 1.0.0
label: Getting Started

schema:
  title: Getting Started
  description: A basic example of a resource type, paired with the getting-started bundle from part 1.
  type: object
  additionalProperties: false
  required:
    - data
  properties:
    data:
      title: Resource Data
      type: object
      required:
        - pet-name
        - password
        - shuffle
      properties:
        pet-name:
          title: Pet Name
          description: The generated pet name
          type: string
        password:
          title: Password
          description: The generated password
          type: string
          $md.sensitive: true
        shuffle:
          title: Shuffle
          description: The shuffled words
          type: array
          items:
            type: string
```

Some key points:
* `name` is the identifier other bundles use to reference the resource type. Within your own organization you refer to it simply as `getting-started`.
* `version` is the semantic version of this contract. Publishing is immutable: once `1.0.0` exists it can never be overwritten, so you bump the version to change the contract.
* `label` is the human-friendly name shown in the Massdriver UI.
* `schema` is a JSON Schema describing the resource payload. Here everything lives under a single `data` object with a `pet-name` string, a `password` string, and a list of strings called `shuffle`. All three are **`required`**.
* `$md.sensitive` marks the password so it is masked in the UI and API responses.

The `massdriver.yaml` format also supports onboarding instructions, downloadable export templates, and UI placement. See the [Resource Type Spec](/bundle-development/dependencies-resources/resource-type-spec) for the complete reference.

### Publish the Resource Type

1. From your getting-started repository root, run:

    ```bash
    mass resource-type publish resource-types/getting-started
    ```

2. Confirm it published by fetching it back:

    ```bash
    mass resource-type get getting-started
    ```

Because the resource type lives in your organization, your bundles can reference it by name alone. No organization prefix is needed.

## Step 2: Update `getting-started` Bundle to Produce a Resource

Now you'll modify your `getting-started` bundle from the previous guide to produce a resource of the type you just published.

### Update the Bundle Configuration

1. Navigate to your `01-deploying` directory
2. Open `massdriver.yaml`
3. Find the commented `resources:` section and uncomment it:

    ```yaml
    resources:
      your_first_resource:
        resource_type: getting-started@1.0.0
        required: true
    ```

The bundle pins the exact resource type version it produces, `1.0.0`. `required: true` means the bundle always creates this resource.

### Update the Resource Output

1. Open `src/resources.tf`
2. Uncomment the `massdriver_resource` resource:

    ```hcl
    resource "massdriver_resource" "example" {
      field = "your_first_resource"
      name  = "A human friendly name. This is the resource for ${var.md_metadata.name_prefix}"

      resource = jsonencode({
        data = {
          pet-name = random_pet.name.id
          password = random_password.password.result
          shuffle  = random_shuffle.shuffle.result
        }
      })
    }
    ```

You'll notice the structure of the `resource` field matches the schema: a top-level `data` object with `pet-name`, `password` and `shuffle` nested under it. The `field` value matches the key you declared under `resources` in `massdriver.yaml`.

### Republish and Redeploy

1. Publish the updated bundle:

    ```bash
    mass bundle publish
    ```

2. In the Massdriver UI, navigate to the project from the previous guide that has `getting-started` deployed.
3. **Notice**: Your bundle now has a connection port on the right side!
4. Click on the `getting-started` bundle, and deploy it from the config tab so it will run the OpenTofu and create the new resource.
5. **Explore**: Click on the "Resources" tab to view and download the produced resource

## Step 3: Deploy the Connecting Bundle

Now you'll deploy a second bundle that consumes a `getting-started` resource.

### Declare the Dependency

1. Navigate to your `02-connecting` directory
2. Open `massdriver.yaml`
3. Scroll near the bottom of the file where the `dependencies` block is located. This is where you declare the resources the bundle needs from other bundles:

    ```yaml
    dependencies:
      your_first_dependency:
        resource_type: getting-started@~1
        required: true
    ```

Where the producing bundle pinned an exact version, the consuming bundle accepts a **range**. `~1` means any `1.x.x` release of the `getting-started` resource type, so the producer can ship compatible updates without this bundle changing. See [Version Resolution](/bundle-development/dependencies-resources/version-resolution) for the range forms you can use.

### Generate Variables from Dependencies

1. Run the bundle build command to generate variables from your dependencies:

    ```bash
    mass bundle build
    ```

2. **Notice**: This updates `src/_massdriver_variables.tf` to create a typed variable that matches the resource type schema
3. **Examine**: Look at how the resource type became a typed OpenTofu variable:

    ```hcl
    variable "your_first_dependency" {
      type = object({
        data = object({
          password = string
          pet-name = string
          shuffle  = list(string)
        })
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
🔢 **Versions let contracts evolve** - Producers pin a version, consumers accept a range  
🔄 **Resource types are reusable** - One resource type can be used by many bundles  
👀 **Visual connections** - The UI makes infrastructure dependencies clear and manageable  
🔗 **Dependency enforcement** - Required dependencies prevent incomplete deployments  

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
