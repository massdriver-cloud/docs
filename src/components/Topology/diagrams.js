const ALL = ["on", "on", "on"];
const TWO = ["on", "on"];

const node = (kind) => (id, x, y, c = ALL, o = {}) => ({ id, label: id, kind, x, y, c, ...o });
const env = node("env");
const eph = node("eph");
const prod = node("prod");
const pill = (id, label, cx, y, o = {}) => ({ id, label, cx, y, kind: "ext", ...o });

const arrow = (from, to, o = {}) => ({ from, to, kind: "arrow", ...o });
const fork = (from, to, o = {}) => ({ from, to, kind: "fork", ...o });
const uses = (from, to, o = {}) => ({ from, to, kind: "ref", ...o });

const project = (label, nodes, o = {}) => ({ label, nodes, ...o });

const reveal = (nodes) => nodes.map((n, i) => ({ ...n, build: i }));

export const TOPOLOGIES = {
  stages: {
    title: "Stages",
    steps: 0,
    build: true,
    buildStep: 0.5,
    nodes: reveal([env("dev", 20, 32), env("staging", 142, 32), prod("prod", 264, 32)]),
    edges: [],
    projects: [project("billing project", ["dev", "prod"])],
  },

  regions: {
    title: "Regions",
    steps: 0,
    build: true,
    buildStep: 0.5,
    nodes: reveal([prod("useast", 20, 32), prod("euwest", 142, 32), prod("apsouth", 264, 32)]),
    edges: [],
    projects: [project("api project", ["useast", "apsouth"])],
  },

  standby: {
    title: "Standby",
    steps: 5,
    hold: 0.5,
    nodes: [
      pill("traffic", "traffic", 190, 6),
      env("primary", 52, 64, ALL, { live: [[0, 3]] }),
      env("standby", 232, 64, ALL, { live: [[3, 99]] }),
    ],
    edges: [
      arrow("traffic", "primary", { step: [1, 2, 3], out: 3 }),
      arrow("traffic", "standby", { step: [4, 5], in: 3, label: "failover", labelDx: 26 }),
    ],
    projects: [project("api project", ["primary", "standby"])],
  },

  "blue-green": {
    title: "Blue/Green",
    steps: 5,
    hold: 0.5,
    nodes: [
      pill("traffic", "traffic", 190, 6),
      env("blue", 52, 64, TWO, { live: [[0, 3]] }),
      env("green", 232, 64, TWO, { live: [[3, 99]] }),
      prod("prod", 142, 170, ["on"]),
    ],
    edges: [
      arrow("traffic", "blue", { step: [1, 2, 3], out: 3 }),
      arrow("traffic", "green", { step: [4, 5], in: 3 }),
      uses("prod", "blue"),
      uses("prod", "green"),
    ],
    projects: [project("api project", ["blue", "green"]), project("database project", ["prod"])],
  },

  customers: {
    title: "Customers",
    steps: 2,
    nodes: [
      prod("prod", 142, 32, TWO),
      prod("acme", 20, 136),
      prod("globex", 142, 136),
      prod("initech", 264, 136, ALL, { in: 1 }),
    ],
    edges: [uses("prod", "acme"), uses("prod", "globex"), uses("prod", "initech", { in: 1, step: 2 })],
    projects: [project("control plane project", ["prod"]), project("tenant project", ["acme", "initech"])],
  },

  "pool-and-dedicated": {
    title: "Pool and Dedicated",
    steps: 0,
    nodes: [prod("pool", 20, 32, ALL, { w: 130 }), prod("acme", 170, 32, ALL, { w: 84 }), prod("globex", 270, 32, ALL, { w: 84 })],
    edges: [],
    projects: [project("product project", ["pool", "globex"])],
  },

  cells: {
    title: "Cells",
    steps: 1,
    nodes: [
      prod("prod", 142, 32, TWO),
      prod("cell1", 16, 136, TWO, { w: 76 }),
      prod("cell2", 104, 136, TWO, { w: 76 }),
      prod("cell3", 192, 136, TWO, { w: 76 }),
      prod("cell4", 280, 136, TWO, { w: 76, in: 1, pulse: [1] }),
    ],
    edges: [
      uses("prod", "cell1"),
      uses("prod", "cell2"),
      uses("prod", "cell3"),
      uses("prod", "cell4", { in: 1 }),
    ],
    projects: [project("router project", ["prod"]), project("cells project", ["cell1", "cell4"])],
  },

  sites: {
    title: "Sites",
    steps: 1,
    nodes: [
      prod("store001", 18, 32, TWO, { w: 80 }),
      prod("store002", 107, 32, TWO, { w: 80 }),
      prod("store003", 196, 32, TWO, { w: 80 }),
      prod("store004", 285, 32, TWO, { w: 80 }),
      prod("store401", 196, 112, TWO, { w: 80, in: 1 }),
    ],
    edges: [fork("store003", "store401", { step: 1 })],
    projects: [project("store project", ["store001", "store004", "store401"])],
  },

  "pull-request-preview": {
    title: "Pull Request Preview",
    steps: 3,
    nodes: [
      env("staging", 20, 64),
      eph("pr212", 264, 28, ALL, { in: 1, out: 3 }),
      eph("pr215", 264, 100, ALL, { in: 2 }),
      env("nonprod", 142, 196, TWO),
    ],
    edges: [
      fork("staging", "pr212", { step: 1 }),
      fork("staging", "pr215", { step: 2 }),
      uses("nonprod", "staging"),
      uses("nonprod", "pr212"),
      uses("nonprod", "pr215"),
    ],
    projects: [project("storefront project", ["staging", "pr212", "pr215"]), project("platform project", ["nonprod"])],
  },

  workspace: {
    title: "Workspace",
    steps: 4,
    hold: 1,
    nodes: [
      env("dev", 142, 32),
      eph("alice", 20, 124, ["on", "ref", "ref"], { in: 1 }),
      eph("bob", 142, 124, ["ref", "on", "ref"], { in: 2, out: 4 }),
      eph("task481", 264, 124, ["on", "on", "ref"], { in: 3 }),
    ],
    edges: [fork("dev", "alice", { step: 1 }), fork("dev", "bob", { step: 2 }), fork("dev", "task481", { step: 3 })],
    projects: [project("ecomm project", ["dev", "alice", "task481"])],
  },

  "purpose-fork": {
    title: "Purpose Fork",
    steps: 4,
    hold: 1,
    nodes: [
      prod("prod", 142, 32),
      eph("hotfix", 20, 124, ALL, { in: 1, out: 3 }),
      eph("loadtest", 142, 124, ALL, { in: 2, out: 4 }),
      eph("pentest", 264, 124, ALL, { in: 3, out: 4.6 }),
    ],
    edges: [fork("prod", "hotfix", { step: 1 }), fork("prod", "loadtest", { step: 2 }), fork("prod", "pentest", { step: 3 })],
    projects: [project("ecomm project", ["prod", "hotfix", "pentest"])],
  },

  singleton: {
    title: "Singleton",
    steps: 1,
    nodes: [
      prod("global", 142, 32),
      prod("billing", 30, 136, ALL, { label: "prod" }),
      prod("search", 254, 136, ALL, { label: "prod" }),
    ],
    edges: [uses("global", "billing", { step: 1 }), uses("global", "search", { step: 1 })],
    projects: [
      project("organization project", ["global"]),
      project("billing project", ["billing"]),
      project("search project", ["search"]),
    ],
  },

  "platform-layer": {
    title: "Platform Layer",
    steps: 2,
    nodes: [
      env("dev", 20, 36),
      env("staging", 142, 36),
      prod("prod", 264, 36),
      env("nonprod", 81, 150, TWO),
      prod("pprod", 203, 150, TWO, { label: "prod" }),
    ],
    edges: [
      uses("nonprod", "dev", { step: 1 }),
      uses("nonprod", "staging", { step: 1 }),
      uses("pprod", "prod", { step: 2 }),
    ],
    projects: [project("billing project", ["dev", "staging", "prod"]), project("platform project", ["nonprod", "pprod"])],
  },

  "migration-pair": {
    title: "Migration Pair",
    steps: 4,
    hold: 1,
    nodes: [
      pill("traffic", "traffic", 190, 6),
      prod("old", 30, 64, ALL, { label: "prod" }),
      prod("new", 254, 64, TWO, { label: "prod" }),
    ],
    edges: [
      arrow("traffic", "old", { step: [1, 2], out: 3 }),
      arrow("traffic", "new", { step: [2, 3, 4], in: 1 }),
      uses("old", "new", { label: "database", dy: 8 }),
    ],
    projects: [project("legacy project", ["old"]), project("services project", ["new"])],
  },

  "multi-cloud": {
    title: "Multi-Cloud",
    steps: 0,
    nodes: [prod("aws", 30, 32, ALL, { label: "prod" }), prod("azure", 254, 32, ALL, { label: "prod" })],
    edges: [],
    projects: [project("shop aws project", ["aws"]), project("shop azure project", ["azure"])],
  },

  boundary: {
    title: "Isolated Boundary",
    steps: 1,
    nodes: [
      pill("cred", "aws credentials", 100, 6),
      pill("gcred", "govcloud credentials", 280, 6),
      prod("prod", 52, 96),
      prod("govcloud", 232, 96),
    ],
    edges: [uses("cred", "prod", { step: 1 }), uses("gcred", "govcloud", { step: 1 })],
    projects: [project("records project", ["prod", "govcloud"])],
  },
};

const pair = (a, b, c, label) => ({
  steps: 0,
  nodes: [env(a, 52, 32, c), prod(b, 232, 32, c)],
  edges: [],
  projects: [project(label, [a, b])],
});
const regions = (comps, label) => ({
  steps: 0,
  nodes: [env("nonuseast", 20, 32, comps), prod("produseast", 142, 32, comps), prod("prodeuwest", 264, 32, comps)],
  edges: [],
  projects: [project(label, ["nonuseast", "prodeuwest"])],
});

export const CANVASES = {
  organization: {
    title: "Organization canvas",
    steps: 0,
    nodes: [prod("global", 142, 32)],
    edges: [],
    projects: [project("organization project", ["global"])],
  },
  network: { title: "Network canvas", ...regions(TWO, "network project") },
  "compute-platform": { title: "Compute Platform canvas", ...regions(ALL, "compute platform project") },
  "shared-services": { title: "Shared Services canvas", ...pair("nonprod", "prod", ALL, "shared services project") },
  edge: { title: "Edge canvas", ...pair("staging", "prod", TWO, "edge project") },
  application: {
    title: "Application canvas",
    steps: 0,
    nodes: [
      env("dev", 11, 32, ALL, { w: 82 }),
      env("staging", 103, 32, ALL, { w: 82 }),
      prod("produseast", 195, 32, ALL, { w: 82 }),
      prod("prodeuwest", 287, 32, ALL, { w: 82 }),
    ],
    edges: [],
    projects: [project("application project", ["dev", "prodeuwest"])],
  },
  "data-platform": { title: "Data Platform canvas", ...pair("dev", "prod", TWO, "data platform project") },
  "tenant-stack": {
    title: "Tenant Stack canvas",
    steps: 0,
    nodes: [prod("acme", 20, 32), prod("globex", 142, 32), prod("initech", 264, 32)],
    edges: [],
    projects: [project("tenant project", ["acme", "initech"])],
  },
};

// Five projects, each with its own topology. Each layer is built from the
// resources of the layer under it.
const W82 = { w: 82 };
export const ORGANIZATION = {
  title: "Example organization",
  build: true,
  buildStep: 0.7,
  begin: 3.6,
  steps: 4,
  hold: 1.5,
  stepDur: 1.2,
  nodes: [
    env("e-stg", 103, 32, TWO, { ...W82, label: "staging", build: 4 }),
    prod("e-prod", 241, 32, TWO, { ...W82, label: "prod", build: 4 }),
    env("b-dev", 11, 136, ALL, { ...W82, label: "dev", build: 3 }),
    env("b-stg", 103, 136, ALL, { ...W82, label: "staging", build: 3 }),
    prod("b-use", 195, 136, ALL, { ...W82, label: "produseast", build: 3 }),
    prod("b-euw", 287, 136, ALL, { ...W82, label: "prodeuwest", build: 3 }),
    env("c-non", 57, 240, ALL, { ...W82, label: "nonuseast", build: 2 }),
    prod("c-use", 195, 240, ALL, { ...W82, label: "produseast", build: 2 }),
    prod("c-euw", 287, 240, ALL, { ...W82, label: "prodeuwest", build: 2 }),
    env("n-non", 57, 344, TWO, { ...W82, label: "nonuseast", build: 1 }),
    prod("n-use", 195, 344, TWO, { ...W82, label: "produseast", build: 1 }),
    prod("n-euw", 287, 344, TWO, { ...W82, label: "prodeuwest", build: 1 }),
    prod("global", 142, 448, ALL, { label: "global", build: 0 }),
  ],
  edges: [
    uses("b-stg", "e-stg", { step: 4 }),
    uses("b-use", "e-prod", { step: 4 }),
    uses("b-euw", "e-prod", { step: 4 }),
    uses("c-non", "b-dev", { step: 3 }),
    uses("c-non", "b-stg", { step: 3 }),
    uses("c-use", "b-use", { step: 3 }),
    uses("c-euw", "b-euw", { step: 3 }),
    uses("n-non", "c-non", { step: 2 }),
    uses("n-use", "c-use", { step: 2 }),
    uses("n-euw", "c-euw", { step: 2 }),
    uses("global", "n-non", { step: 1 }),
    uses("global", "n-use", { step: 1 }),
    uses("global", "n-euw", { step: 1 }),
  ],
  projects: [
    project("edge project", [], { box: { x: 96, y: 8, w: 280, h: 78 }, topology: "Stages", build: 4 }),
    project("billing project", [], { box: { x: 4, y: 112, w: 372, h: 78 }, topology: "Stages + Regions", build: 3 }),
    project("compute platform project", [], { box: { x: 4, y: 216, w: 372, h: 78 }, topology: "Platform Layer", build: 2 }),
    project("network project", [], { box: { x: 4, y: 320, w: 372, h: 78 }, topology: "Regions", build: 1 }),
    project("organization project", [], { box: { x: 96, y: 424, w: 188, h: 78 }, topology: "Singleton", build: 0 }),
  ],
};
