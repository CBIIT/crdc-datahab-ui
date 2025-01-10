import { memo, useMemo, useState } from "react";
import { isEqual } from "lodash";
import { IconButton, IconButtonProps, styled } from "@mui/material";
import { useSnackbar } from "notistack";
import { useMutation } from "@apollo/client";
import { ReactComponent as DeleteAllFilesIcon } from "../../assets/icons/delete_all_files_icon.svg";
import StyledFormTooltip from "../StyledFormComponents/StyledTooltip";
import DeleteDialog from "../DeleteDialog";
import { useSubmissionContext } from "../Contexts/SubmissionContext";
import { useAuthContext } from "../Contexts/AuthContext";
import { DELETE_DATA_RECORDS, DeleteDataRecordsInput, DeleteDataRecordsResp } from "../../graphql";
import { titleCase } from "../../utils";
import { hasPermission } from "../../config/AuthPermissions";

const StyledIconButton = styled(IconButton)(({ disabled }) => ({
  opacity: disabled ? 0.26 : 1,
}));

const StyledTooltip = styled(StyledFormTooltip)({
  "& .MuiTooltip-tooltip": {
    color: "#000000",
  },
});

/**
 * An array of submission statuses that should disable the delete button
 */
const DisabledStatuses: SubmissionStatus[] = [
  "Submitted",
  "Released",
  "Completed",
  "Canceled",
  "Deleted",
];

type Props = {
  /**
   * The name of the node type currently selected
   */
  nodeType: string;
  /**
   * An array of the selected node IDs
   */
  selectedItems: string[];
  /**
   * Optional callback function for when successful deletion occurs
   */
  onDelete?: (message: string) => void;
} & Omit<IconButtonProps, "onClick">;

const DeleteNodeDataButton = ({ nodeType, selectedItems, disabled, onDelete, ...rest }: Props) => {
  const { enqueueSnackbar } = useSnackbar();
  const { data } = useSubmissionContext();
  const { user } = useAuthContext();
  const { _id, status, deletingData } = data?.getSubmission || {};

  const collaborator = data?.getSubmission?.collaborators?.find(
    (c) => c.collaboratorID === user?._id
  );

  const tooltipText = useMemo<string>(() => {
    if (deletingData === true) {
      return "Delete action unavailable while another delete operation is in progress";
    }

    if (nodeType?.toLowerCase() === "data file") {
      return "Delete all the selected data files from this data submission";
    }

    return "Delete all the selected records from this data submission";
  }, [deletingData, nodeType]);

  const content = useMemo(() => {
    const nodeTerm: string = selectedItems.length > 1 ? "nodes" : "node";
    const itemCount: number = selectedItems.length;
    const isDataFile: boolean = nodeType.toLowerCase() === "data file";
    const isMultiple: boolean = itemCount !== 1;

    return {
      snackbarError: "An error occurred while deleting the selected rows.",
      snackbarSuccess: isDataFile
        ? `${itemCount} ${nodeType}${
            isMultiple ? "s" : ""
          } have been deleted from this data submission`
        : `${itemCount} ${nodeType} ${nodeTerm} and their associated child nodes have been deleted from this data submission`,
      dialogTitle: isDataFile
        ? `Delete Data File${isMultiple ? "s" : ""}`
        : `Delete ${titleCase(nodeType)} ${titleCase(nodeTerm)}`,
      dialogBody: isDataFile
        ? `You have selected to delete ${itemCount} ${nodeType}${
            isMultiple ? "s" : ""
          } from this data submission. This action is irreversible. Are you sure you want to continue?`
        : `You have selected to delete ${itemCount} ${nodeType} ${nodeTerm}. This action is irreversible. Are you sure you want to delete them and their associated children from this data submission?`,
    };
  }, [nodeType, selectedItems]);

  const [loading, setLoading] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);

  const [deleteDataRecords] = useMutation<DeleteDataRecordsResp, DeleteDataRecordsInput>(
    DELETE_DATA_RECORDS,
    {
      context: { clientName: "backend" },
    }
  );

  const onClickIcon = async () => {
    setConfirmOpen(true);
  };

  const onCloseDialog = async () => {
    setConfirmOpen(false);
  };

  const onConfirmDialog = async () => {
    try {
      const { data: d, errors } = await deleteDataRecords({
        variables: {
          _id,
          nodeType,
          nodeIds: selectedItems,
        },
      });

      if (errors || !d?.deleteDataRecords?.success) {
        throw new Error("Unable to delete selected rows.");
      }

      setConfirmOpen(false);
      onDelete?.(content.snackbarSuccess);
    } catch (err) {
      enqueueSnackbar(content.snackbarError, {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission(user, "data_submission", "create", data?.getSubmission)) {
    return null;
  }

  return (
    <>
      <StyledTooltip
        title={tooltipText}
        placement="top"
        aria-label="Delete node data tooltip"
        data-testid="delete-node-data-tooltip"
      >
        <span>
          <StyledIconButton
            onClick={onClickIcon}
            disabled={
              loading ||
              disabled ||
              deletingData === true ||
              selectedItems.length === 0 ||
              DisabledStatuses.includes(status) ||
              (collaborator && collaborator.permission !== "Can Edit")
            }
            aria-label="Delete nodes icon"
            data-testid="delete-node-data-button"
            {...rest}
          >
            <DeleteAllFilesIcon />
          </StyledIconButton>
        </span>
      </StyledTooltip>
      <DeleteDialog
        open={confirmOpen}
        header={content.dialogTitle}
        description={content.dialogBody}
        confirmText="Confirm"
        closeText="Cancel"
        onConfirm={onConfirmDialog}
        onClose={onCloseDialog}
      />
    </>
  );
};

export default memo<Props>(DeleteNodeDataButton, isEqual);
