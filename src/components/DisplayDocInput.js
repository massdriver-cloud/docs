import React, { useContext } from "react";
import { DocInputContext } from "./DocInputProvider";

const DisplayDocInput = ({ fieldName }) => {
  const { getField } = useContext(DocInputContext);

  return <span>{getField(fieldName)}</span>;
};

export default DisplayDocInput;
