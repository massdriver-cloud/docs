---
id: topologies-purpose
slug: /continuous-delivery/topologies/purpose
title: Purpose Topologies
sidebar_label: Purpose
description: Environments that exist to do one job.
---

# Purpose Topologies

Each environment exists to do one job.

## Load Test {#load-test}

<Topology id="load-test" />

A production-sized fork created for a performance test and decommissioned after it.

- **Project:** One project. The environment is a fork of prod.
- **Instances:** Every component in the request path is deployed at production size. Nothing is shared with prod, because the test has to load its own copies.
- **Versions:** The versions under test: the exact versions in prod, or the release about to go there.
- **Parity:** Params have to match prod, including size. The fork copies them, so avoid overrides.

**Example.** Two weeks before a sales event, `ecomm-prod` is forked into `ecomm-loadtest` with `--copy-secrets` and without remote references, so it gets its own database at production size. A load generator drives traffic at it for two hours, and the environment is decommissioned when the test ends.

## Security and Chaos Target {#security-and-chaos-target}

<Topology id="security-and-chaos-target" />

An isolated copy of production used as a target for penetration tests and fault injection.

- **Project:** One project, or a clone of the project in a separate cloud account when the test must not share credentials with anything else.
- **Instances:** Every component is deployed. No instance references another environment, so nothing outside the target can be damaged.
- **Versions:** The exact versions in prod.
- **Parity:** Parity is with prod at the time of the fork. Re-fork before each test.

**Example.** A quarterly penetration test runs against `pentest`, whose environment default is a credential for an isolated cloud account. The day before each test, `mass environment fork ecomm-prod pentest` re-forks it, so the target runs the versions and params that prod runs that day.

## Demo {#demo}

<Topology id="demo" />

A long-lived environment for sales demos and walkthroughs, reset to a known state on a schedule.

- **Project:** One project.
- **Instances:** Every component is deployed, at small sizes.
- **Versions:** Stable channels only. A demo environment never follows `+dev`.
- **Parity:** A scheduled re-fork from the parent resets params and versions to a known state.

**Example.** Sales engineers give demos from `demo`. A nightly job re-forks it from `staging`, which discards any params changed during the day's demos and picks up the release staging took that day.

## Partner Sandbox {#partner-sandbox}

<Topology id="partner-sandbox" />

A long-lived non-production environment that customers or partners integrate against.

- **Project:** One project.
- **Instances:** Every component that outside parties can reach is deployed.
- **Versions:** The same channels as prod, or one release ahead so partners can test upcoming changes.
- **Parity:** Partners depend on it behaving like prod, so Compare against prod should show size and data and nothing else.

**Example.** A payments API gives integrators a `sandbox` environment. Each release goes to the sandbox a week before prod so partners can test against it. After the week, the same version is promoted from the sandbox to prod.

## Spike {#spike}

<Topology id="spike" />

A throwaway environment for an experiment. Nothing is promoted from it.

- **Project:** A fork in the existing project when the experiment changes versions or params. A new project when it changes the architecture, because a component added to a blueprint is added to every environment.
- **Instances:** Whatever the experiment needs.
- **Versions:** Development releases.
- **Parity:** Parity is not a goal. Give the environment an owner and an expiry date so it gets decommissioned.

**Example.** An engineer wants to know whether Arm instances lower the cost of the API. A fork named `armtest` changes the instance type param and runs a benchmark, and is deleted afterward. Trying a different database engine changes the canvas, so that experiment goes in a new project.

## Scheduled {#scheduled}

<Topology id="scheduled" />

An environment that exists only during a time window, such as a nightly integration run or business hours.

- **Project:** One project.
- **Instances:** A schedule forks the environment and deploys it. Another schedule decommissions and deletes it.
- **Versions:** Whatever the parent holds at the time of the fork.
- **Parity:** Parity is with the parent at the start of each window, since every window is a new fork.

**Example.** An end-to-end suite needs a full environment for an hour each night. A CI schedule forks `ecomm-staging` into `ecomm-nightly` at 18:00, deploys it with `mass environment deploy`, runs the suite, then runs `mass environment decommission` and `mass environment delete`.
