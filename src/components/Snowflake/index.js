import React, { useEffect, useRef, useState } from "react";
import s from "./styles.module.css";

const SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];
const CLICKS = 5;
const FLAKES = 14;

const typingIn = (target) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

function useSequence(onMatch) {
  const position = useRef(0);
  useEffect(() => {
    const onKey = (event) => {
      if (typingIn(event.target)) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === SEQUENCE[position.current]) {
        position.current += 1;
        if (position.current === SEQUENCE.length) {
          position.current = 0;
          onMatch();
        }
      } else {
        position.current = key === SEQUENCE[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onMatch]);
}

function Flurry() {
  return (
    <div className={s.flurry} aria-hidden="true">
      {Array.from({ length: FLAKES }, (_, index) => (
        <span
          key={index}
          className={s.flake}
          style={{ left: `${(index * 97) % 100}%`, animationDelay: `${(index % 7) * 0.12}s` }}
        >
          ❄
        </span>
      ))}
    </div>
  );
}

function Hidden() {
  return (
    <div className={s.hidden} role="region" aria-label="Holiday mode">
      <p className={s.title}>
        <strong>
          <code>md/v1/eggs/xmas</code>
        </strong>
      </p>
      <p>
        Turns holiday decorations on or off in a project. Set it on a project. Format: TEXT. The value is{" "}
        <code>on</code> or <code>off</code>. The only egg is <code>xmas</code>. Widget name: <code>project.egg</code>.
      </p>
      <pre className={s.code}>
        <code>mass alpha stash set billing.md/v1/eggs/xmas on</code>
      </pre>
      <p>
        When the key is <code>on</code>, the environment canvas shows colored lights along the top edge of each
        instance node, light snow over the canvas background, and a small wreath in the top-right corner. The
        decorations do not change the size or layout of the nodes.
      </p>
      <p>
        When your system asks for reduced motion, the lights do not twinkle and there is no snow. The{" "}
        <strong>Widgets</strong> button in the canvas toolbar hides the decorations.
      </p>
      <p>
        An egg key other than <code>xmas</code> is rejected. The error lists the allowed values.
      </p>
    </div>
  );
}

export default function Snowflake() {
  const [clicks, setClicks] = useState(0);
  const [open, setOpen] = useState(false);
  const reveal = useRef(() => setOpen(true)).current;
  useSequence(reveal);

  const onClick = () => {
    const next = clicks + 1;
    setClicks(next);
    if (next >= CLICKS) reveal();
  };

  return (
    <div className={s.root}>
      <button type="button" className={s.button} aria-label="Snowflake" onClick={onClick}>
        ❄
      </button>
      {open ? (
        <>
          <Flurry />
          <Hidden />
        </>
      ) : null}
    </div>
  );
}
