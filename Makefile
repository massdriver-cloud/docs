MDPATH?=../massdriver
CLIPATH?=../mass

all: sync-cli-docs sync-gql-docs sync-authz-docs

.PHONY: sync-gql-docs
sync-gql-docs: # Generate GraphQL docs from remote schema
	rm -rf ./docs/api/graphql/{operations,types,deprecated}
	curl -s https://api.massdriver.cloud/graphql/v2/schema.graphql -o ./schema/schema.graphql
	yarn gen:graphql

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
	rsync -a ${CLIPATH}/docs/generated/ ./docs/reference/cli/commands/
