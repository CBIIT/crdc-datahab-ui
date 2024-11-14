import { FC, ReactElement, useMemo, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { useSnackbar } from "notistack";
import { Box, Button, Typography, styled } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import env from "../../env";
import { RETRIEVE_CLI_CONFIG, RetrieveCLIConfigResp } from "../../graphql";
import { downloadBlob, filterAlphaNumeric } from "../../utils";
import FlowWrapper from "./FlowWrapper";
import UploaderToolDialog from "../UploaderToolDialog";
import UploaderConfigDialog, { InputForm } from "../UploaderConfigDialog";
import { useAuthContext } from "../Contexts/AuthContext";
import { GenerateApiTokenRoles } from "../../config/AuthRoles";

export type Props = {
  /**
   * The submission to download a pre-configured CLI config for.
   */
  submission: Submission;
};

const StyledBox = styled(Box)({
  maxWidth: "790px",
  lineHeight: "22px",
  marginTop: "10px",
});

const StyledDownloadButton = styled(Button)({
  padding: "10px 6px",
  fontSize: "14px",
  fontStyle: "normal",
  lineHeight: "16px",
  letterSpacing: "0.32px",
  width: "137px",
  height: "47px",
  "&.MuiButtonBase-root": {
    marginLeft: "auto",
  },
});

const StyledToolButton = styled(Typography)({
  color: "#005999",
  cursor: "pointer",
  lineHeight: "16px",
  fontWeight: 700,
  display: "inline",
  textDecoration: "underline",
  textDecorationThickness: "1px",
  textUnderlineOffset: "1.5px",
});

const StyledOpenInNewIcon = styled(OpenInNewIcon)({
  color: "#005999",
  fontSize: "18px",
  verticalAlign: "middle",
  marginLeft: "4px",
});

/**
 * Provides a way to download the Uploader CLI tool and a pre-configured CLI config file.
 *
 * @param {Props} props
 * @returns {React.FC<Props>}
 */
export const DataUpload: FC<Props> = ({ submission }: Props) => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const { _id, name } = submission || {};

  const [cliDialogOpen, setCLIDialogOpen] = useState<boolean>(false);
  const [configDialogOpen, setConfigDialogOpen] = useState<boolean>(false);
  const [retrieveCLIConfig] = useLazyQuery<RetrieveCLIConfigResp>(RETRIEVE_CLI_CONFIG, {
    context: { clientName: "backend" },
  });

  const collaborator = submission?.collaborators?.find((c) => c.collaboratorID === user?._id);

  const handleConfigDownload = async ({ manifest, dataFolder }: InputForm) => {
    try {
      const { data, error } = await retrieveCLIConfig({
        variables: {
          _id,
          dataFolder,
          manifest,
          apiURL: env.REACT_APP_BACKEND_API,
        },
      });

      if (error || !data?.retrieveCLIConfig?.length) {
        throw new Error(error.message);
      }

      const filteredName = filterAlphaNumeric(name.trim()?.replaceAll(" ", "-"), "-");
      const prefixedName = `cli-config-${filteredName}`;
      const filename = `${prefixedName.replace(/-+$/, "")}.yml`;

      downloadBlob(data.retrieveCLIConfig, filename, "application/yaml");
      setConfigDialogOpen(false);
    } catch (e) {
      enqueueSnackbar("Unable to download Uploader CLI config file", {
        variant: "error",
      });
    }
  };

  const Actions: ReactElement = useMemo(() => {
    if (submission?.dataType !== "Metadata and Data Files") {
      return null;
    }

    return (
      <StyledDownloadButton
        disabled={
          (collaborator && collaborator.permission !== "Can Edit") ||
          !GenerateApiTokenRoles.includes(user?.role)
        }
        onClick={() => setConfigDialogOpen(true)}
        variant="contained"
        color="info"
        data-testid="uploader-cli-config-button"
      >
        Download Configuration File
      </StyledDownloadButton>
    );
  }, [submission?.dataType, user?.role, collaborator]);

  return (
    <FlowWrapper index={2} title="Upload Data Files" actions={Actions}>
      {submission?.dataType === "Metadata and Data Files" ? (
        <>
          <StyledBox data-testid="uploader-cli-footer">
            The CLI Tool is used to upload data files to CRDC Submission Portal and requires a
            configuration file to work. The CLI Tools is a one-time download however the
            configuration file needs to be customized for each submission. You can either edit the
            example configuration files found in the{" "}
            <StyledToolButton
              onClick={() => setCLIDialogOpen(true)}
              data-testid="uploader-cli-download-button"
            >
              <span>CLI Tool download</span>
              <StyledOpenInNewIcon />
            </StyledToolButton>
            , or you can click the button on the right to download a configuration file customized
            for this submission.
          </StyledBox>
          <UploaderToolDialog open={cliDialogOpen} onClose={() => setCLIDialogOpen(false)} />
          <UploaderConfigDialog
            open={configDialogOpen}
            onClose={() => setConfigDialogOpen(false)}
            onDownload={handleConfigDownload}
          />
        </>
      ) : (
        <StyledBox data-testid="uploader-cli-footer-alt">
          This submission is for metadata only; there is no need to upload data files.
        </StyledBox>
      )}
    </FlowWrapper>
  );
};
