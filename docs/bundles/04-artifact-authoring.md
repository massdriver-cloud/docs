# Identifying artifact definitions

## Do

- Set `$md.name` to be the &#39;short name&#39; (aws-iam-role, gcp-gcs-bucket). This must be unique within your organization and will be prefixed with your organizations slug on publish. Re-using a name will overwrite the previous artifact definition.

## Do Not

- Set the `$id` this is managed by the Massdriver package management system.

## Example

```javascript
{
  "$md": {
    "name": "gcp-gcs-bucket",
    "access": "public"
  },
  ...
}
```

# Use Full Cloud Resource Identifier

## Do

In the artifact have a field that has the (cloud provider specific) fully qualified resource identifier for each resource.

- Google Cloud GRN: includes project / region information
- Azure ARI: includes subscription / resource group information 
- AWS ARN: includes region, account, resource type information

## Do Not

- Use the just the lowest level id / name in the artifact (e.g. an Azure Storage container id without the rest of the ARI including information about higher level entities related to this resource in the resource hierarchy: storage account,  resource group, and region.
- Have separate fields for things that are encoded into the fully qualified resource identifier. For example GCP project / region are in the GRN so they do not need separate fields. Downstream consumers of this artifact can parse this information from the resource identifier. 

## Example

Here is a great example of best practice for parsing the vnet name and resource group from an azure virtual network&#39;s ARN.

```
locals {
  vnet_name           = element(split("/", var.vnet.data.infrastructure.id), length(split("/", var.vnet.data.infrastructure.id)) - 1)
  vnet_resource_group = element(split("/", var.vnet.data.infrastructure.id), index(split("/", var.vnet.data.infrastructure.id), "resourceGroups") + 1)
}
```

# Provide IAM Roles (not service accounts) in the Security Block 

It is best for a bundle to expose relevant role / scopes that downstream consumers can apply to identities that they create for themselves (e.g. an App can create a Service Account and apply a role assignment to this role to gain the access necessary to the resources created by this bundle).

## Do

- use existing roles / scopes from your cloud provider where possible.
- create custom roles only when necessary.

## Do Not

- create service accounts inside resource bundles and expose these in the artifact.

## Example

Note that we have purposeful names for top level keys and expose the relevant role and scope in the convention of the relevant cloud provider (in this case Google Cloud).

```
iam = {
  read = {
    role      = "roles/storage.objectViewer"
    condition = "resource.name.startsWith(\"projects/_/buckets/${google_storage_bucket.main.name}\")"
  }
  "read/write" = {
     role      = "roles/storage.objectCreator"
     condition = "resource.name.startsWith(\"projects/_/buckets/${google_storage_bucket.main.name}\")"
  }
  admin = {
    role      = "roles/storage.objectAdmin"
    condition = "resource.name.startsWith(\"projects/_/buckets/${google_storage_bucket.main.name}\")"
  }
}
```

# Every Bundle Needs a Spec

Specs provide high level configuration of the bundle like what cloud region they are to be deployed into, relevant software / framework versions (e.g kubernetes, spark version). These values will be used for searching resources with common spec values (e.g. all resoursces in a particular region).

## Do 

- include a spec for every bundle with relevant cloud version
- include information about software framework versions
- include information about OS versions / CPU Architectures if relevant

## Do Not

- TODO



# IAM Security Blocks Naming Convention

IAM security blocks follow a pattern properties structure where we give a descriptive name to each IAM role / scope. The style for naming these is `[<resource>-]permission[/<other-permission>]`.

- The `[<resource>-]`prefix is optional and only necessary in cases where you need to disambiguate IAM access to several resources that a bundle provisions (e.g. Azure Databricks Workspace provisions several storage containers which each need separate roles / access patterns.
- The `[/<other-permission>]`is to clearly capture the difference between permission sets like  `read` and `read/write` where necessary.

### Examples

```
read (bundle provisions single resource this block will capture role / scope necessary to read data from this resource)
read/write (bundle provisions single resource this block will capture role / scope necessary to read and write data to this resource)
foo-read/write (bundle provisions mutiple resources this block will capture role / scope to read and write data to the foo resource)
```

