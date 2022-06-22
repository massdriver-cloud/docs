module.exports = {
  docs: [
    'introduction',
    {
      type: "category",
      label: "Bundle Development",
      items: [
        "bundles/overview",
        "bundles/walk-through"
      ]
    },
    { type: "category", label: "Deploying Applications", items: ["applications/overview"] },
    { type: "category", label: "JSON Schema Recipes", items: ["json-schema-recipes/overview"] },
  ],
  ...require("./docs/swapi/sidebar-schema.js"),
};
