---
id: topologies-person
slug: /continuous-delivery/topologies/person
title: Person Topologies
sidebar_label: Person
description: Environments that belong to a developer, a team, an agent, or an attendee.
---

# Person Topologies

Each environment belongs to someone.

## Developer Workspace {#developer-workspace}

<Topology id="developer-workspace" />

One environment per developer, forked from a shared environment.

- **Project:** One project. Each workspace is a fork.
- **Instances:** The developer deploys the components they are working on. The rest are filled by remote references to the shared environment.
- **Versions:** Development releases on the instances being worked on. Development releases are separated by version and not by author, so two developers on the same bundle version should each hold the exact development tag they published instead of following `+dev`.
- **Parity:** Workspaces are partial. Re-fork to catch up with the parent, which discards local edits.

**Example.** The [sandbox-on-join](/continuous-delivery/automations/sandbox-on-join) automation forks `ecomm-dev` into `ecomm-alice` when Alice joins the payments group. Alice deploys only the payments service, from the development releases she publishes, and the database and other services are remote references to dev. When she leaves the group, the automation decommissions her workspace.

## Team Environment {#team-environment}

<Topology id="team-environment" />

One environment per team inside a shared project.

- **Project:** One project whose blueprint holds every team's components.
- **Instances:** Each team deploys its own components and references the others from the environment of the team that owns them.
- **Versions:** Each team chooses the channels for its own instances.
- **Parity:** There is none between team environments. If teams never deploy each other's components, separate projects linked by remote references are simpler.

**Example.** The payments, search, and billing teams each own one environment of the `ecomm` project. The `search` environment deploys the search service and reads payments and billing from those teams' environments. Payments follows `+dev` on its own service, and billing holds `~1.4` on its.

## Agent Workspace {#agent-workspace}

<Topology id="agent-workspace" />

One environment per AI agent task. It is forked when the task starts and decommissioned when the task ends or a time limit passes.

- **Project:** One project. Each task is a fork.
- **Instances:** Only the components named in the task are deployed. The rest are referenced from the parent.
- **Versions:** The agent holds the exact development tag it published, since several tasks can work on the same bundle at once.
- **Parity:** Parity is not a goal. The agent's write access should end at its own fork, which an attribute on the environment can enforce.

**Example.** A coding agent picks up a ticket to add a read replica. It forks `ecomm-staging` into `ecomm-task481` with an `agent=true` attribute, publishes a development release of the database bundle, deploys it in the fork, and attaches the plan to its pull request. An [access policy](/platform-operations/security/access-control#policies) conditioned on that attribute lets the agent's service account deploy only in its own forks. The fork is decommissioned when the pull request closes.

## Training Environment {#training-environment}

<Topology id="training-environment" />

One environment per attendee of a workshop or course, forked from a template before the session and decommissioned after it.

- **Project:** One project with a template environment.
- **Instances:** Every component the exercise uses is deployed for every attendee, at the smallest sizes.
- **Versions:** Exact versions copied from the template, so every attendee sees the same thing.
- **Parity:** Every attendee environment should match the template when the session starts.

**Example.** A Kubernetes workshop has 30 attendees. The night before, a script runs `mass environment fork workshop-template seat01` through `seat30` and deploys each one. After the session, the script decommissions and deletes them.
