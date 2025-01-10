import { FC, memo, useState } from "react";
import { Button, styled } from "@mui/material";
import FormDialog from "./FormDialog";
import { useAuthContext } from "../Contexts/AuthContext";
import { hasPermission } from "../../config/AuthPermissions";

const StyledButton = styled(Button)({
  marginLeft: "42px",
  marginBottom: "1px",
  color: "#0B7F99",
  textTransform: "uppercase",
  fontSize: "13px",
  fontFamily: "Public Sans",
  fontWeight: "600",
  letterSpacing: "1.5",
  textDecoration: "underline !important",
  textUnderlineOffset: "2px",
  "&:hover": {
    backgroundColor: "transparent",
  },
});

/**
 * A component to handle profile-based role change requests.
 *
 * @returns {React.ReactNode} A Request Access button and dialog.
 */
const AccessRequest: FC = (): React.ReactNode => {
  const { user } = useAuthContext();

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const handleClick = () => {
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
  };

  if (!hasPermission(user, "access", "request")) {
    return null;
  }

  return (
    <>
      <StyledButton
        variant="text"
        onClick={handleClick}
        data-testid="request-access-button"
        disableFocusRipple
        disableRipple
      >
        Request Access
      </StyledButton>
      {dialogOpen && <FormDialog open onClose={handleClose} />}
    </>
  );
};

export default memo(AccessRequest);
