MDPATH?=../massdriver
.PHONY: gql
gql: # Generate GraphQL docs.
	rm -rf ./docs/swapi/{directives,inputs,objects,scalars,subscriptions,unions,enums,mutations,queries}
	cd ${MDPATH} && mix absinthe.schema.sdl
	mv ${MDPATH}/schema.graphql ./schema/md.graphql
	npx docusaurus graphql-to-doc


	