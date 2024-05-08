import { useState } from "react";
import { Chip, ChipProps, styled } from "@mui/material";
import { useSnackbar } from "notistack";
import { useMutation } from "@apollo/client";
import { ReactComponent as DeleteFileIcon } from "../../assets/icons/delete_single_file_icon.svg";
import { DELETE_EXTRA_FILE, DeleteExtraFileResp } from "../../graphql";
import { useAuthContext } from "../Contexts/AuthContext";

const StyledChip = styled(Chip)({
  "&.MuiChip-root": {
    border: "1px solid #2B528B",
    background: "#2B528B",
    height: "21px",
    marginLeft: "60.5px",
    alignSelf: "center",
  },
  "& .MuiSvgIcon-root": {
    color: "#FFFFFF",
    fontSize: "15px",
    marginLeft: "3.65px",
  },
  "& .MuiChip-label": {
    color: "#D8E3F2",
    fontFamily: "'Inter', 'Rubik', sans-serif",
    fontWeight: 400,
    fontSize: "10px",
    lineHeight: "11px",
    paddingLeft: "8px",
    paddingRight: "5px",
  },
});

/**
 * The roles that are allowed to delete orphan files within a submission.
 *
 * @note The button is only visible to users with these roles.
 */
const DeleteOrphanFileRoles: User["role"][] = [
  "Submitter",
  "Organization Owner",
  "Data Curator",
  "Admin",
];

type Props = {
  submission: Submission;
  submittedID: QCResult["submittedID"];
  onDeleteFile: (success: boolean) => void;
} & ChipProps;

const DeleteOrphanFileChip = ({
  submission,
  submittedID,
  onDeleteFile,
  disabled,
  ...rest
}: Props) => {
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState<boolean>(false);

  const [deleteExtraFile] = useMutation<DeleteExtraFileResp>(DELETE_EXTRA_FILE, {
    context: { clientName: "backend" },
    fetchPolicy: "no-cache",
  });

  const deleteOrphanFile = async () => {
    setLoading(true);

    try {
      const { data: d, errors } = await deleteExtraFile({
        variables: {
          _id: submission._id,
          fileName: submittedID,
        },
      });

      if (errors || !d?.deleteExtraFile?.success) {
        throw new Error("Unable to delete orphan file.");
      }

      onDeleteFile(true);
    } catch (err) {
      enqueueSnackbar("There was an issue deleting orphan file.", {
        variant: "error",
      });
      onDeleteFile(false);
    } finally {
      setLoading(false);
    }
  };

  if (
    !user?.role ||
    !DeleteOrphanFileRoles.includes(user.role) ||
    !submission?.fileErrors?.find((fileError) => fileError.submittedID === submittedID)
  ) {
    return null;
  }

  return (
    <StyledChip
      icon={<DeleteFileIcon data-testid="delete-orphaned-file-icon" />}
      label="Delete orphaned file"
      onClick={deleteOrphanFile}
      disabled={loading || disabled}
      aria-label="Delete orphaned file"
      data-testid="delete-orphaned-file-chip"
      {...rest}
    />
  );
};

export default DeleteOrphanFileChip;
