MDPATH?=../massdriver
CLIPATH?=../cli

.PHONY: gql
gql: # Generate GraphQL docs.
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
	
sync-cli-docs:
	rm -rf ./docs/cli
	mkdir ./docs/cli
	cp -R ${CLIPATH}/cmd/helpdocs/* ./docs/cli
	# Remove top level docs for now, the formatting in sidebar is weird
	rm ./docs/cli/*.md
