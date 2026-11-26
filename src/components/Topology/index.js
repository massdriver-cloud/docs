import React from "react";
import s from "./styles.module.css";
import { Diagram, usePrefersReducedMotion } from "./engine";
import { TOPOLOGIES, CANVASES, ORGANIZATION } from "./diagrams";

export function Topology({ id }) {
  const reduced = usePrefersReducedMotion();
  const d = TOPOLOGIES[id];
  if (!d) throw new Error(`Unknown topology: ${id}`);
  return (
    <figure className={s.figure}>
      <Diagram d={d} uid={id} label={`${d.title} diagram`} reduced={reduced} />
    </figure>
  );
}

export function Canvas({ id }) {
  const d = CANVASES[id];
  if (!d) throw new Error(`Unknown canvas: ${id}`);
  return (
    <figure className={s.figure}>
      <Diagram d={d} uid={`canvas-${id}`} label={`${d.title} diagram`} reduced />
    </figure>
  );
}

export function OrganizationTopology() {
  const reduced = usePrefersReducedMotion();
  return (
    <figure className={s.figure}>
      <Diagram
        d={ORGANIZATION}
        uid="organization"
        label="Five projects stacked by layer: an organization project with one environment, a network project with one environment per region, a compute platform project, a billing project with dev, staging, and two production regions, and an edge project with staging and prod. Each project uses resources from the one below it."
        reduced={reduced}
        className={s.svgWide}
      />
    </figure>
  );
}

const Swatch = ({ children }) => (
  <svg viewBox="0 0 64 30" width="64" height="30" aria-hidden="true">
    {children}
  </svg>
);

const FOLDER = "M6 2 H24 Q27 2 27 5 V9 H59 Q62 9 62 12 V25 Q62 28 59 28 H5 Q2 28 2 25 V5 Q2 2 6 2 Z";

export function TopologyLegend() {
  return (
    <ul className={`${s.legend} ${s.legendFigure}`}>
      <li>
        <Swatch>
          <rect className={s.project} x="2" y="4" width="60" height="22" rx="6" />
        </Swatch>
        <span>A project. Every environment inside it has the same blueprint.</span>
      </li>
      <li>
        <Swatch>
          <path className={`${s.node} ${s.env}`} d={FOLDER} />
        </Swatch>
        <span>An environment</span>
      </li>
      <li>
        <Swatch>
          <path className={`${s.node} ${s.eph}`} d={FOLDER} />
        </Swatch>
        <span>A short-lived environment, such as a fork</span>
      </li>
      <li>
        <Swatch>
          <path className={`${s.node} ${s.prod}`} d={FOLDER} />
        </Swatch>
        <span>A production environment, or the one taking traffic</span>
      </li>
      <li>
        <Swatch>
          <rect className={s.cOn} x="27" y="10" width="10" height="10" rx="2" />
        </Swatch>
        <span>One component of the blueprint, deployed in this environment</span>
      </li>
      <li>
        <Swatch>
          <rect className={s.cRef} x="27" y="10" width="10" height="10" rx="2" />
        </Swatch>
        <span>A component left undeployed. What depends on it uses a resource from another environment instead.</span>
      </li>
      <li>
        <Swatch>
          <line className={`${s.edge} ${s.dash}`} x1="4" y1="15" x2="60" y2="15" />
        </Swatch>
        <span>Provides resources, through an environment default or a remote reference</span>
      </li>
      <li>
        <Swatch>
          <line className={`${s.edge} ${s.dash}`} x1="4" y1="15" x2="52" y2="15" />
          <path className={s.head} d="M52 11.5 59 15 52 18.5z" />
        </Swatch>
        <span>Fork: a new environment seeded from this one</span>
      </li>
      <li>
        <Swatch>
          <line className={s.edge} x1="4" y1="15" x2="52" y2="15" />
          <path className={s.head} d="M52 11.5 59 15 52 18.5z" />
        </Swatch>
        <span>Traffic</span>
      </li>
      <li>
        <Swatch>
          <rect className={s.ext} x="2" y="4" width="60" height="22" rx="11" />
        </Swatch>
        <span>Not an environment, such as traffic or a credential</span>
      </li>
    </ul>
  );
}
