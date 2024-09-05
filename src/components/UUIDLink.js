import React, { useContext } from "react";
import { UUIDContext } from "./UUIDFetcher";
import { DocInputContext } from "./DocInputProvider";

const UUIDLink = () => {
  const uuid = useContext(UUIDContext);
  const { getField } = useContext(DocInputContext);

  const url = `https://console.aws.amazon.com/cloudformation/home#/stacks/quickcreate?param_CustomerRoleName=${getField("awsRoleName")}&param_MassdriverExternalId=${uuid}&stackName=massdriver-provisioning-access&templateURL=https%3A%2F%2Fmassdriver-prod-quickconnect-0000.s3.us-west-2.amazonaws.com%2Fquick-connect.yml`;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      here
    </a>
  );
};

export default UUIDLink;
