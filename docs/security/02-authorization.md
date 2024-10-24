# Authorization

This documentation provides an overview of the roles within Massdriver and the corresponding permissions for each role regarding GraphQL operations.

## Roles

### Organization Viewer
All organization members are granted the "organization viewer" role, allowing them to:

- acceptGroupInvitation
- applicationBundleTemplates
- artifactDefinition
- artifactDefinitions
- artifact
- artifacts
- cloudDnsZones
- cloud
- compareEnvironments
- containerRepositories
- containerRepository
- createApplicationBundle
- defaultableEnvironmentConnectionGroups
- dnsZones
- environment
- filterArtifactsByType
- getPackageByNamingConvention
- group
- groups
- importableResources
- instanceTypes
- manifest
- metricTimeSeries
- organization
- package
- project
- projects

### Organization Admin
In addition to the [organization viewer](#organization-viewer) permissions, "organization admin" can perform:

- addServiceAccountToGroup
- artifactDefinition
- auditLogs
- billingSubscription
- bundle
- connectDnsZone
- createArtifact
- createDnsZone
- createEnvironmentConnection
- createGroupInvitation
- createGroup
- createManifest
- createSubscriptionManagementSession
- deactivateServiceAccount
- deleteArtifact
- deleteBundle
- deleteGroupInvitation
- deleteGroupMembership
- deleteGroup
- deleteOrganizationMember
- deleteServiceAccount
- disconnectDnsZone
- grantGroupAccess
- publishArtifactDefinition
- publishBundle
- reactivateServiceAccount
- removeServiceAccountFromGroup
- serviceAccounts
- updateGroup

### Project Viewer
"Project viewer" roles allow views on specific project-related GraphQL operations:

- compareDeployments
- deployPreviewEnvironment
- deployment
- deployments
- environment
- getPackageByNamingConvention
- grantGroupAccess
- importResources
- importableResources
- instanceTypes
- manifest
- metricTimeSeries
- package
- watchMetric

### Project Admin
In addition to the [project viewer](#project-viewer) permissions, a "project admin" can:

- assignRemoteReference
- configurePackage
- createEnvironmentConnection
- createEnvironment
- createImportableManifest
- createManifest
- createProject
- createServiceAccount
- createWatchedMetricPackageAlarm
- decommissionPackage
- decommissionPreviewEnvironment
- deleteEnvironmentConnection
- deleteEnvironment
- deleteManifest
- deleteProject
- deleteWatchedMetricPackageAlarm
- deployPackage
- disconnectImportedResources
- downloadArtifact
- linkManifests
- setDefaultSecretForPreviewEnvironments
- setManifestPosition
- setPackageSecret
- unsetDefaultSecretForPreviewEnvironments
- unsetPackageSecret
- unlinkManifests
- unsetRemoteReference
- unwatchMetric
- updateArtifact
- updateEnvironment
- updateManifest
- updateProject
- watchMetricAndCreatePackageAlarm
- createWatchedMetricPackageAlarm

## Authorization Rule Details

All resources in Massdriver roll up to either an organizational or project boundary. Specific permissions on GraphQL operations are contingent on the boundary and role of the user in relation to that boundary.
