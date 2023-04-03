MDPATH?=../massdriver
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
	