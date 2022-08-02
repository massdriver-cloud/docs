# Massdriver Docs

## Enabling Pre-commit

This repo includes Terraform pre-commit hooks.

[Install precommmit](https://pre-commit.com/index.html#installation) on your system.

```shell
git init
pre-commit install
```
### Generating GQL Docs

```shell
cd $MASSDRIVER_DIR
mix absinthe.schema.sdl
mv schema.graphql $DOCS_DIR/schema/md.graphql
cd $DOCS_DIR
npx docusaurus graphql-to-doc
```
