import React from "react";
import s from "./styles.module.css";
import { Figure, Box, Arrow, Label } from "./primitives";

export function ConceptLifecycle() {
  const steps = [
    ["BUNDLE", "PostgreSQL", "versioned IaC package"],
    ["COMPONENT", "user-db", "a bundle on a project's blueprint"],
    ["INSTANCE", "user-db in prod", "a component in one environment"],
    ["DEPLOYMENT", "provision #42", "one provision, plan, or decommission"],
  ];
  const w = 158;
  const gap = 24;
  return (
    <Figure
      uid="concept-lifecycle"
      width={720}
      height={104}
      label="A bundle is a versioned IaC package. Adding it to a project's blueprint makes a component. Each environment of the project has one instance of the component. Each provision, plan, or decommission of an instance is a deployment."
    >
      {steps.map(([h, n, m], i) => {
        const x = 8 + i * (w + gap);
        return (
          <g key={h}>
            <Box x={x} y={8} w={w} h={88} tone={i === 3 ? "accent" : "surface"} lines={[["heading", h], ["name", n], ["muted", m.length > 22 ? m.slice(0, m.lastIndexOf(" ", 22)) : m], ["muted", m.length > 22 ? m.slice(m.lastIndexOf(" ", 22) + 1) : ""]]} />
            {i > 0 && <Arrow tone="Accent" d={`M ${x - gap} 52 L ${x - 2} 52`} />}
          </g>
        );
      })}
    </Figure>
  );
}

export function ChangeFlow() {
  const stops = [
    ["PUBLISH", "mass bundle", "publish", "channels follow"],
    ["LOWER ENV", "preview, fork,", "or sandbox", "validate"],
    ["STAGING", "mass instance", "promote", "copies config"],
    ["GATE", "deploy, or", "propose and", "approve"],
    ["PRODUCTION", "deployment", "runs", "own credentials"],
  ];
  const w = 124;
  const gap = 22;
  return (
    <Figure
      uid="change-flow"
      width={720}
      height={168}
      label="A bundle version is published, validated in a preview, forked, or sandbox environment, then in staging. mass instance promote copies the instance's configuration to production, where the environment's access policy decides whether the requester deploys or proposes for approval. A failed change is rolled back to a past deployment with rollbackDeployment, which creates a proposal."
    >
      {stops.map(([h, a, b, m], i) => {
        const x = 8 + i * (w + gap);
        return (
          <g key={h}>
            <Box x={x} y={8} w={w} h={86} tone={i === 4 ? "accent" : i === 3 ? "well" : "surface"} lines={[["heading", h], ["body", a], ["body", b], ["muted", m]]} />
            {i > 0 && <Arrow tone="Accent" d={`M ${x - gap} 51 L ${x - 2} 51`} />}
          </g>
        );
      })}
      <Arrow tone="Danger" d={`M ${8 + 4 * (w + gap) + w / 2} 94 L ${8 + 4 * (w + gap) + w / 2} 128 L ${8 + 3 * (w + gap) + w / 2} 128 L ${8 + 3 * (w + gap) + w / 2} 96`} />
      <Label x={8 + 3 * (w + gap) + w + gap / 2} y={146} kind="danger">rollbackDeployment</Label>
      <Label x={8 + 3 * (w + gap) + w + gap / 2} y={160}>a proposal for a past deployment</Label>
    </Figure>
  );
}

export function VersionLifecycle() {
  return (
    <Figure
      uid="version-lifecycle"
      width={720}
      height={318}
      label="Set the version in massdriver.yaml. mass bundle publish -d publishes a development release such as 1.2.0-dev.20261127T153000Z, and can be repeated while 1.2.0 is unpublished. mass bundle publish publishes the immutable 1.2.0, after which the next change needs a new version. Each instance's version field picks a release: an exact version, a channel such as ~1.2 or latest that resolves to the newest stable match, or a development channel such as ~1.2+dev that includes development releases."
    >
      <Box x={8} y={92} w={168} h={76} tone="well" lines={[["heading", "MASSDRIVER.YAML"], ["name", "version: 1.2.0"], ["muted", "repository must exist"]]} />

      <Arrow tone="Accent" d="M 176 116 C 206 116, 206 50, 236 50" />
      <Label x={200} y={64} anchor="end">publish -d</Label>
      <Box x={238} y={8} w={212} h={84} lines={[["heading", "DEVELOPMENT RELEASE"], ["body", "1.2.0-dev."], ["body", "20261127T153000Z"], ["muted", "repeat while you iterate"]]} />

      <Arrow tone="Accent" d="M 176 144 C 206 144, 206 210, 236 210" />
      <Label x={200} y={200} anchor="end">publish</Label>
      <Box x={238} y={168} w={212} h={84} tone="accent" lines={[["heading", "STABLE RELEASE"], ["accent", "1.2.0"], ["muted", "immutable; no more -dev"], ["muted", "builds of 1.2.0"]]} />
      <Arrow tone="Accent" dashed d="M 344 92 L 344 166" />
      <Label x={352} y={134} anchor="start">ready</Label>

      <Label x={496} y={24} kind="heading" anchor="start">INSTANCE VERSION FIELD</Label>
      <Box x={496} y={36} w={216} h={60} lines={[["body", "~1.2+dev  latest+dev"], ["muted", "includes development releases"]]} top={24} />
      <Box x={496} y={106} w={216} h={60} tone="accent" lines={[["accent", "1.2.0"], ["muted", "exact pin"]]} top={24} />
      <Box x={496} y={176} w={216} h={60} tone="accent" lines={[["accent", "~1.2  ~1  latest"], ["muted", "newest stable match"]]} top={24} />
      <Arrow d="M 450 50 L 494 62" />
      <Arrow tone="Accent" d="M 450 200 C 472 200, 472 136, 494 136" />
      <Arrow tone="Accent" d="M 450 214 L 494 206" />
      <Label x={360} y={290}>the next change bumps the version in massdriver.yaml and starts over</Label>
      <Label x={360} y={306}>a channel instance that is deployed runs each new matching release</Label>
    </Figure>
  );
}

export function AttributeCascade() {
  const node = (x, y, name, tone = "surface", w = 132) => (
    <Box x={x} y={y} w={w} h={40} tone={tone} lines={[["name", name]]} top={25} center />
  );
  return (
    <Figure
      uid="attr-cascade"
      width={720}
      height={334}
      label="System attributes cascade down. Project feeds environment and component. Environment and component both feed instance. Instance feeds its deployments and the resources it produces. A resource type adds only md-resource-type to each resource."
    >
      {node(294, 8, "Project")}
      {node(150, 88, "Environment")}
      {node(438, 88, "Component")}
      {node(294, 168, "Instance", "accent")}
      {node(150, 268, "Deployment")}
      {node(438, 268, "Resource", "accent")}
      <Box x={584} y={160} w={128} h={52} tone="well" lines={[["name", "Resource type"], ["muted", "md-resource-type"]]} top={23} center />

      <Arrow tone="Accent" d="M 330 48 C 330 68, 216 68, 216 86" />
      <Arrow tone="Accent" d="M 396 48 C 396 68, 504 68, 504 86" />
      <Arrow tone="Accent" d="M 216 128 C 216 148, 330 148, 330 166" />
      <Arrow tone="Accent" d="M 504 128 C 504 148, 396 148, 396 166" />
      <Arrow tone="Accent" d="M 330 208 C 330 238, 216 238, 216 266" />
      <Arrow tone="Accent" d="M 396 208 C 396 238, 504 238, 504 266" />
      <Arrow d="M 648 212 C 648 248, 570 248, 570 266" />

      <Label x={40} y={112} anchor="start">md-environment</Label>
      <Label x={580} y={112} anchor="start">md-component</Label>
      <Label x={580} y={126} anchor="start">md-repo</Label>
      <Label x={186} y={190} anchor="start">md-instance</Label>
      <Label x={186} y={204} anchor="start">md-bundle</Label>
      <Label x={360} y={72}>md-project</Label>
      <Label x={360} y={328}>a deployment and a resource each carry their instance&#8217;s attributes, with their own md-id</Label>
    </Figure>
  );
}

export function DeliverySequence() {
  const lanes = [
    { x: 90, name: "Audit log" },
    { x: 360, name: "Massdriver" },
    { x: 630, name: "Your endpoint" },
  ];
  const msg = (y, from, to, text, tone = "", dashed = false) => {
    const a = lanes[from].x;
    const b = lanes[to].x;
    const dir = b > a ? -1 : 1;
    return (
      <g>
        <Arrow tone={tone} dashed={dashed} d={`M ${a} ${y} L ${b + dir * 4} ${y}`} />
        <Label x={(a + b) / 2} y={y - 6} kind={tone === "Accent" ? "accentSmall" : tone === "Danger" ? "danger" : "muted"}>
          {text}
        </Label>
      </g>
    );
  };
  const note = (y, text, tone = "surface") => (
    <g>
      <rect className={tone === "accent" ? s.surfaceAccent : tone === "danger" ? s.surfaceDanger : s.surface} x={170} y={y} width={380} height={24} rx={4} />
      <text className={tone === "accent" ? s.accentSmall : tone === "danger" ? s.danger : s.muted} x={360} y={y + 16} textAnchor="middle">
        {text}
      </text>
    </g>
  );
  return (
    <Figure
      uid="delivery-seq"
      width={720}
      height={392}
      label="Events 1 and 2 are recorded in the audit log. Massdriver makes one delivery for each event that matches the destination's Events and Attributes. Event 1, attempt 1, fails with an error Massdriver retries, so event 1 stays PENDING and waits at least 30 seconds, and Massdriver stops sending for now. Within a minute Massdriver sends event 2, which succeeds and is DELIVERED. Then event 1, attempt 2, succeeds and is DELIVERED."
    >
      {lanes.map((l) => (
        <g key={l.name}>
          <Box x={l.x - 70} y={8} w={140} h={32} lines={[["body", l.name]]} top={20} center />
          <path className={`${s.route} ${s.dashed}`} d={`M ${l.x} 40 L ${l.x} 384`} />
        </g>
      ))}
      {msg(72, 0, 1, "events 1 and 2")}
      {note(84, "one delivery per event matching Events and Attributes")}
      {msg(140, 1, 2, "event 1, attempt 1", "Accent")}
      {msg(170, 2, 1, "retryable failure", "Danger", true)}
      {note(182, "event 1 PENDING: waits 30s or more; drain stops", "danger")}
      {msg(240, 1, 2, "event 2, attempt 1, within a minute", "Accent")}
      {msg(270, 2, 1, "success", "", true)}
      {note(282, "event 2 DELIVERED", "accent")}
      {msg(330, 1, 2, "event 1, attempt 2", "Accent")}
      {msg(352, 2, 1, "success", "", true)}
      {note(360, "event 1 DELIVERED", "accent")}
    </Figure>
  );
}

export function IdentityTokenChain() {
  return (
    <Figure
      uid="id-token"
      width={720}
      height={240}
      label="When a deployment is queued, Massdriver signs four tokens and writes them into the provisioner pod, for example /massdriver/oidc/environment.jwt. The bundle's IaC gives one to the cloud's token exchange: AWS STS, GCP Security Token Service, or Microsoft Entra ID. The exchange fetches Massdriver's public keys from the issuer, verifies the token, matches its subject against your trust rule, and returns a short-lived credential."
    >
      <Box x={8} y={8} w={196} h={104} lines={[["heading", "MASSDRIVER"], ["body", "queues the deployment"], ["body", "signs 4 tokens:"], ["muted", "organization, project,"], ["muted", "environment, instance"]]} />
      <Arrow tone="Accent" d="M 204 60 L 250 60" />
      <Box x={252} y={8} w={216} h={104} tone="well" lines={[["heading", "PROVISIONER POD"], ["accent", "/massdriver/oidc/"], ["accent", "environment.jwt"], ["muted", "one file per level"], ["muted", "IaC picks one"]]} />
      <Arrow tone="Accent" d="M 468 60 L 514 60" />
      <Box x={516} y={8} w={196} h={104} lines={[["heading", "CLOUD TOKEN EXCHANGE"], ["body", "AWS STS"], ["body", "GCP STS"], ["body", "Microsoft Entra ID"]]} />

      <Arrow d="M 614 112 L 614 150" />
      <Box x={516} y={152} w={196} h={80} lines={[["heading", "VERIFY"], ["body", "keys from issuer's"], ["body", "/.well-known/jwks.json"], ["muted", "trust rule matches sub"]]} />
      <Arrow tone="Accent" d="M 516 192 L 470 192" />
      <Box x={252} y={152} w={216} h={80} tone="accent" lines={[["heading", "SHORT-LIVED CREDENTIAL"], ["accentSmall", "in your cloud account"], ["muted", "used by the IaC for"], ["muted", "this deployment"]]} />
    </Figure>
  );
}

export function ProvisionerIdentityChain() {
  return (
    <Figure
      uid="prov-identity"
      width={720}
      height={224}
      label="Every deployment step runs in an Argo Workflow pod with the provisioner ServiceAccount, massdriver-provisioner by default. The chart annotates that ServiceAccount with a cloud identity. The cluster's workload identity, EKS IRSA or Pod Identity, GKE Workload Identity, or AKS Workload ID, gives the pod a short-lived credential for the provisioner identity in your platform account. The IaC uses it to reach the target account by assuming a role, impersonating a service account, or exchanging a federated token for a managed identity."
    >
      <Box x={8} y={8} w={216} h={100} tone="well" lines={[["heading", "ARGO WORKFLOW POD"], ["body", "ServiceAccount"], ["accent", "massdriver-provisioner"], ["muted", "annotated with a"], ["muted", "cloud identity"]]} />
      <Arrow tone="Accent" d="M 224 58 L 260 58" />
      <Box x={262} y={8} w={216} h={100} lines={[["heading", "CLUSTER WORKLOAD ID"], ["body", "EKS IRSA / Pod Identity"], ["body", "GKE Workload Identity"], ["body", "AKS Workload ID"], ["muted", "short-lived credential"]]} />
      <Arrow tone="Accent" d="M 478 58 L 514 58" />
      <Box x={516} y={8} w={196} h={100} lines={[["heading", "PROVISIONER IDENTITY"], ["body", "in your platform"], ["body", "account"], ["muted", "one identity for"], ["muted", "every deployment"]]} />
      <Arrow tone="Accent" d="M 614 108 L 614 156" />
      <Box x={262} y={158} w={450} h={58} tone="accent" lines={[["heading", "TARGET CLOUD ACCOUNT"], ["accentSmall", "AWS: assume role  ·  GCP: impersonate SA  ·  Azure: federated token"]]} top={24} />
    </Figure>
  );
}
