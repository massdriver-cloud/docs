import React from "react";
import { Figure, Box, Arrow, Label } from "./primitives";

const W = 720;

export default function RuntimeApplications({ uid, runtime, provides, apps, owners = false, label }) {
  const rowH = 60;
  const gap = 14;
  const top = owners ? 36 : 8;
  const height = top + apps.length * rowH + (apps.length - 1) * gap + 8;
  const rtH = 76;
  const rtY = top + (height - top - 8 - rtH) / 2;
  const appX = 420;
  return (
    <Figure uid={uid} width={W} height={height} label={label}>
      {owners && (
        <>
          <Label x={8} y={20} kind="heading" anchor="start">PLATFORM TEAM</Label>
          <Label x={appX} y={20} kind="heading" anchor="start">APPLICATION TEAMS</Label>
        </>
      )}
      <Box
        x={8}
        y={rtY}
        w={236}
        h={rtH}
        tone="accent"
        lines={[["heading", "RUNTIME"], ["name", runtime], ...provides.map((p) => ["muted", p])]}
      />
      {apps.map((a, i) => {
        const y = top + i * (rowH + gap);
        const fromY = rtY + 30 + i * ((rtH - 60) / Math.max(1, apps.length - 1));
        const toY = y + rowH / 2;
        return (
          <g key={a.name}>
            <Arrow tone="Accent" d={`M 244 ${fromY} C 332 ${fromY}, 332 ${toY}, ${appX - 2} ${toY}`} />
            <Box
              x={appX}
              y={y}
              w={W - appX - 8}
              h={rowH}
              lines={[["name", a.name], ["muted", a.adds]]}
              top={25}
            />
          </g>
        );
      })}
    </Figure>
  );
}

export function EcsServiceApplications() {
  return (
    <RuntimeApplications
      uid="ecs-service-apps"
      runtime="ecs-service"
      provides={["network, IAM, logging"]}
      apps={[
        { name: "orders-api", adds: "+ postgres, STRIPE_KEY" },
        { name: "search-api", adds: "+ opensearch" },
        { name: "emails-worker", adds: "+ queue" },
      ]}
      label="The ecs-service runtime provides network, IAM, and logging. Three applications are built on it, and each adds only what it needs: orders-api adds postgres and STRIPE_KEY, search-api adds opensearch, emails-worker adds a queue."
    />
  );
}

export function LambdaApplications() {
  return (
    <RuntimeApplications
      uid="lambda-apps"
      runtime="lambda"
      provides={["IaC, params, form"]}
      owners
      apps={[
        { name: "payments-api", adds: "+ postgres, STRIPE_KEY" },
        { name: "search-api", adds: "+ opensearch" },
        { name: "reports-worker", adds: "+ s3 bucket, schedule env" },
      ]}
      label="The platform team owns the lambda runtime: its IaC, params, and form. Application teams build payments-api, search-api, and reports-worker on it, each adding only its own dependencies and envs."
    />
  );
}

export function RuntimeFix() {
  const apps = [
    { name: "payments-api 0.4.2", on: "built on lambda 1.2.8" },
    { name: "search-api 1.0.4", on: "built on lambda 1.2.8" },
  ];
  return (
    <Figure
      uid="runtime-fix"
      width={W}
      height={160}
      label="The platform team publishes lambda 1.2.8 with an IAM fix. The next time each application's CI bumps its version and runs mass bundle publish, the application is built on lambda 1.2.8: payments-api 0.4.2 and search-api 1.0.4. Each instance runs it on its next deployment."
    >
      <Box x={8} y={44} w={188} h={72} tone="accent" lines={[["heading", "RUNTIME RELEASE"], ["name", "lambda 1.2.8"], ["muted", "tighter IAM role"]]} />
      <Arrow tone="Accent" d="M 196 80 L 252 80" />
      <Box x={254} y={44} w={200} h={72} lines={[["heading", "APPLICATION CI"], ["body", "bump version, publish"], ["muted", "resolves lambda@~1.2"]]} />
      <Arrow tone="Accent" d="M 454 70 C 482 70, 482 38, 510 38" />
      <Arrow tone="Accent" d="M 454 90 C 482 90, 482 122, 510 122" />
      {apps.map((a, i) => (
        <Box key={a.name} x={512} y={8 + i * 84} w={200} h={60} lines={[["name", a.name], ["accentSmall", a.on]]} top={25} />
      ))}
    </Figure>
  );
}

export function RuntimeMtls() {
  return (
    <Figure
      uid="runtime-mtls"
      width={W}
      height={196}
      label="payments-api and checkout-api both run on the lambda runtime. payments-api produces a payments-api-server resource with url, ca_cert and server_name. checkout-api depends on that resource type and connects to payments through it."
    >
      <Box x={8} y={62} w={176} h={72} tone="well" lines={[["heading", "RUNTIME"], ["name", "lambda"], ["muted", "runs both applications"]]} />
      <Arrow dashed d="M 184 86 C 222 86, 222 38, 258 38" />
      <Arrow dashed d="M 184 110 C 222 110, 222 158, 258 158" />
      <Box x={260} y={8} w={176} h={60} lines={[["name", "payments-api"], ["muted", "produces the resource"]]} top={25} />
      <Box x={260} y={128} w={176} h={60} lines={[["name", "checkout-api"], ["muted", "depends on the type"]]} top={25} />
      <Arrow tone="Accent" d="M 436 38 L 510 38" />
      <Box
        x={512}
        y={8}
        w={200}
        h={96}
        tone="accent"
        lines={[["heading", "RESOURCE"], ["accent", "payments-api-server"], ["muted", "url"], ["muted", "ca_cert"], ["muted", "server_name"]]}
      />
      <Arrow tone="Accent" d="M 612 104 L 612 158 L 438 158" />
    </Figure>
  );
}
