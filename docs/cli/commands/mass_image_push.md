---
id: mass_image_push.md
slug: /cli/commands/mass_image_push
title: Mass Image Push
sidebar_label: Mass Image Push
---
## mass image push

Push an image to ECR, ACR or GAR

### Synopsis

# Push Container Images To Cloud Repositories

Create registries, repositories and push images via the Massdriver CLI. Massdriver will build a Docker registry if it does not exist in the region in which you are pushing an image, create a repository in that region's registry and finally push a tagged version of the image to that repository. By default `mass` will attempt to build your image before pushing it. To disable this feature pass the `--skip-build` flag.

## Examples

Build and push an image:
```bash
mass image push massdriver-cloud/massdriver \
    --region us-east-1 \
    --artifact xxxx \
    --image-tag v1
```

Push an existing image and tag without building:
```bash
mass image push massdriver-cloud/massdriver \
    --region us-east-1 \
    --artifact xxxx \
    --image-tag v1 \
    --skip-build
```

In the above example massdriver would create a registry with the namespace provided, and push your built container as the image name in that registry. The artifact ID is a unique idenifier for a credential artifact in Massdriver that is authorized to access the cloud account you are pushing the image to. The tag is the image tag which can be used to signal container orchestration systems which version of the image to pull.


```
mass image push <namespace>/<image-name> [flags]
```

### Options

```
  -a, --artifact string        Massdriver ID of the artifact used to create the repository and generate repository credentials
  -b, --build-context string   Path to the directory to build the image from (default ".")
  -c, --cache-from string      Path to image used for caching
  -f, --dockerfile string      Name of the dockerfile to build from if you have named it anything other than Dockerfile (default "Dockerfile")
  -h, --help                   help for push
  -t, --image-tag strings      Unique identifier for this version of the image (default [latest])
  -p, --platform string        Set platform if server is multi-platform capable (default "linux/amd64")
  -r, --region string          Cloud region to push the image to
  -s, --skip-build             Skip building the image before pushing
```

### SEE ALSO

* [mass image](/cli/commands/mass_image)	 - Container image integration Massdriver
