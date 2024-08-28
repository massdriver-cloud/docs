import React, { useState, createContext, useContext } from "react";

export const CredentialContext = createContext();

const CredentialNameProvider = ({ children }) => {
  const [credName, setCredName] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [projectId, setProjectId] = useState("");

  return (
    <CredentialContext.Provider
      value={{
        credName,
        setCredName,
        subscriptionId,
        setSubscriptionId,
        tenantId,
        setTenantId,
        clientId,
        setClientId,
        clientSecret,
        setClientSecret,
        projectId,
        setProjectId,
      }}
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
      Enter a friendly name for your AWS role here:
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
      Enter a friendly name for your Azure service principal:
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
  const { setSubscriptionId } = useContext(CredentialContext);

  return (
    <div>
      Paste your Azure subscription ID here:
      <input
        type="text"
        onChange={(e) => setSubscriptionId(e.target.value)}
        placeholder="Enter Azure subscription ID"
      />
    </div>
  );
};

export const AzureSubscription = () => {
  const { subscriptionId } = useContext(CredentialContext);

  return <span>{subscriptionId || ""}</span>;
};

export const AzureTenantInput = () => {
  const { setTenantId } = useContext(CredentialContext);

  return (
    <div>
      Paste your Azure tenant ID here:
      <input
        type="text"
        onChange={(e) => setTenantId(e.target.value)}
        placeholder="Enter Azure tenant ID"
      />
    </div>
  );
};

export const AzureTenant = () => {
  const { tenantId } = useContext(CredentialContext);

  return <span>{tenantId || ""}</span>;
};

export const AzureClientInput = () => {
  const { setClientId } = useContext(CredentialContext);

  return (
    <div>
      Paste your Azure client ID here:
      <input
        type="text"
        onChange={(e) => setClientId(e.target.value)}
        placeholder="Enter Azure client ID"
      />
    </div>
  );
};

export const AzureClient = () => {
  const { clientId } = useContext(CredentialContext);

  return <span>{clientId || ""}</span>;
};

export const AzureClientSecretInput = () => {
  const { setClientSecret } = useContext(CredentialContext);

  return (
    <div>
      Paste your Azure client secret value here:
      <input
        type="text"
        onChange={(e) => setClientSecret(e.target.value)}
        placeholder="Enter client secret value"
      />
    </div>
  );
};

export const AzureClientSecret = () => {
  const { clientSecret } = useContext(CredentialContext);

  return <span>{clientSecret || ""}</span>;
};

export const GCPAccountInput = () => {
  const { setCredName } = useContext(CredentialContext);

  return (
    <div>
      Enter a friendly name for your GCP service account here:
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

export const GCPProjectInput = () => {
  const { setProjectId } = useContext(CredentialContext);

  return (
    <div>
      Paste your GCP project ID here:
      <input
        type="text"
        onChange={(e) => setProjectId(e.target.value)}
        placeholder="Enter GCP project ID"
      />
    </div>
  );
};

export const GCPProject = () => {
  const { projectId } = useContext(CredentialContext);

  return <span>{projectId || ""}</span>;
};
