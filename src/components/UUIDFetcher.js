import React, { useEffect, useState } from "react";

export const UUIDContext = React.createContext();

const UUIDProvider = ({ children }) => {
  const [uuid, setUuid] = useState("");

  useEffect(() => {
    fetch("https://www.uuidgenerator.net/api/version4")
      .then((response) => response.text())
      .then((data) => {
        setUuid(data);
      })
      .catch((error) => {
        console.error("Error fetching UUID:", error);
      });
  }, []);

  return <UUIDContext.Provider value={uuid}>{children}</UUIDContext.Provider>;
};

export default UUIDProvider;
