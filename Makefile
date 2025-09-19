MDPATH?=../massdriver
CLIPATH?=../mass

all: sync-cli-docs sync-gql-docs sync-authz-docs

.PHONY: sync-gql-docs
sync-gql-docs: # Generate GraphQL docs
	rm -rf ./docs/swapi/{operations,types}
	curl https://api.massdriver.cloud/graphql/schema.graphql -o ./schema/md.graphql
	npx docusaurus graphql-to-doc

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
