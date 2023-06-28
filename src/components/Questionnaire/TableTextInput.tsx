import React, { FC, useEffect, useId, useState, useRef } from "react";
import {
  Input,
  InputProps,
} from "@mui/material";
import { WithStyles, withStyles } from "@mui/styles";

/*
*Pass in a regex pattern if you want this field to have custom validation checking
*/
type Props = {
  pattern?: string;
  patternValidityMessage?: string;
  maxLength?: number;
  classes: WithStyles<typeof styles>["classes"];
} & InputProps;

/**
 * Generates a generic text input with a label and help text
 *
 * NOTE:
 * - We're using a custom wrapper for Material UI's OutlinedInput component
 *   instead of using the TextField component because of the forced
 *   floating label behavior of TextField.
 *
 * @param {Props} props
 * @returns {JSX.Element}
 */
const TableTextInput: FC<Props> = ({
  classes,
  value,
  patternValidityMessage,
  maxLength,
  pattern,
  ...rest
}) => {
  const id = useId();
  const [val, setVal] = useState(value);
  const regex = new RegExp(pattern);
  const inputElement = useRef<HTMLInputElement>(null);
  const onChange = (newVal) => {
    if (typeof maxLength === "number" && newVal.length > maxLength) {
      newVal = newVal.slice(0, maxLength);
    }
    if (!newVal.match(regex)) {
      inputElement.current.setCustomValidity(patternValidityMessage || "Please enter input in the correct format");
    } else {
      inputElement.current.setCustomValidity("");
    }
    setVal(newVal);
  };

  useEffect(() => {
    onChange(value.toString().trim());
  }, [value]);

  return (
    <Input
      inputRef={inputElement}
      sx={{ width: "100%" }}
      classes={{ root: classes.input }}
      id={id}
      size="small"
      value={val}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
      disableUnderline
    />
  );
};

const styles = () => ({
  input: {
    "& .MuiInputBase-input": {
      padding: "0px",
      color: "#083A50",
      fontWeight: 400,
      fontSize: "16px",
      fontFamily: "'Nunito', 'Rubik', sans-serif",
      lineHeight: "19.6px",
      height: "20px",
      width: "100%"
    },
    "& ::placeholder": {
      color: "#929296",
      fontWeight: 400,
      opacity: 1
    },
  },
});

export default withStyles(styles, { withTheme: true })(TableTextInput);
