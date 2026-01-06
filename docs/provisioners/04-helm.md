---
id: provisioners-helm
slug: /provisioners/helm
title: Helm Provisioner
sidebar_label: Helm
---

# Helm Provisioner

[Massdriver](https://www.massdriver.cloud/) provisioner for managing resources with [Helm](https://helm.sh/). You can view the GitHub repository for this provisioner [here](https://github.com/massdriver-cloud/provisioner-helm).

## Structure

This provisioner expects the `path` to be the base directory of a helm chart if using a local chart. This means it should contain the `Chart.yaml` and `values.yaml` files at a minimium. If using a remote chart, the `path` should still include any relevant files for manipulating inputs or creating artifacts.

## Tooling

The following tools are included in this provisioner:

* [Checkov](https://www.checkov.io/): Included to scan helm charts for common policy and compliance violations.

## Configuration

The following configuration options are available:

| Configuration Option | Type | Default | Description |
|-|-|-|-|
| `kubernetes_cluster` | object | `.connections.kubernetes_cluster` | `jq` path to a `massdriver/kubernetes-cluster` connection for authentication to Kubernetes |
| `namespace` | string | `"default"` | Kubernetes namespace to install the chart into. Defaults to the `default` namespace |
| `release_name` | string | (package name) | Specifies the release name for the helm chart. Defaults to the Massdriver package name if not specified. |
| `.chart.repo` | string | `null` | Specifies the URL of the chart repo (required if using [remote chart](#local-vs-remote-chart)) |
| `.chart.name` | string | `null` | Specifies the name of the chart from the repo to use (required if using [remote chart](#local-vs-remote-chart)) |
| `.chart.version` | string | `null` | Specifies the chart version to use (required if using [remote chart](#local-vs-remote-chart)) |
| `debug` | boolean | `true` | Enables the `--debug` flag for Helm (verbose output) |
| `wait` | boolean | `true` | Enables the `--wait` flag for Helm (waits for pods, PVCs, services, etc. to be ready before marking the release as successful)  |
| `wait_for_jobs` | string | `true` | Enables the `--wait-for-jobs` flag for Helm (waits for jobs to complete before marking the release as successful) |
| `timeout` | integer | 300 | Sets the `--timeout` flag for Helm (how long to wait for release to complete before marking as failed) |
| `checkov.enable` | boolean | `true` | Enables Checkov policy evaluation. If `false`, Checkov will not be run. |
| `checkov.quiet` | boolean | `true` | Only display failed checks if `true` (adds the `--quiet` flag). |
| `checkov.halt_on_failure` | boolean | `false` | Halt provisioning run and mark deployment as failed on a policy failure (removes the `--soft-fail` flag). |

### Local vs Remote Chart

This provisioner supports both local and remote charts. By default the provisioner will assume a local chart exists in directory specified by the `path` field of the bundle step. However if `.chart.repo`, `.chart.name` and `.chart.version` are specified then the provisioner will attempt to use the specified remote chart. All 3 fields must be set, or none of them set. Regarding inputs and artifacts, provisioner behavior is the same for both remote and local charts. If a `values.yaml` file exists in the `path` directory, then it will be used to override the specified default values in the remote chart (as Helm typically does with the `-f/--values` flag).

#### Local Chart Example

```yaml
steps:
- path: chart         # local chart must exist in this directory
  provisioner: helm
  config:
    namespace: ".params.namespace"
```

#### Remote Chart Example

```yaml
steps:
- path: chart
  provisioner: helm
  config:
    chart:
      repo: '@text "https://my.helm.net"' # Note: jq query notation must be used to specify a static string
      name: '@text "mychart"'             # Note: jq query notation must be used to specify a static string
      version: '@text "1.2.3"'            # Note: jq query notation must be used to specify a static string
    namespace: ".params.namespace"
```

## Inputs

Helm accepts inputs via YAML formatted files, the primary one being [values.yaml](https://helm.sh/docs/chart_template_guide/values_files/), though additional files can be specified. To adhere to this standard, this provisioner will convert the `params.json`, `connections.json`, `envs.json` and `secrets.json` files into YAML format before passing them to Helm.

If modifications to params, connections, envs or secrets are required to fit the predefined values of a helm chart, this provisioner supports JQ templates for restructuring the original JSON files before they are converted to YAML. These JQ template files should exist in the base directory of the helm chart and be named `params.jq`, `connections.jq`, `envs.jq` and `secrets.jq`. The format of these files should be a JQ template which accepts the `params.json`, `connections.json`, `envs.json` and `secrets.json` files as inputs and restructures them according to the JQ template. These files aren't required by the provisioner so if any of them is missing the corresponding JSON file will be left unmodified before being converted to YAML, with the exception of `envs.json` and `secrets.json` which will be nested under a top level `envs` key and `secrets` key, respectively.

To demonstrate, let's say there is a Helm bundle with some configuration values and a dependency on a Postgres database. The `values.yaml` file would be something like this:

```yaml values.yaml
commonLabels: {}

foo:
    bar: "baz"
    count: 4

postgres:
    hostname: ""
    port: 5432
    user: "root"
    password: ""
    version: "12.1"

deployment:
    envs: {}
```

To properly set these values in a Massdriver bundle, we likely would want the `commonLabels` value to come from [`md_metadata.default_tags`](https://docs.massdriver.cloud/bundles/development#massdriver-metadata), the `foo` value to come from params, and the `postgres` block to come from a connection. That means this bundle would require a `massdriver/postgres-authentication` connection named `database`. Since this is a Helm chart, it will also need a `massdriver/kubernetes-cluster` connection to provide authentication to the kubernetes cluster the chart is being installed into. The `massdriver.yaml` file would look something like:

```yaml massdriver.yaml
app:
  envs:
    LOG_LEVEL: '@text "debug"'

params:
  required:
    - foo
  properties:
    foo:
      required:
        - bar
        - count
      properties:
        bar:
          type: string
        count:
          type: integer

connections:
  required:
    - kubernetes_cluster
    - database
  properties:
    kubernetes_cluster:
      $ref: massdriver/kubernetes-cluster
    database:
      $ref: massdriver/postgresql-authentication
```
### params.jq

Let's start with the `params.json`, which will look like:

```json params.json
{
    "foo": {
        "bar": "bizzle",
        "count": 10
    },
    "md_metadata": {
        "default_tags": {
            "managed-by": "massdriver",
            "md-manifest": "somebundle",
            "md-package": "proj-env-somebundle-0000",
            "md-project": "proj",
            "md-target": "env"
        },
        "name_prefix": "proj-env-somebundle-0000"
        ...
    }
}
```

The `foo` object can be passed directly to helm chart since it already matches the structure in `values.yaml`. However, we want set `commonLabels` to `md_metadata.default_tags`, and we'd also like to remove the rest of `md_metadata` from the params since it isn't expected by the helm chart and could cause issues in the unlikely event there is a naming collision with an existing value named `md_metadata`. This means the `params.jq` file should contain:

```jq params.jq
. += {"commonLabels": .md_metadata.default_tags} | del(.md_metadata)
```

This JQ command takes all of the original JSON and adds the field `commonLabels` which is set to `.md_metadata.default_tags`. It then deletes the entire `.md_metadata` block from the params. The resulting `params.yaml` after this JQ restructuring and conversion to YAML would be:

```yaml params.yaml
commonLabels:
    managed-by: "massdriver",
    md-manifest: "somebundle",
    md-package: "proj-env-somebundle-0000",
    md-project: "proj",
    md-target: "env"
foo:
    bar: "bizzle"
    count: 10
```

This fits what the helm chart expects. Now let's focus on connections.

### connections.jq

With the `database` and `kubernetes_cluster` connection, the `connections.json` file would be roughly equivalent to:

```json connections.json
{
    "kubernetes_cluster": {
        "data": {
            "authentication": {
                "cluster": {
                    "certificate-authority-data": "...",
                    "server": "https://my.kubernetes.cluster.com"
                },
                "user": {
                    "token": "..."
                }
            }
        },
        "specs": {
            "kubernetes": {
                "version": "1.27"
            }
        }
    },
    "database": {
        "data": {
            "authentication": {
                "hostname": "the.postgres.database",
                "password": "s3cr3tV@lue",
                "port": 5432,
                "username": "admin"
            }
        },
        "specs": {
            "rdbms": {
                "version": "14.6"
            }
        }
    }
}
```

While this `connections.json` file contains all the necessary data for the postgres configuration, it isn't formatted properly and there is significantly more data than needed by the chart. The entire `kubernetes_cluster` block isn't used by the Helm chart at all (it is only needed to provide the provisioner with authentication information to the Kubernetes cluster). Let's create a `connections.jq` file to remove the `kubernetes_cluster` connection, and restructure the `database` connection so that it fits the helm chart's expected `postgres` block.

```jq connections.jq
{
    "postgres": {
        "hostname": .database.data.authentication.hostname,
        "port": .database.data.authentication.port,
        "user": .database.data.authentication.username,
        "password": .database.data.authentication.password,
        "version": .database.specs.version
    }
}
```

This will restructure the data so that the `connections.yaml` file passed to helm will be:

```yaml connections.yaml
postgres:
    hostname: "the.postgres.database"
    port: 5432
    user: "admin"
    password: "s3cr3tV@lue"
    version: "14.6"
```

This converts the data in `connections.json` to match the expected fields in `values.yaml`.

### envs.jq

The last file to address is the environment variables. The `envs.json` file will look like:

```json envs.json
{
    "LOG_LEVEL": "debug"
}
```

There are two problems here. First, by default this provisioner will place the envs under a top level `envs` block, while the helm chart is expecting them under `deployment.envs`. Second, most Helm charts expect the environment variables to be an array of objects with `name` and `values` keys, as opposed to a map. So, let's convert our `envs.json` into an array of objects, and move it under a `deployment.envs` path.

```jq connections.jq
{
    deployment: {
        envs: [to_entries[] | {name: .key, value: .value}]
    }
}
```

This will restructure the data so that the `envs.yaml` file passed to helm will be:

```yaml connections.yaml
deployment:
  envs:
    - name: "LOG_LEVEL"
      value: "debug"
```

This converts the data in `envs.json` to match the expected field in `values.yaml`.

## Artifacts

After every provision, this provider will scan the template directory for files matching the pattern `artifact_<name>.jq`. If a file matching this pattern is present, it will be used as a JQ template to render and publish a Massdriver artifact. The inputs to the JQ template will be a JSON object with the params, connections, envs, secrets and [helm manifests](https://helm.sh/docs/helm/helm_get_manifest/) as top level fields. Note that the `params`, `connections`, `envs` and `secrets` will contain the original content of `params.json`, `connections.json`, `envs.json` and `secrets.json` without any modifications that may have been applied through `params.jq`, `connections.jq`, `envs.jq` and `secrets.jq`. The `outputs` field will contain the result of `helm get manifest` for the chart after it is installed. Since the output of `helm get manifest` is list of yaml files, the `outputs` block will be a JSON array with each element being a JSON object of an individual kubernetes resource manifest.

```json
{
    "params": {
        ...
    },
    "connections": {
        ...
    },
    "envs": {
        ...
    },
    "secrets": {
        ...
    },
    "outputs": [
        ...
    ]
}
```

To demonstrate, let's say there is a Helm bundle with a single param (`namespace`), a single connection (`kubernetes_cluster`), and a single artifact (`api_endpoint`). The `massdriver.yaml` would be similar to:


```yaml massdriver.yaml
params:
  required:
    - namespace
  properties:
    namespace:
      type: string

connections:
  required:
    - kubernetes_cluster
  properties:
    kubernetes_cluster:
      $ref: massdriver/kubernetes-cluster

artifacts:
  required:
    - api_endpoint
  properties:
    api_endpoint:
      $ref: massdriver/api
```

Since the artifact is named `api_endpoint` a file named `artifact_api_endpoint.jq` would need to be in the template directory and the provisioner would use this file as a JQ template, passing the params, connections and outputs to it. For this example, let's say the helm chart will produce two manifests: a `deployment`, and a `service`. The output of `helm get manifest` would be something like:

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: helm-prov-example-0000
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 80
      protocol: TCP
      name: http
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: helm-prov-example-0000
spec:
  template:
    spec:
      containers:
        - name: nginx
          image: "nginx:latest"
          imagePullPolicy: Always
```

In this case, the input to the `artifact_api_endpoint.jq` template file would be:

```json
{
    "params": {
        "namespace": "foo"
    },
    "connections": {
        "kubernetes_cluster": {
            "data": {
                "authentication": {
                    "cluster": {
                        "certificate-authority-data": "...",
                        "server": "https://my.kubernetes.cluster.com"
                    },
                    "user": {
                        "token": "..."
                    }
                }
            },
            "specs": {
                "kubernetes": {
                    "version": "1.27"
                }
            }
        }
    },
    "envs": {
        "LOG_LEVEL": "debug"
    },
    "secrets": {},
    "outputs": [
        {
            "apiVersion": "v1",
            "kind": "Service",
            "metadata": {
                "name": "helm-prov-example-0000"
            },
            "spec": {
                "type": "ClusterIP",
                "ports": [{
                    "port": 80,
                    "targetPort": 80,
                    "protocol": "TCP",
                    "name": "http"
                }]
            }
        },
        {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {
                "name": "helm-prov-example-0000"
            },
            "spec": {
                "template": {
                "spec": {
                    "containers": [
                    {
                        "name": "nginx",
                        "image": "nginx:latest",
                        "imagePullPolicy": "Always"
                    }
                    ]
                }
                }
            }
        }
    ]
}
```

We need to build an API artifact from these inputs. We'll use Kubernetes built in DNS pattern for services to build the API endpoint from the service name, namespace and port. Thus, the `artifact_api_endpoint.jq` file would be:

```jq
{
    "data": {
        "api": {
            "hostname": "\(.outputs[] | select(.kind == "Service" and .apiVersion == "v1") | .metadata.name).\(.params.namespace).svc.cluster.local",
            "port": (.outputs[] | select(.kind == "Service" and .apiVersion == "v1") | .spec.ports[] | select(.name == "http") | .port),
            "protocol": "http"
        }
    },
    "specs": {
        "api": {
            "version": "1.0.0"
        }
    }
}
```

In this template, we are using the [`select` function in JQ](https://jqlang.github.io/jq/manual/#select) to find the proper manifest and extract the relevant values to build a properly formatted artifact.