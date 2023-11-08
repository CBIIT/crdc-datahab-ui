import {
  Button,
  Divider,
  Grid,
  Stack,
  Typography,
  styled,
} from "@mui/material";
import { FC, useEffect, useRef, useState } from "react";
import SubmissionHeaderProperty, {
  StyledValue,
} from "./SubmissionHeaderProperty";
import Tooltip from "./Tooltip";
import { ReactComponent as EmailIconSvg } from "../../assets/icons/email_icon.svg";
import HistoryDialog from "../Shared/HistoryDialog";
import DataSubmissionIconMap from "./DataSubmissionIconMap";

const StyledSummaryWrapper = styled("div")(() => ({
  borderRadius: "8px 8px 0px 0px",
  textWrap: "nowrap",
  padding: "25px 21px 59px 48px",
}));

const StyledSubmissionTitle = styled(Typography)(() => ({
  color: "#1D91AB",
  fontFamily: "'Nunito Sans', 'Rubik', sans-serif",
  fontSize: "13px",
  fontStyle: "normal",
  fontWeight: 400,
  lineHeight: "27px",
  letterSpacing: "0.5px",
  textTransform: "uppercase",
}));

const StyledSubmissionStatus = styled(Typography)(() => ({
  color: "#004A80",
  fontFamily: "'Nunito Sans', 'Rubik', sans-serif",
  fontSize: "35px",
  fontStyle: "normal",
  fontWeight: 900,
  lineHeight: "30px",
  minHeight: "30px",
}));

const StyledHistoryButton = styled(Button)(() => ({
  marginTop: "16px",
  marginBottom: "10px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "10px 20px",
  borderRadius: "8px",
  border: "1px solid #B3B3B3",
  color: "#004A80",
  textAlign: "center",
  fontFamily: "'Nunito'",
  fontSize: "16px",
  fontStyle: "normal",
  fontWeight: 700,
  lineHeight: "17px",
  letterSpacing: "0.32px",
  textTransform: "none",
  "&:hover": {
    backgroundColor: "#1A5874",
    borderColor: "#DDE6EF",
    color: "#DDE6EF",
  },
}));

const StyledSectionDivider = styled(Divider)(() => ({
  "&.MuiDivider-root": {
    width: "2px",
    height: "114px",
    background: "#6CACDA",
    marginLeft: "44px",
    marginTop: "8px",
    alignSelft: "flex-end"
  },
}));

const StyledSubmitterName = styled(StyledValue)(() => ({
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
  lineHeight: "19.6px",
  flexShrink: 1
}));

const StyledConciergeName = styled(StyledValue)(() => ({
  maxWidth: "100%",
  lineHeight: "19.6px",
  flexShrink: 1
}));

const StyledTooltipSubmitterName = styled(StyledValue)(() => ({
  color: "#595959",
  fontFamily: "'Nunito'",
  fontSize: "16px",
  fontStyle: "normal",
  fontWeight: 400,
  lineHeight: "19.6px",
  marginTop: "6px",
}));

const StyledGridContainer = styled(Grid)(({ theme }) => ({
  "&.MuiGrid-container": {
    marginLeft: "45px",
    width: "100%",
    overflow: "hidden"
  },
  "& .MuiGrid-item:nth-of-type(2n + 1)": {
    paddingLeft: 0,
  },
  [theme.breakpoints.down("lg")]: {
    "& .MuiGrid-item": {
      paddingLeft: 0,
    },
  }
}));

type Props = {
  dataSubmission: Submission;
};

const DataSubmissionSummary: FC<Props> = ({ dataSubmission }) => {
  const [historyDialogOpen, setHistoryDialogOpen] = useState<boolean>(false);
  const [hasEllipsis, setHasEllipsis] = useState(false);
  const textRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const checkEllipsis = () => {
      if (textRef.current) {
        setHasEllipsis(textRef.current.offsetWidth < textRef.current.scrollWidth);
      }
    };

    checkEllipsis();

    window.addEventListener("resize", checkEllipsis);
    return () => window.removeEventListener("resize", checkEllipsis);
  }, [dataSubmission?.name]);

  const handleOnHistoryDialogOpen = () => {
    setHistoryDialogOpen(true);
  };

  const handleOnHistoryDialogClose = () => {
    setHistoryDialogOpen(false);
  };

  const getHistoryTextColorFromStatus = (status: SubmissionStatus) => {
    let color: string;
    switch (status) {
      case "Archived":
        color = "#10EBA9";
        break;
      case "Rejected":
        color = "#FF7A42";
        break;
      default:
        color = "#FFF";
    }

    return color;
  };

  return (
    <StyledSummaryWrapper>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={7.125}
      >
        <Stack direction="column" minWidth="192px">
          <StyledSubmissionTitle variant="h6">STATUS</StyledSubmissionTitle>
          <StyledSubmissionStatus variant="h5">
            {dataSubmission?.status}
          </StyledSubmissionStatus>
          <StyledHistoryButton
            variant="outlined"
            onClick={handleOnHistoryDialogOpen}
          >
            Full History
          </StyledHistoryButton>
        </Stack>

        <StyledSectionDivider orientation="vertical" />

        <StyledGridContainer container flexDirection={{ xs: "column", lg: "row" }} rowSpacing={2} columnSpacing={{ xs: 0, lg: 8.25 }}>
          <SubmissionHeaderProperty
            label="Submission Name"
            value={(
              <Stack direction="row" alignItems="center" sx={{ minWidth: 0, flexWrap: "nowrap" }}>
                {hasEllipsis ? (
                  <Tooltip
                    title="Submission Name"
                    body={(
                      <StyledTooltipSubmitterName variant="body2">
                        {dataSubmission?.name}
                      </StyledTooltipSubmitterName>
                    )}
                    disableHoverListener
                  >
                    <StyledSubmitterName ref={textRef}>
                      {dataSubmission?.name}
                    </StyledSubmitterName>
                  </Tooltip>
                ) : (
                  <StyledSubmitterName ref={textRef}>
                    {dataSubmission?.name}
                  </StyledSubmitterName>
                )}
              </Stack>
            )}
          />
          <SubmissionHeaderProperty
            label="Submitter"
            value={dataSubmission?.submitterName}
          />
          <SubmissionHeaderProperty
            label="Study"
            value={dataSubmission?.studyAbbreviation}
          />
          <SubmissionHeaderProperty
            label="Data Commons"
            value={dataSubmission?.dataCommons}
          />
          <SubmissionHeaderProperty
            label="Organization"
            value={dataSubmission?.organization?.name}
          />
          <SubmissionHeaderProperty
            label="Primary Contact"
            value={(
              <Stack direction="row" alignItems="center" spacing={1.375}>
                <StyledConciergeName>
                  {dataSubmission?.conciergeName}
                </StyledConciergeName>
                {dataSubmission?.conciergeName && dataSubmission?.conciergeEmail && (
                  <a
                    href={`mailto:${dataSubmission?.conciergeEmail}`}
                    aria-label="Email Primary Contact"
                  >
                    <EmailIconSvg />
                  </a>
                )}
              </Stack>
            )}
          />
        </StyledGridContainer>
      </Stack>
      <HistoryDialog
        open={historyDialogOpen}
        onClose={handleOnHistoryDialogClose}
        preTitle="Data Submission Request"
        title="Submission History"
        history={dataSubmission?.history}
        iconMap={DataSubmissionIconMap}
        getTextColor={getHistoryTextColorFromStatus}
      />
    </StyledSummaryWrapper>
  );
};

export default DataSubmissionSummary;
