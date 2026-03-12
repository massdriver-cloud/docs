import React from "react";
// Import the original mapper
import MDXComponents from "@theme-original/MDXComponents";
import SchemaForm from "@site/src/components/SchemaForm";

export default {
  // Re-use the default mapping
  ...MDXComponents,
  // Add custom components
  SchemaForm,
};
