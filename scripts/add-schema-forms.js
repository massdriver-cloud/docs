#!/usr/bin/env node
/**
 * Post-processes generated GraphQL mutation docs to add SchemaForm components.
 * Run this after `docusaurus graphql-to-doc:graphql-v1`
 */
const fs = require('fs');
const path = require('path');

const mutationsDir = path.join(__dirname, '../docs/api/graphql/v1/operations/mutations');
const schemaPath = path.join(__dirname, '../schema/v1/schema.graphql');

// Base URL for schema endpoints
const BASE_URL = process.env.SCHEMA_BASE_URL || 'http://localhost:4000';

// Parse schema to find mutations with @formSchema directive
const schemaContent = fs.readFileSync(schemaPath, 'utf8');
const formSchemaRegex = /@formSchema\(\s*name:\s*"([^"]+)",\s*schema:\s*"([^"]+)",\s*ui_schema:\s*"([^"]+)"\s*\)/g;

const formSchemaMutations = {};
let match;
while ((match = formSchemaRegex.exec(schemaContent)) !== null) {
  formSchemaMutations[match[1]] = {
    schema: match[2].replace(/\\\//g, '/'),
    uiSchema: match[3].replace(/\\\//g, '/')
  };
}

console.log(`Found ${Object.keys(formSchemaMutations).length} mutations with @formSchema directive`);

const files = fs.readdirSync(mutationsDir).filter(f => f.endsWith('.mdx'));
let updated = 0;

for (const file of files) {
  const filePath = path.join(mutationsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if it has the form schema badge
  if (!content.includes('text="form schema"')) continue;

  // Check if SchemaForm already exists
  if (content.includes('<SchemaForm')) continue;

  // Get mutation name from filename (e.g., create-project -> createProject)
  const mutationName = file.replace('.mdx', '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());

  const schemaInfo = formSchemaMutations[mutationName];
  if (!schemaInfo) {
    console.log(`⚠ No schema info for ${mutationName}`);
    continue;
  }

  const schemaUrl = `${BASE_URL}${schemaInfo.schema}`;
  const uiSchemaUrl = `${BASE_URL}${schemaInfo.uiSchema}`;

  // Add SchemaForm and links after the graphql code block, before ### Arguments
  const schemaFormSection = `
### Form Schema

This mutation supports dynamic form generation using JSON Schema.

- [JSON Schema](${schemaUrl})
- [UI Schema](${uiSchemaUrl})

<SchemaForm
  schemaUrl="${schemaUrl}"
  uiSchemaUrl="${uiSchemaUrl}"
  name="${mutationName}"
/>

`;

  // Find position before ### Arguments
  const argsPos = content.indexOf('### Arguments');
  if (argsPos === -1) continue;

  content = content.slice(0, argsPos) + schemaFormSection + content.slice(argsPos);

  fs.writeFileSync(filePath, content);
  console.log(`✓ Added SchemaForm to ${file}`);
  updated++;
}

console.log(`\nProcessed ${updated} files.`);
