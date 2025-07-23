---
id: self-hosted-install
slug: /guides/self-hosted-install
title: Self-Hosted Installation
sidebar_label: Self-Hosted Install
---

This guide will walk you through installing Massdriver's self-hosted version using our Helm chart. The self-hosted version of Massdriver is great for teams that want the all the features of our platform in a private cloud environment.

## Prerequisites

Before beginning the installation, ensure you have the following requirements:

### Infrastructure Requirements

- **Kubernetes cluster** running version 1.25 or higher
- **PostgreSQL database** version 13.25 or higher
  - The following PostgresQL extensions are required to be installed: `citext`, `uuid-ossp`, `pg_stat_statements`
- **SMTP server** for account management and email alerts
- **Domain name** where you'll host your Massdriver instance

### Access Requirements

:::info Required from Massdriver Team

You'll need to obtain the following from the Massdriver team before installation:

- **DockerHub access token** - Required to pull our application images
- **License key** - Required for the application to run

Contact us to request these credentials for your self-hosted deployment.

:::

### Dependencies (Included)

The following dependencies are automatically included in the Helm chart:

- **S3-compatible object storage** (via MinIO)
- **Argo Workflows** for executing deployments

## Installation Steps

### Step 1: Add the Helm Repository

First, add the Massdriver Helm repository:

```bash
helm repo add massdriver https://massdriver-cloud.github.io/helm-charts
helm repo update
```

### Step 2: Download and Configure Values

Download the default values file to customize for your environment:

```bash
curl -o values-custom.yaml https://raw.githubusercontent.com/massdriver-cloud/helm-charts/main/charts/massdriver/values-example.yaml
```

:::note

This command downloads the `values-example.yaml` file, which is available for convenience as it only contains a subset of the Massdriver helm chart values - specifically the values which are mandatory and/or commonly modified. The full set of values is available in the chart's `values.yaml` file [here](https://github.com/massdriver-cloud/helm-charts/blob/main/charts/massdriver/values.yaml).

:::

### Step 3: Configure Required Values

Edit your `values-custom.yaml` file to provide the necessary configuration. Focus on the top section between the `# BEGIN Mandatory values` and `# END Global variables` comments:

#### Required Configuration

1. **PostgreSQL Connection**
   ```yaml
   postgresql:
     username: "massdriver_user"
     password: "your-secure-password"
     hostname: "your-postgres-host"
     port: 5432
   ```

2. **SMTP Configuration**
   ```yaml
   smtp:
     username: "your-smtp-username"
     password: "your-smtp-password"
     hostname: "your-smtp-server"
     port: 587
     from: "noreply@your-domain.com"
   ```

3. **Domain Configuration**
   ```yaml
   domain: "your-domain.com"  # e.g., "massdriver.example.com"
   ```

4. **Docker Registry Access**
   ```yaml
   dockerhub:
     accessToken: "your-dockerhub-token"  # Provided by Massdriver team
   ```

5. **License Key**
   ```yaml
   licenseKey: "your-license-key"  # Provided by Massdriver team
   ```


:::info Custom Release Name (Optional)

If you plan to use a different release name than `massdriver`, search for `"release name"` in the values file and update the associated values accordingly.

:::

### Step 4: Configure Ingress and TLS

The ingress configuration allows you to configure how you will access Massdriver in a web browser:

#### Ingress Controller

Update the `massdriver.ingress` section in your `values-custom.yaml` file:

```yaml
massdriver:
  ingress:
    enabled: true
    ingressClassName: "nginx"  # Update to match your ingress controller, or leave blank to use the default ingress controller
```

#### TLS Configuration

Massdriver requires a TLS certificate valid for the following subdomains:
- `app.<your-domain>`
- `api.<your-domain>`

**Option 1: Using cert-manager (Recommended)**

If you have [cert-manager](https://cert-manager.io/) running in the Kubernetes cluster where you are installing Massdriver, and it is configured to manage the domain you specified in the `domain` value earlier, uncomment and configure the cert-manager annotation:

```yaml
massdriver:
  ingress:
    annotations:
      cert-manager.io/cluster-issuer: "letsencrypt-prod"  # Your issuer name
    tls:
      createSecret: true
```

**Option 2: Provide Your Own Certificate Managed By Helm**

If you have your own TLS certificate, you can create and manage it via the helm chart by configuring it in the values file:

```yaml
massdriver:
  ingress:
    tls:
      createSecret: true
      certificate: |
        -----BEGIN CERTIFICATE-----
        # Your certificate content
        -----END CERTIFICATE-----
      key: |
        -----BEGIN PRIVATE KEY-----
        # Your private key content
        -----END PRIVATE KEY-----
```

**Option 3: Provide Your Own Certificate Managed Manually**

If you prefer to manage the TLS certificate manually, you can create the TLS secret separately:

```bash
kubectl create secret tls massdriver-tls --cert=path/to/tls.crt --key=path/to/tls.key
```

and simply reference it in the values file:

```yaml
massdriver:
  ingress:
    tls:
      createSecret: false
      secretName: massdriver-tls
```

**Option 4: Disable TLS (NOT recommended for production)**

:::warning Do NOT disable TLS in Production!!

It is strongly recommended to enable TLS when using Massdriver in production to avoid sensitive data being transmitted via unencrypted traffic.

:::

Massdriver also supports running without TLS. This is useful for short term development and testing purposes.

```yaml
massdriver:
  ingress:
    tls:
      enabled: false
```

### Step 5: Configure Access

Massdriver supports the OpenID Connect protocol for authentication to the platform.

**Configuring OIDC**

Update your `values-custom.yaml` file to include an `oidc` configuration.

```yaml
oidc:
  - name: "google"
    authorizeUrl: "https://..."
    tokenUrl: "https://..."
    clientId: "11111111-2222-3333-44444-555555555555"
    clientSecret: "some-secret-value"
```

**QuickStart Login**

:::warning Do NOT use QuickStart in Production!!

QuickStart login is intended to be used only for short-term access after installation. OIDC should be used for access to production Massdriver installations.

:::

Massdriver also supports a single "QuickStart" user for testing purposes without requiring a full OIDC configuration.

```yaml
quickstart:
  email: you@example.com
  password: p@ssw0rd
```

:::tip Disabling QuickStart

QuickStart login should be disabled as soon as OIDC is configured. This can be done by simply removing the QuickStart configuration from `values-custom.yaml`, or setting it to an empty object (`quickstart: {}`)

:::

### Step 6: Install Massdriver

Once your values file is configured, install Massdriver:

```bash
helm install massdriver massdriver/massdriver \
  -n massdriver \
  --create-namespace \
  -f values-custom.yaml
```

### Step 7: Verify Installation

Check that all pods are running:

```bash
kubectl get pods -n massdriver
```

Verify that your ingress is configured correctly:

```bash
kubectl get ingress -n massdriver
```

## Accessing Your Installation

Once installed, you can access your Massdriver installation at:

- **Main Application (OIDC login)**: `https://app.<your-domain>/login`
- **Main Application (QuickStart login)**: `https://api.<your-domain>/auth/quickstart`
- **API**: `https://api.<your-domain>/api/graphiql`

### Setup CLI

Be sure to update your Massdriver CLI configuration to interact with your new self-hosted instance. You'll need to set the `MASSDRIVER_URL` environment variable to point to your new instance (`https://api.<your-domain>/`). You can also create a new `profile` in your configuration file. Review the [CLI documentation](../cli/00-overview.md#configuration) for more information.

## Updating Your Installation

Massdriver periodically releases updates to the self-hosted chart. To update your installation:

1. **Update the Helm repository**:
   ```bash
   helm repo update
   ```

2. **Upgrade your installation**:
   ```bash
   helm upgrade massdriver massdriver/massdriver \
     -n massdriver \
     -f values-custom.yaml
   ```

:::tip Version Management

Always review the changelog before upgrading to check for changes that are required to values.yaml or other configuration settings.

:::

## Troubleshooting

### Common Issues

**Pods failing to start**
- Verify your DockerHub access token is correct
- Check that your license key is valid
- Ensure PostgreSQL connectivity

**Ingress not working**
- Verify your ingress controller is running
- Check that DNS is properly configured
- Ensure TLS certificates are valid for all required subdomains

**Database connection issues**
- Verify PostgreSQL credentials and connectivity
- Ensure the database exists and the user has proper permissions

### Getting Help

For assistance with your self-hosted installation:

- Check the [troubleshooting guide](../troubleshooting.md)
- Join our [Slack community](https://join.slack.com/t/massdrivercommunity/shared_invite/zt-1smvckvdj-jVFpBG2jF5XiYzX2njDCWA)
- Contact the Massdriver team for enterprise support

## Next Steps

* [Configure which clouds you wanted supported in your instance](/guides/customizing-cloud-support)
* Ready to start building? Check out our [Getting Started guide](../getting_started/00-overview.md) to learn the core Massdriver workflows.
