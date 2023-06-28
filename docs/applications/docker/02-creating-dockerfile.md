---
id: applications-docker-creating-dockerfile
slug: /applications/docker/creating-dockerfile
title: Creating a Dockerfile
sidebar_label: Creating a Dockerfile
---

# Creating a Dockerfile

:::note

Before getting started, you'll need:

* [Docker Desktop](../docker/01-getting-started.md) installed
* An IDE (like VS Code)

:::

## Creating needed files

This guide will walk you through the process of creating a basic Dockerfile for your application. First, let's create 2 files in your application's directory:

* `Dockerfile`
* `.dockerignore`

The `Dockerfile` is a list of step by step instructions for the container at startup so that it can run your application. The `.dockerignore` file will allow you to set certain files or directories for your `Dockerfile` to ignore.

## Dockerfile example

Let's get started with a basic `Dockerfile`. We'll use Python.

```dockerfile
FROM python:3.8-slim-buster

WORKDIR /app

COPY requirements.txt requirements.txt

RUN pip3 install -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["python3", "-m" , "flask", "run", "--host=0.0.0.0"]
```

Now let's break down each section:

* `FROM python:3.8-slim-buster`: This line is telling the `Dockerfile` where to download a base image from. The base image also has its own set of step by step instructions, and will also download the tools and packages needed to run my Python application.
* `WORKDIR /app`: We want to set a working directory within the container for my application. This tells Docker to use `/app` within the container as the default path for all subsequent commands.
* `COPY requirements.txt requirements.txt`: We're telling the container to `COPY` the `requirements.txt` file and then I tell Docker where to put it. In this case, we are copying the file to `/app/requirements.txt`.
* `RUN pip3 install -r requirements.txt`: Now we're instructing the container to `RUN` the command `pip3 install` for all of my Python app dependencies listed in my `requirements.txt` file.
* `COPY . .`: Now that we have the Python base image installed, and all of my Python app dependencies, we now want to copy the source code into the image. We're saying `COPY` all files here `.` to my `WORKDIR` of `/app` (excluding any files/directories listed in my `.dockerignore`).
* `EXPOSE 8080`: This command exposes the internal container port of `8080` so that the runtime running the container can access the image.
* `CMD ["python3", "-m" , "flask", "run", "--host=0.0.0.0"]`: Finally, we're telling Docker to run a specific command using `CMD`. We're also making the application visible outside of the container using `--host=0.0.0.0`.

Your directory structure should now look similar to this:

```bash
python-app
|____ app.py
|____ requirements.txt
|____ Dockerfile
|____ .dockerignore
```

These are the basic components of a `Dockerfile`. For a more specific template for your desired language, check out [templates](./03-templates.md)
