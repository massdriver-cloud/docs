import React, { useContext } from "react";
import { UUIDContext } from "./UUIDFetcher";

const DynamicCodeBlock = () => {
  const uuid = useContext(UUIDContext);
  const code = `aws iam create-role --role-name=massdriver-provisioner --description="Massdriver Cloud Provisioning Role" --assume-role-policy-document='{"Version":"2012-10-17","Statement":[{"Sid":"MassdriverCloudProvisioner","Effect":"Allow","Principal":{"AWS":["308878630280"]},"Action":"sts:AssumeRole","Condition":{"StringEquals":{ "sts:ExternalId":"${uuid}"}}}]}'
  `;

  return (
    <pre>
      <code>{code}</code>
    </pre>
  );
};

export default DynamicCodeBlock;
