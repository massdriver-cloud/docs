import React, { useContext } from "react";
import { UUIDContext } from "./UUIDFetcher";
import { DocInputContext } from "./DocInputProvider";

export const DynamicTrustPolicy = () => {
  const uuid = useContext(UUIDContext);
  const { getField } = useContext(DocInputContext);

  const code = `aws iam create-role --role-name=${getField("awsRoleName")} --description="Massdriver Cloud Provisioning Role" --assume-role-policy-document='{"Version":"2012-10-17","Statement":[{"Sid":"MassdriverCloudProvisioner","Effect":"Allow","Principal":{"AWS":["308878630280"]},"Action":"sts:AssumeRole","Condition":{"StringEquals":{ "sts:ExternalId":"${uuid}"}}}]}'
  `;

  return (
    <pre>
      <code>{code}</code>
    </pre>
  );
};

export const DynamicRolePrivileges = () => {
  const { getField } = useContext(DocInputContext);

  const code = `aws iam attach-role-policy --role-name=${getField("awsRoleName")} --policy-arn=arn:aws:iam::aws:policy/AdministratorAccess`;

  return (
    <pre>
      <code>{code}</code>
    </pre>
  );
};

export const DynamicServicePrincipal = () => {
  const { getField } = useContext(DocInputContext);

  const code = `az ad sp create-for-rbac --name ${getField("azureServicePrincipalName")} --role contributor --scopes /subscriptions/${getField("azureSubscriptionId")}`;

  return (
    <pre>
      <code>{code}</code>
    </pre>
  );
};

export const DynamicServiceAccount = () => {
  const { getField } = useContext(DocInputContext);

  const code = `gcloud iam service-accounts create ${getField("gcpServiceAccountName")} --description="Massdriver Service Account" --display-name=${getField("gcpServiceAccountName")}`;

  return (
    <pre>
      <code>{code}</code>
    </pre>
  );
};

export const DynamicProjectPolicy = () => {
  const { getField } = useContext(DocInputContext);

  const code = `gcloud projects add-iam-policy-binding ${getField("gcpProjectId")} --member=serviceAccount:${getField("gcpServiceAccountName")}@${getField("gcpProjectId")}.iam.gserviceaccount.com --role=roles/owner`;

  return (
    <pre>
      <code>{code}</code>
    </pre>
  );
};

export const DynamicAccountKeys = () => {
  const { getField } = useContext(DocInputContext);

  const code = `gcloud iam service-accounts keys create md-${getField("gcpServiceAccountName")}-key.json --iam-account=${getField("gcpServiceAccountName")}@${getField("gcpProjectId")}.iam.gserviceaccount.com`;

  return (
    <pre>
      <code>{code}</code>
    </pre>
  );
};
