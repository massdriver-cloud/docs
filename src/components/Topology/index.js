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
        label="Five projects stacked by layer: an organization singleton, a multi-region network, a compute platform, a billing API with dev, staging, and two production regions, and an edge with staging and prod. Each project uses resources from the one below it."
        reduced={reduced}
        className={s.svgWide}
      />
    </figure>
  );
}

const Swatch = ({ children }) => (
  <svg viewBox="0 0 64 26" width="64" height="26" aria-hidden="true">
    {children}
  </svg>
);

export function TopologyLegend() {
  return (
    <ul className={`${s.legend} ${s.legendFigure}`}>
      <li>
        <Swatch>
          <rect className={s.project} x="2" y="3" width="60" height="20" rx="6" />
        </Swatch>
        <span>A project. Everything inside it shares one blueprint.</span>
      </li>
      <li>
        <Swatch>
          <rect className={`${s.node} ${s.env}`} x="2" y="3" width="60" height="20" rx="5" />
        </Swatch>
        <span>Long-lived environment</span>
      </li>
      <li>
        <Swatch>
          <rect className={`${s.node} ${s.eph}`} x="2" y="3" width="60" height="20" rx="5" />
        </Swatch>
        <span>Short-lived environment</span>
      </li>
      <li>
        <Swatch>
          <rect className={`${s.node} ${s.prod}`} x="2" y="3" width="60" height="20" rx="5" />
        </Swatch>
        <span>Production environment, or the one taking traffic</span>
      </li>
      <li>
        <Swatch>
          <rect className={s.cOn} x="27" y="8" width="10" height="10" rx="2" />
        </Swatch>
        <span>Component deployed in this environment</span>
      </li>
      <li>
        <Swatch>
          <rect className={s.cDev} x="27" y="8" width="10" height="10" rx="2" />
        </Swatch>
        <span>Component deployed from a development release</span>
      </li>
      <li>
        <Swatch>
          <rect className={s.cRef} x="27" y="8" width="10" height="10" rx="2" />
        </Swatch>
        <span>Component not deployed here. Its consumers are filled by a remote reference or an environment default.</span>
      </li>
      <li>
        <Swatch>
          <rect className={s.cOff} x="27" y="8" width="10" height="10" rx="2" />
        </Swatch>
        <span>Component not deployed</span>
      </li>
      <li>
        <Swatch>
          <line className={s.edge} x1="4" y1="13" x2="52" y2="13" />
          <path className={s.head} d="M52 9.5 59 13 52 16.5z" />
        </Swatch>
        <span>Promote, release, or traffic</span>
      </li>
      <li>
        <Swatch>
          <line className={`${s.edge} ${s.dash}`} x1="4" y1="13" x2="52" y2="13" />
          <path className={s.head} d="M52 9.5 59 13 52 16.5z" />
        </Swatch>
        <span>Fork</span>
      </li>
      <li>
        <Swatch>
          <line className={`${s.edge} ${s.dash}`} x1="4" y1="13" x2="60" y2="13" />
        </Swatch>
        <span>Uses resources from, by environment default or remote reference</span>
      </li>
      <li>
        <Swatch>
          <rect className={s.ext} x="2" y="3" width="60" height="20" rx="10" />
        </Swatch>
        <span>Not an environment: a branch, a release, traffic</span>
      </li>
      <li>
        <Swatch>
          <line className={s.edge} x1="4" y1="13" x2="60" y2="13" />
          <circle className={s.dot} cx="32" cy="13" r="3.6" />
        </Swatch>
        <span>A change on its way. The version beside the components updates when it arrives.</span>
      </li>
    </ul>
  );
}
