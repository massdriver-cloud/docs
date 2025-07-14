# Massdriver Docs

### Enabling Pre-commit

This repo includes pre-commit hooks, use 'em!

[Install precommmit](https://pre-commit.com/index.html#installation) on your system.

```shell
git init
pre-commit install
```

### Local development

The docs are generated using Docusaurus:

```shell
yarn start
open http://localhost:3000/
```

Or with docker

```shell
docker run --rm -it -v $PWD:/app -w /app -p 3001:3000 node:20-alpine3.22 yarn
docker run --rm -it -v $PWD:/app -w /app -p 3001:3000 node:20-alpine3.22 yarn start
```

### Generating GQL Docs

To update the GraphQL docs, you'll need access to generated the GraphQL SDL file from Massdriver.

```shell
cd $MASSDRIVER_DIR
mix absinthe.schema.sdl
mv schema.graphql $DOCS_DIR/schema/md.graphql
cd $DOCS_DIR
npx docusaurus graphql-to-doc
```

### Sync CLI docs

The [Massdriver CLI](https://github.com/massdriver-cloud/mass) has markdown docs for all commands. They can be sync'd to ./cli w/ the following command:

```shell
make sync-cli-docs
```
---
