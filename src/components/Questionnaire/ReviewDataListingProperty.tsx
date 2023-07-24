import { Stack, styled } from "@mui/material";
import { FC } from "react";

export const StyledLabel = styled("span")(() => ({
  color: "#000000",
  fontSize: "13px",
  fontFamily: "'Nunito', 'Rubik', sans-serif",
  fontWeight: 700,
  lineHeight: "19.6px",
  letterSpacing: "0.52px",
  textTransform: "uppercase",
}));

export const StyledValue = styled("span")(() => ({
  color: "#595959",
  fontSize: "16px",
  fontFamily: "'Nunito', 'Rubik', sans-serif",
  fontWeight: 400,
  lineHeight: "19.6px",
}));

const StyledLabelWrapper = styled(Stack)(() => ({
  display: "inline-flex",
  marginRight: "22px",
  minWidth: "fit-content",
}));

const StyledPropertyWrapper = styled(Stack)(() => ({
  marginBottom: "3px",
}));

type Props = {
  label?: string | JSX.Element;
  value: string | JSX.Element;
  valuePlacement?: "right" | "bottom";
  hideLabel?: boolean;
};

const ReviewDataListingProperty: FC<Props> = ({
  label,
  value,
  valuePlacement = "right",
  hideLabel = false,
}) => (
  <StyledPropertyWrapper
    direction={valuePlacement === "bottom" ? "column" : "row"}
    alignItems="start"
    justifyContent="start"
  >
    {label && (
      <StyledLabelWrapper
        direction="row"
        alignItems="center"
        sx={{ marginBottom: valuePlacement === "bottom" ? "3px" : 0 }}
      >
        <StyledLabel>{!hideLabel && label}</StyledLabel>
      </StyledLabelWrapper>
    )}
    {typeof value === "string" ? (
      <Stack
        display={valuePlacement === "right" ? "inline-flex" : "flex"}
        direction="row"
        alignItems="center"
      >
        <StyledValue>{value}</StyledValue>
      </Stack>
    ) : (
      value
    )}
  </StyledPropertyWrapper>
);

export default ReviewDataListingProperty;
