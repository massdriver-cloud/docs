This guide walks through the use of [LocalStack](https://localstack.cloud/) for bundle development

## Install `localstack` and `tflocal` wrapper CLIs

```
pip3 install localstack terraform-local
```

## Start local stack (in detached mode)

This will run a local version of the entire AWS API in a local docker container.

```
localstack start -d
```

## Use `tflocal` wherever you&#39;d use `terraform` in your workflow

Behind the scenes this will point any AWS provider API calls at your locally running LocalStack without any terraform code changes.

```
tflocal init -var-file dev.params.tfvars.json -var-file dev.connections.tfvars.json
tflocal plan -var-file dev.params.tfvars.json -var-file dev.connections.tfvars.json
```

## Note on connections

In order for your connections to be set up the same way they would normally you should still download and AWS IAM artifact from massdriver and place the details in the `aws_authentication` portion of your `dev.connections.tfvars.json` file. These credentials will essentially be ignored while using local stack.

