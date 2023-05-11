---
id: applications-container-repositories-masscli
slug: /applications/container-repositories/masscli
title: Application Container Images
sidebar_label: Application Container Images
---

# Pushing Images With The Massdriver CLI

This method is the easiest way to push container repositories on any Massdriver supported cloud. It requires the latest release of the Massdriver CLI which can be downloaded [here](https://github.com/massdriver-cloud/mass/releases). Massdriver makes pushing images in any cloud easier by providing a cloud agnostic utility in the [Massdriver CLI](https://github.com/massdriver-cloud/mass). The `mass image push` command will create a registry in the provided region if one does not exist, build your docker image and push to the named repository.

## Example

```bash
    mass image push {{namespace}}/{{image_name}} --region {{desired_region}} --artifact {{your_artifact_id}} --image-tag v6
```

In the above example massdriver would create a registry with the namespace provided, and push your built container as the image name in that registry. The artifact ID is a unique idenifier for a credential artifact in Massdriver that is authorized to access the cloud account you are pushing the image to. The tag is the image tag which can be used to signal container orchestration systems which version of the image to pull.

| Long          | Short  | Default     | Description                                                  |
| -----         | ------ | -------     | -----------                                                  |
| build-context | b      | .           | The root directory docker should use as the build context.   |
| dockerfile    | f      | Dockerfile  | Indicates a nonstandard dockerfile name like Dockerfile.dev. |
| image-tag     | t      | latest      | Version of the docker image.                                 |
| artifact      | a      | N/A         | Massdriver artifact ID.                                      |
| region        | r      | N/A         | Cloud provider region to push to.                            |
| platform      | p      | linux/amd64 | Platform architecture to build the container for.            |
