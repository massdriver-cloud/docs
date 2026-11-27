import React from "react";
import s from "./styles.module.css";

const TONE_VAR = {
  teal: "var(--an-teal)",
  success: "var(--an-success)",
  warning: "var(--an-warning)",
  error: "var(--an-error)",
  info: "var(--an-info)",
  pending: "var(--an-pending)",
  neutral: "#819ca9",
  idle: "#9ca3af",
};

function Figure({ label, width, height, children }) {
  return (
    <span className={s.figure} style={{ display: "inline-block" }}>
      <svg
        className={s.svg}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={label}
      >
        {children}
      </svg>
    </span>
  );
}

function Node({ x, y, name, w = 96 }) {
  return (
    <g>
      <rect className={s.node} x={x} y={y} width={w} height={36} rx={6} />
      <text className={s.strong} x={x + 10} y={y + 22}>
        {name}
      </text>
    </g>
  );
}

const TRAFFIC = {
  off: { stroke: "var(--an-border)", width: 1.5, dash: null, chip: null },
  idle: { stroke: TONE_VAR.idle, width: 2, dash: "4 4", chip: "0 rps" },
  flowing: { stroke: TONE_VAR.teal, width: 6, dash: "8 6", chip: "240 rps · 180 ms" },
  someErrors: { stroke: TONE_VAR.warning, width: 6, dash: "8 6", chip: "240 rps · 3 err · 180 ms" },
  manyErrors: { stroke: TONE_VAR.error, width: 6, dash: "8 6", chip: "240 rps · 42 err · 180 ms" },
  stale: { stroke: TONE_VAR.teal, width: 6, dash: "8 6", chip: "240 rps · 180 ms · stale", opacity: 0.5 },
};

export function TrafficState({ state, label }) {
  const t = TRAFFIC[state];
  const chipWidth = t.chip ? t.chip.length * 6.2 + 14 : 0;
  return (
    <Figure label={label} width={380} height={60}>
      <Node x={2} y={12} name="api" w={80} />
      <Node x={298} y={12} name="database" w={80} />
      <g opacity={t.opacity ?? 1}>
        <line
          x1={82}
          y1={30}
          x2={298}
          y2={30}
          stroke={t.stroke}
          strokeWidth={t.width}
          strokeDasharray={t.dash ?? undefined}
          className={t.dash === "8 6" ? s.flow : undefined}
        />
        {t.chip ? (
          <g>
            <rect className={s.surface} x={190 - chipWidth / 2} y={0} width={chipWidth} height={18} rx={9} />
            <text className={s.muted} x={190} y={13} textAnchor="middle">
              {t.chip}
            </text>
          </g>
        ) : null}
      </g>
    </Figure>
  );
}

export function StatusDotState({ tone, label }) {
  return (
    <Figure label={label} width={150} height={44}>
      <rect className={s.node} x={2} y={4} width={146} height={36} rx={6} />
      <circle cx={16} cy={22} r={5} style={{ fill: TONE_VAR[tone] }} />
      <text className={s.strong} x={28} y={26}>
        billing-dev-app
      </text>
    </Figure>
  );
}

function UsageMeter({ x, y, width, percent, tone, name, text }) {
  const nameWidth = name ? name.length * 5.6 + 8 : 0;
  const textWidth = text.length * 5.6 + 8;
  const track = width - nameWidth - textWidth;
  return (
    <g>
      {name ? (
        <text className={s.muted} x={x} y={y + 4}>
          {name}
        </text>
      ) : null}
      <rect x={x + nameWidth} y={y - 3} width={track} height={6} rx={3} style={{ fill: "var(--an-border)" }} />
      <rect x={x + nameWidth} y={y - 3} width={(track * percent) / 100} height={6} rx={3} style={{ fill: TONE_VAR[tone] }} />
      <text className={s.muted} x={x + width} y={y + 4} textAnchor="end">
        {text}
      </text>
    </g>
  );
}

export function UsageBarState({ percent, tone, name, text, label }) {
  return (
    <Figure label={label} width={210} height={58}>
      <rect className={s.node} x={2} y={2} width={206} height={54} rx={6} />
      <text className={s.strong} x={14} y={22}>
        billing-dev-app
      </text>
      <UsageMeter x={14} y={44} width={182} percent={percent} tone={tone} name={name} text={text} />
    </Figure>
  );
}

const BANNER_TEXT = { info: "Database upgrade tonight", warning: "Deploy freeze until Friday", error: "Payments API is down" };

export function BannerState({ levels, label }) {
  const height = levels.length * 28 + 4;
  return (
    <Figure label={label} width={300} height={height}>
      {levels.map((level, index) => (
        <g key={level + index}>
          <rect x={0} y={2 + index * 28} width={300} height={28} style={{ fill: TONE_VAR[level], opacity: 0.16 }} />
          <circle cx={14} cy={16 + index * 28} r={5} style={{ fill: TONE_VAR[level] }} />
          <text className={s.text} x={28} y={20 + index * 28}>
            {BANNER_TEXT[level]}
          </text>
        </g>
      ))}
    </Figure>
  );
}

export function HeaderLinkState({ links, label }) {
  let x = 0;
  return (
    <Figure label={label} width={300} height={30}>
      <text className={s.strong} x={4} y={19}>
        billing / dev
      </text>
      {links.map(link => {
        const width = link.length * 6.6 + 26;
        x += width + 8;
        const left = 300 - x;
        return (
          <g key={link}>
            <rect className={s.surface} x={left} y={4} width={width} height={22} rx={4} />
            <text className={s.muted} x={left + 8} y={19}>
              {link} ↗
            </text>
          </g>
        );
      })}
    </Figure>
  );
}

function Pill({ x, tone, text }) {
  const width = text.length * 5.8 + 12;
  return (
    <g>
      <rect x={x - width} y={8} width={width} height={16} rx={3} style={{ fill: TONE_VAR[tone], opacity: 0.14 }} />
      <text x={x - width / 2} y={19} textAnchor="middle" style={{ fill: TONE_VAR[tone], fontSize: 11, fontWeight: 500 }}>
        {text}
      </text>
    </g>
  );
}

function Row({ height, label, children }) {
  return (
    <Figure label={label} width={360} height={height}>
      <rect className={s.surface} x={0.5} y={0.5} width={359} height={height - 1} rx={4} />
      {children}
    </Figure>
  );
}

export function MetadataTextRow({ label }) {
  return (
    <Row height={64} label={label}>
      <text className={s.strong} x={14} y={20}>
        Schema version
      </text>
      <text className={`${s.muted} ${s.mono}`} x={14} y={35}>
        schema.version
      </text>
      <text className={`${s.text} ${s.mono}`} x={14} y={54}>
        42
      </text>
    </Row>
  );
}

export function MetadataJsonRow({ label }) {
  const tiles = [
    ["rps", "240"],
    ["errors_5m", "2"],
    ["p95_ms", "85"],
  ];
  return (
    <Row height={84} label={label}>
      <text className={s.strong} x={14} y={20}>
        Traffic
      </text>
      <text className={`${s.muted} ${s.mono}`} x={14} y={35}>
        stats/traffic
      </text>
      {tiles.map(([key, value], index) => (
        <g key={key}>
          <rect className={s.tile} x={14 + index * 92} y={42} width={84} height={36} rx={4} />
          <text className={`${s.muted} ${s.mono}`} x={22 + index * 92} y={56}>
            {key}
          </text>
          <text className={`${s.text} ${s.mono}`} x={22 + index * 92} y={72}>
            {value}
          </text>
        </g>
      ))}
    </Row>
  );
}

export function MetadataPillsRow({ label }) {
  return (
    <Row height={64} label={label}>
      <text className={s.strong} x={14} y={20}>
        Database password
      </text>
      <text className={`${s.muted} ${s.mono}`} x={14} y={35}>
        db/password
      </text>
      <text className={`${s.text} ${s.mono}`} x={14} y={54}>
        ••••••••••••
      </text>
      <Pill x={346} tone="warning" text="sensitive" />
      <Pill x={286} tone="pending" text="immutable" />
      <Pill x={226} tone="info" text="expires in 2 hours" />
    </Row>
  );
}

export function MetadataWidgetsRow({ label }) {
  const cell = 160;
  return (
    <Figure label={label} width={cell * 3} height={60}>
      <rect className={s.surface} x={0.5} y={0.5} width={cell * 3 - 1} height={59} rx={4} />
      <line className={s.line} x1={cell} y1={1} x2={cell} y2={59} />
      <line className={s.line} x1={cell * 2} y1={1} x2={cell * 2} y2={59} />

      <text className={s.strong} x={16} y={22}>
        Health
      </text>
      <circle cx={21} cy={41} r={5} style={{ fill: TONE_VAR.warning }} />
      <text className={`${s.text} ${s.mono}`} x={32} y={45}>
        degraded
      </text>

      <text className={s.strong} x={cell + 16} y={22}>
        Traffic
      </text>
      <circle cx={cell + 21} cy={41} r={5} style={{ fill: TONE_VAR.teal }} />
      <text className={`${s.text} ${s.mono}`} x={cell + 32} y={45}>
        240 rps · 180 ms
      </text>

      <text className={s.strong} x={cell * 2 + 16} y={22}>
        Connection pool
      </text>
      <UsageMeter x={cell * 2 + 16} y={41} width={cell - 32} percent={37} tone="teal" text="37 / 100" />
    </Figure>
  );
}

export function MetadataFooter({ label }) {
  return (
    <Figure label={label} width={360} height={22}>
      <text className={s.muted} x={0} y={15}>
        3 entries have no label.
      </text>
      <text className={`${s.muted} ${s.mono}`} x={136} y={15}>
        mass alpha stash list billing-dev-app
      </text>
    </Figure>
  );
}

const SEVERITY_FILL = {
  critical: "#B91C1C",
  high: "var(--an-error)",
  medium: "var(--an-warning)",
  low: "var(--an-info)",
};

export function ResultPillState({ tone, text, label }) {
  const width = text.length * 6.2 + 16;
  return (
    <Figure label={label} width={width + 4} height={22}>
      <rect x={2} y={2} width={width} height={18} rx={9} style={{ fill: TONE_VAR[tone], opacity: 0.14 }} />
      <rect x={2} y={2} width={width} height={18} rx={9} style={{ fill: "none", stroke: TONE_VAR[tone], strokeOpacity: 0.35 }} />
      <text className={s.text} x={2 + width / 2} y={15} textAnchor="middle" style={{ fontSize: 11, fontWeight: 500 }}>
        {text}
      </text>
    </Figure>
  );
}

export function ChangesState({ text, label }) {
  return (
    <Figure label={label} width={190} height={22}>
      <text className={s.strong} x={2} y={15}>
        Changes
      </text>
      <text className={`${s.text} ${s.mono}`} x={70} y={15}>
        {text}
      </text>
    </Figure>
  );
}

export function SeverityBarState({ severity, label }) {
  const levels = ["critical", "high", "medium", "low"].filter((level) => (severity[level] ?? 0) > 0);
  const total = levels.reduce((sum, level) => sum + severity[level], 0);
  const track = 90;
  const legend = levels.map((level) => `${severity[level]} ${level}`).join(" · ") || "No findings";
  let x = 2;
  return (
    <Figure label={label} width={track + 8 + legend.length * 6 + 8} height={22}>
      {total > 0 ? (
        <g>
          <rect x={2} y={8} width={track} height={6} rx={3} style={{ fill: "var(--an-border)" }} />
          {levels.map((level) => {
            const width = (track * severity[level]) / total;
            const segment = <rect key={level} x={x} y={8} width={width} height={6} style={{ fill: SEVERITY_FILL[level] }} />;
            x += width;
            return segment;
          })}
        </g>
      ) : null}
      <text className={s.muted} x={total > 0 ? track + 10 : 2} y={15}>
        {legend}
      </text>
    </Figure>
  );
}

export function ProblemBadgeState({ label }) {
  return (
    <Figure label={label} width={190} height={44}>
      <rect className={s.node} x={2} y={4} width={186} height={36} rx={6} />
      <text className={s.strong} x={14} y={26}>
        billing-dev-app
      </text>
      <path d="M 170 13 L 180 31 L 160 31 Z" style={{ fill: "none", stroke: "#B7791F", strokeWidth: 1.6, strokeLinejoin: "round" }} />
      <line x1={170} y1={19} x2={170} y2={25} style={{ stroke: "#B7791F", strokeWidth: 1.6 }} />
      <circle cx={170} cy={28} r={0.9} style={{ fill: "#B7791F" }} />
    </Figure>
  );
}
