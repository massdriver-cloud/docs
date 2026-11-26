const ALL = ["on", "on", "on"];
const OFF = ["off", "off", "off"];

const node = (kind) => (id, x, y, c = ALL, v, o = {}) => ({ id, label: id, kind, x, y, c, v, ...o });
const env = node("env");
const eph = node("eph");
const prod = node("prod");
const pill = (id, label, cx, y, o = {}) => ({ id, label, cx, y, kind: "ext", ...o });

const arrow = (from, to, o = {}) => ({ from, to, kind: "arrow", ...o });
const fork = (from, to, o = {}) => ({ from, to, kind: "fork", ...o });
const uses = (from, to, o = {}) => ({ from, to, kind: "ref", ...o });

// ver("1.4.2", "1.5.0", 2) shows 1.4.2, then 1.5.0 from step 2 on.
const ver = (first, ...rest) => {
  const out = [[first, 0]];
  for (let i = 0; i < rest.length; i += 2) out.push([rest[i], rest[i + 1]]);
  return out;
};

const project = (label, nodes, o = {}) => ({ label, nodes, ...o });

const chain = (y, versions = ["~1+dev", "~1", "~1.4"]) => [
  env("dev", 20, y, ALL, versions[0]),
  env("staging", 142, y, ALL, versions[1]),
  prod("prod", 264, y, ALL, versions[2]),
];

export const TOPOLOGIES = {
  "linear-promotion": {
    title: "Linear Promotion",
    steps: 3,
    nodes: [
      pill("rel", "publish 1.5.0", 68, 6),
      env("dev", 20, 64, ALL, ver("1.4.2", "1.5.0", 1)),
      env("staging", 142, 64, ALL, ver("1.4.2", "1.5.0", 2)),
      prod("prod", 264, 64, ALL, ver("1.4.2", "1.5.0", 3)),
    ],
    edges: [arrow("rel", "dev", { step: 1 }), arrow("dev", "staging", { step: 2 }), arrow("staging", "prod", { step: 3 })],
    projects: [project("project", ["dev", "staging", "prod"])],
  },

  "branch-mapped-promotion": {
    title: "Branch-Mapped Promotion",
    steps: 4,
    nodes: [
      pill("develop", "develop", 68, 6),
      pill("release", "release/*", 190, 6),
      pill("main", "main", 312, 6),
      env("dev", 20, 64, ["on", "dev", "on"], "+dev"),
      env("staging", 142, 64, ALL, ver("1.4.2", "1.5.0", 2)),
      prod("prod", 264, 64, ALL, ver("1.4.2", "1.5.0", 3, "1.5.1", 4)),
      pill("hotfix", "hotfix/*", 251, 132),
    ],
    edges: [
      arrow("develop", "dev", { step: 1 }),
      arrow("release", "staging", { step: 2 }),
      arrow("main", "prod", { step: 3 }),
      arrow("dev", "staging"),
      arrow("staging", "prod"),
      arrow("hotfix", "prod", { step: 4 }),
    ],
    projects: [project("project", ["dev", "staging", "prod"])],
  },

  "shared-integration": {
    title: "Shared Integration",
    steps: 2,
    nodes: [
      env("payments", 20, 28, ["dev", "ref", "ref"], "+dev"),
      env("search", 20, 84, ["ref", "dev", "ref"], "+dev"),
      env("billing", 20, 140, ["ref", "ref", "dev"], "+dev"),
      env("integration", 142, 84, ALL, ver("1.4.2", "1.5.0", 1)),
      prod("prod", 264, 84, ALL, ver("1.4.2", "1.5.0", 2)),
    ],
    edges: [
      arrow("payments", "integration", { step: 1 }),
      arrow("search", "integration", { step: 1 }),
      arrow("billing", "integration", { step: 1 }),
      arrow("integration", "prod", { step: 2 }),
    ],
    projects: [project("project", ["payments", "billing", "integration", "prod"])],
  },

  "pull-request-preview": {
    title: "Pull Request Preview",
    steps: 3,
    nodes: [
      prod("prod", 242, 56, ALL, "1.4.2"),
      eph("pr212", 32, 28, ["ref", "on", "dev"], "+dev", { in: 1, out: 3 }),
      eph("pr215", 32, 84, ["ref", "dev", "ref"], "+dev", { in: 2 }),
    ],
    edges: [fork("prod", "pr212", { step: 1, label: "fork" }), fork("prod", "pr215", { step: 2, label: "fork" })],
    projects: [project("project", ["prod", "pr212", "pr215"])],
  },

  "staged-preview": {
    title: "Staged Preview",
    steps: 3,
    nodes: [
      ...chain(28),
      eph("pr212", 81, 108, ["ref", "on", "dev"], "+dev", { in: 1, out: 3 }),
      eph("pr215", 203, 108, ["ref", "dev", "ref"], "+dev", { in: 2 }),
    ],
    edges: [
      arrow("dev", "staging"),
      arrow("staging", "prod"),
      fork("staging", "pr212", { step: 1 }),
      fork("staging", "pr215", { step: 2 }),
    ],
    projects: [project("project", ["dev", "prod", "pr212", "pr215"])],
  },

  "feature-environment": {
    title: "Feature Environment",
    steps: 4,
    nodes: [
      ...chain(28),
      eph("checkoutv2", 142, 108, ["ref", "dev", "dev"], "~2+dev", { in: 1 }),
      pill("prs", "pull requests", 190, 174, { in: 1 }),
    ],
    edges: [
      arrow("dev", "staging"),
      arrow("staging", "prod"),
      fork("staging", "checkoutv2", { step: 1 }),
      arrow("prs", "checkoutv2", { step: [2, 3, 4] }),
    ],
    projects: [project("project", ["dev", "prod", "checkoutv2"])],
  },

  "hotfix-environment": {
    title: "Hotfix Environment",
    steps: 3,
    nodes: [
      env("dev", 20, 28, ALL, "~1+dev"),
      env("staging", 142, 28, ALL, "~1"),
      prod("prod", 264, 28, ALL, ver("1.4.2", "1.4.3", 2)),
      eph("hotfix", 264, 108, ["ref", "ref", "dev"], "+dev", { in: 1, out: 3 }),
    ],
    edges: [
      arrow("dev", "staging"),
      arrow("staging", "prod"),
      fork("prod", "hotfix", { step: 1, dx: -12, label: "fork", labelDx: -24 }),
      arrow("hotfix", "prod", { step: 2, dx: 12, label: "patch", labelDx: 26 }),
    ],
    projects: [project("project", ["dev", "prod", "hotfix"])],
  },

  "blue-green": {
    title: "Blue/Green",
    steps: 5,
    hold: 0.5,
    nodes: [
      pill("traffic", "traffic", 110, 6),
      pill("release", "next release", 270, 6),
      env("blue", 62, 64, ["ref", "ref", "on"], "1.4.2", { live: [[0, 3]] }),
      env("green", 222, 64, ["ref", "ref", "on"], ver("1.4.2", "1.5.0", 1), { live: [[3, 99]] }),
    ],
    edges: [
      arrow("release", "green", { step: 1 }),
      arrow("traffic", "blue", { step: [1, 2, 3], out: 3 }),
      arrow("traffic", "green", { step: [4, 5], in: 3 }),
      uses("blue", "green", { label: "swap" }),
    ],
    projects: [project("project", ["blue", "green"])],
  },

  "canary-rings": {
    title: "Canary Rings",
    steps: 3,
    nodes: [
      pill("rel", "publish 1.5.0", 68, 6),
      prod("canary", 20, 64, ALL, ver("1.4.2", "1.5.0", 1)),
      prod("ring1", 142, 64, ALL, ver("1.4.2", "1.5.0", 2)),
      prod("ring2", 264, 64, ALL, ver("1.4.2", "1.5.0", 3)),
    ],
    edges: [arrow("rel", "canary", { step: 1 }), arrow("canary", "ring1", { step: 2 }), arrow("ring1", "ring2", { step: 3 })],
    projects: [project("project", ["canary", "ring1", "ring2"])],
  },

  "release-lines": {
    title: "Release Lines",
    steps: 3,
    nodes: [
      pill("p1", "publish 1.9.3", 68, 6),
      pill("p2", "publish 2.4.1", 190, 6),
      pill("p3", "publish 3.0.1", 312, 6),
      prod("prodv1", 20, 64, ALL, ver("1.9.2", "1.9.3", 1)),
      prod("prodv2", 142, 64, ALL, ver("2.4.0", "2.4.1", 2)),
      prod("prodv3", 264, 64, ALL, ver("3.0.0", "3.0.1", 3)),
    ],
    edges: [arrow("p1", "prodv1", { step: 1 }), arrow("p2", "prodv2", { step: 2 }), arrow("p3", "prodv3", { step: 3 })],
    projects: [project("project", ["prodv1", "prodv2", "prodv3"])],
  },

  "migration-pair": {
    title: "Migration Pair",
    steps: 4,
    hold: 1,
    nodes: [
      pill("traffic", "traffic", 190, 6),
      prod("old", 30, 64, ALL, "3.8.1", { label: "prod" }),
      prod("new", 254, 64, ["on", "on", "ref"], "1.0.0", { label: "prod" }),
    ],
    edges: [
      arrow("traffic", "old", { step: [1, 2], out: 3 }),
      arrow("traffic", "new", { step: [2, 3, 4], in: 1 }),
      uses("new", "old", { label: "remote reference" }),
    ],
    projects: [project("legacy project", ["old"]), project("new project", ["new"])],
  },

  "multi-region": {
    title: "Multi-Region",
    steps: 3,
    nodes: [
      pill("rel", "release 1.5.0", 68, 6),
      prod("useast", 20, 102, ALL, ver("1.4.2", "1.5.0", 1)),
      prod("euwest", 264, 58, ALL, ver("1.4.2", "1.5.0", 2)),
      prod("apsouth", 264, 146, ALL, ver("1.4.2", "1.5.0", 3)),
    ],
    edges: [
      arrow("rel", "useast", { step: 1 }),
      arrow("useast", "euwest", { step: 2, label: "promote" }),
      arrow("useast", "apsouth", { step: 3, label: "promote" }),
    ],
    projects: [project("project", ["useast", "euwest", "apsouth"])],
  },

  "hub-and-spoke": {
    title: "Hub and Spoke",
    steps: 2,
    nodes: [
      pill("plan", "reviewed plan", 190, 6),
      prod("hub", 142, 64, ALL, ver("1.2.0", "1.3.0", 1)),
      prod("useast", 20, 170, ALL, "~1"),
      prod("euwest", 142, 170, ALL, "~1"),
      prod("apsouth", 264, 170, ALL, "~1"),
    ],
    edges: [
      arrow("plan", "hub", { step: 1 }),
      uses("hub", "useast", { step: 2 }),
      uses("hub", "euwest", { step: 2 }),
      uses("hub", "apsouth", { step: 2 }),
    ],
    projects: [project("hub project", ["hub"]), project("application project", ["useast", "euwest", "apsouth"])],
  },

  "disaster-recovery-standby": {
    title: "Disaster Recovery Standby",
    steps: 5,
    hold: 0.5,
    nodes: [
      pill("traffic", "traffic", 148, 6),
      pill("rel", "release", 44, 74),
      env("primary", 100, 64, ALL, ver("1.4.2", "1.5.0", 1), { live: [[0, 3]] }),
      env("standby", 262, 64, ALL, ver("1.4.2", "1.5.0", 2), { live: [[3, 99]] }),
    ],
    edges: [
      arrow("rel", "primary", { step: 1 }),
      arrow("primary", "standby", { step: 2, label: "promote" }),
      arrow("traffic", "primary", { step: [1, 2, 3], out: 3 }),
      arrow("traffic", "standby", { step: [4, 5], in: 3, label: "failover" }),
    ],
    projects: [project("project", ["primary", "standby"])],
  },

  "multi-cloud": {
    title: "Multi-Cloud",
    steps: 1,
    hold: 1.5,
    nodes: [
      pill("pub", "publish app 2.3.0", 190, 6),
      prod("aws", 30, 64, ALL, ver("2.2.0", "2.3.0", 1), { label: "prod" }),
      prod("azure", 254, 64, ALL, ver("2.2.0", "2.3.0", 1), { label: "prod" }),
    ],
    edges: [arrow("pub", "aws", { step: 1 }), arrow("pub", "azure", { step: 1 })],
    projects: [project("aws project", ["aws"]), project("azure project", ["azure"])],
  },

  "site-fleet": {
    title: "Site Fleet",
    steps: 3,
    nodes: [
      env("template", 142, 32, OFF, "1.5.0"),
      prod("store001", 18, 120, ["on", "on"], ver("1.4.2", "1.5.0", 1), { w: 80 }),
      prod("store002", 107, 120, ["on", "on"], ver("1.4.2", "1.5.0", 1), { w: 80 }),
      prod("store003", 196, 120, ["on", "on"], ver("1.4.2", "1.5.0", 2), { w: 80 }),
      prod("store004", 285, 120, ["on", "on"], "1.5.0", { w: 80, in: 3 }),
    ],
    edges: [
      arrow("template", "store001", { step: 1 }),
      arrow("template", "store002", { step: 1 }),
      arrow("template", "store003", { step: 2 }),
      fork("template", "store004", { step: 3 }),
    ],
    projects: [project("project", ["template", "store001", "store004"])],
  },

  "single-tenant": {
    title: "Single-Tenant",
    steps: 2,
    nodes: [
      env("template", 142, 32, OFF, "1.5.0"),
      prod("acme", 20, 120, ALL, ver("1.4.2", "1.5.0", 1)),
      prod("globex", 142, 120, ALL, "1.4.2"),
      prod("initech", 264, 120, ALL, ver("1.3.9", "1.5.0", 2)),
    ],
    edges: [
      arrow("template", "acme", { step: 1 }),
      arrow("template", "globex"),
      arrow("template", "initech", { step: 2 }),
    ],
    projects: [project("project", ["template", "acme", "initech"])],
  },

  cells: {
    title: "Cells",
    steps: 4,
    nodes: [
      pill("rel", "release", 60, 44),
      prod("router", 142, 32, ["on", "on"], undefined),
      prod("cell1", 16, 130, ["on", "on"], ver("1.4.2", "1.5.0", 1), { w: 76 }),
      prod("cell2", 104, 130, ["on", "on"], ver("1.4.2", "1.5.0", 2), { w: 76 }),
      prod("cell3", 192, 130, ["on", "on"], ver("1.4.2", "1.5.0", 3), { w: 76 }),
      prod("cell4", 280, 130, ["on", "on"], "1.5.0", { w: 76, in: 4 }),
    ],
    edges: [
      uses("router", "cell1"),
      uses("router", "cell2"),
      uses("router", "cell3"),
      uses("router", "cell4", { in: 4 }),
      arrow("rel", "cell1", { step: 1 }),
      arrow("cell1", "cell2", { step: 2 }),
      arrow("cell2", "cell3", { step: 3 }),
      fork("cell3", "cell4", { step: 4 }),
    ],
    projects: [project("router project", ["router"]), project("cells project", ["cell1", "cell4"])],
  },

  "tiered-tenancy": {
    title: "Tiered Tenancy",
    steps: 2,
    nodes: [
      pill("pub", "publish 1.5.1", 85, 6),
      prod("pool", 20, 64, ALL, ver("1.5.0", "1.5.1", 1), { w: 130 }),
      prod("acme", 170, 64, ALL, ver("1.4.2", "1.5.1", 2), { w: 84 }),
      prod("globex", 270, 64, ALL, "1.4.2", { w: 84 }),
    ],
    edges: [arrow("pub", "pool", { step: 1 }), arrow("pool", "acme", { step: 2 })],
    projects: [project("project", ["pool", "acme", "globex"])],
  },

  "compliance-partition": {
    title: "Compliance Partition",
    steps: 2,
    nodes: [
      prod("prod", 16, 64, ALL, "1.5.0"),
      prod("govcloud", 126, 64, ALL, ver("1.4.2", "1.5.0", 1)),
      prod("air", 270, 64, ALL, ver("1.4.2", "1.5.0", 2), { label: "prod", w: 90 }),
    ],
    edges: [arrow("prod", "govcloud", { step: 1 }), fork("govcloud", "air", { step: 2 })],
    projects: [project("project", ["prod", "govcloud"]), project("air-gapped install", ["air"])],
  },

  "developer-workspace": {
    title: "Developer Workspace",
    steps: 4,
    nodes: [
      env("dev", 142, 28, ALL, "~1"),
      eph("alice", 20, 116, ["dev", "ref", "ref"], undefined, { in: 1 }),
      eph("bob", 142, 116, ["ref", "dev", "ref"], undefined, { in: 2, out: 4 }),
      eph("carol", 264, 116, ["ref", "ref", "dev"], undefined, { in: 3 }),
    ],
    edges: [fork("dev", "alice", { step: 1 }), fork("dev", "bob", { step: 2 }), fork("dev", "carol", { step: 3 })],
    projects: [project("project", ["dev", "alice", "carol"])],
  },

  "team-environment": {
    title: "Team Environment",
    steps: 3,
    nodes: [
      env("payments", 20, 36, ["on", "ref", "ref"], "+dev"),
      env("search", 264, 36, ["ref", "on", "ref"], "~1"),
      env("billing", 142, 120, ["ref", "ref", "on"], "~1.4"),
    ],
    edges: [
      uses("payments", "search", { step: 1 }),
      uses("search", "billing", { step: 2 }),
      uses("billing", "payments", { step: 3 }),
    ],
    projects: [project("project", ["payments", "search", "billing"])],
  },

  "agent-workspace": {
    title: "Agent Workspace",
    steps: 4,
    hold: 1,
    nodes: [
      env("staging", 142, 28, ALL, "~1"),
      eph("task481", 20, 116, ["dev", "ref", "ref"], undefined, { in: 1, out: 3 }),
      eph("task482", 142, 116, ["ref", "dev", "ref"], undefined, { in: 2, out: 4.5 }),
      eph("task483", 264, 116, ["dev", "dev", "ref"], undefined, { in: 3 }),
    ],
    edges: [
      fork("staging", "task481", { step: 1 }),
      fork("staging", "task482", { step: 2 }),
      fork("staging", "task483", { step: 3 }),
    ],
    projects: [project("project", ["staging", "task481", "task483"])],
  },

  "training-environment": {
    title: "Training Environment",
    steps: 3,
    nodes: [
      env("template", 142, 28, OFF, "1.5.0"),
      ...["seat01", "seat02", "seat03", "seat04"].map((id, i) =>
        eph(id, 16 + i * 88, 116, ALL, undefined, { w: 76, in: 1, out: 3 })
      ),
    ],
    edges: ["seat01", "seat02", "seat03", "seat04"].map((id) => fork("template", id, { step: 1 })),
    projects: [project("project", ["template", "seat01", "seat04"])],
  },

  "load-test": {
    title: "Load Test",
    steps: 4,
    nodes: [
      prod("prod", 20, 64, ALL, "1.5.0"),
      eph("loadtest", 264, 64, ALL, "1.5.0", { in: 1, out: 4 }),
      pill("gen", "load generator", 312, 6, { in: 1, out: 4 }),
    ],
    edges: [fork("prod", "loadtest", { step: 1, label: "fork" }), arrow("gen", "loadtest", { step: [2, 3] })],
    projects: [project("project", ["prod", "loadtest"])],
  },

  "security-and-chaos-target": {
    title: "Security and Chaos Target",
    steps: 4,
    nodes: [
      prod("prod", 20, 64, ALL, "1.5.0"),
      eph("pentest", 264, 64, ALL, "1.5.0", { in: 1, out: 4 }),
      pill("chaos", "fault injection", 312, 6, { in: 1, out: 4 }),
    ],
    edges: [fork("prod", "pentest", { step: 1, label: "re-fork" }), arrow("chaos", "pentest", { step: [2, 3] })],
    projects: [project("project", ["prod", "pentest"])],
  },

  demo: {
    title: "Demo",
    steps: 2,
    nodes: [
      pill("pub", "publish 1.6.0", 68, 6),
      pill("sched", "nightly", 312, 6),
      env("staging", 20, 64, ALL, ver("1.5.0", "1.6.0", 1)),
      env("demo", 264, 64, ALL, ver("1.5.0", "1.6.0", 2)),
    ],
    edges: [
      arrow("pub", "staging", { step: 1 }),
      arrow("sched", "demo", { step: 2 }),
      fork("staging", "demo", { step: 2, label: "re-fork" }),
    ],
    projects: [project("project", ["staging", "demo"])],
  },

  "partner-sandbox": {
    title: "Partner Sandbox",
    steps: 4,
    nodes: [
      pill("rel", "release 1.6.0", 68, 6),
      env("sandbox", 20, 64, ALL, ver("1.5.0", "1.6.0", 1)),
      prod("prod", 264, 64, ALL, ver("1.5.0", "1.6.0", 4)),
      pill("pa", "partner a", 40, 132),
      pill("pb", "partner b", 122, 132),
    ],
    edges: [
      arrow("rel", "sandbox", { step: 1 }),
      arrow("pa", "sandbox", { step: [2, 3] }),
      arrow("pb", "sandbox", { step: [2, 3] }),
      arrow("sandbox", "prod", { step: 4, label: "promote" }),
    ],
    projects: [project("project", ["sandbox", "prod"])],
  },

  spike: {
    title: "Spike",
    steps: 3,
    nodes: [...chain(28), eph("spike", 20, 108, ["dev", "dev", "on"], "+dev", { in: 1, out: 3 })],
    edges: [arrow("dev", "staging"), arrow("staging", "prod"), fork("dev", "spike", { step: 1 })],
    projects: [project("project", ["dev", "prod", "spike"])],
  },

  scheduled: {
    title: "Scheduled",
    steps: 4,
    nodes: [
      env("staging", 20, 64, ALL, "~1"),
      eph("nightly", 264, 64, ALL, "~1", { in: 1, out: 4 }),
      pill("tests", "test suite", 312, 6, { in: 1, out: 4 }),
    ],
    edges: [fork("staging", "nightly", { step: 1, label: "fork at 18:00" }), arrow("tests", "nightly", { step: [2, 3] })],
    projects: [project("project", ["staging", "nightly"])],
  },

  singleton: {
    title: "Singleton",
    steps: 2,
    nodes: [
      pill("plan", "reviewed plan", 190, 6),
      prod("global", 142, 64, ALL, ver("1.2.0", "1.3.0", 1)),
      prod("billing", 30, 170, ALL, "~1", { label: "prod" }),
      prod("search", 254, 170, ALL, "~1", { label: "prod" }),
    ],
    edges: [arrow("plan", "global", { step: 1 }), uses("global", "billing", { step: 2 }), uses("global", "search", { step: 2 })],
    projects: [
      project("organization project", ["global"]),
      project("billing project", ["billing"]),
      project("search project", ["search"]),
    ],
  },

  "platform-layer": {
    title: "Platform Layer",
    steps: 4,
    nodes: [
      env("dev", 20, 36, ALL, "~1+dev"),
      env("staging", 142, 36, ALL, "~1"),
      prod("prod", 264, 36, ALL, "~1.4"),
      env("nonprod", 81, 150, ALL, ver("1.6.0", "1.7.0", 1), { pulse: [1] }),
      prod("pprod", 203, 150, ALL, ver("1.6.0", "1.7.0", 3), { label: "prod", pulse: [3] }),
    ],
    edges: [
      uses("nonprod", "dev", { step: 2 }),
      uses("nonprod", "staging", { step: 2 }),
      uses("pprod", "prod", { step: 4 }),
    ],
    projects: [project("application project", ["dev", "staging", "prod"]), project("platform project", ["nonprod", "pprod"])],
  },
};

const TWO = ["on", "on"];
const W82C = { w: 82 };
const pair = (a, av, b, bv, c = ALL, arrowed = false, label = "project") => ({
  steps: 0,
  nodes: [env(a, 52, 32, c, av), prod(b, 232, 32, c, bv)],
  edges: arrowed ? [arrow(a, b)] : [],
  projects: [project(label, [a, b])],
});
const regions = (comps, versions, label) => ({
  steps: 0,
  nodes: [
    env("nonuseast", 20, 32, comps, versions[0]),
    prod("produseast", 142, 32, comps, versions[1]),
    prod("prodeuwest", 264, 32, comps, versions[2]),
  ],
  edges: [],
  projects: [project(label, ["nonuseast", "prodeuwest"])],
});

export const CANVASES = {
  organization: {
    title: "Organization canvas",
    steps: 0,
    nodes: [prod("global", 142, 32, ALL, "1.2.0")],
    edges: [],
    projects: [project("organization project", ["global"])],
  },
  network: { title: "Network canvas", ...regions(TWO, ["~1", "1.2.0", "1.2.0"], "network project") },
  "compute-platform": { title: "Compute Platform canvas", ...regions(ALL, ["~1", "1.6.1", "1.6.1"], "compute platform project") },
  "shared-services": { title: "Shared Services canvas", ...pair("nonprod", "~1", "prod", "1.3.0", ALL, false, "shared services project") },
  edge: { title: "Edge canvas", ...pair("staging", "~1", "prod", "1.1.4", TWO, true, "edge project") },
  application: {
    title: "Application canvas",
    steps: 0,
    nodes: [
      env("dev", 11, 32, ALL, "+dev", W82C),
      env("staging", 103, 32, ALL, "~1", W82C),
      prod("produseast", 195, 32, ALL, "1.4.2", W82C),
      prod("prodeuwest", 287, 32, ALL, "1.4.2", W82C),
    ],
    edges: [],
    projects: [project("application project", ["dev", "prodeuwest"])],
  },
  "data-platform": { title: "Data Platform canvas", ...pair("dev", "~1", "prod", "1.0.3", TWO, true, "data platform project") },
  "tenant-stack": {
    title: "Tenant Stack canvas",
    steps: 0,
    nodes: [
      env("template", 20, 32, OFF, "1.5.0"),
      prod("acme", 142, 32, ALL, "1.5.0"),
      prod("globex", 264, 32, ALL, "1.4.2"),
    ],
    edges: [],
    projects: [project("tenant stack project", ["template", "globex"])],
  },
};

// An organization's projects, each with its own topology, connected by
// environment defaults and remote references.
const W82 = { w: 82 };
export const ORGANIZATION = {
  title: "Example organization",
  build: true,
  buildStep: 0.7,
  begin: 3.6,
  steps: 8,
  hold: 1.5,
  stepDur: 1.1,
  nodes: [
    env("e-stg", 103, 32, ["on", "on"], undefined, { ...W82, label: "staging", build: 4 }),
    prod("e-prod", 241, 32, ["on", "on"], undefined, { ...W82, label: "prod", build: 4 }),
    env("b-dev", 11, 136, ALL, ver("1.7.0", "1.8.0", 1), { ...W82, label: "dev", build: 3, pulse: [1] }),
    env("b-stg", 103, 136, ALL, ver("1.7.0", "1.8.0", 2), { ...W82, label: "staging", build: 3, pulse: [2] }),
    prod("b-use", 195, 136, ALL, ver("1.7.0", "1.8.0", 3), { ...W82, label: "produseast", build: 3, pulse: [3] }),
    prod("b-euw", 287, 136, ALL, ver("1.7.0", "1.8.0", 4), { ...W82, label: "prodeuwest", build: 3, pulse: [4] }),
    env("c-non", 57, 240, ["on", "on", "on"], undefined, { ...W82, label: "nonuseast", build: 2 }),
    prod("c-use", 195, 240, ["on", "on", "on"], undefined, { ...W82, label: "produseast", build: 2 }),
    prod("c-euw", 287, 240, ["on", "on", "on"], undefined, { ...W82, label: "prodeuwest", build: 2 }),
    env("n-non", 57, 344, ["on", "on"], undefined, { ...W82, label: "nonuseast", build: 1 }),
    prod("n-use", 195, 344, ["on", "on"], ver("1.2.0", "1.3.0", 5), { ...W82, label: "produseast", build: 1, pulse: [5] }),
    prod("n-euw", 287, 344, ["on", "on"], undefined, { ...W82, label: "prodeuwest", build: 1 }),
    prod("global", 142, 448, ALL, undefined, { label: "global", build: 0 }),
  ],
  edges: [
    uses("b-stg", "e-stg"),
    uses("b-use", "e-prod", { step: 8 }),
    uses("b-euw", "e-prod"),
    uses("c-non", "b-dev"),
    uses("c-non", "b-stg"),
    uses("c-use", "b-use", { step: 7 }),
    uses("c-euw", "b-euw"),
    uses("n-non", "c-non"),
    uses("n-use", "c-use", { step: 6 }),
    uses("n-euw", "c-euw"),
    uses("global", "n-non"),
    uses("global", "n-use"),
    uses("global", "n-euw"),
  ],
  projects: [
    project("edge project", [], { box: { x: 96, y: 8, w: 280, h: 78 }, topology: "Linear Promotion", build: 4 }),
    project("billing api project", [], { box: { x: 4, y: 112, w: 372, h: 78 }, topology: "Linear Promotion, Multi-Region", build: 3 }),
    project("compute platform project", [], { box: { x: 4, y: 216, w: 372, h: 78 }, topology: "Platform Layer", build: 2 }),
    project("network project", [], { box: { x: 4, y: 320, w: 372, h: 78 }, topology: "Multi-Region", build: 1 }),
    project("organization project", [], { box: { x: 96, y: 424, w: 188, h: 78 }, topology: "Singleton", build: 0 }),
  ],
};
