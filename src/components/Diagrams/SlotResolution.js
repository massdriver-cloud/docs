import React from "react";
import s from "./styles.module.css";

export default function SlotResolution() {
  return (
    <figure className={s.figure}>
      <svg
        className={s.svg}
        viewBox="0 0 720 316"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="A dependency slot asking for aws-vpc at tilde 1 is filled by the first source that matches. A remote reference on the instance wins, then a blueprint connection drawn on the canvas, then an environment default. Each source must match the resource type and satisfy the version range."
      >
        <rect className={s.well} x="8" y="40" width="248" height="150" rx="6" />
        <text className={s.heading} x="28" y="68">DEPENDENCY SLOT</text>
        <text className={s.name} x="28" y="94">network</text>
        <text className={s.accent} x="28" y="116">aws-vpc@~1</text>
        <text className={s.muted} x="28" y="140">declared in the bundle&#8217;s</text>
        <text className={s.muted} x="28" y="155">massdriver.yaml under</text>
        <text className={s.muted} x="28" y="170">dependencies</text>

        <text className={s.muted} x="132" y="216" textAnchor="middle">filled at deploy time</text>
        <text className={s.muted} x="132" y="232" textAnchor="middle">by the first match</text>

        <path className={`${s.routeAccent} ${s.tierRoute1}`} d="M 256 96 C 310 96, 310 74, 364 74" />
        <path className={`${s.routeAccent} ${s.tierRoute2}`} d="M 256 110 C 310 110, 310 158, 364 158" />
        <path className={`${s.routeAccent} ${s.tierRoute3}`} d="M 256 124 C 310 124, 310 242, 364 242" />

        <g className={s.tier1}>
          <rect className={s.surface} x="364" y="40" width="348" height="68" rx="6" />
          <text className={s.heading} x="384" y="64">1 &#183; REMOTE REFERENCE</text>
          <text className={s.body} x="384" y="83">shared-vpc, set on this instance</text>
          <text className={s.muted} x="384" y="99">checked for resource type and version on every deploy</text>
        </g>

        <g className={s.tier2}>
          <rect className={s.surface} x="364" y="124" width="348" height="68" rx="6" />
          <text className={s.heading} x="384" y="148">2 &#183; BLUEPRINT CONNECTION</text>
          <text className={s.body} x="384" y="167">the link drawn from vpc on the canvas</text>
          <text className={s.muted} x="384" y="183">resource type matched when drawn, version re-checked here</text>
        </g>

        <g className={s.tier3}>
          <rect className={s.surface} x="364" y="208" width="348" height="68" rx="6" />
          <text className={s.heading} x="384" y="232">3 &#183; ENVIRONMENT DEFAULT</text>
          <text className={s.body} x="384" y="251">the highest aws-vpc version this range accepts</text>
          <text className={s.muted} x="384" y="267">an environment can hold one default per version</text>
        </g>

        <text className={s.muted} x="360" y="306" textAnchor="middle">
          a source that does not match the resource type, or falls outside the range, is skipped for the next one
        </text>
      </svg>
    </figure>
  );
}
