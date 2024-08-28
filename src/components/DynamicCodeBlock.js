import React, { useContext } from "react";
import { UUIDContext } from "./UUIDFetcher";
import { CredentialContext } from "./CredentialInput";

const DynamicTrustPolicy = () => {
  const uuid = useContext(UUIDContext);
  const { credName } = useContext(CredentialContext);

  const code = `aws iam create-role --role-name=${credName} --description="Massdriver Cloud Provisioning Role" --assume-role-policy-document='{"Version":"2012-10-17","Statement":[{"Sid":"MassdriverCloudProvisioner","Effect":"Allow","Principal":{"AWS":["308878630280"]},"Action":"sts:AssumeRole","Condition":{"StringEquals":{ "sts:ExternalId":"${uuid}"}}}]}'
  `;

  return (
    <pre>
      <code>{code}</code>
    </pre>
  );
};

const DynamicRolePrivileges = () => {
  const { credName } = useContext(CredentialContext);

  const code = `aws iam attach-role-policy --role-name=${credName} --policy-arn=arn:aws:iam::aws:policy/AdministratorAccess`;

  return (
    <pre>
      <code>{code}</code>
    </pre>
  );
};

const DynamicServicePrincipal = () => {
  const { credName, accountId } = useContext(CredentialContext);

  const code = `az ad sp create-for-rbac --name ${credName} --role contributor --scopes /subscriptions/${accountId}`;

  return (
    <pre>
      <code>{code}</code>
    </pre>
  );
};

export { DynamicTrustPolicy, DynamicRolePrivileges, DynamicServicePrincipal };
