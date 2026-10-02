---
id: self-hosted-install
slug: /platform-operations/self-hosted/install
title: Self-Hosted Installation
sidebar_label: Install
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
     database: "massdriver"
     port: 5432
   ```

2. **SMTP Configuration**
   ```yaml
   smtp:
     username: "your-smtp-username"
     password: "your-smtp-password"
     server: "your-smtp-server"
     port: 587
     fromAddress: "noreply@your-domain.com"
   ```

3. **Domain Configuration**
   ```yaml
   domain: "massdriver.example.com"
   ```

   Massdriver is served on two subdomains of this domain, `app.massdriver.example.com` and `api.massdriver.example.com`. Create DNS records for both pointing at your ingress controller or Gateway's external address (see [Step 4](#step-4-configure-ingress-or-gateway-api)).

4. **Docker Registry Access**
   ```yaml
   dockerhub:
     accessToken: "your-dockerhub-token"  # Provided by Massdriver team
   ```

5. **License Key**
   ```yaml
   licenseKey: "your-license-key"  # Provided by Massdriver team
   ```


#### Optional Configuration

**Documentation link**

The documentation link in the sidebar points at `https://docs.massdriver.cloud`. Installations that serve their own documentation can point it somewhere else with `MD_DOCS_URL`:

```bash
MD_DOCS_URL=https://docs.internal.example.com
```

Leave it unset to keep the default.

:::info Custom Release Name (Optional)

If you plan to use a different release name than `massdriver`, search for `"release name"` in the values file and update the associated values accordingly.

:::

### Step 4: Configure Ingress or Gateway API

This step configures how you will access Massdriver in a web browser. Use either a Kubernetes [Ingress](#ingress-controller) or the [Gateway API](#gateway-api), not both.

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
      cert: |
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

#### Gateway API

If your cluster uses the [Gateway API](https://gateway-api.sigs.k8s.io/), Massdriver can attach `HTTPRoute` resources to an existing `Gateway` instead of creating an Ingress. This requires the Gateway API CRDs and a Gateway with listeners for `app.<your-domain>` and `api.<your-domain>`. If the Gateway is in a different namespace than Massdriver, its listeners' `allowedRoutes` must permit routes from the Massdriver namespace.

Disable the ingress (it is enabled in `values-example.yaml`) and enable `httpRoute`:

```yaml
massdriver:
  ingress:
    enabled: false
  httpRoute:
    enabled: true
    parentRefs:
      - name: "external-gateway"         # Name of your Gateway
        namespace: "gateway-system"      # Optional: defaults to the Massdriver namespace
        # sectionName: "https"           # Optional: attach to a specific listener
    tls:
      enabled: true
```

TLS is terminated on the Gateway, so the certificate for both subdomains is configured on the Gateway's listeners, not in the Massdriver chart. `httpRoute.tls.enabled` only tells Massdriver whether to generate `https` URLs. Set it to `false` if your Gateway serves plain HTTP (NOT recommended for production).

### Step 5: Configure Access

Massdriver supports the [OpenID Connect (OIDC)](https://openid.net/connect/) protocol for authentication. You can configure one or more OIDC providers in your `values-custom.yaml` file. For full setup instructions including provider-specific configuration, see the [OIDC Configuration guide](./oidc).

**QuickStart Login**

:::warning Do NOT use QuickStart in Production!!

QuickStart login is intended to be used only for short-term access after installation. OIDC should be used for access to production Massdriver installations.

:::

For initial testing, Massdriver supports a single "QuickStart" user without requiring OIDC configuration:

```yaml
quickstart:
  email: you@example.com
  password: p@ssw0rd
```

Once OIDC is configured, disable QuickStart by removing the section from `values-custom.yaml` or setting it to an empty object (`quickstart: {}`).

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

If you are using the Gateway API, check that both routes are accepted by the Gateway:

```bash
kubectl get httproute -n massdriver
```

## Accessing Your Installation

Once installed, you can access your Massdriver installation at:

- **Main Application (OIDC login)**: `https://app.<your-domain>/login`
- **Main Application (QuickStart login)**: `https://api.<your-domain>/auth/quickstart`
- **API**: `https://api.<your-domain>/api/graphiql`

### Setup CLI

Be sure to update your Massdriver CLI configuration to interact with your new self-hosted instance. You'll need to set the `MASSDRIVER_URL` environment variable to point to your new instance (`https://api.<your-domain>/`). You can also create a new `profile` in your configuration file. Review the [CLI documentation](/reference/cli/overview#configuration) for more information.

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

**Ingress or Gateway not working**
- Verify your ingress controller or Gateway is running
- For the Gateway API, run `kubectl describe httproute -n massdriver` and check the `Accepted` and `ResolvedRefs` conditions
- Check that DNS is properly configured
- Ensure TLS certificates are valid for all required subdomains

**Database connection issues**
- Verify PostgreSQL credentials and connectivity
- Ensure the database exists and the user has proper permissions

### Getting Help

For assistance with your self-hosted installation:

- Join our [Slack community](https://join.slack.com/t/massdrivercommunity/shared_invite/zt-1smvckvdj-jVFpBG2jF5XiYzX2njDCWA)
- Contact the Massdriver team for enterprise support

## Next Steps

* **[Explore the Massdriver Catalog](https://github.com/massdriver-cloud/massdriver-catalog)** - Jump-start your self-hosted instance with a complete git-ready catalog of resource types and infrastructure bundles. This catalog helps you model your platform architecture and developer experience _before_ writing infrastructure code. Clone it, customize it, and use it as the foundation for your platform team's infrastructure delivery.
