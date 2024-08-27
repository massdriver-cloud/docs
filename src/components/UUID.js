import React, { useContext } from "react";
import { UUIDContext } from "./UUIDFetcher";

const UUID = () => {
  const uuid = useContext(UUIDContext);
  return <span>{uuid || "Loading..."}</span>;
};

export default UUID;
