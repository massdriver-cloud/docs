# Creating an Azure Container Registry

## Using Azure CLI

### Connect to your Azure subscription

```
az login
```

### Create a resource group

```
az group create --name myResourceGroup --location eastus
```

### Create a container registry

```
az acr create --resource-group myResourceGroup --name myContainerRegistry001 --sku Standard
```

## Using Azure portal

### Create a container registry

1. In your Azure account, search for and click on **container registries**
2. Click **Create**
3. On the create screen, complete the required fields:
  1. Click **Create new** under resource group to create a new resource group
  2. Enter a name for your container registry
  3. Select a location
  4. Select a SKU (Standard is used for most scenarios)
  5. Click **Review + create** and **Create**
![Example 1](/static/img/acr-example-1.png)

# Pushing container registry to GitHub actions

## Using Azure CLI

### Connect to your Azure subscription

```
az login
```

### Create the Azure service principal

```
az ad app create --display-name myApp
```
This will output the `appId` and `objectId` in JSON. Save these values for later use.

```
az ad sp create --id $appId
```
Replace `$appId` with the value from the previous step.

### Create role assignment for service principal

```
az role assignment create --role contributor --subscription $subscriptionId --assignee-object-id  $objectId --assignee-principal-type ServicePrincipal --scope /subscriptions/$subscriptionId/resourceGroups/$resourceGroupName
```
Replace `$subscriptionId` and `$objectId` with the values from the previous steps. Replace `$resourceGroupName` with the name of the resource group you created for the container registry.

Copy the values for `clientId`, `subscriptionId`, and `tenantId` for later use in your GitHub actions workflow.

### Create federated credentials for service principal

```
az rest --method POST --uri 'https://graph.microsoft.com/beta/applications/<APPLICATION-OBJECT-ID>/federatedIdentityCredentials' --body '{"name":"<CREDENTIAL-NAME>","issuer":"https://token.actions.githubusercontent.com","subject":"<repo:organization/repository:environment:name>","description":"Testing","audiences":["api://AzureADTokenExchange"]}'
```
- Replace `APPLICATION-OBJECT-ID` with the **objectId** from the previous step
- Set a value for `CREDENTIAL-NAME` to reference later
- Set the `subject`. The value of this is defined by GitHub depending on your workflow:
  - Jobs in your GitHub Actions environment: `repo:organization/repository:environment:Production`
  - Jobs not tied to an environment (ref path for branch/tag): `repo:organization/repository:ref:refs/heads/my-branch` or `repo:organization/repository:ref:refs/tags/my-tag`
  - For workflows triggered by a pull request: `repo:organization/repository:pull_request`

## Using Azure portal

### Create the Azure service principal

1. In your Azure account, search for and click on **Subscriptions**
2. Copy the **Subscription ID** and save for later use
3. Search for and click on **Azure Active Directory**
4. Select **App registrations**
5. Select **New registration**
6. Name your application and click **Register**
7. Copy the **Application (client) ID** and **Directory (tenant) ID** and save for later use

### Create federated credentials for service principal

1. Select **Certificates & secrets**
2. Select the **Federated credentials** tab
3. Click **+ Add credential**
4. Select the scenario **GitHub Actions deploying Azure resources**
5. Enter your GitHub account information:
  - Organization: Your GitHub organization name or GitHub username
  - Repository: Your repository name
  - Entity type: The filter used to scope the OIDC requests from GitHub workflows, used to generate the `subject` for the credential
  - GitHub name: The name of the environment, branch, or tag
  - Credential details name: Name for the created credential 
6. Click **Add**

### Create role assignment for service principal

1. Search for and open the **resource group** of your Azure Container Registry
2. Select **Access control (IAM)**
3. Click **+ Add** and **Add role assignment**
4. Select **Contributor** and click **Next**
5. Click **Select members** and search for the **service principal** you created earlier, select it and click **Select**
6. Click **Review + assign**
![Example 2](/static/img/acr-example-2.png)

## Set up GitHub Actions

### Create GitHub secrets

1. Open your GitHub repository and click **Settings**
2. Click **Secrets** and then **New Secret**
3. Create secrets for the following using values saved from previous steps:
  - `AZURE_CLIENT_ID` = `Application (client) ID`
  - `AZURE_TENANT_ID` = `Directory (tenant) ID`
  - `AZURE_SUBSCRIPTION_ID` = `Subscription ID`

### Setup Azure Login with OpenID Connect authentication

#### Linux

Replace `ACR-NAME` with the name of your Azure Container Registry.

```
name: Run Azure Login with OpenID Connect
on: [push]

permissions:
      id-token: write
      contents: read
      
jobs: 
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - name: 'Az CLI login'
      uses: azure/login@v1
      with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
  
    - name: 'Run Azure CLI commands'
      run: |
          az account show
          az group list
          pwd 

    - name: Docker meta
        id: meta
        uses: docker/metadata-action@v3
        with:
          flavor: |
            latest=true
          images: <ACR-NAME>.azurecr.io/${{ github.repository }}
          tags: |
            type=ref,event=branch
            type=sha
      - name: Build and push
        id: docker-build
        uses: docker/build-push-action@v2
        with:
          file: Dockerfile.prod
          push: true
          tags: ${{ steps.meta.outputs.tags }}  
```