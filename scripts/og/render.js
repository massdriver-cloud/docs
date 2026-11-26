#!/usr/bin/env node

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const OUT = path.join(ROOT, "static/img/og");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const card = (name, doc, kicker, title) => ({ name, doc, kicker, title });
const destination = (name, doc, focus, title) => ({
  name,
  doc,
  template: "event-destinations.html",
  params: { kicker: "event destinations", focus, title },
});

const PAGES = [
  { name: "default", template: "default.html" },
  { name: "automations", doc: "continuous-delivery/automations/00-overview.md", template: "automations.html" },
  { name: "canvas-design", doc: "continuous-delivery/topologies/01-canvas-design.md", template: "canvas-design.html" },
  {
    name: "event-destinations",
    doc: "platform-operations/event-destinations/00-overview.md",
    template: "event-destinations.html",
  },
  destination("event-destinations-http", "platform-operations/event-destinations/01-http.md", "http", "HTTP"),
  destination("event-destinations-slack", "platform-operations/event-destinations/02-slack.md", "slack", "Slack"),
  destination(
    "event-destinations-servicenow",
    "platform-operations/event-destinations/03-servicenow.md",
    "servicenow",
    "ServiceNow",
  ),
  destination(
    "event-destinations-pagerduty",
    "platform-operations/event-destinations/04-pagerduty.md",
    "pagerduty",
    "PagerDuty",
  ),

  card("getting-started", "getting_started/00-overview.md", "docs", "Getting Started"),
  card("getting-started-first-bundle", "getting_started/01-deploying-first-bundle.md", "getting started"),
  card("getting-started-connecting-bundles", "getting_started/02-connecting-bundles.md", "getting started"),
  card("getting-started-creating-bundles", "getting_started/03-creating-bundles.md", "getting started"),

  card("concepts-bundles", "concepts/01-bundles.md", "concepts"),
  card("concepts-resources", "concepts/02-artifacts-and-definitions.md", "concepts"),
  card("concepts-projects-environments", "concepts/03-projects-and-environments.md", "concepts"),
  card("concepts-components-instances", "concepts/04-manifests-packages-deployments.md", "concepts"),
  card("concepts-dependencies", "concepts/05-dependencies.md", "concepts"),
  card("concepts-organizations", "concepts/06-organizations.md", "concepts"),
  card("concepts-deployments", "concepts/10-deployments.md", "concepts"),

  card("applications", "applications/01-overview.md", "docs"),

  card("bundle-development", "bundle-development/00-overview.md", "docs"),
  card("bundle-yaml-spec", "bundle-development/01-bundle-yaml-spec.md", "bundle development", "Bundle YAML Spec"),
  card("runtimes-and-applications", "bundle-development/02-runtimes-and-applications.md", "bundle development"),
  card("schema-design", "bundle-development/schema-design/00-overview.md", "bundle development"),
  card("dependencies-resources", "bundle-development/dependencies-resources/00-overview.md", "bundle development"),
  card(
    "resource-type-spec",
    "bundle-development/dependencies-resources/01-resource-type-spec.md",
    "dependencies & resources",
    "Resource Type Spec",
  ),
  card("provisioners", "bundle-development/provisioners/01-overview.md", "bundle development", "Provisioners"),
  card("provisioners-opentofu", "bundle-development/provisioners/02-opentofu.md", "provisioners", "OpenTofu"),
  card("provisioners-terraform", "bundle-development/provisioners/03-terraform.md", "provisioners", "Terraform"),
  card("provisioners-helm", "bundle-development/provisioners/04-helm.md", "provisioners", "Helm"),
  card("provisioners-bicep", "bundle-development/provisioners/05-bicep.md", "provisioners", "Bicep"),
  card("bundle-versioning", "bundle-development/publishing/00-versioning.md", "bundle development"),
  card("module-patterns", "bundle-development/publishing/02-module-patterns.md", "bundle development", "Module Patterns"),

  card("continuous-delivery", "continuous-delivery/00-overview.md", "docs"),
  card("fork-environment", "continuous-delivery/01-fork-environment.md", "continuous delivery"),
  card("promote", "continuous-delivery/02-promote.md", "continuous delivery", "Promote Configs"),
  card("preview-environments", "continuous-delivery/03-preview-environments.md", "continuous delivery", "Preview Environments"),
  card("rollback", "continuous-delivery/04-rollback.md", "continuous delivery"),
  card("topologies", "continuous-delivery/topologies/00-overview.md", "continuous delivery"),
  card("topologies-environments", "continuous-delivery/topologies/02-environments.md", "environment topologies"),
  card("topologies-short-lived", "continuous-delivery/topologies/03-short-lived.md", "environment topologies"),
  card("topologies-projects", "continuous-delivery/topologies/04-projects.md", "environment topologies"),
  card("automations-deploy", "continuous-delivery/automations/01-deploy.md", "automations"),
  ...[
    "10-release-notes",
    "11-bundle-scanner",
    "12-sandbox-on-join",
    "13-proposal-chatops",
    "14-freeze-guard",
    "15-autodeploy-downstream",
    "16-github-deployments",
    "17-rollback-on-failure",
    "18-drift",
    "19-statuspage",
    "20-audit-archiver",
    "21-router",
  ].map((file) => card(`automation-${file.slice(3)}`, `continuous-delivery/automations/${file}.md`, "automations")),

  card("platform-operations", "platform-operations/00-overview.md", "docs"),
  card("state-management", "platform-operations/01-state-management.md", "platform operations", "State Management"),
  card(
    "monitoring-and-alarms",
    "platform-operations/02-monitoring-and-alarms.md",
    "platform operations",
    "Monitoring and Alarms",
  ),
  card("event-reference", "platform-operations/event-destinations/events/00-overview.md", "event destinations"),
  card("ci-cd-github-action", "platform-operations/ci-cd/01-github.md", "ci/cd"),
  card("ci-cd-azure-devops", "platform-operations/ci-cd/02-devops.md", "ci/cd", "Azure DevOps"),
  card("security", "platform-operations/security/00-overview.md", "platform operations"),
  card("service-accounts", "platform-operations/security/01-service-accounts.md", "security"),
  card("access-control", "platform-operations/security/02-access-control.md", "security", "Access Control"),
  card("abac-by-example", "platform-operations/security/04-abac-by-example.md", "security"),
  card("deployment-identity-tokens", "platform-operations/security/06-deployment-identity-tokens.md", "security"),
  card("self-hosted", "platform-operations/self-hosted/00-overview.md", "platform operations", "Self-Hosted"),
  card("self-hosted-install", "platform-operations/self-hosted/01-install.md", "self-hosted", "Installation"),
  card("self-hosted-oidc", "platform-operations/self-hosted/02-oidc.md", "self-hosted", "OIDC"),
  card("self-hosted-encryption", "platform-operations/self-hosted/07-secret-encryption.md", "self-hosted"),

  card("guide-bootstrap-platform", "guides/bootstrap-platform.md", "guides"),
  card("guide-bundle-from-opentofu", "guides/bundle-from-opentofu.md", "guides", "Bundle from an OpenTofu Module"),
  card("guide-import-resource", "guides/import-artifact.md", "guides"),
  card("guide-sharing-infrastructure", "guides/sharing_infrastructure.md", "guides", "Sharing Infrastructure"),

  card("cli", "reference/cli/00-overview.md", "reference", "Mass CLI"),
  card("integrations", "reference/integrations/00-overview.md", "reference"),
  card("integration-aws-cur", "reference/integrations/01-aws-cost-and-usage-reports.md", "integrations"),
  card(
    "integration-azure-cost",
    "reference/integrations/02-azure-cost-management-exports.md",
    "integrations",
    "Azure Cost Exports",
  ),
  card("integration-scim", "reference/integrations/03-scim.md", "integrations"),
];

const docPath = (doc) => path.join(ROOT, "docs", doc);

const frontMatterTitle = (source) => {
  const match = source.match(/^---\n[\s\S]*?^title:\s*(.+)$/m);
  return match[1].trim().replace(/^["']|["']$/g, "");
};

const setImage = (source, image) => {
  const end = source.indexOf("\n---", 4);
  const front = source.slice(0, end).replace(/^image:.*\n?/m, "").replace(/\n$/, "");
  return `${front}\nimage: ${image}${source.slice(end)}`;
};

const render = (page) => {
  const template = path.join(__dirname, page.template || "card.html");
  const url = new URL(`file://${template}`);
  if (!page.template) {
    const title = page.title || frontMatterTitle(fs.readFileSync(docPath(page.doc), "utf8"));
    url.searchParams.set("kicker", page.kicker);
    url.searchParams.set("title", title);
  }
  for (const [key, value] of Object.entries(page.params || {})) url.searchParams.set(key, value);
  const out = path.join(OUT, `${page.name}.png`);
  execFileSync(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--allow-file-access-from-files",
    "--force-device-scale-factor=1",
    "--window-size=1200,630",
    "--virtual-time-budget=6000",
    `--screenshot=${out}`,
    url.href,
  ], { stdio: "ignore" });
  return out;
};

fs.mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);

for (const page of PAGES) {
  if (only.length && !only.includes(page.name)) continue;
  const out = render(page);
  if (page.doc) {
    const file = docPath(page.doc);
    fs.writeFileSync(file, setImage(fs.readFileSync(file, "utf8"), `/img/og/${page.name}.png`));
  }
  console.log(path.relative(ROOT, out));
}
