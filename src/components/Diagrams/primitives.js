import React, { createContext, useContext } from "react";
import s from "./styles.module.css";

const Uid = createContext("dg");

const TONES = {
  surface: s.surface,
  accent: s.surfaceAccent,
  well: s.well,
  danger: s.surfaceDanger,
  ghost: s.surfaceGhost,
};

const LINE = {
  heading: { cls: s.heading, step: 18 },
  name: { cls: s.name, step: 18 },
  body: { cls: s.body, step: 16 },
  muted: { cls: s.muted, step: 15 },
  accent: { cls: s.accent, step: 16 },
  accentSmall: { cls: s.accentSmall, step: 15 },
  danger: { cls: s.danger, step: 15 },
};

export function Figure({ uid, width, height, label, children }) {
  return (
    <Uid.Provider value={uid}>
      <figure className={s.figure}>
        <svg
          className={s.svg}
          viewBox={`0 0 ${width} ${height}`}
          style={{ maxWidth: width }}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label={label}
        >
          <defs>
            {["", "Accent", "Danger"].map((t) => (
              <marker
                key={t}
                id={`${uid}-head${t}`}
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="7"
                markerHeight="7"
                orient="auto"
              >
                <path className={s[`head${t}`]} d="M0 .6 7.6 4 0 7.4z" />
              </marker>
            ))}
          </defs>
          {children}
        </svg>
      </figure>
    </Uid.Provider>
  );
}

export function Box({ x, y, w, h, tone = "surface", lines = [], center = false, top = 22 }) {
  let cy = y + top;
  const tx = center ? x + w / 2 : x + 16;
  return (
    <g>
      <rect className={TONES[tone]} x={x} y={y} width={w} height={h} rx="6" />
      {lines.map((l, i) => {
        const [kind, text] = typeof l === "string" ? ["muted", l] : l;
        const spec = LINE[kind];
        const ty = cy;
        cy += spec.step;
        return (
          <text key={i} className={spec.cls} x={tx} y={ty} textAnchor={center ? "middle" : undefined}>
            {text}
          </text>
        );
      })}
    </g>
  );
}

export function Arrow({ d, tone = "", dashed = false, head = true }) {
  const uid = useContext(Uid);
  const cls = { "": s.route, Accent: s.routeAccent, Danger: s.routeDanger }[tone];
  return (
    <path
      className={`${cls} ${dashed ? s.dashed : ""}`}
      d={d}
      markerEnd={head ? `url(#${uid}-head${tone})` : undefined}
    />
  );
}

export function Label({ x, y, kind = "muted", anchor = "middle", children }) {
  return (
    <text className={`${LINE[kind].cls} ${s.halo}`} x={x} y={y} textAnchor={anchor}>
      {children}
    </text>
  );
}
