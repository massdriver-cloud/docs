# Massdriver Docs

### Enabling Pre-commit

This repo includes Terraform pre-commit hooks.

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

### Generating GQL Docs

To update the GraphQL docs, you'll need access to generated the GraphQL SDL file from Massdriver.

```shell
cd $MASSDRIVER_DIR
mix absinthe.schema.sdl
mv schema.graphql $DOCS_DIR/schema/md.graphql
cd $DOCS_DIR
npx docusaurus graphql-to-doc
```
