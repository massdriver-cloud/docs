---
id: getting-started-creating-bundles
slug: /getting-started/creating-bundles
title: Creating Your Own Bundle
sidebar_label: Creating Your Own Bundle
---

Welcome to part 3 of the Massdriver getting started guide! In the previous guides, you learned how to [deploy bundles](01-deploying-first-bundle.md) (part 1) and [connect them together](02-connecting-bundles.md) (part 2). Now you'll learn how to create your own Massdriver bundle from an existing OpenTofu/Terraform module - a common workflow when adopting Massdriver with existing infrastructure code.

## What You'll Learn

By the end of this guide, you'll understand:

✅ **Creating bundles from existing IaC** - Converting Terraform modules to Massdriver bundles  
✅ **Parameter generation** - How module variables become bundle parameters  
✅ **Rich UI configuration** - Adding validation, enums, and user-friendly forms  
✅ **Massdriver metadata** - Using injected context instead of manual parameters  
✅ **Advanced validation** - Creating robust parameter schemas with constraints  
✅ **Bundle refinement** - Improving the user experience through better configuration  

## Understanding the Existing Module

Before creating a bundle, let's examine the Terraform module in the `module` directory. This module demonstrates common infrastructure patterns:

- **Resource naming** with project and environment context and uniqueness
- **Password generation** with configurable complexity
- **Encryption key creation** for security
- **Port assignment** within specified ranges
- **Availability zone selection** based on region

Now let's see how this module can become a Massdriver bundle.

## Step 1: Bundle Creation

Let's create a new bundle from the existing module using the Massdriver CLI.

### Navigate to the Directory

1. Change to the `03-creating` directory:

    ```bash
    cd 03-creating
    ```

### Start the Bundle Creation Wizard

1. Run the bundle creation command:

    ```bash
    mass bundle new
    ```

2. The wizard will guide you through the setup process. Provide these responses:

    **Bundle Name:**
    ```
    ✔ Name: my-first-bundle
    ```

    **Description:**
    ```
    ✔ Description: Step 3 of Massdriver's getting started guide
    ```

    **Template Selection:**
    Use the arrow keys to select `opentofu-module`:
    ```
    ✔ opentofu-module
    ```

    **Existing Module Path:**
    This will copy the module files into the bundle, and convert the `variable` declarations into `params`. Point to the module directory:
    ```
    ✔ Path to an existing Terraform/OpenTofu module to generate a bundle from, leave blank to skip: module
    ```

    **Connections:**
    To keep things simple we won't add any connections to this bundle, so just press Enter:
    ```
    ✔ Connection (leave blank to finish): 
    ```

    **Output Directory:**
    Accept the default:
    ```
    ✔ Output directory: massdriver
    ```

3. The CLI will process the module and create your bundle:

    ```
    Importing params from module...
    Params schema imported successfully.
    Bundle "my-first-bundle" created successfully at path "massdriver"
    ```

### Examine the Generated Bundle

1. Look at the directory structure that was created:

    ```
    massdriver/
    ├── massdriver.yaml          # Bundle configuration with generated params
    ├── src/                     # Your module code
    │   ├── main.tf             # Copied from module/main.tf
    │   ├── variables.tf        # Copied from module/variables.tf
    │   ├── outputs.tf          # Copied from module/outputs.tf
    │   ├── _artifacts.tf       # Generated artifact stub (not needed for this example)
    │   └── _providers.tf       # Generated provider configuration
    └── operator.md             # Bundle documentation template
    ```

2. **Notice**: Your module files have been copied to the `src` directory
3. **Examine**: The `massdriver.yaml` file contains auto-generated parameters matching your module variables

## Step 2: Build and Examine the Bundle

### Generate Massdriver Variables

1. From the `massdriver` directory, build the bundle:

    ```bash
    cd massdriver
    mass bundle build
    ```

2. **Notice**: A new file `src/_massdriver_variables.tf` was created
3. **Important**: This file contains the `md_metadata` variable that Massdriver injects into every deployment. It contains useful, contextual information about the bundle at deployment time. We'll use some of these values later in the guide.

:::tip Variable Generation

Running `mass bundle build` will actually generate variables for **all** the params in the `massdriver.yaml` file if they don't exist. The reason `_massdriver_variables.tf` only contains `md_metadata` is because variable declarations already exist for all of the other params. If you delete a variable declaration from `variables.tf` (but not from params) and run `mass bundle build` again, you'll see the deleted variable generated in `_massdriver_variables.tf`.

:::

### Examine the Metadata Variable

Look at `src/_massdriver_variables.tf`:

```hcl
variable "md_metadata" {
  type = object({
    default_tags = object({...})
    deployment = object({...})
    name_prefix = string      # This is key for our improvements!
    observability = object({...})
    # ... other metadata fields
  })
}
```

The `name_prefix` field contains `<project>-<environment>-<package>-<random-suffix>` - perfect for resource naming!

### Publish and Test the Initial Bundle

1. Publish the bundle to see the auto-generated form:

    ```bash
    mass bundle publish
    ```

2. In the Massdriver UI:
   - Drag the bundle onto the canvas and give it a name
   - Click on the bundle to view the configuration form
   - **Notice**: All module variables became form fields

You now have a working bundle that will deploy the OpenTofu module we provided earlier. However, there are a number of small improvements we can make to improve the user experience of configuring and deploying this bundle.

## Step 3: Improve the Bundle Configuration

### Remove Redundant Naming Variables

The module uses the variables `app_name`, `environment`, and `project_name` for resource naming, but Massdriver provides this automatically through `md_metadata.name_prefix`. Swapping to `md_metadata.name_prefix` has numerous benefits:

* Remove fields from the UI form, reducing configuration requirements
* Prevent misconfigurations by users specifying improper values
* Enforce consistent naming patterns

Let's remove these unnecessary variables and swap to `md_metadata.name_prefix`.

1. **Open** `massdriver.yaml`
2. **Remove** these three parameters from the `params`:
   - `app_name`
   - `environment`
   - `project_name`
3. **Remove** them from the `required` array at the bottom of the `params`
4. **Remove** them from the `variables.tf` file
5. **Update** `src/main.tf` to use the metadata instead:

    ```hcl
    resource "random_id" "server_id" {
      byte_length = 4
      prefix      = "${var.md_metadata.name_prefix}-"
    }
    ```

### Add Enum Validation for Encryption Key

Let's say our system only supports specific key lengths for encryption - in this case 16, 32 and 64 bytes. Let's use an `enum` to make sure the user can't use an invalid length. Let's also clean up the `title` field in all these examples to be more human readable:

```yaml
encryption_key_length:
  default: 32
  description: Length of encryption key in bytes
  title: Encryption Key Length
  type: number
  enum: [16, 32, 64]  # Only allow valid values
```

### Improve Password Configuration

Booleans default to `false` unless specified otherwise, which means all these password options will default to `false`. We don't want our users to have to "opt-in" to a secure password, we want to make it safe by default. Let's make it so all of the password options default to `true`. Let's also enforce a `minimum` and `maximum` length to make sure the password is secure and valid.

```yaml
password_config:
  description: Configuration for password generation
  properties:
    include_lower:
      title: Include Lowercase
      type: boolean
      default: true  # Default to secure
    include_numeric:
      title: Include Numeric
      type: boolean
      default: true
    include_special:
      title: Include Special Characters
      type: boolean
      default: true
    include_upper:
      title: Include Uppercase
      type: boolean
      default: true
    length:
      title: Length
      type: number
      minimum: 8    # Enforce minimum security
      maximum: 64   # Reasonable maximum
      default: 16
  required:
  - include_lower
  - include_numeric
  - include_special
  - include_upper
  - length
  title: Password Configuration
  type: object
```

### Constrain Port Range

Let's make it so we have a specific port range for our application by setting `minimum` and `maximum` contraints. Let's also set the `default` so users don't have to guess the appropriate ranges:

```yaml
port_range:
  description: Port range for application
  properties:
    max:
      title: Maximum Port Number
      type: number
      minimum: 8000
      maximum: 9000
      default: 9000
    min:
      title: Minimum Port Number
      type: number
      minimum: 8000
      maximum: 9000
      default: 8000
  required:
  - max
  - min
  title: Port Range
  type: object
```

### Add Region Validation

If you check the `main.tf` file, you'll see in the `locals` block that `var.region` is used to look up valid availability zones.

```hcl
locals {
  availability_zones_per_region = {
    "us-east-1" = ["us-east-1a", "us-east-1b", "us-east-1c", "us-east-1d", "us-east-1e", "us-east-1f"]
    "us-west-2" = ["us-west-2a", "us-west-2b", "us-west-2c", "us-west-2d"]
  }
}
```

This means that there are only 2 acceptable values for the region: `us-east-1` and `us-west-2`. Let's make `region` an enum to make sure our users can't specify a bad region. Let's also mark this field as `immutable` since changing regions in the cloud is always a destructive action.

```yaml
region:
  default: us-west-2
  description: AWS region to deploy to
  title: AWS Region
  type: string
  enum: ["us-east-1", "us-west-2"]
  $md.immutable: true  # Prevent changes after deployment
```

### Validate Zone Count

The availability zone arrays in the `locals` block were of lengths 4 and 6. This means we should set a `maximum` on the `zone_count` to 4, to make sure users can't choose a value larger than the length of the shortest array. We should also set a `minimum` of 2, to make sure there is always high availability.

```yaml
zone_count:
  default: 2
  description: Number of zones to select
  title: Zone Count
  type: number
  minimum: 2  # Require high availability
  maximum: 4  # Safe maximum
```

### Final Parameter Schema

Your completed `params` section should look like this:

```yaml
params:
  properties:
    encryption_key_length:
      default: 32
      description: Length of encryption key in bytes
      title: Encryption Key Length
      type: number
      enum: [16, 32, 64]
    password_config:
      description: Configuration for password generation
      properties:
        include_lower:
          title: Include Lowercase
          type: boolean
          default: true
        include_numeric:
          title: Include Numeric
          type: boolean
          default: true
        include_special:
          title: Include Special Characters
          type: boolean
          default: true
        include_upper:
          title: Include Uppercase
          type: boolean
          default: true
        length:
          title: Length
          type: number
          minimum: 8
          maximum: 64
          default: 16
      required:
      - include_lower
      - include_numeric
      - include_special
      - include_upper
      - length
      title: Password Configuration
      type: object
    port_range:
      description: Port range for application
      properties:
        max:
          title: Maximum Port Number
          type: number
          minimum: 8000
          maximum: 9000
          default: 9000
        min:
          title: Minimum Port Number
          type: number
          minimum: 8000
          maximum: 9000
          default: 8000
      required:
      - max
      - min
      title: Port Range
      type: object
    region:
      default: us-west-2
      description: AWS region to deploy to
      title: AWS Region
      type: string
      enum: ["us-east-1", "us-west-2"]
      $md.immutable: true
    zone_count:
      default: 2
      description: Number of zones to select
      title: Zone Count
      type: number
      minimum: 2
      maximum: 4
  required:
  - encryption_key_length
  - password_config
  - port_range
  - region
  - zone_count
```

## Step 4: Test the Improved Bundle

### Republish and Deploy

1. Publish the improved bundle:

    ```bash
    mass bundle publish
    ```

### Examine the Enhanced UI

1. In the Massdriver UI, reopen the configuration panel on the bundle to view the changes
2. **Notice the improvements:**
   - **Cleaner form** - Naming fields are removed
   - **Dropdown menus** - Enum fields become select boxes
   - **Better titles** - User-friendly field names
   - **Default values** - Form pre-populated with safe defaults
   - **Validation** - Invalid configurations are prevented

### Test Validation

Try these scenarios to see validation in action:

- **Invalid port range**: Set max port to 9500 - you'll see an error
- **Weak password**: Try setting password length to 4 - validation prevents it
- **Invalid key length**: The dropdown only shows valid encryption key sizes
- **Region constraints**: Only supported regions appear in the dropdown

### Deploy Successfully

1. Configure the bundle with valid settings
2. Click **Deploy**
3. **Notice**: The deployment uses `md_metadata.name_prefix` for consistent naming

## Key Takeaways

⚡ **Existing modules convert easily** - The CLI automates most of the conversion process  
✨ **Parameter refinement improves UX** - Better titles, validation, and defaults create user-friendly forms  
🏷️ **Massdriver metadata reduces complexity** - Use injected context instead of manual parameters  
🛡️ **Validation prevents errors** - JSON Schema constraints catch configuration mistakes early  
🔒 **Immutable fields prevent accidents** - Critical settings can be locked after deployment  

## What's Next?

Congratulations! You've successfully created a Massdriver bundle from an existing Terraform module and enhanced it with rich validation and user experience improvements.

Check out some of our other guides for more advanced topics.

## Need Help?

- 📄 [Documentation](https://docs.massdriver.cloud)
- 💬 [Community Slack](https://join.slack.com/t/massdrivercommunity/shared_invite/zt-1smvckvdj-jVFpBG2jF5XiYzX2njDCWA)
- 🐛 [Report Issues](https://github.com/massdriver-cloud/getting-started/issues)
