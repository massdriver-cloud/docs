import React from "react";
// Import the original mapper
import MDXComponents from "@theme-original/MDXComponents";
import SchemaForm from "@site/src/components/SchemaForm";
import VersionedConnections from "@site/src/components/Diagrams/VersionedConnections";
import SlotResolution from "@site/src/components/Diagrams/SlotResolution";
import SeparationOfDuty from "@site/src/components/Diagrams/SeparationOfDuty";

export default {
  // Re-use the default mapping
  ...MDXComponents,
  // Add custom components
  SchemaForm,
  VersionedConnections,
  SlotResolution,
  SeparationOfDuty,
};
