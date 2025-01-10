import React, { ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { useParams } from "react-router-dom";
import { LoadingButton } from "@mui/lab";
import { isEqual } from "lodash";
import { VariantType } from "notistack";
import { Button, Stack, Typography, styled } from "@mui/material";
import Tooltip from "../Tooltip";
import {
  CREATE_BATCH,
  CreateBatchInput,
  CreateBatchResp,
  UPDATE_BATCH,
  UpdateBatchResp,
} from "../../graphql";
import { useAuthContext } from "../Contexts/AuthContext";
import FlowWrapper from "./FlowWrapper";
import { Logger } from "../../utils";
import { hasPermission } from "../../config/AuthPermissions";

const StyledUploadTypeText = styled(Typography)(() => ({
  color: "#083A50",
  fontFamily: "'Nunito', 'Rubik', sans-serif",
  fontSize: "16px",
  fontStyle: "normal",
  fontWeight: 700,
  lineHeight: "19.6px",
}));

const StyledMetadataText = styled(StyledUploadTypeText)(() => ({
  "&.MuiTypography-root": {
    color: "#000000",
  },
}));

const StyledUploadFilesButton = styled(Button)(() => ({
  minWidth: "137px",
  padding: "10px",
  color: "#FFF",
  fontFamily: "'Nunito'",
  fontSize: "16px",
  fontStyle: "normal",
  lineHeight: "24px",
  letterSpacing: "0.32px",
  textTransform: "none",
  "&.MuiButtonBase-root": {
    marginLeft: "auto",
    minWidth: "137px",
  },
}));

const StyledChooseFilesButton = styled(LoadingButton)(() => ({
  minWidth: "137px",
  padding: "10px",
  fontFamily: "'Nunito', 'Rubik', sans-serif",
  fontSize: "16px",
  fontStyle: "normal",
  fontWeight: 500,
  lineHeight: "24px",
  textTransform: "initial",
  marginLeft: "12px",
  marginRight: "12px",
  "&.MuiButtonBase-root": {
    marginLeft: "15px",
  },
}));

const StyledFilesSelected = styled(Typography)(() => ({
  color: "#083A50",
  fontFamily: "'Nunito', 'Rubik', sans-serif",
  fontSize: "16px",
  fontStyle: "italic",
  fontWeight: 400,
  lineHeight: "19.6px",
  minWidth: "135px",
}));

const StyledUploadActionWrapper = styled(Stack)(() => ({
  "&.MuiStack-root": {
    justifyContent: "center",
    alignItems: "center",
  },
}));

const VisuallyHiddenInput = styled("input")(() => ({
  display: "none !important",
}));

const StyledTooltip = styled(Tooltip)(() => ({
  alignSelf: "start",
  marginTop: "3.5px",
}));

type Props = {
  submission: Submission;
  readOnly?: boolean;
  onCreateBatch: () => void;
  onUpload: (message: string, severity: VariantType) => void;
};

/**
 * A component that handles the Metadata upload process for a Data Submission
 *
 * @param {Props} props
 * @returns {React.FC<Props>}
 */
const MetadataUpload = ({ submission, readOnly, onCreateBatch, onUpload }: Props) => {
  const { submissionId } = useParams();
  const { user } = useAuthContext();

  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const uploadMetadataInputRef = useRef<HTMLInputElement>(null);
  const canUpload = hasPermission(user, "data_submission", "create", submission);
  const acceptedExtensions = [".tsv", ".txt"];

  const [createBatch] = useMutation<CreateBatchResp, CreateBatchInput>(CREATE_BATCH, {
    context: { clientName: "backend" },
    fetchPolicy: "no-cache",
  });

  const [updateBatch] = useMutation<UpdateBatchResp>(UPDATE_BATCH, {
    context: { clientName: "backend" },
    fetchPolicy: "no-cache",
  });

  // Intercept browser navigation actions (e.g. closing the tab) with unsaved changes
  useEffect(() => {
    const unloadHandler = (event: BeforeUnloadEvent) => {
      if (selectedFiles?.length > 0) {
        event.preventDefault();
        event.returnValue = "You have unsaved form changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", unloadHandler);

    return () => {
      window.removeEventListener("beforeunload", unloadHandler);
    };
  });

  const handleChooseFilesClick = () => {
    if (!canUpload || readOnly) {
      return;
    }
    uploadMetadataInputRef?.current?.click();
  };

  const handleChooseFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event?.target || {};

    if (!files?.length) {
      setSelectedFiles(null);
      return;
    }

    // Filter out any file that is not an accepted file extension
    const filteredFiles = Array.from(files)?.filter((file: File) =>
      acceptedExtensions.some((ext) => file.name?.toLowerCase()?.endsWith(ext))
    );
    if (!filteredFiles?.length) {
      setSelectedFiles(null);
      return;
    }

    // Add the files back to a FileList
    const dataTransfer = new DataTransfer();
    filteredFiles.forEach((file) => dataTransfer?.items?.add(file));

    setSelectedFiles(dataTransfer?.files);
  };

  const onUploadFail = (fileCount = 0) => {
    onUpload(`${fileCount} ${fileCount > 1 ? "Files" : "File"} failed to upload`, "error");
    setSelectedFiles(null);
    setIsUploading(false);
    if (uploadMetadataInputRef.current) {
      uploadMetadataInputRef.current.value = "";
    }
  };

  const createNewBatch = async (): Promise<NewBatch> => {
    if (!selectedFiles?.length) {
      return null;
    }

    try {
      const { data: batch, errors } = await createBatch({
        variables: {
          submissionID: submissionId,
          type: "metadata",
          files: Array.from(selectedFiles)?.map((file) => file.name),
        },
      });

      if (errors) {
        throw new Error("Unexpected network error");
      }

      return batch?.createBatch;
    } catch (err) {
      // Unable to initiate upload process so all failed
      Logger.error("Error creating new batch", err);
      onUploadFail(selectedFiles?.length);
      return null;
    }
  };

  const onBucketUpload = async (batchID: string, files: UploadResult[]) => {
    let failedFilesCount = 0;
    files?.forEach((file) => {
      if (!file.succeeded) {
        failedFilesCount += 1;
      }
    });

    try {
      const { errors } = await updateBatch({
        variables: {
          batchID,
          files,
        },
      });

      if (errors) {
        throw new Error("Unexpected network error");
      }
      if (failedFilesCount > 0) {
        onUploadFail(failedFilesCount);
        return;
      }
      // Batch upload completed successfully
      onUpload(
        "The batch upload is in progress. You can check the upload status in the Data Activity tab once the upload is complete",
        "success"
      );
      setIsUploading(false);
      setSelectedFiles(null);
      if (uploadMetadataInputRef.current) {
        uploadMetadataInputRef.current.value = "";
      }
    } catch (err) {
      // Unable to let BE know of upload result so all fail
      onUploadFail(selectedFiles?.length);
    }
  };

  const handleUploadFiles = async () => {
    if (!selectedFiles?.length || !canUpload || readOnly) {
      return;
    }

    setIsUploading(true);
    const newBatch: NewBatch = await createNewBatch();
    if (!newBatch) {
      return;
    }
    onCreateBatch();

    const uploadResult: UploadResult[] = [];

    const uploadPromises = newBatch.files?.map(async (file: FileURL) => {
      const selectedFile: File = Array.from(selectedFiles).find((f) => f.name === file.fileName);
      try {
        const res = await fetch(file.signedURL, {
          method: "PUT",
          body: selectedFile,
          headers: {
            "Content-Type": "text/tab-separated-values",
          },
        });
        if (!res.ok) {
          throw new Error("Unexpected network error");
        }
        uploadResult.push({
          fileName: file.fileName,
          succeeded: true,
          errors: null,
        });
      } catch (err) {
        uploadResult.push({
          fileName: file.fileName,
          succeeded: false,
          errors: err?.toString(),
        });
      }
    });

    // Wait for all uploads to finish
    await Promise.allSettled(uploadPromises);
    onBucketUpload(newBatch._id, uploadResult);
  };

  const Actions: ReactElement = useMemo(
    () => (
      <StyledUploadFilesButton
        variant="contained"
        color="info"
        onClick={handleUploadFiles}
        data-testid="metadata-upload-file-upload-button"
        disabled={readOnly || !selectedFiles?.length || !canUpload || isUploading}
        disableElevation
        disableRipple
        disableTouchRipple
      >
        {isUploading ? "Uploading..." : "Upload"}
      </StyledUploadFilesButton>
    ),
    [selectedFiles, readOnly, canUpload, isUploading]
  );

  return (
    <FlowWrapper
      index={1}
      title="Upload Metadata"
      titleAdornment={
        <StyledTooltip
          placement="right"
          title="The metadata uploaded will be compared with existing data within the submission. All new data will be added to the submission, including updates to existing information."
          open={undefined} // will use hoverListener to open
          disableHoverListener={false}
        />
      }
      actions={Actions}
    >
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <StyledUploadActionWrapper direction="row">
          <StyledMetadataText variant="body2">Metadata Files</StyledMetadataText>
          <VisuallyHiddenInput
            ref={uploadMetadataInputRef}
            type="file"
            accept={acceptedExtensions.toString()}
            data-testid="metadata-upload-file-input"
            aria-label="Upload metadata files"
            onChange={handleChooseFiles}
            readOnly={readOnly}
            multiple
          />
          <StyledChooseFilesButton
            variant="contained"
            color="info"
            onClick={handleChooseFilesClick}
            disabled={readOnly || isUploading || !canUpload}
            data-testid="metadata-upload-file-select-button"
          >
            Choose Files
          </StyledChooseFilesButton>
          <StyledFilesSelected variant="body1" data-testid="metadata-upload-file-count">
            {selectedFiles?.length
              ? `${selectedFiles.length} ${selectedFiles.length > 1 ? "files" : "file"} selected`
              : "No files selected"}
          </StyledFilesSelected>
        </StyledUploadActionWrapper>
      </Stack>
    </FlowWrapper>
  );
};

export default React.memo<Props>(MetadataUpload, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
);
