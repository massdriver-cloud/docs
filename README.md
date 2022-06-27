# Docusaurus 2

This directory is a brief example of a [Docusaurus](https://v2.docusaurus.io) site that can be deployed to Vercel with zero configuration.

## Enabling Pre-commit

This repo includes Terraform pre-commit hooks.

[Install precommmit](https://pre-commit.com/index.html#installation) on your system.

```shell
git init
pre-commit install
```

## Deploy Your Own

Deploy your own Docusaurus project with Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vercel/vercel/tree/main/docusaurus-2&template=docusaurus-2)

_Live Example: https://docusaurus-2-template.vercel.app_

### How We Created This Example

To get started with Docusaurus on Vercel, you can use the [Docusaurus CLI](https://v2.docusaurus.io/docs/installation#scaffold-project-website) to initialize the project:

```shell
$ npx @docusaurus/init@next init my-website classic
```

### Generating GQL Docs

```shell
cd $MASSDRIVER_DIR
mix absinthe.schema.sdl
mv schema.graphql $DOCS_DIR/schema/md.graphql
cd $DOCS_DIR
npx docusaurus graphql-to-doc
```
