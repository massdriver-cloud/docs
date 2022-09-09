module.exports = {
  docs: [
    'introduction',
    { type: "category", label: "Concepts", items: [{ type: "autogenerated", dirName: "concepts" }] },
    { type: "category", label: "Bundle Development", items: [{ type: "autogenerated", dirName: "bundles" }] },
    {
      type: "category", label: "Applications", items: [
        { type: "autogenerated", dirName: "applications" }
      ]
    },
    { type: "category", label: "Platform Services", items: [{ type: "autogenerated", dirName: "platform" }] },
    { type: "category", label: "JSON Schema Cheat Sheet", items: [{ type: "autogenerated", dirName: 'json_schema_cheat_sheet' }] }
  ],
  ...require("./docs/swapi/sidebar-schema.js"),
};
