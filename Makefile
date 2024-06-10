MDPATH?=../massdriver
CLIPATH?=../cli

all: sync-cli-docs sync-gql-docs sync-authz-docs

.PHONY: sync-gql-docs
sync-gql-docs: # Generate GraphQL docs
	rm -rf ./docs/swapi/{directives,inputs,objects,scalars,subscriptions,unions,enums,mutations,queries}
	cd ${MDPATH} && mix absinthe.schema.sdl
	mv ${MDPATH}/schema.graphql ./schema/md.graphql
	npx docusaurus graphql-to-doc

.PHONY: yarn
yarn:
	docker run --rm -it -v ${PWD}:/app -w /app -p 3001:3000 node:19-alpine3.16 yarn install

.PHONY: build
build:
	docker run --rm -it -v ${PWD}:/app -w /app -p 3001:3000 node:19-alpine3.16 yarn build

.PHONY: dev
dev:
	docker run --rm -it -v ${PWD}:/app -w /app -p 3001:3000 node:19-alpine3.16 yarn start

.PHONY: sync-cli-docs
sync-cli-docs: # Generate CLI docs
	rsync -a ${CLIPATH}/cmd/helpdocs/ ./docs/cli/

.PHONY: sync-authz-docs
sync-authz-docs: 
	cp ${MDPATH}/adrs/0013* ./docs/security/02-authorization.md
