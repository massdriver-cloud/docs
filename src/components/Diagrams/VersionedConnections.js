import React from "react";
import s from "./styles.module.css";

export default function VersionedConnections() {
  return (
    <figure className={s.figure}>
      <svg
        className={s.svg}
        viewBox="0 0 720 344"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="A project blueprint holding two links on the same field, one for each version pair. Development runs the database at 2.0.0 and reads the second link. Staging upgrades from 1.2.0 to 2.0.0 and starts reading it too. Production stays on 1.2.0 and keeps the first link."
      >
        <rect className={s.well} x="8" y="42" width="322" height="196" rx="6" />
        <text className={s.heading} x="28" y="70">PROJECT BLUEPRINT</text>
        <text className={s.muted} x="28" y="87">two links on db.network, one per version pair</text>

        <rect className={s.barMuted} x="28" y="106" width="3" height="38" />
        <text className={s.body} x="42" y="121">vpc ~1 &#8594; db ~1</text>
        <text className={s.muted} x="42" y="137">db.network reads vpc.network</text>

        <rect className={s.barAccent} x="28" y="160" width="3" height="38" />
        <text className={s.accent} x="42" y="175">vpc ~1 &#8594; db ~2</text>
        <text className={s.accentSmall} x="42" y="191">db.network reads vpc.private_network</text>

        <text className={s.muted} x="28" y="222">both environments run aws-vpc 1.4.0</text>

        <path className={s.routeAccent} d="M 330 178 C 372 178, 372 78, 414 78" />
        <path className={`${s.route} ${s.routeOld}`} d="M 330 124 C 372 124, 372 178, 414 178" />
        <path className={`${s.routeAccent} ${s.routeNew}`} d="M 330 178 C 372 178, 372 178, 414 178" />
        <path className={s.route} d="M 330 124 C 372 124, 372 278, 414 278" />

        <rect className={s.surfaceAccent} x="414" y="44" width="298" height="70" rx="6" />
        <text className={s.heading} x="434" y="68">DEVELOPMENT</text>
        <text className={s.name} x="434" y="88">db 2.0.0</text>
        <text className={s.accentSmall} x="434" y="104">wired to vpc.private_network</text>

        <rect className={`${s.surface} ${s.stgBox}`} x="414" y="144" width="298" height="70" rx="6" />
        <text className={s.heading} x="434" y="168">STAGING</text>
        <g className={s.stgOld}>
          <text className={s.name} x="434" y="188">db 1.2.0</text>
          <text className={s.muted} x="434" y="204">wired to vpc.network</text>
        </g>
        <g className={s.stgNew}>
          <text className={s.name} x="434" y="188">db 2.0.0</text>
          <text className={s.accentSmall} x="434" y="204">wired to vpc.private_network</text>
        </g>

        <rect className={s.surface} x="414" y="244" width="298" height="70" rx="6" />
        <text className={s.heading} x="434" y="268">PRODUCTION</text>
        <text className={s.muted} x="692" y="268" textAnchor="end">not upgraded</text>
        <text className={s.name} x="434" y="288">db 1.2.0</text>
        <text className={s.muted} x="434" y="304">wired to vpc.network</text>

        <text className={`${s.muted} ${s.capBefore}`} x="360" y="336" textAnchor="middle">
          each environment materializes the link whose version ranges its deployed bundles satisfy
        </text>
        <text className={`${s.accentSmall} ${s.capAfter}`} x="360" y="336" textAnchor="middle">
          staging upgraded to db 2.0.0 and picked up the vpc ~1 &#8594; db ~2 link with no rewiring
        </text>
      </svg>
    </figure>
  );
}
