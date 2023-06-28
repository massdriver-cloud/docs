---
id: applications-docker-templates
slug: /applications/docker/templates
title: Templates
sidebar_label: Templates
---

# Python

## Dockerfile

```dockerfile
# Download base image
FROM python:3.8-slim-buster

# Set destination for COPY
WORKDIR /app

# Copy and install dependencies
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

# Copy the source code
COPY . .

# Optional:
# To bind to a TCP port, runtime parameters must be supplied to the docker command.
# But we can document in the Dockerfile what ports
# the application is going to listen on by default.
# https://docs.docker.com/engine/reference/builder/#expose
EXPOSE 8080

# Run the application in the container
CMD ["python3", "-m" , "flask", "run", "--host=0.0.0.0"]
```

## .dockerignore

```bash
__pycache__
*.pyc
*.pyo
*.pyd
.Python
env
pip-log.txt
pip-delete-this-directory.txt
.tox
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.log
.git
.mypy_cache
.pytest_cache
.hypothesis
/venv
```

[Source](https://docs.docker.com/language/python/build-images/)

# Node.js

## Dockerfile

```dockerfile
# Download base image
FROM node:18-alpine

# Set node environment
ENV NODE_ENV=production

# Set destination for COPY
WORKDIR /app

# Copy dependencies
COPY ["package.json", "package-lock.json*", "./"]

# Install dependencies
RUN npm install --production

# Copy the source code
COPY . .

# Optional:
# To bind to a TCP port, runtime parameters must be supplied to the docker command.
# But we can document in the Dockerfile what ports
# the application is going to listen on by default.
# https://docs.docker.com/engine/reference/builder/#expose
EXPOSE 8080

# Run the application in the container
CMD ["node", "server.js"]
```

## .dockerignore

```bash
node_modules
npm-debug.log
```

[Source](https://docs.docker.com/language/nodejs/build-images/)

# Java

## Dockerfile

```dockerfile
# Download base image
FROM eclipse-temurin:17-jdk-jammy

# Set destination for COPY
WORKDIR /app

# Copy and install dependencies
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:resolve

# Copy the source code
COPY src ./src

# Optional:
# To bind to a TCP port, runtime parameters must be supplied to the docker command.
# But we can document in the Dockerfile what ports
# the application is going to listen on by default.
# https://docs.docker.com/engine/reference/builder/#expose
EXPOSE 8080

# Run the application in the container
CMD ["./mvnw", "spring-boot:run"]
```

## .dockerignore

```bash
.git/
target/
```

[Source](https://docs.docker.com/language/java/build-images/)

# Go

## Dockerfile

```dockerfile
# Download base image
FROM golang:1.19

# Set destination for COPY
WORKDIR /app

# Download Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code. Note the slash at the end, as explained in
# https://docs.docker.com/engine/reference/builder/#copy
COPY *.go ./

# Compile the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /docker-gs-ping

# Optional:
# To bind to a TCP port, runtime parameters must be supplied to the docker command.
# But we can document in the Dockerfile what ports
# the application is going to listen on by default.
# https://docs.docker.com/engine/reference/builder/#expose
EXPOSE 8080

# Run the application in the container
CMD ["/docker-gs-ping"]
```

## .dockerignore

```bash
# The .dockerignore file excludes files from the container build process.
#
# https://docs.docker.com/engine/reference/builder/#dockerignore-file

# Exclude locally vendored dependencies.
vendor/

# Exclude "build-time" ignore files.
.dockerignore
.gcloudignore

# Exclude git history and configuration.
.gitignore
```

[Source](https://docs.docker.com/language/golang/build-images/)

# C# (.NET)

## Dockerfile

```dockerfile
# Download base image using multi-stage build and define a stage for building the app
FROM mcr.microsoft.com/dotnet/sdk:6.0 as build-env

# Set destination for COPY
WORKDIR /src

# Although not necessary, this command copies only csproj files then runs dotnet restore
COPY src/*.csproj .
RUN dotnet restore

# Copy source files and publish
COPY src .
RUN dotnet publish -c Release -o /publish

# Download runtime image to run the app
FROM mcr.microsoft.com/dotnet/aspnet:6.0 as runtime

# Set destination for COPY
WORKDIR /publish

# Copy publish directory from build stage into runtime image
COPY --from=build-env /publish .

# Optional:
# To bind to a TCP port, runtime parameters must be supplied to the docker command.
# But we can document in the Dockerfile what ports
# the application is going to listen on by default.
# https://docs.docker.com/engine/reference/builder/#expose
EXPOSE 8080

# Run the application in the container
ENTRYPOINT ["dotnet", "myWebApp.dll"]
```

## .dockerignore

```bash
**/bin/
**/obj/
```

[Source](https://docs.docker.com/language/dotnet/build-images/)