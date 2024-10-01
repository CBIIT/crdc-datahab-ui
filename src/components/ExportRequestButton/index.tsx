import { forwardRef, memo, useState } from "react";
import { styled, Button, ButtonProps } from "@mui/material";
import { useSnackbar } from "notistack";
import { ReactComponent as DownloadIcon } from "../../assets/icons/download_icon.svg";
import StyledFormTooltip from "../StyledFormComponents/StyledTooltip";
import { Status as FormStatus, useFormContext } from "../Contexts/FormContext";
import { GenerateDocument } from "./pdf/Generate";
import { downloadBlob, FormatDate, Logger } from "../../utils";

const StyledTooltip = styled(StyledFormTooltip)({
  marginLeft: "0 !important",
  "& .MuiTooltip-tooltip": {
    color: "#000000",
  },
});

const StyledButton = styled(Button)({
  "&.MuiButton-root": {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minWidth: "128px",
    padding: "10px",
    fontFamily: "'Nunito', 'Rubik', sans-serif",
    fontSize: "16px",
    fontStyle: "normal",
    lineHeight: "24px",
    letterSpacing: "0.32px",
    "& .MuiSvgIcon-root": {
      fontSize: "20px",
    },
  },
});

const StyledDownloadIcon = styled(DownloadIcon)({
  color: "#000000",
  marginLeft: "10px",
});

export type ExportRequestButtonProps = ButtonProps;

/**
 * Provides the button and supporting functionality to export a
 * Submission Request to PDF format.
 *
 * @returns {React.FC} The export PDF button.
 */
const ExportRequestButton = forwardRef<HTMLButtonElement, ExportRequestButtonProps>(
  ({ disabled, ...buttonProps }, ref) => {
    const { enqueueSnackbar } = useSnackbar();
    const { data, status } = useFormContext();
    const [loading, setLoading] = useState<boolean>(false);

    const handleClick = async () => {
      setLoading(true);

      try {
        const printRegion: HTMLElement = document.querySelector("[data-pdf-print-region]");
        const pdfBlob = await GenerateDocument(data, printRegion);

        const studyAbbr =
          data?.questionnaireData?.study?.abbreviation || data?.questionnaireData?.study?.name;
        const submittedDate =
          data?.status === "In Progress"
            ? FormatDate(data?.updatedAt, "YYYY-MM-DD")
            : FormatDate(data?.submittedDate, "YYYY-MM-DD");
        const filename = `CRDCSubmissionPortal-Request-${studyAbbr}-${submittedDate}.pdf`;

        downloadBlob(pdfBlob, filename, "application/pdf");
      } catch (error) {
        Logger.error("ExportRequestButton", error);

        enqueueSnackbar("An error occurred while exporting the Submission Request to PDF.", {
          variant: "error",
        });
      }

      setLoading(false);
    };

    return (
      <StyledTooltip
        title="Click to export this Submission Request as a PDF."
        placement="top"
        data-testid="export-submission-request-tooltip"
      >
        <span>
          <StyledButton
            onClick={handleClick}
            disabled={loading || disabled || status !== FormStatus.LOADED}
            data-testid="export-submission-request-button"
            aria-label="Export Submission Request to PDF"
            variant="contained"
            color="info"
            type="button"
            size="large"
            ref={ref}
            {...buttonProps}
          >
            PDF <StyledDownloadIcon />
          </StyledButton>
        </span>
      </StyledTooltip>
    );
  }
);

export default memo<ExportRequestButtonProps>(ExportRequestButton);
