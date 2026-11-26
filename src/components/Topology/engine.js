import React, { useEffect, useRef, useState } from "react";
import s from "./styles.module.css";

const NODE_W = 96;
const NODE_H = 44;
const PILL_H = 24;
const FADE = 0.2;

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

const pillWidth = (label) => Math.round(label.length * 6.4 + 20);

export function boxOf(n) {
  if (n.kind === "ext") {
    const w = pillWidth(n.label);
    return { x: n.cx - w / 2, y: n.y, w, h: PILL_H };
  }
  return { x: n.x, y: n.y, w: n.w || NODE_W, h: n.h || NODE_H };
}

function exitPoint(b, px, py, qx, qy) {
  const dx = qx - px;
  const dy = qy - py;
  let t = Infinity;
  if (dx > 0) t = Math.min(t, (b.x + b.w - px) / dx);
  if (dx < 0) t = Math.min(t, (b.x - px) / dx);
  if (dy > 0) t = Math.min(t, (b.y + b.h - py) / dy);
  if (dy < 0) t = Math.min(t, (b.y - py) / dy);
  if (!Number.isFinite(t)) return [px, py];
  return [px + dx * t, py + dy * t];
}

export function edgeGeometry(a, b, e) {
  const A = boxOf(a);
  const B = boxOf(b);
  const ox = e.dx || 0;
  const oy = e.dy || 0;
  const pa = [A.x + A.w / 2 + ox, A.y + A.h / 2 + oy];
  const pb = [B.x + B.w / 2 + ox, B.y + B.h / 2 + oy];
  let [x1, y1] = exitPoint(A, pa[0], pa[1], pb[0], pb[1]);
  let [x2, y2] = exitPoint(B, pb[0], pb[1], pa[0], pa[1]);
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const startGap = 1.5;
  const endGap = e.kind === "ref" ? 1.5 : 2.5;
  x1 += ux * startGap;
  y1 += uy * startGap;
  x2 -= ux * endGap;
  y2 -= uy * endGap;
  return { x1, y1, x2, y2 };
}

const r4 = (n) => Math.round(n * 10000) / 10000;

function keyed(points) {
  const out = [];
  let last = -1;
  for (const [t, v] of points) {
    const tt = Math.min(1, Math.max(last, t));
    out.push([tt, v]);
    last = tt;
  }
  return {
    keyTimes: out.map((p) => r4(p[0])).join(";"),
    values: out.map((p) => p[1]).join(";"),
  };
}

// Visible from boundary a to boundary b (in steps), fading at each end.
function presence(a, b, N) {
  const e = FADE / N;
  const A = a / N;
  const B = b / N;
  const pts = [];
  if (A <= 0) pts.push([0, 1]);
  else pts.push([0, 0], [A, 0], [Math.min(A + e, B), 1]);
  if (B >= 1) pts.push([1, 1]);
  else pts.push([Math.max(B - e, A + e), 1], [B, 0], [1, 0]);
  return keyed(pts);
}

function Anim({ attr = "opacity", spec, dur, begin, mode }) {
  return (
    <animate
      attributeName={attr}
      dur={`${dur}s`}
      begin={`${begin}s`}
      repeatCount="indefinite"
      calcMode={mode || "linear"}
      keyTimes={spec.keyTimes}
      values={spec.values}
    />
  );
}

function Once({ at, dur = 0.45 }) {
  return (
    <animate
      attributeName="opacity"
      from="0"
      to="1"
      begin={`${at}s`}
      dur={`${dur}s`}
      fill="freeze"
    />
  );
}


const TAB_H = 13;

// An environment is drawn as a folder: a tab carrying its name over a body
// holding one square per blueprint component, so it never reads as a component.
function envPath(b, label) {
  const r = 4;
  const tab = Math.min(b.w - 6, Math.round(label.length * 6.1 + 14));
  const { x, y, w, h } = b;
  const t = y + TAB_H;
  return [
    `M${x + r} ${y}`,
    `H${x + tab - r}`,
    `Q${x + tab} ${y} ${x + tab} ${y + r}`,
    `V${t}`,
    `H${x + w - r}`,
    `Q${x + w} ${t} ${x + w} ${t + r}`,
    `V${y + h - r}`,
    `Q${x + w} ${y + h} ${x + w - r} ${y + h}`,
    `H${x + r}`,
    `Q${x} ${y + h} ${x} ${y + h - r}`,
    `V${y + r}`,
    `Q${x} ${y} ${x + r} ${y}`,
    "Z",
  ].join(" ");
}

const stepsOf = (e) => (e.step === undefined ? [] : [].concat(e.step));

const COMP_CLASS = { on: s.cOn, ref: s.cRef };
const NODE_CLASS = { env: s.env, eph: s.eph, prod: s.prod, ext: s.ext };

// Each SVG has its own animation clock. Hold it at zero until the diagram
// scrolls into view, so a build-up plays where the reader can see it, and
// pause it again while it is off screen.
function useViewportClock(ref, enabled) {
  useEffect(() => {
    const svg = ref.current;
    if (!enabled || !svg || typeof IntersectionObserver === "undefined" || !svg.pauseAnimations) return undefined;
    let started = false;
    svg.pauseAnimations();
    svg.setCurrentTime(0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!started) {
            svg.setCurrentTime(0);
            started = true;
          }
          svg.unpauseAnimations();
        } else {
          svg.pauseAnimations();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(svg);
    return () => observer.disconnect();
  }, [ref, enabled]);
}

export function Diagram({ d, uid, label, reduced, className }) {
  const svgRef = useRef(null);
  useViewportClock(svgRef, !reduced);
  const nodes = d.nodes;
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const N = d.steps + (d.hold ?? 1.5);
  const stepDur = d.stepDur || 1.25;
  const dur = N * stepDur;
  const begin = d.begin || 0;
  const animate = !reduced;

  const pulses = {};
  const addPulse = (id, k) => {
    (pulses[id] = pulses[id] || []).push(k);
  };
  nodes.forEach((n) => (n.pulse || []).forEach((k) => addPulse(n.id, k)));

  const edges = d.edges.map((e) => {
    const from = byId[e.from];
    const to = byId[e.to];
    if (!from || !to) throw new Error(`Topology ${uid}: edge ${e.from} -> ${e.to} has an unknown node`);
    const steps = stepsOf(e);
    steps.forEach((k) => addPulse(e.to, k));
    let inAt = e.in;
    if (inAt === undefined) {
      const ins = [];
      if (from.in !== undefined) ins.push(from.in);
      if (to.in !== undefined) ins.push(steps.length && to.in === Math.min(...steps) ? to.in - 1 : to.in);
      if (ins.length) inAt = Math.max(...ins);
    }
    let outAt = e.out;
    if (outAt === undefined) {
      const outs = [from.out, to.out].filter((x) => x !== undefined);
      if (outs.length) outAt = Math.min(...outs);
    }
    return { ...e, steps, inAt, outAt, g: edgeGeometry(from, to, e), build: e.build ?? Math.max(from.build ?? 0, to.build ?? 0) };
  });

  const projects = (d.projects || []).map((p) => {
    let box = p.box;
    if (!box) {
      const bs = p.nodes.map((id) => boxOf(byId[id]));
      const x0 = Math.min(...bs.map((b) => b.x)) - 14;
      const y0 = Math.min(...bs.map((b) => b.y)) - 24;
      const x1 = Math.max(...bs.map((b) => b.x + b.w)) + 14;
      const y1 = Math.max(...bs.map((b) => b.y + b.h)) + 10;
      box = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
    return { ...p, box };
  });

  const allBoxes = [...nodes.map(boxOf), ...projects.map((p) => p.box)];
  const width = d.width || 380;
  const height = d.height || Math.ceil(Math.max(...allBoxes.map((b) => b.y + b.h)) + 6);

  const markerId = `tp-ah-${uid}`;
  const buildStep = d.buildStep || 0.8;

  const presenceProps = (inAt, outAt, build) => {
    if (!animate) return { children: null, initial: 1 };
    if (build !== undefined && d.build) {
      return { children: <Once at={build * buildStep} />, initial: 0 };
    }
    if (inAt === undefined && outAt === undefined) return { children: null, initial: 1 };
    const a = inAt ?? 0;
    const b = outAt ?? (a > 0 ? N - 0.3 : N);
    const spec = presence(a, b, N);
    return { children: <Anim spec={spec} dur={dur} begin={begin} />, initial: a > 0 ? 0 : 1 };
  };

  const pulseRect = (b, k, key) => {
    const t = k / N;
    const e = 0.15 / N;
    const spec = keyed([
      [0, 0],
      [t, 0],
      [t + e, 1],
      [t + 5 * e, 0],
      [1, 0],
    ]);
    return (
      <rect key={key} className={s.pulse} x={b.x - 2} y={b.y - 2} width={b.w + 4} height={b.h + 4} rx={8} opacity={0}>
        <Anim spec={spec} dur={dur} begin={begin} />
      </rect>
    );
  };

  const windowSpec = (from, to) => {
    const pts = [];
    const A = from / N;
    const B = Math.min(to, N) / N;
    if (A <= 0) pts.push([0, 1]);
    else pts.push([0, 0], [A, 1]);
    if (B < 1) pts.push([B, 0]);
    return keyed(pts);
  };

  return (
    <svg
      ref={svgRef}
      className={`${s.svg} ${className || ""}`}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker id={markerId} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path className={s.head} d="M0 .6 7.6 4 0 7.4z" />
        </marker>
      </defs>

      {projects.map((p, i) => {
        const pr = presenceProps(p.in, p.out, p.build);
        return (
          <g key={`p${i}`} opacity={pr.initial}>
            {pr.children}
            <rect className={s.project} x={p.box.x} y={p.box.y} width={p.box.w} height={p.box.h} rx={9} />
          </g>
        );
      })}

      {edges.map((e, i) => {
        const pr = presenceProps(e.inAt, e.outAt, d.build ? e.build : undefined);
        const { x1, y1, x2, y2 } = e.g;
        const cls = `${s.edge} ${e.kind === "fork" || e.kind === "ref" ? s.dash : ""}`;
        const arrow = e.kind !== "ref";
        const mx = (x1 + x2) / 2 + (e.labelDx || 0);
        const my = (y1 + y2) / 2 + (e.labelDy || 0);
        return (
          <g key={`e${i}`} opacity={pr.initial}>
            {pr.children}
            <line className={cls} x1={r4(x1)} y1={r4(y1)} x2={r4(x2)} y2={r4(y2)} markerEnd={arrow ? `url(#${markerId})` : undefined} />
            {e.label ? (
              <text className={s.edgeLabel} x={r4(mx)} y={r4(my)}>
                {e.label}
              </text>
            ) : null}
          </g>
        );
      })}

      {projects.map((p, i) => {
        const pr = presenceProps(p.in, p.out, p.build);
        return (
          <g key={`pl${i}`} opacity={pr.initial}>
            {pr.children}
            <text className={s.projectLabel} x={p.box.x + 10} y={p.box.y + 13}>
              {p.label}
              {p.topology ? <tspan className={s.projectTopology}>{`  ${p.topology}`}</tspan> : null}
            </text>
          </g>
        );
      })}

      {nodes.map((n) => {
        const b = boxOf(n);
        const pr = presenceProps(n.in, n.out, n.build);
        if (n.kind === "ext") {
          return (
            <g key={n.id} opacity={pr.initial}>
              {pr.children}
              <rect className={s.ext} x={b.x} y={b.y} width={b.w} height={b.h} rx={12} />
              <text className={`${s.label} ${s.extLabel}`} x={b.x + b.w / 2} y={b.y + 12}>
                {n.label}
              </text>
              {animate && !d.build ? (pulses[n.id] || []).map((k, j) => pulseRect(b, k, `pu${j}`)) : null}
            </g>
          );
        }
        const live = n.live || [];
        return (
          <g key={n.id} opacity={pr.initial}>
            {pr.children}
            <path className={`${s.node} ${NODE_CLASS[n.kind] || s.env}`} d={envPath(b, n.label)} />
            {live.map(([from, to], j) => {
              if (!animate) {
                return from <= 0 ? <path key={`l${j}`} className={`${s.node} ${s.prod}`} d={envPath(b, n.label)} /> : null;
              }
              return (
                <path key={`l${j}`} className={`${s.node} ${s.prod}`} d={envPath(b, n.label)} opacity={from <= 0 ? 1 : 0}>
                  <Anim spec={windowSpec(from, to)} dur={dur} begin={begin} mode="discrete" />
                </path>
              );
            })}
            <text className={`${s.label} ${s.envLabel}`} x={b.x + 7} y={b.y + 7.5}>
              {n.label}
            </text>
            {(n.c || []).map((c, j) => (
              <rect key={`c${j}`} className={COMP_CLASS[c]} x={b.x + 9 + j * 14} y={b.y + TAB_H + (b.h - TAB_H) / 2 - 5} width={10} height={10} rx={2} />
            ))}
            {animate ? (pulses[n.id] || []).map((k, j) => pulseRect(b, k, `pu${j}`)) : null}
          </g>
        );
      })}

      {animate
        ? edges.flatMap((e, i) =>
            e.steps.map((k, j) => {
              const { x1, y1, x2, y2 } = e.g;
              const t0 = (k - 1) / N;
              const t1 = k / N;
              const eps = 0.06 / N;
              const motion = keyed([
                [0, 0],
                [t0, 0],
                [t1, 1],
                [1, 1],
              ]);
              const fade = keyed([
                [0, 0],
                [t0, 0],
                [t0 + eps, 1],
                [t1 - eps, 1],
                [t1, 0],
                [1, 0],
              ]);
              const path = `M${r4(x1)} ${r4(y1)} L${r4(x2)} ${r4(y2)}`;
              return (
                <circle key={`d${i}-${j}`} className={s.dot} r={3.6} cx={0} cy={0} opacity={0}>
                  <animateMotion
                    path={path}
                    dur={`${dur}s`}
                    begin={`${begin}s`}
                    repeatCount="indefinite"
                    calcMode="linear"
                    keyPoints={motion.values}
                    keyTimes={motion.keyTimes}
                  />
                  <Anim spec={fade} dur={dur} begin={begin} />
                </circle>
              );
            })
          )
        : null}
    </svg>
  );
}
