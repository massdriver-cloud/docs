import React from "react";
import { Figure, Box, Arrow, Label } from "./primitives";

const W = 720;

export function TerralithSeam() {
  return (
    <Figure
      uid="terralith-seam"
      width={W}
      height={252}
      label="The Terraform monolith keeps owning the VPC, the EKS cluster, the RDS instance and the IAM roles. Its VPC outputs become an imported aws-vpc resource in Massdriver, which is the network default of the orders-prod environment. New bundles, ecs-cluster and postgres, connect to that default and deploy into the existing VPC."
    >
      <Label x={8} y={18} kind="heading" anchor="start">TERRAFORM MONOLITH</Label>
      <Label x={274} y={18} kind="heading" anchor="start">IMPORTED</Label>
      <Label x={500} y={18} kind="heading" anchor="start">NEW BUNDLES</Label>

      <Box
        x={8}
        y={30}
        w={200}
        h={212}
        tone="well"
        lines={[
          ["name", "s3://tf-state/prod"],
          ["accentSmall", "aws_vpc.main"],
          ["accentSmall", "aws_subnet.private[*]"],
          ["muted", "aws_eks_cluster.main"],
          ["muted", "aws_db_instance.orders"],
          ["muted", "aws_iam_role.*"],
          ["muted", "…400 more"],
          ["body", " "],
          ["muted", "unchanged, still applied"],
          ["muted", "by the same pipeline"],
        ]}
        top={26}
      />

      <Arrow tone="Accent" d="M 208 98 L 272 98" />
      <Label x={240} y={88} kind="accentSmall">outputs</Label>

      <Box
        x={274}
        y={58}
        w={190}
        h={84}
        tone="accent"
        lines={[["heading", "RESOURCE"], ["name", "aws-vpc"], ["muted", "mass resource create"], ["muted", "origin: imported"]]}
      />

      <Arrow tone="Accent" dashed d="M 369 142 L 369 186" />
      <Box x={274} y={188} w={190} h={54} lines={[["heading", "ORDERS-PROD"], ["muted", "default: network"]]} />

      <Arrow tone="Accent" d="M 464 215 C 482 215, 482 74, 498 74" />
      <Arrow tone="Accent" d="M 464 215 C 482 215, 482 164, 498 164" />

      <Box x={500} y={40} w={212} h={68} lines={[["name", "ecs-cluster"], ["muted", "ALB in the public subnets"], ["muted", "tasks in the private subnets"]]} top={25} />
      <Box x={500} y={130} w={212} h={68} lines={[["name", "postgres"], ["muted", "RDS in the internal subnets"], ["muted", "own client security group"]]} top={25} />
    </Figure>
  );
}

export function AutomationsProject() {
  return (
    <Figure
      uid="automations-project"
      width={W}
      height={226}
      label="The platform project's dev environment deploys vpc, dns-zone and ecs-cluster. Each resource is granted to the automations project and set as an environment default of automations-main. The pr-sync instance in automations-main uses those defaults, and its service_account slot is a remote reference to an imported massdriver-service-account resource."
    >
      <Label x={8} y={18} kind="heading" anchor="start">platform-dev</Label>
      <Label x={420} y={18} kind="heading" anchor="start">automations-main</Label>

      <Box x={8} y={30} w={200} h={46} lines={[["name", "vpc"], ["muted", "aws-vpc"]]} top={20} />
      <Box x={8} y={90} w={200} h={46} lines={[["name", "dns-zone"], ["muted", "aws-dns-zone"]]} top={20} />
      <Box x={8} y={150} w={200} h={46} lines={[["name", "ecs-cluster"], ["muted", "aws-ecs-cluster"]]} top={20} />

      <Arrow tone="Accent" dashed d="M 208 53 C 320 53, 320 100, 418 100" />
      <Arrow tone="Accent" dashed d="M 208 113 C 320 113, 320 120, 418 120" />
      <Arrow tone="Accent" dashed d="M 208 173 C 320 173, 320 140, 418 140" />
      <Label x={314} y={198} kind="accentSmall">grant + environment default</Label>

      <Box
        x={420}
        y={74}
        w={292}
        h={92}
        tone="accent"
        lines={[["heading", "INSTANCE"], ["name", "automations-main-prsync"], ["muted", "massdriver-pr-sync-ecs"], ["muted", "host: pr-sync.dev.example.com"]]}
      />

      <Box x={420} y={186} w={292} h={34} tone="ghost" lines={[["muted", "imported massdriver-service-account"]]} top={21} />
      <Arrow tone="Accent" d="M 566 186 L 566 168" />
      <Label x={630} y={180} kind="accentSmall">remote ref</Label>
    </Figure>
  );
}
