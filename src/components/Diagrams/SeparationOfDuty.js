import React from "react";
import s from "./styles.module.css";

export default function SeparationOfDuty() {
  return (
    <figure className={s.figure}>
      <svg
        className={s.svg}
        viewBox="0 0 720 276"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="On an environment with separation of duty enabled, the account that proposed a deployment is refused when it tries to approve. A different reviewer approves it and the deployment runs. The proposer can still reject its own proposal."
      >
        <rect className={s.surface} x="8" y="60" width="196" height="76" rx="6" />
        <text className={s.heading} x="28" y="84">PROPOSED</text>
        <text className={s.body} x="28" y="104">proposed by dana</text>
        <text className={s.muted} x="28" y="122">params live on the deployment</text>

        <g className={s.sodDenied}>
          <path className={s.routeDanger} d="M 204 84 C 254 84, 254 54, 304 54" />
          <rect className={s.surface} x="304" y="26" width="230" height="58" rx="6" />
          <text className={s.heading} x="324" y="48">DANA APPROVES</text>
          <text className={s.danger} x="324" y="68">refused &#8212; same subject proposed it</text>
          <text className={s.muted} x="548" y="58">deployment stays PROPOSED</text>
        </g>

        <g className={s.sodAllowed}>
          <path className={s.routeAccent} d="M 204 112 C 254 112, 254 168, 304 168" />
          <rect className={s.surfaceAccent} x="304" y="140" width="230" height="58" rx="6" />
          <text className={s.heading} x="324" y="162">SAM APPROVES</text>
          <text className={s.accentSmall} x="324" y="182">params written to the instance</text>
          <path className={s.routeAccent} d="M 534 168 L 566 168" />
          <text className={s.accent} x="576" y="172">APPROVED</text>
        </g>

        <path className={s.route} d="M 204 122 C 234 122, 234 236, 264 236" />
        <text className={s.muted} x="274" y="232">dana can still reject the proposal</text>
        <text className={s.muted} x="274" y="248">withdrawing is not gated by the setting</text>

        <text className={s.muted} x="360" y="268" textAnchor="middle">
          the setting is read from the environment at approval time, for user and service account subjects alike
        </text>
      </svg>
    </figure>
  );
}
