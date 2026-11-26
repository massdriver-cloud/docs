#!/usr/bin/env node

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const OUT = path.join(ROOT, "static/img/og");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const PAGES = [
  { name: "default", kicker: "documentation", title: "Massdriver Docs" },
  { name: "automations", doc: "continuous-delivery/automations/00-overview.md", template: "automations.html" },
  { name: "canvas-design", doc: "continuous-delivery/topologies/01-canvas-design.md", template: "canvas-design.html" },
  { name: "bundle-development", doc: "bundle-development/00-overview.md", kicker: "docs" },
  { name: "schema-design", doc: "bundle-development/schema-design/00-overview.md", kicker: "bundle development" },
  {
    name: "dependencies-resources",
    doc: "bundle-development/dependencies-resources/00-overview.md",
    kicker: "bundle development",
  },
  {
    name: "provisioners",
    doc: "bundle-development/provisioners/01-overview.md",
    kicker: "bundle development",
    title: "Provisioners",
  },
  { name: "continuous-delivery", doc: "continuous-delivery/00-overview.md", kicker: "docs" },
  { name: "topologies", doc: "continuous-delivery/topologies/00-overview.md", kicker: "continuous delivery" },
  {
    name: "topologies-environments",
    doc: "continuous-delivery/topologies/02-environments.md",
    kicker: "environment topologies",
  },
  {
    name: "topologies-short-lived",
    doc: "continuous-delivery/topologies/03-short-lived.md",
    kicker: "environment topologies",
  },
  {
    name: "topologies-projects",
    doc: "continuous-delivery/topologies/04-projects.md",
    kicker: "environment topologies",
  },
  { name: "automations-deploy", doc: "continuous-delivery/automations/01-deploy.md", kicker: "automations" },
  { name: "platform-operations", doc: "platform-operations/00-overview.md", kicker: "docs" },
  {
    name: "event-destinations",
    doc: "platform-operations/event-destinations/00-overview.md",
    kicker: "platform operations",
  },
  {
    name: "event-reference",
    doc: "platform-operations/event-destinations/events/00-overview.md",
    kicker: "event destinations",
  },
  { name: "security", doc: "platform-operations/security/00-overview.md", kicker: "platform operations" },
  {
    name: "self-hosted",
    doc: "platform-operations/self-hosted/00-overview.md",
    kicker: "platform operations",
    title: "Self-Hosted",
  },
  { name: "cli", doc: "reference/cli/00-overview.md", kicker: "reference", title: "Mass CLI" },
  { name: "integrations", doc: "reference/integrations/00-overview.md", kicker: "reference" },
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
