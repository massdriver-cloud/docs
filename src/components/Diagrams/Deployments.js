import React from "react";
import s from "./styles.module.css";
import { Figure, Box, Arrow, Label } from "./primitives";

const PW = 104;
const PH = 32;

function Status({ x, y, name, tone = "surface", w = PW }) {
  return (
    <g>
      <rect className={STATUS_TONE[tone]} x={x} y={y} width={w} height={PH} rx={PH / 2} />
      <text className={tone === "accent" ? s.accent : tone === "danger" ? s.danger : s.body} x={x + w / 2} y={y + 20} textAnchor="middle">
        {name}
      </text>
    </g>
  );
}

const STATUS_TONE = {
  surface: s.surface,
  accent: s.surfaceAccent,
  danger: s.surfaceDanger,
  ghost: s.surfaceGhost,
};

export function DeploymentSnapshot() {
  return (
    <Figure
      uid="dep-snapshot"
      width={720}
      height={132}
      label="When a deployment is created, it copies the instance's params, resolved connections, and bundle version. The provisioner applies that frozen copy to real infrastructure. Later edits to the instance do not change it."
    >
      <Box x={8} y={14} w={200} h={104} tone="well" lines={[["heading", "INSTANCE"], ["name", "instance.params"], ["muted", "the desired configuration"], ["muted", "edits change the next"], ["muted", "deployment only"]]} />
      <Arrow tone="Accent" d="M 208 66 L 266 66" />
      <Label x={237} y={56}>copy</Label>
      <Box x={268} y={14} w={220} h={104} tone="accent" lines={[["heading", "DEPLOYMENT"], ["body", "params"], ["body", "connection_params"], ["body", "bundle version"], ["muted", "frozen when created"]]} />
      <Arrow tone="Accent" d="M 488 66 L 546 66" />
      <Box x={548} y={14} w={164} h={104} lines={[["heading", "PROVISIONER"], ["body", "applies the copy"], ["muted", "to real"], ["muted", "infrastructure"]]} />
    </Figure>
  );
}

function Tail({ x, y }) {
  return (
    <g>
      <Arrow tone="Accent" d={`M ${x + 84} ${y + 16} L ${x + 96} ${y + 16}`} />
      <Status x={x + 98} y={y} name="RUNNING" w={84} />
      <Arrow tone="Accent" d={`M ${x + 182} ${y + 16} L ${x + 194} ${y + 16}`} />
      <Status x={x + 196} y={y} name="COMPLETED" w={86} tone="accent" />
    </g>
  );
}

export function DirectDeployment() {
  return (
    <Figure
      uid="dep-direct"
      width={720}
      height={84}
      label="createDeployment writes the submitted params to instance.params at once, then the deployment is queued as PENDING, runs, and completes."
    >
      <Box x={8} y={8} w={164} h={52} lines={[["name", "createDeployment"], ["muted", "params submitted"]]} top={25} />
      <Arrow tone="Accent" d="M 172 34 L 334 34" />
      <Label x={253} y={26} kind="accentSmall">writes instance.params</Label>
      <Label x={253} y={50}>immediately</Label>
      <Status x={336} y={18} name="PENDING" w={84} />
      <Tail x={336} y={18} />
      <Label x={360} y={78}>a PLAN deployment is queued the same way and leaves instance.params alone</Label>
    </Figure>
  );
}

export function ProposedDeployment() {
  return (
    <Figure
      uid="dep-propose"
      width={720}
      height={136}
      label="proposeDeployment creates a PROPOSED deployment and leaves instance.params untouched. approveDeployment writes the proposal's params to instance.params and queues it as APPROVED, then it runs and completes. rejectDeployment ends it as REJECTED with nothing written."
    >
      <Box x={8} y={8} w={164} h={52} lines={[["name", "proposeDeployment"], ["muted", "params stay on it"]]} top={25} />
      <Arrow tone="Accent" d="M 172 34 L 186 34" />
      <Status x={188} y={18} name="PROPOSED" w={92} />
      <Arrow tone="Accent" d="M 280 34 L 434 34" />
      <Label x={357} y={26} kind="accentSmall">approveDeployment</Label>
      <Label x={357} y={50}>writes instance.params</Label>
      <Status x={436} y={18} name="APPROVED" w={84} tone="accent" />
      <Tail x={436} y={18} />

      <Arrow tone="Danger" d="M 234 50 L 234 94" />
      <Label x={242} y={76} anchor="start">rejectDeployment</Label>
      <Status x={188} y={96} name="REJECTED" w={92} tone="danger" />
      <Label x={292} y={116} anchor="start">nothing is written</Label>
    </Figure>
  );
}

export function DeploymentLifecycle() {
  const c1 = 170;
  const c2 = 400;
  const c3 = 608;
  const r = (i) => 20 + i * 76;
  return (
    <Figure
      uid="dep-lifecycle"
      width={720}
      height={296}
      label="Deployment status machine. createDeployment enters at PENDING and proposeDeployment at PROPOSED. A proposal is approved to APPROVED or rejected to REJECTED. PENDING and APPROVED drain to RUNNING, which ends COMPLETED or FAILED. abortDeployment moves PENDING, APPROVED, or RUNNING to ABORTED. COMPLETED, FAILED, REJECTED, and ABORTED are terminal."
    >
      <circle className={s.dot} cx={14} cy={r(0) + 16} r={5} />
      <Arrow d={`M 20 ${r(0) + 16} L ${c1 - 2} ${r(0) + 16}`} />
      <Label x={92} y={r(0) + 8}>proposeDeployment</Label>
      <circle className={s.dot} cx={14} cy={r(2) + 16} r={5} />
      <Arrow d={`M 20 ${r(2) + 16} L ${c1 - 2} ${r(2) + 16}`} />
      <Label x={92} y={r(2) + 8}>createDeployment</Label>

      <Status x={c1} y={r(0)} name="PROPOSED" />
      <Status x={c1} y={r(1)} name="REJECTED" tone="danger" />
      <Status x={c1} y={r(2)} name="PENDING" />

      <Status x={c2} y={r(0)} name="APPROVED" />
      <Status x={c2} y={r(1)} name="RUNNING" />

      <Status x={c3} y={r(0) + 30} name="COMPLETED" tone="accent" />
      <Status x={c3} y={r(1) + 30} name="FAILED" tone="danger" />
      <Status x={c3} y={r(3)} name="ABORTED" tone="ghost" />

      <Arrow d={`M ${c1 + PW} ${r(0) + 16} L ${c2 - 2} ${r(0) + 16}`} />
      <Label x={(c1 + PW + c2) / 2} y={r(0) + 8}>approveDeployment</Label>
      <Arrow tone="Danger" d={`M ${c1 + PW / 2} ${r(0) + PH} L ${c1 + PW / 2} ${r(1) - 2}`} />
      <Label x={c1 + PW / 2 + 8} y={r(1) - 20} anchor="start">rejectDeployment</Label>

      <Arrow d={`M ${c2 + PW / 2} ${r(0) + PH} L ${c2 + PW / 2} ${r(1) - 2}`} />
      <Label x={c2 + PW / 2 + 8} y={r(1) - 20} anchor="start">dequeued</Label>
      <Arrow d={`M ${c1 + PW} ${r(2) + 16} C ${c1 + PW + 70} ${r(2) + 16}, ${c2 - 70} ${r(1) + 16}, ${c2 - 2} ${r(1) + 16}`} />
      <Label x={(c1 + PW + c2) / 2} y={r(2) + 22}>dequeued</Label>

      <Arrow tone="Accent" d={`M ${c2 + PW} ${r(1) + 10} C ${c2 + PW + 50} ${r(1) + 10}, ${c3 - 50} ${r(0) + 46}, ${c3 - 2} ${r(0) + 46}`} />
      <Arrow tone="Danger" d={`M ${c2 + PW} ${r(1) + 22} C ${c2 + PW + 50} ${r(1) + 22}, ${c3 - 50} ${r(1) + 46}, ${c3 - 2} ${r(1) + 46}`} />

      <path className={`${s.route} ${s.dashed}`} d={`M ${c1 + PW / 2} ${r(2) + PH} L ${c1 + PW / 2} ${r(3) + 16} L ${c3 - 2} ${r(3) + 16}`} markerEnd="url(#dep-lifecycle-head)" />
      <path className={`${s.route} ${s.dashed}`} d={`M ${c2 + PW / 2} ${r(1) + PH} L ${c2 + PW / 2} ${r(3) + 16}`} />
      <path className={`${s.route} ${s.dashed}`} d={`M ${c2 + PW} ${r(0) + 16} L ${c2 + PW + 26} ${r(0) + 16} L ${c2 + PW + 26} ${r(3) + 16}`} />
      <Label x={(c1 + PW / 2 + c3) / 2} y={r(3) + 34}>abortDeployment, from PENDING, APPROVED, or RUNNING</Label>
    </Figure>
  );
}

export function DeploymentQueue() {
  const slots = [
    { name: "RUNNING", at: "09:00", tone: "accent" },
    { name: "APPROVED", at: "09:02", note: "proposed 09:02" },
    { name: "PENDING", at: "09:05" },
    { name: "PENDING", at: "09:07" },
  ];
  const x0 = 24;
  const sw = 158;
  const gap = 16;
  return (
    <Figure
      uid="dep-queue"
      width={720}
      height={230}
      label="One instance's queue. One deployment runs at a time. PENDING and APPROVED deployments wait in the order they were created. PROPOSED deployments wait outside the queue. Approving a proposal places it by the time it was proposed, ahead of newer PENDING deployments."
    >
      <rect className={s.well} x={8} y={70} width={704} height={102} rx={8} />
      <Label x={24} y={92} kind="heading" anchor="start">INSTANCE QUEUE</Label>
      <Label x={696} y={92} anchor="end">oldest created first, one runs at a time</Label>
      {slots.map((sl, i) => {
        const x = x0 + i * (sw + gap);
        return (
          <g key={i}>
            <Box x={x} y={104} w={sw} h={52} tone={sl.tone || "surface"} lines={[[sl.tone ? "accent" : "body", sl.name], ["muted", `created ${sl.at}`]]} top={22} />
            {i > 0 && <Arrow d={`M ${x - 2} 130 L ${x - gap + 2} 130`} />}
          </g>
        );
      })}

      <Box x={x0 + sw + gap} y={8} w={sw} h={40} tone="ghost" lines={[["body", "PROPOSED"]]} top={25} center />
      <Arrow tone="Accent" dashed d={`M ${x0 + sw + gap + sw / 2} 48 L ${x0 + sw + gap + sw / 2} 102`} />
      <Label x={x0 + sw + gap + sw / 2 + 8} y={64} anchor="start" kind="accentSmall">approveDeployment</Label>
      <Label x={x0 + 2 * (sw + gap)} y={30} anchor="start">waits outside the queue and holds no slot</Label>

      <Label x={360} y={198}>a proposal approved at 09:10 still sorts by 09:02, ahead of newer PENDING work</Label>
      <Label x={360} y={216}>when the running deployment finishes, fails, or is aborted, the next one is sent</Label>
    </Figure>
  );
}
