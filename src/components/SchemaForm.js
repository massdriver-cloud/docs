import React, { useState, useEffect } from "react";
import Form from "@rjsf/semantic-ui";
import validator from "@rjsf/validator-ajv8";
import "semantic-ui-css/semantic.min.css";

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
    </div>
  );
}
