import React, { useContext, useEffect } from "react";
import { DocInputContext } from "./DocInputProvider";

const DocInput = ({
  className,
  fieldName,
  placeholder,
  label,
  initialValue = "",
}) => {
  const { setField, getField } = useContext(DocInputContext);
  const value = getField(fieldName);

  useEffect(() => {
    setField(fieldName, initialValue);
  }, []);

  return (
    <div className={className || "doc-input"}>
      {label}
      <input
        type="text"
        onChange={(e) => setField(fieldName, e.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
};

export default DocInput;
