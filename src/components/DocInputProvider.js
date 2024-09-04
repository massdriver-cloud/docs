import React, { createContext, useState } from "react";

export const DocInputContext = createContext();

const DocInputProvider = ({ children }) => {
  const [fields, setFields] = useState({});
  const setField = (fieldName, fieldValue) =>
    setFields((curFields) => ({
      ...curFields,
      ...(fieldName && { [fieldName]: fieldValue || "" }),
    }));
  console.log("fields: ", fields);

  const getField = (fieldName) => fields[fieldName] || "";

  return (
    <DocInputContext.Provider
      value={{
        setField,
        getField,
      }}
    >
      {children}
    </DocInputContext.Provider>
  );
};

export default DocInputProvider;
