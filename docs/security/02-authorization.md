# Authorization

This documentation provides an overview of the roles within Massdriver and the corresponding permissions for each role regarding GraphQL operations.

## Roles

### Organization Viewer

All organization members are granted the `organization viewer` role, allowing them to:

| permission | description |
| ---------- | ----------- |
| acceptGroupInvitation | can accept org group invite |
| applicationBundleTemplates | ? |
| artifactDefinition | can view artifact type |
| artifactDefinitions | ? |
| artifact | can view metadata of artifact |
| artifacts | can view list of artifacts |
| cloudDnsZones | can view [dns zones](/docs/dns/01-dns-zones.md) |
| cloud | ? |
| compareEnvironments | can [compare](/docs/concepts/05-environments.md) project environments ?(shouldn't this be in project-viewer?) |
| containerRepositories | ? we don't have this feature, remove? |
| containerRepository | ^ |
| createApplicationBundle | can create an application bundle from template |
| defaultableEnvironmentConnectionGroups | ? |
| dnsZones | ? diff than cloudDnsZones? |
| environment | ? |
| filterArtifactsByType | can filter artifacts by artifact type |
| group | can view group details |
| groups | can view list of groups |
| importableResources | ? import feature gone? |
| instanceTypes | ? |
| manifest | ? should be in project-viewer? |
| metricTimeSeries | ? |
| organization | can view organization details |
| package | ? should be in project-viewer? |
| project | can view authorized project |
| projects | can list authorized projects |
| serviceAccounts | can view list of service accounts |

### Organization Admin

In addition to the [organization viewer](#organization-viewer) permissions, `organization admin` can perform:

| permission | description |
| ---------- | ----------- |
| addServiceAccountToGroup | can add service account to a group |
| artifactDefinition | ? diff than org-viewer? |
| auditLogs | can access audit logs |
| billingSubscription | can access billing |
| bundle | ? |
| connectDnsZone | can [connect](/docs/dns/01-dns-zones.md) a cloud DNS zone |
| createArtifact | can create an artifact |
| createDnsZone | can [create](/docs/dns/01-dns-zones.md) a cloud DNS zone |
| createGroupInvitation | can [invite](/docs/concepts/10-organizations.md#invite-a-user-to-your-organization) user to organization |
| createGroup | can create a group |
| createManifest | can create a bundle manifest |
| createSubscriptionManagementSession | ? |
| deactivateServiceAccount | can deactivate a service account |
| deleteArtifact | can delete an artifact |
| deleteBundle | can delete a bundle |
| deleteGroupInvitation | can delete a invitation to the organization |
| deleteGroupMembership | can remove a user from a group |
| deleteGroup | can delete a group |
| deleteOrganizationMember | can remote a user from the organization |
| deleteServiceAccount | can delete a service account |
| disconnectDnsZone | can disconnect a cloud DNS zone from Massdriver |
| grantGroupAccess | can add user to a group |
| publishArtifactDefinition | can publish a [artifact definition](/docs/guides/custom_artifact_definition.md) |
| publishBundle | can publish a bundle |
| reactivateServiceAccount | can reactivate a service account |
| removeServiceAccountFromGroup | can remove a service account from a group |
| updateGroup | can edit group name and description |

### Project Viewer

`Project viewer` roles allow views on specific project-related GraphQL operations:

| permission | description |
| ---------- | ----------- |
| compareDeployments | can [compare](/docs/concepts/09-deployments.md#deployment-comparison) bundle deployment history |
| deployPreviewEnvironment | can deploy a preview environment using [Mass CLI](/docs/cli/commands/mass_preview_deploy.md) |
| deployment | can view [deployment](/docs/concepts/09-deployments.md) details |
| deployments | can view [deployment](/docs/concepts/09-deployments.md) history |
| environment | can view [environment](/docs/concepts/05-environments.md) |
| getPackageByNamingConvention | can view [package](/docs/concepts/07-packages.md) name |
| importResources | ? should be removed? |
| importableResources | ? should be removed? |
| instanceTypes | can view available bundle instance types |
| manifest | can view [manifest](/docs/concepts/06-manifests.md) details |
| metricTimeSeries | ? |
| package | can view [package](/docs/concepts/07-packages.md) details |
| watchMetric | can view monitoring details |

### Project Admin

In addition to the [project viewer](#project-viewer) permissions, a `project admin` can:

| permission | description |
| ---------- | ----------- |
| assignRemoteReference | can assign a [remote reference](/docs/guides/sharing_infrastructure.md) |
| configurePackage | can change [package](/docs/concepts/07-packages.md) configuration |
| createEnvironmentConnection | ? |
| createEnvironment | can create an [environment](/docs/concepts/05-environments.md) |
| createImportableManifest | ? delete? |
| createManifest | can create a [manifest](/docs/concepts/06-manifests.md) |
| createProject | can create a [project](/docs/concepts/04-projects.md) |
| createServiceAccount | can create a service account |
| createWatchedMetricPackageAlarm | can create a new watched metric package alarm |
| decommissionPackage | can decommission a [package](/docs/concepts/07-packages.md) |
| decommissionPreviewEnvironment | can [decommission](/docs/cli/commands/mass_preview_decommission.md) a preview environment ?(should be doable by project viewer if they can deploy?) |
| deleteEnvironmentConnection | ? |
| deleteEnvironment | can delete [environment](/docs/concepts/05-environments.md) |
| deleteManifest | can delete [manifest](/docs/concepts/06-manifests.md) |
| deleteProject | can delete [project](/docs/concepts/04-projects.md) |
| deleteWatchedMetricPackageAlarm | can delete watched metric package alarm |
| deployPackage | can deploy a [package](/docs/concepts/07-packages.md) |
| disconnectImportedResources | ? delete? |
| downloadArtifact | can download an [artifact](/docs/concepts/03-artifacts.md) |
| linkManifests | can create [bundle](/docs/concepts/01-bundles.md) connection |
| setDefaultSecretForPreviewEnvironments | can set default secret for preview environments |
| setManifestPosition | can set [manifest](/docs/concepts/06-manifests.md) position on the graph |
| setPackageSecret | can set a [package](/docs/concepts/07-packages.md) secret |
| unsetDefaultSecretForPreviewEnvironments | can unset default secret for preview environments |
| unsetPackageSecret | can unset a [package](/docs/concepts/07-packages.md) secret |
| unlinkManifests | can delete [bundle](/docs/concepts/01-bundles.md) connection |
| unsetRemoteReference | can unassign a [remote reference](/docs/guides/sharing_infrastructure.md) |
| unwatchMetric | can unwatch a [bundle](/docs/concepts/01-bundles.md) metric |
| updateArtifact | can update [artifact](/docs/concepts/03-artifacts.md) name/description |
| updateEnvironment | can update [environment](/docs/concepts/05-environments.md) name/description |
| updateManifest | can update [manifest](/docs/concepts/06-manifests.md) name/description |
| updateProject | can update [project](/docs/concepts/04-projects.md) name/description |
| watchMetricAndCreatePackageAlarm | can watch a [bundle](/docs/concepts/01-bundles.md) metric and create a [package](/docs/concepts/07-packages.md) alarm |
| createWatchedMetricPackageAlarm | can create a watched metric [package](/docs/concepts/07-packages.md) alarm |

## Authorization Rule Details

All resources in Massdriver roll up to either an organizational or project boundary. Specific permissions on GraphQL operations are contingent on the boundary and role of the user in relation to that boundary.
