module.exports = {
  docs: [
    "introduction",
    {
      type: "category",
      label: "Getting Started",
      items: [{ type: "autogenerated", dirName: "getting_started" }],
    },
    {
      type: "category",
      label: "Concepts",
      items: [{ type: "autogenerated", dirName: "concepts" }],
    },
    {
      type: "category",
      label: "Bundle Development",
      items: [{ type: "autogenerated", dirName: "bundles" }],
    },
    {
      type: "category",
      label: "Applications",
      items: [{ type: "autogenerated", dirName: "applications" }],
    },
    {
      type: "category",
      label: "Platform Services",
      items: [{ type: "autogenerated", dirName: "platform" }],
    },
    {
      type: "category",
      label: "CI/CD",
      items: [{ type: "autogenerated", dirName: "ci-cd" }],
    },
    {
      type: "category",
      label: "CLI",
      link: {type: 'doc', id: 'cli/cli-overview'},
      items: [{ type: "autogenerated", dirName: "cli" }],
    },
    {
      type: "category",
      label: "Extend the Platform",
      items: [{ type: "autogenerated", dirName: "extend_the_platform" }],
    },
    {
      type: "category",
      label: "Runbooks",
      items: [{ type: "autogenerated", dirName: "runbooks" }],
    },
    {
      type: "category",
      label: "JSON Schema Cheat Sheet",
      items: [{ type: "autogenerated", dirName: "json_schema_cheat_sheet" }],
    },
    {
      type: "category",
      label: "Mission Log",
      items: [{ type: "autogenerated", dirName: "missionlog" }],
    },
  ],
  ...require("./docs/swapi/sidebar-schema.js"),
};
