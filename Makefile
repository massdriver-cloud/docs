MDPATH?=../massdriver
CLIPATH?=../mass

all: sync-cli-docs sync-gql-docs sync-authz-docs

.PHONY: sync-gql-docs
sync-gql-docs: sync-gql-v0 sync-gql-v1 # Generate all GraphQL docs

.PHONY: sync-gql-v0
sync-gql-v0: # Generate v0 GraphQL docs from remote schema
	rm -rf ./docs/api/graphql/v0/{operations,types,deprecated}
	curl -s https://api.massdriver.cloud/graphql/schema.graphql -o ./schema/v0/schema.graphql
	npx docusaurus graphql-to-doc:graphql-v0

.PHONY: sync-gql-v1
sync-gql-v1: # Generate v1 GraphQL docs from remote schema
	rm -rf ./docs/api/graphql/v1/{operations,types}
	curl -s https://api.massdriver.cloud/graphql/v1/schema.graphql -o ./schema/v1/schema.graphql
	npx docusaurus graphql-to-doc:graphql-v1

.PHONY: yarn
yarn:
	docker run --rm -it -v ${PWD}:/app -w /app -p 3001:3000 node:20-alpine3.22 yarn install

.PHONY: build
build:
	docker run --rm -it -v ${PWD}:/app -w /app -p 3001:3000 node:20-alpine3.22 yarn build

.PHONY: dev
dev:
	docker run --rm -it -v ${PWD}:/app -w /app -p 3001:3000 node:20-alpine3.22 yarn start

.PHONY: sync-cli-docs
sync-cli-docs: # Generate CLI docs
	rsync -a ${CLIPATH}/docs/generated/ ./docs/cli/commands/

.PHONY: sync-authz-docs
sync-authz-docs: 
	cp ${MDPATH}/adrs/0013* ./docs/security/02-authorization.md
