# Authorization

This guide explains what actions each role can perform in Massdriver. Permissions are organized by role, with each role having specific capabilities within the platform.

## Role Hierarchy

```
Organization Owner (account owner)
  └─ Full access to everything in the organization
  
Organization Admin/Manager
  └─ Can manage organization settings and all resources
  └─ Automatically has admin access to all projects
  
Organization Viewer
  └─ Can view organization resources
  └─ Can only access projects where explicitly granted via groups
  
Project Admin/Manager
  └─ Can manage specific projects and their resources
  └─ Granted explicitly via group access
  
Project Viewer
  └─ Can view specific projects and their resources
  └─ Granted explicitly via group access
```

## Organization Owner

The account that owns the organization has **full, unrestricted access** to all resources and operations within that organization, regardless of other role assignments.

## Organization Admin

Organization Admins can **manage** the organization and have elevated access to all projects automatically.

### Organization Management
- **Integrations**
  - View, enable, and disable integrations
  - Manage AWS Cost and Usage Reports
  
- **Team & Access**
  - Create, update, and delete groups
  - Create and send group invitations
  - Delete group invitations
  - Add and remove service accounts from groups
  - Delete organization members
  - Create, deactivate, reactivate, and delete service accounts
  
- **Bundles & Catalog**
  - Add bundles to catalog
  - Manage bundle source code (for private bundles)
  - Delete bundles
  
- **Artifact Definitions**
  - Publish artifact definitions
  - Delete artifact definitions
  
- **Projects**
  - View all projects in the organization (automatic)
  - Create new projects
  - Full admin access to all projects (see Project Admin section)
  
- **Artifacts & Credentials**
  - Create artifacts (when not using a deployment context)
  - Delete artifacts (imported)
  - Update artifacts (imported)
  - Assign cloud cost credentials
  - Dismiss cloud cost credentials
  - Download artifacts
  - View and manage container repositories
  
- **Audit & Compliance**
  - View audit log
  - View audit logs

## Organization Viewer

Organization Viewers can **view** organization resources but have limited management capabilities. They can only access projects where they've been explicitly granted access via groups.

### What Organization Viewers Can Do

- **View Organization Resources**
  - View organization details
  - View groups
  - View service accounts
  - View and filter artifacts
  - View artifact definitions
  - View defaultable environment connection groups
  - View repos (OCI repositories)

- **Bundles & Manifests**
  - View bundles
  - Create manifests from bundles
  
- **Artifacts**
  - View artifacts
  - Assign remote references (connect artifacts to packages)
  - Disconnect imported resources from artifacts
  - View importable resources from artifacts
  - Import resources from artifacts
  
- **Service Account Management (Limited)**
  - View service accounts
  - Add service accounts to groups (view permission)
  - Remove service accounts from groups (view permission)

## Project Admin

Project Admins can **manage** specific projects and all resources within those projects. There are two ways to become a Project Admin:

1. **Automatic**: Organization Admins automatically have admin access to all projects
2. **Explicit**: Users granted admin access via group permissions

### What Project Admins Can Do

- **Project Management**
  - View project details
  - Update project settings
  - Delete project
  
- **Environments**
  - Create environments
  - Update environments
  - Delete environments
  - Deploy environments
  - Decommission environments
  - Compare environments
  - Deploy preview environments
  - Decommission preview environments
  
- **Environment Connections**
  - Create environment connections
  - Delete environment connections
  
- **Packages (Infrastructure Resources)**
  - View packages
  - Get packages by naming convention
  - Configure packages
  - Set package version
  - Reset package
  - Plan package changes
  - Deploy packages
  - Decommission packages
  - View deployments
  - Compare deployments
  - Set package secrets
  - Unset package secrets
  - View metrics and time series data
  
- **Manifests (Canvas Components)**
  - View manifests
  - Create manifests
  - Update manifests
  - Delete manifests
  - Link manifests
  - Unlink manifests
  - Set manifest position
  - Recommend manifest dependencies
  
- **Resource Management**
  - Import resources
  - Disconnect imported resources
  - Assign remote references
  - Unset remote references
  
- **Project Groups & Access**
  - Grant group access to project
  - Revoke group access from project
  
- **Observability**
  - View nodes (canvas view)
  - View node contexts
  - View links (connections between manifests)
  - View link contexts

### Service Accounts
Service accounts with project admin access can additionally:
- Manage state (read and write Terraform state)
- Create, update, and delete package alarms

## Project Viewer

Project Viewers can **view** project resources but cannot make changes. Users become Project Viewers through explicit group access grants.

### What Project Viewers Can Do

- **Project Viewing**
  - View project details
  - View organization details (of the project's org)
  
- **Environments**
  - View environment details
  - Compare environments
  - View link contexts
  - View node contexts
  
- **Packages**
  - View packages
  - Get packages by naming convention
  - View deployments
  - View deployment logs (streams)
  - View metrics and time series data
  
- **Manifests**
  - View manifests
  
- **Canvas & Visualization**
  - View nodes
  - View node contexts
  - View links
  - View link contexts
  - Receive real-time updates (subscriptions):
    - Node created, updated, deleted
    - Link created, updated, deleted
    - Link context created, updated, deleted
    - Node context created, deleted

## Special Contexts

### Deployment Context
When operations are performed by a deployment (infrastructure provisioning), special permissions apply:

- **Deployments can**:
  - View bundle source code for bundles in their organization
  - Create artifacts in their organization
  - Delete artifacts they created
  - Update artifacts in their organization
  - Manage state for their own package
  - Read state from other packages in the same environment
  - Create, update, delete, and view alarms for their own package
  - Update their own deployment status

### Service Account Context
Service accounts with appropriate project access can:
- Read and manage state for any package in projects they can manage
- Create, update, delete, and view package alarms in projects they can manage

## Key Permission Concepts

### Permission Boundaries
Permissions are checked at the boundary level:
- **Organization boundary**: Permissions apply to org-level resources
- **Project boundary**: Permissions apply to project-level resources and below
- **Account boundary**: Applies to personal resources like group invitations

### Manage vs. View
- **Manage** (`manage`): Full control including create, update, delete operations
- **View** (`view`): Read-only access to resources and their details

## Common Scenarios

### "I can't see a project"
- If you're an **Organization Viewer**: You need to be added to a group that has access to the project
- If you're an **Organization Admin**: You should be able to see all projects automatically

### "I can't deploy infrastructure"
- You need **Project Admin** permissions to deploy packages
- Organization Viewers cannot deploy even if they can view the project

### "I can't create a project"
- You need **Organization Admin** permissions to create projects
- Organization Viewers cannot create projects

### "I can't see audit logs"
- Only **Organization Admins** can view audit logs
- This is a compliance and security feature

### "A deployment failed with unauthorized"
- Check that the service account used has appropriate project access
- Ensure the deployment context matches the resource being accessed
- Deployments can only manage their own package's state
