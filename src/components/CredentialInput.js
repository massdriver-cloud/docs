import React, { useState, createContext, useContext } from "react";

export const CredentialContext = createContext();

const CredentialNameProvider = ({ children }) => {
  const [credName, setCredName] = useState("");
  const [accountId, setAccountId] = useState("");

  return (
    <CredentialContext.Provider
      value={{ credName, setCredName, accountId, setAccountId }}
    >
      {children}
    </CredentialContext.Provider>
  );
};

export default CredentialNameProvider;

export const AWSRoleInput = () => {
  const { setCredName } = useContext(CredentialContext);

  return (
    <div>
      Enter your AWS Role name here:
      <input
        type="text"
        onChange={(e) => setCredName(e.target.value)}
        placeholder="Enter AWS Role name"
      />
    </div>
  );
};

export const AWSRole = () => {
  const { credName } = useContext(CredentialContext);

  return <span>{credName || ""}</span>;
};

export const AzurePrincipalInput = () => {
  const { setCredName } = useContext(CredentialContext);

  return (
    <div>
      Enter your Azure service principal name here:
      <input
        type="text"
        onChange={(e) => setCredName(e.target.value)}
        placeholder="Enter Azure service principal name"
      />
    </div>
  );
};

export const AzurePrincipal = () => {
  const { credName } = useContext(CredentialContext);

  return <span>{credName || ""}</span>;
};

export const AzureSubscriptionInput = () => {
  const { setAccountId } = useContext(CredentialContext);

  return (
    <div>
      Enter your Azure subscription ID here:
      <input
        type="text"
        onChange={(e) => setAccountId(e.target.value)}
        placeholder="Enter Azure subscription ID"
      />
    </div>
  );
};

export const AzureSubscription = () => {
  const { accountId } = useContext(CredentialContext);

  return <span>{accountId || ""}</span>;
};

export const GCPAccountInput = () => {
  const { setCredName } = useContext(CredentialContext);

  return (
    <div>
      Enter your GCP service account name here:
      <input
        type="text"
        onChange={(e) => setCredName(e.target.value)}
        placeholder="Enter GCP service account name"
      />
    </div>
  );
};

export const GCPAccount = () => {
  const { credName } = useContext(CredentialContext);

  return <span>{credName || ""}</span>;
};
