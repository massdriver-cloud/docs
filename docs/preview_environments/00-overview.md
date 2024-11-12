---
title: Overview
---

# Preview Environments

Massdriver's Preview Environments enable you to replicate entire projects, allowing you to spin up temporary environments that include all Infrastructure-as-Code (IaC) modules on your canvas. This means you can test networks, compute resources, applications, databases, queues, model builds, and more. Anything you can define using tools like Terraform, OpenTofu, or Helm, Massdriver can reproduce.

## Overview

Preview Environments are essential for validating changes in a production-like setting before merging code. By creating temporary environments that mirror your production infrastructure, you can catch issues early, ensure compatibility, and streamline your development workflow.

## Walkthrough

### Basic Setup

First, initialize your preview configuration using the Massdriver CLI:

```shell
mass project list
mass preview init $projectSlug
```

You'll be prompted to select the credentials you want to use for your preview environment and this will generate a `preview.json` configuration file for your project with a set of default parameters for each of the packages in your project.

Next, edit the `preview.json` file to set the parameters, remote references, and secrets for your preview environment.

Add the configuration to your repository:

```shell
git add preview.json
git commit -m "Add Massdriver configuration"
git push origin main
```

Finally, set up your GitHub Actions workflow to manage preview environments:

```yaml
name: Preview Environments

on:
  pull_request:
    types: [opened, reopened, synchronize, closed]

jobs:
  preview:
    runs-on: ubuntu-latest
    env:
      MASSDRIVER_API_KEY: ${{secrets.MASSDRIVER_API_KEY}}
      MASSDRIVER_ORG_ID: ${{secrets.MASSDRIVER_ORG_ID}}
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Install Massdriver CLI
      uses: massdriver-cloud/actions/setup@v5.1

    # Deploy preview environment when PR is opened/updated
    - name: Deploy Preview Environment
      if: github.event.action != 'closed'
      uses: massdriver-cloud/actions/preview_deploy@v5.1

    # Decommission preview environment when PR is closed/merged
    - name: Decommission Preview Environment
      if: github.event.action == 'closed'
      uses: massdriver-cloud/actions/preview_decommission@v5.1
```

### Open a Pull Request to Create a Temporary Environment

With the setup complete, opening a pull request will trigger the GitHub Actions workflow. Massdriver will read the configuration file and spin up a temporary environment that replicates your project's infrastructure.

## Advanced Features

### Bash Interpolation in Configuration Files

Massdriver's configuration files support bash interpolation of environment variables. This is useful for incorporating dynamic values like pull request numbers into hostnames or resource identifiers.

```js
{
  "projectSlug": "your-project-slug",
  // other project configuration here
  "packages": {
    "app": {
      "params": {
        "hostname": "preview-${SOME_UNIQUE_ENV_VAR_VALUE}.example.com"
      }
    }
  }
}
```  

In the example above, `${{ env.PULL_REQUEST_NUMBER }}` is replaced with the actual pull request number, ensuring each preview environment has a unique hostname.

### Setting Secrets for Applications

You can securely pass secrets to your applications within the configuration file. Massdriver ensures that sensitive information is handled securely throughout the deployment process.

```js
{
  "projectSlug": "your-project-slug",
  // other project configuration here
  "packages": {
    "app": {
      "params": {
        // your params here
      },
      "secrets": [
        {
          "name": "FOOBAR",
          "value": "${SOME_ENV_VAR}"
        }
      ]
    }
  }
}
```        

### Using Remote References for Resource Sharing

Massdriver allows you to use remote references to include only a portion of the project canvas in your preview environments. This feature is detailed in our [Sharing Infrastructure Guide](https://docs.massdriver.cloud/guides/sharing-infrastructure).

#### Sharing Resources Among Preview Environments

By using remote references, you can share resources like Kubernetes clusters among multiple preview environments. This approach minimizes costs and reduces the time required to set up new environments.

- **Cost Efficiency**: Sharing a single staging cluster across preview environments avoids the overhead of provisioning separate clusters for each pull request.
- **Faster Deployment**: Reusing existing resources speeds up the deployment process, allowing developers to test changes more quickly.
- **Consistent Environment**: Ensures all preview environments are running in a consistent infrastructure setup.

#### Additional Use Cases

- **Shared Databases**: Connect preview environments to a shared database populated with test data.
- **Common Networking**: Use a shared virtual network to maintain consistent network policies.
- **Centralized Monitoring**: Aggregate logs and metrics from all preview environments into a shared monitoring service.

**Example Configuration using remote references for networking and compute from another project:**

```js
{
  "projectSlug": "your-project-slug",
  "credentials": [
    // your credential references here
  ],
  "packages": {
    "vpc": {
      "remoteReferences": [
        {
          "artifactId": "your-artifact-id",
          "field": "network"
        }
      ]
    },
    "cluster": {
      "remoteReferences": [
        {
          "artifactId": "your-artifact-id",
          "field": "compute"
        }
      ]
    },
    "rds": {
      "params": {
        "engine": "postgresql",
        "version": "14.3"
      }
    },
    "app": {
      "params": {
        "image": "example:${SOME_ENV_VAR}",
        "hostname": "preview-${SOME_ENV_VAR}.example.com"
      },
      "secrets": [
        {
          "name": "FOOBAR",
          "value": "${SOME_ENV_VAR}"
        }
      ]
    }
  }
}
```


## CI Integration

Preview environments can be integrated with any CI system. While GitHub integration works out of the box, you can use preview environments with any CI platform by providing a JSON file with the required pull request metadata.

When using the `mass preview deploy` command, pass your CI context file using the `--ci-context` flag:

## Conclusion

Massdriver's Preview Environments provide a powerful way to test and validate changes in a safe, isolated environment. By replicating your entire project infrastructure, you can ensure that code changes behave as expected before they reach production.

Leveraging advanced features like bash interpolation, secrets management, and remote references, you can customize your preview environments to fit your development workflow seamlessly.

---

For more information on sharing infrastructure and using remote references, refer to our [Sharing Infrastructure Guide](https://docs.massdriver.cloud/guides/sharing-infrastructure). If you have any questions or need assistance, feel free to reach out to our support team.