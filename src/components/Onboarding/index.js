import React, { useEffect, useState } from "react";
import Link from "@docusaurus/Link";
import s from "./styles.module.css";

const QUESTIONS = [
  {
    key: "cloud",
    title: "Which catalog?",
    options: [
      { value: "aws", label: "AWS", detail: "massdriver-catalogs/aws: real OpenTofu for VPC, DNS, ECS, Lambda, RDS" },
      { value: "pets", label: "Pets", detail: "massdriver-catalog: real schemas, random_pet IaC, no cloud account" },
      { value: "azure", label: "Azure", detail: "Onboarding path not written yet", soon: true },
      { value: "gcp", label: "GCP", detail: "Onboarding path not written yet", soon: true },
    ],
  },
  {
    key: "start",
    title: "What is already running?",
    options: [
      { value: "greenfield", label: "Greenfield", detail: "An empty account. Massdriver builds the network and the cluster." },
      { value: "brownfield", label: "Brownfield", detail: "A Terraform monolith already runs the network, clusters and databases." },
    ],
  },
  {
    key: "runtime",
    title: "Where will the automations run?",
    options: [
      { value: "ecs", label: "Amazon ECS", detail: "Fargate behind the catalog's ecs-cluster load balancer" },
      { value: "k8s", label: "Kubernetes", detail: "EKS, GKE, AKS or any cluster, even one namespace someone else runs" },
      { value: "none", label: "Not yet", detail: "Skip automations for now" },
    ],
  },
];

const DEFAULTS = { cloud: "aws", start: "greenfield", runtime: "ecs" };

const CLI = {
  title: "Install the mass CLI and sign in",
  to: "/reference/cli/overview",
  body: "Every step after this runs mass. Check `mass version` reports 2.x for both the CLI and the server.",
};

function catalogStep(cloud) {
  if (cloud === "aws") {
    return {
      title: "Fork the AWS catalog and turn on its publish workflow",
      to: "/onboarding/catalogs#aws-catalog",
      body: "Credentials and resource types publish first, then every bundle. Each push to main publishes what changed.",
    };
  }
  return {
    title: "Clone the pets catalog and publish it",
    to: "/onboarding/catalogs#pets-catalog",
    body: "`make all` creates the OCI repositories, publishes the resource types and platforms, then the bundles.",
  };
}

const RESOURCE_TYPES = {
  title: "Install the official resource types",
  to: "/onboarding/official-resource-types",
  body: "massdriver-service-account, massdriver-kubernetes-cluster and massdriver-wireguard-tunnel. Automations and onboarding bundles depend on them.",
};

function credentialStep(cloud) {
  if (cloud === "aws") {
    return {
      title: "Connect an AWS account",
      to: "/onboarding/greenfield-aws#connect-an-aws-account",
      body: "An IAM role that trusts Massdriver's deployment identity tokens. No keys are stored.",
    };
  }
  return null;
}

function infraSteps({ cloud, start, runtime }) {
  if (start === "greenfield") {
    if (cloud === "aws") {
      return [
        {
          title: "Stand up the platform project: vpc, dns-zone, ecs-cluster",
          to: "/onboarding/greenfield-aws#stand-up-the-platform-project",
          body: "One project, a dev and a prod environment, three components linked on the canvas.",
        },
        {
          title: "Delegate the DNS zone",
          to: "/onboarding/greenfield-aws#delegate-the-dns-zone",
          body: "The zone's certificate is not issued until the parent domain points at it.",
        },
        {
          title: "Share the platform with app projects",
          to: "/onboarding/greenfield-aws#share-the-platform-with-app-projects",
          body: "Grant the VPC, zone and cluster, then set them as environment defaults.",
        },
      ];
    }
    return [
      {
        title: "Model the platform on the canvas",
        to: "/onboarding/catalogs#model-the-platform",
        body: "Add network, postgres, bucket and application. Connect them. Deploy. Nothing is created in a cloud.",
      },
    ];
  }

  const typeName = cloud === "aws" ? "aws-vpc" : "virtual-network";
  const steps = [
    {
      title: "Pick the seam in the Terraform monolith",
      to: "/onboarding/brownfield#pick-the-seam",
      body: "The network is almost always the first seam: everything depends on it and it rarely changes.",
    },
    {
      title: `Import the VPC as an ${typeName} resource`,
      to: "/onboarding/brownfield#import-the-vpc",
      body: "Build the payload from `tofu output -json` or the AWS CLI. The monolith keeps owning the VPC.",
    },
    {
      title: "Make it the environment default",
      to: "/onboarding/brownfield#make-it-the-environment-default",
      body: "Every bundle in the environment that needs a network now connects to the imported VPC.",
    },
  ];
  if (cloud === "aws") {
    steps.push({
      title: runtime === "ecs" ? "Deploy dns-zone and ecs-cluster on the imported VPC" : "Deploy a new bundle on the imported VPC",
      to: "/onboarding/brownfield#build-on-the-imported-vpc",
      body:
        runtime === "ecs"
          ? "dns-zone adopts an existing Route 53 zone. The cluster's load balancer serves HTTPS only with a zone connected."
          : "New infrastructure lands next to the old, in its network, without moving anything.",
    });
  } else {
    steps.push({
      title: "Deploy a new bundle on the imported network",
      to: "/onboarding/brownfield#build-on-the-imported-vpc",
      body: "The pets bundles still deploy random_pet. The connection to the imported resource is real.",
    });
  }
  return steps;
}

function automationSteps({ cloud, start, runtime }) {
  if (runtime === "none") return [];

  if (runtime === "ecs" && cloud !== "aws") {
    return [
      {
        blocked: true,
        title: cloud === "pets" ? "The pets catalog cannot run automations on ECS" : "ECS needs the AWS catalog",
        to: "/onboarding/automations#where-automations-run",
        body:
          cloud === "pets"
            ? "Pets bundles deploy random_pet. There is no ECS cluster to run a container on, so an automation has nowhere to go."
            : "The -ecs automation bundles depend on aws-ecs-cluster, which the AWS catalog's ecs-cluster bundle produces.",
        fixes: [
          { label: "Greenfield AWS with pr-sync on ECS", set: { cloud: "aws", start: "greenfield", runtime: "ecs" } },
          { label: "pr-sync in a namespace of a cluster you already have", set: { start: "brownfield", runtime: "k8s" } },
        ],
      },
    ];
  }

  const steps = [
    {
      title: "Import a Massdriver service account",
      to: "/onboarding/automations#import-a-service-account",
      body: "The bundle creates its event destination and calls the API with it.",
    },
  ];

  if (runtime === "k8s") {
    if (cloud === "aws" && start === "greenfield") {
      steps.push({
        soon: true,
        title: "The AWS catalog builds ECS, not EKS",
        to: "/onboarding/automations#where-automations-run",
        body: "There is no EKS bundle to deploy. Import an EKS cluster you already run, or run the automations on the catalog's ecs-cluster.",
        fixes: [{ label: "Run them on ECS", set: { runtime: "ecs" } }],
      });
    }
    steps.push({
      title:
        start === "brownfield"
          ? "Import the namespace you were given as a Kubernetes cluster resource"
          : "Import the cluster as a Kubernetes cluster resource",
      to: "/onboarding/brownfield-kubernetes#import-the-namespace",
      body: "A ServiceAccount token bound to one namespace with the admin ClusterRole. Nothing cluster-wide.",
    });
    steps.push({
      title: "Publish massdriver-pr-sync",
      to: "/onboarding/automations#publish-the-bundle",
      body: "From massdriver-automations/bundles. The Kubernetes bundles have no -ecs suffix.",
    });
    steps.push({
      title: "Deploy pr-sync into the namespace",
      to: "/onboarding/brownfield-kubernetes#deploy-pr-sync-into-the-namespace",
      body: "Needs an ingress controller, a DNS name for the host and TLS. The bundle does not create the namespace.",
    });
  } else {
    steps.push({
      title: "Publish massdriver-pr-sync-ecs",
      to: "/onboarding/automations#publish-the-bundle",
      body: "The AWS catalog ships the other -ecs automation bundles. pr-sync comes from massdriver-automations.",
    });
    steps.push({
      title: "Deploy pr-sync on the cluster",
      to: "/onboarding/automations#deploy-pr-sync-on-ecs",
      body: "An automations project shares the platform's VPC, zone and cluster. The host defaults to pr-sync.<zone>.",
    });
  }

  steps.push({
    title: "Pin the pull request note on a project",
    to: "/onboarding/automations#pin-the-note",
    body: "pr-sync writes github/prs to the project's stash. A Liquid note lists what is in review, in checks and merging.",
  });
  return steps;
}

function soonStep(cloud) {
  const name = cloud === "azure" ? "Azure" : "GCP";
  return {
    soon: true,
    title: `${name} onboarding is not written yet`,
    to: "/onboarding/catalogs#azure-and-gcp",
    body:
      cloud === "azure"
        ? "massdriver-catalogs/azure has 14 Azure bundles and the service principal credential. Until this path exists, the route below uses the pets catalog's azure platform."
        : "There is no GCP catalog yet. The route below uses the pets catalog and its gcp service account platform.",
  };
}

function buildRoute(answers) {
  const effective = { ...answers };
  const route = [CLI];
  if (answers.cloud === "azure" || answers.cloud === "gcp") {
    route.push(soonStep(answers.cloud));
    effective.cloud = "pets";
  }
  route.push(catalogStep(effective.cloud));
  route.push(RESOURCE_TYPES);
  const cred = credentialStep(effective.cloud);
  if (cred) route.push(cred);
  route.push(...infraSteps(effective));
  route.push(...automationSteps(effective));
  if (effective.cloud === "aws") {
    route.push({
      title: "Ship an app on a runtime",
      to: "/bundle-development/runtimes-and-applications",
      body: "An app is a bundle with no IaC that names lambda-function or ecs-service as its runtime.",
    });
  } else {
    route.push({
      title: "Replace random_pet with your IaC",
      to: "/onboarding/catalogs#replace-the-stubs",
      body: "Keep the schemas you settled on. `mass bundle build` regenerates the variables from them.",
    });
  }
  return route;
}

function readQuery() {
  if (typeof window === "undefined") return DEFAULTS;
  const q = new URLSearchParams(window.location.search);
  const out = { ...DEFAULTS };
  QUESTIONS.forEach(({ key, options }) => {
    const v = q.get(key);
    if (v && options.some((o) => o.value === v)) out[key] = v;
  });
  return out;
}

function writeQuery(answers) {
  if (typeof window === "undefined") return;
  const q = new URLSearchParams(window.location.search);
  Object.entries(answers).forEach(([k, v]) => q.set(k, v));
  window.history.replaceState(null, "", `${window.location.pathname}?${q.toString()}${window.location.hash}`);
}

function Inline({ text }) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((p, i) => (p.startsWith("`") && p.endsWith("`") ? <code key={i}>{p.slice(1, -1)}</code> : p));
}

export default function OnboardingPath() {
  const [answers, setAnswers] = useState(DEFAULTS);

  useEffect(() => {
    setAnswers(readQuery());
  }, []);

  const choose = (patch) => {
    const next = { ...answers, ...patch };
    setAnswers(next);
    writeQuery(next);
  };

  const route = buildRoute(answers);
  let n = 0;

  return (
    <div className={s.path}>
      <div className={s.questions}>
        {QUESTIONS.map((q) => (
          <fieldset key={q.key} className={s.question}>
            <legend className={s.legend}>{q.title}</legend>
            <div className={s.options}>
              {q.options.map((o) => {
                const active = answers[q.key] === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={active}
                    className={`${s.option} ${active ? s.active : ""}`}
                    onClick={() => choose({ [q.key]: o.value })}
                  >
                    <span className={s.optionLabel}>
                      {o.label}
                      {o.soon && <span className={s.soonTag}>TBD</span>}
                    </span>
                    <span className={s.optionDetail}>{o.detail}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <ol className={s.route}>
        {route.map((step) => {
          const marker = step.blocked ? "✕" : step.soon ? "…" : String(++n);
          const cls = step.blocked ? s.blocked : step.soon ? s.soon : "";
          return (
            <li key={step.title} className={`${s.step} ${cls}`}>
              <span className={s.marker} aria-hidden="true">
                {marker}
              </span>
              <div className={s.stepBody}>
                <Link className={s.stepTitle} to={step.to}>
                  {step.title}
                </Link>
                <p className={s.stepText}>
                  <Inline text={step.body} />
                </p>
                {step.fixes && (
                  <div className={s.fixes}>
                    {step.fixes.map((f) => (
                      <button key={f.label} type="button" className={s.fix} onClick={() => choose(f.set)}>
                        {f.label} →
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
