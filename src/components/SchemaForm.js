import React, { useState, useEffect } from "react";
import Form from "@rjsf/semantic-ui";
import validator from "@rjsf/validator-ajv8";
import "semantic-ui-css/semantic.min.css";

/**
 * Generates a GraphQL mutation string from the mutation name and schema
 */
function generateMutation(name, schema) {
  if (!schema?.properties) return null;

  const inputFields = Object.entries(schema.properties)
    .map(([key, prop]) => {
      const required = schema.required?.includes(key);
      let type = "String";
      if (prop.type === "integer") type = "Int";
      if (prop.type === "boolean") type = "Boolean";
      return `    ${key}: $${key}`;
    })
    .join("\n");

  // Build the variable definitions
  const varDefs = Object.entries(schema.properties)
    .map(([key, prop]) => {
      const required = schema.required?.includes(key);
      let type = "String";
      if (prop.type === "integer") type = "Int";
      if (prop.type === "boolean") type = "Boolean";
      return `$${key}: ${type}${required ? "!" : ""}`;
    })
    .join(", ");

  return `mutation ${name.charAt(0).toUpperCase() + name.slice(1)}($organizationId: ID!, ${varDefs}) {
  ${name}(
    organizationId: $organizationId
    input: {
${inputFields}
    }
  ) {
    successful
    result {
      id
      name
    }
    messages {
      field
      message
    }
  }
}`;
}

/**
 * Renders an interactive JSON Schema form using the mutation's schema.
 * Uses react-jsonschema-form with Semantic UI theme.
 */
export default function SchemaForm({ schemaUrl, uiSchemaUrl, name }) {
  const [schema, setSchema] = useState(null);
  const [uiSchema, setUiSchema] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const [showQuery, setShowQuery] = useState(false);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    async function fetchSchemas() {
      try {
        const [schemaRes, uiSchemaRes] = await Promise.all([
          fetch(schemaUrl),
          fetch(uiSchemaUrl).catch(() => ({ ok: false })),
        ]);

        if (!schemaRes.ok) {
          throw new Error(`Failed to fetch schema: ${schemaRes.status}`);
        }

        const schemaData = await schemaRes.json();
        setSchema(schemaData);

        if (uiSchemaRes.ok) {
          const uiSchemaData = await uiSchemaRes.json();
          setUiSchema(uiSchemaData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSchemas();
  }, [schemaUrl, uiSchemaUrl]);

  const handleCopy = async (text, type) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const mutation = schema ? generateMutation(name, schema) : null;
  const variables = {
    organizationId: "YOUR_ORG_ID",
    ...formData,
  };

  // GraphiQL deep link - encode query and variables
  const playgroundUrl = mutation
    ? `https://api.massdriver.cloud/graphql/v1/graphiql?query=${encodeURIComponent(mutation)}&variables=${encodeURIComponent(JSON.stringify(variables, null, 2))}`
    : null;

  if (loading) {
    return (
      <div className="ui segment">
        <div className="ui active loader"></div>
        <p>Loading schema...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ui negative message">
        <div className="header">Error loading schema</div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="ui segment" style={{ marginTop: "1rem" }}>
      <Form
        schema={schema}
        uiSchema={{
          ...uiSchema,
          "ui:submitButtonOptions": { norender: true },
        }}
        validator={validator}
        formData={formData}
        onChange={({ formData }) => setFormData(formData)}
        liveValidate={false}
      />

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          className="ui primary button"
          onClick={() => setShowQuery(!showQuery)}
        >
          {showQuery ? "Hide" : "Generate"} Query
        </button>

        {playgroundUrl && (
          <a
            href={playgroundUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ui button"
          >
            Open in GraphiQL
          </a>
        )}
      </div>

      {showQuery && mutation && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <strong>Query</strong>
              <button
                className={`ui mini button ${copied === "query" ? "positive" : ""}`}
                onClick={() => handleCopy(mutation, "query")}
              >
                {copied === "query" ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre
              style={{
                background: "var(--ifm-pre-background)",
                padding: "1rem",
                borderRadius: "4px",
                overflow: "auto",
                fontSize: "0.85rem",
              }}
            >
              <code>{mutation}</code>
            </pre>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <strong>Variables</strong>
              <button
                className={`ui mini button ${copied === "variables" ? "positive" : ""}`}
                onClick={() => handleCopy(JSON.stringify(variables, null, 2), "variables")}
              >
                {copied === "variables" ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre
              style={{
                background: "var(--ifm-pre-background)",
                padding: "1rem",
                borderRadius: "4px",
                overflow: "auto",
                fontSize: "0.85rem",
              }}
            >
              <code>{JSON.stringify(variables, null, 2)}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
