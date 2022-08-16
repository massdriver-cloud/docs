# Creating an Azure Container Registry

## Using Azure CLI (Bash)

Run this script in the Azure CLI using Bash. Replace the values in the script with your own.

``` Bash
ACR_NAME=<name of container registry> # Alpha-numeric characters only, between 5 and 50 characters
LOCATION=<location> # Examples: eastus, westus2, northcentralus

az group create --name $ACR_NAME --location $LOCATION
az acr create --resource-group $ACR_NAME --name $ACR_NAME --sku Standard
ACR_REGISTRY_ID=$(az acr show --name $ACR_NAME --query "id" --output tsv)

PASSWORD=$(az ad sp create-for-rbac --name $ACR_NAME --scopes $ACR_REGISTRY_ID --role acrpush --query "password" --output tsv)
USER_NAME=$(az ad sp list --display-name $ACR_NAME --query "[].appId" --output tsv)
LOGIN_SERVER=$(az acr show --name $ACR_NAME --query "loginServer" --output tsv)

echo "ACR_LOGIN_SERVER: $LOGIN_SERVER"
echo "AZURE_CLIENT_ID: $USER_NAME"
echo "AZURE_CLIENT_SECRET: $PASSWORD"
```
Copy the `ACR_LOGIN_SERVER`, `AZURE_CLIENT_ID` and `AZURE_CLIENT_SECRET` to use in a later step.

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
4. In the **Overview** tab of the container registry, copy and save the `Login server` value for later use
![Example 1](/static/img/acr-example-1.png)

### Create the Azure service principal

1. In your Azure account, search for and click on **Subscriptions**
2. Copy the **Subscription ID** and save for later use
3. Search for and click on **Azure Active Directory**
4. Select **App registrations** tab
5. Select **New registration**
6. Name your application and click **Register**
7. Select **Certificates & secrets** tab
8. Click **New client secret**
9. Name your client secret and click **Add**
10. Copy the `Value` of the secret and save for later use (this will be the only time the secret will be displayed)
11. Select **Overview** tab to copy and save the `Application (client) ID` for later use
![Example 3](/static/img/acr-example-3.png)

### Create role assignment for service principal

1. Search for and open the **resource group** of your Azure Container Registry
2. Select **Access control (IAM)**
3. Click **+ Add** and **Add role assignment**
4. Select **Contributor** and click **Next**
5. Click **Select members** and search for the **service principal** you created earlier, select it and click **Select**
6. Click **Review + assign**
![Example 2](/static/img/acr-example-2.png)

# Pushing container registry to GitHub actions

## Create GitHub secrets

1. Open your GitHub repository and click **Settings**
2. Click **Secrets** and then **New Secret**
3. Create 3 secrets for the following using values saved from previous steps:
  - Secret 1
    - Name: `ACR_LOGIN_SERVER`
    - Value: Paste login server value here
  - Secret 2
    - Name: `AZURE_CLIENT_ID`
    - Value: Paste Azure client ID here
  - Secret 3
    - Name: `AZURE_CLIENT_SECRET`
    - Value: Paste Azure client secret value here

## Create Docker file

### Linux

Save file in `.github/workflows/docker-push.yaml`

``` YAML
name: Push Docker Image to Azure Container Registry
on: [push]
permissions:
  id-token: write
  contents: read

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Login to the Container Registry
      uses: azure/docker-login@v1
      with:
        login-server: ${{ secrets.ACR_LOGIN_SERVER }}
        username: ${{ secrets.AZURE_CLIENT_ID }}
        password: ${{ secrets.AZURE_CLIENT_SECRET }}
    - name: Docker meta
      id: meta
      uses: docker/metadata-action@v3
      with:
        flavor: |
          latest=true
        images: ${{ secrets.ACR_LOGIN_SERVER }}/${{ github.repository }}
        tags: |
          type=ref,event=branch
          type=sha
    - name: Build and push
      id: docker-build
      uses: docker/build-push-action@v2
      with:
        file: Dockerfile
        push: true
        tags: ${{ steps.meta.outputs.tags }}
```