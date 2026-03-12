import React, { useState, useEffect } from "react";

/**
 * Renders an interactive JSON Schema form using the mutation's schema.
 * Uses react-jsonschema-form (RJSF) to render the form.
 *
 * Note: Requires @rjsf/core and @rjsf/validator-ajv8 to be installed.
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
      <div
        style={{
          padding: "1rem",
          background: "var(--ifm-background-surface-color)",
          borderRadius: "4px",
        }}
      >
        Loading schema...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "1rem",
          background: "var(--ifm-color-danger-lightest)",
          borderRadius: "4px",
          color: "var(--ifm-color-danger-darkest)",
        }}
      >
        Error loading schema: {error}
      </div>
    );
  }

  // For now, render a preview of what the form would look like
  // To use actual RJSF, uncomment the Form import and usage below
  return (
    <details style={{ marginTop: "1rem" }}>
      <summary
        style={{ cursor: "pointer", fontWeight: "bold", marginBottom: "0.5rem" }}
      >
        Interactive Form Preview
      </summary>
      <div
        style={{
          padding: "1rem",
          background: "var(--ifm-background-surface-color)",
          borderRadius: "4px",
          border: "1px solid var(--ifm-color-emphasis-300)",
        }}
      >
        <p style={{ marginBottom: "0.5rem", fontStyle: "italic" }}>
          This mutation accepts the following input structure:
        </p>
        <pre
          style={{
            background: "var(--ifm-pre-background)",
            padding: "1rem",
            borderRadius: "4px",
            overflow: "auto",
          }}
        >
          {JSON.stringify(schema, null, 2)}
        </pre>

        {/*
        To enable full RJSF form rendering:
        1. npm install @rjsf/core @rjsf/validator-ajv8
        2. Uncomment the imports and Form component below

        import Form from "@rjsf/core";
        import validator from "@rjsf/validator-ajv8";

        <Form
          schema={schema}
          uiSchema={uiSchema}
          validator={validator}
          formData={formData}
          onChange={({ formData }) => setFormData(formData)}
          onSubmit={({ formData }) => console.log("Form data:", formData)}
        >
          <button type="submit" style={{ display: 'none' }} />
        </Form>
        */}
      </div>
    </details>
  );
}
