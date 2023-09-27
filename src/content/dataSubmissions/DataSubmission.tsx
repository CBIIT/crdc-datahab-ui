import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLazyQuery } from "@apollo/client";
import {
  Alert,
  Card,
  CardActions,
  CardContent,
  Container,
  Stack,
  Tabs,
  styled,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { isEqual } from "lodash";
import bannerSvg from "../../assets/dataSubmissions/dashboard_banner.svg";
import LinkTab from "../../components/DataSubmissions/LinkTab";
import DataSubmissionUpload from "../../components/DataSubmissions/DataSubmissionUpload";
import { GET_DATA_SUBMISSION, GET_DATA_SUBMISSION_BATCH_FILES, GetDataSubmissionBatchFilesResp, GetDataSubmissionResp } from "../../graphql";
import DataSubmissionSummary from "../../components/DataSubmissions/DataSubmissionSummary";
import GenericAlert from "../../components/GenericAlert";
import PieChart from "../../components/DataSubmissions/PieChart";
import DataSubmissionBatchTable, { Column, FetchListing } from "../../components/DataSubmissions/DataSubmissionBatchTable";
import { FormatDate } from "../../utils";
import { useAuthContext } from "../../components/Contexts/AuthContext";

const dummyChartData = [
  { label: 'Group A', value: 12, color: "#DFC798" },
  { label: 'Group B', value: 28, color: "#137E87" },
  { label: 'Group C', value: 30, color: "#99A4E4" },
  { label: 'Group D', value: 30, color: "#CB2809" },
];

const StyledBanner = styled("div")(({ bannerSrc }: { bannerSrc: string }) => ({
  background: `url(${bannerSrc})`,
  backgroundBlendMode: "luminosity, normal",
  backgroundSize: "cover",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "top",
  width: "100%",
  height: "295px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  zIndex: 0
}));

const StyledBannerContentContainer = styled(Container)(
  ({ padding }: { padding?: string }) => ({
    "&.MuiContainer-root": {
      padding: padding || "61px 73px 186px",
      marginTop: "-295px",
      width: "100%",
      height: "100%",
      position: "relative",
      zIndex: 1
    },
  })
);

const StyledActionWrapper = styled(Stack)(() => ({
  justifyContent: "center",
  alignItems: "center",
}));

const StyledButtonBase = styled(LoadingButton)(() => ({
  display: "flex",
  width: "128px",
  height: "51px",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  gap: "10px",
  flexShrink: 0,
  borderRadius: "8px",
  textAlign: "center",
  fontFamily: "'Nunito', 'Rubik', sans-serif",
  fontSize: "16px",
  fontStyle: "normal",
  fontWeight: 700,
  lineHeight: "16px",
  letterSpacing: "0.32px",
  textTransform: "initial",
  zIndex: 3,
}));

const StyledSubmitButton = styled(StyledButtonBase)(() => ({
  background: "#1D91AB",
  color: "#FFF",
  "&:hover": {
    background: "#1A7B90",
  }
}));

const StyledReleaseButton = styled(StyledButtonBase)(() => ({
  background: "#8DC63F",
  color: "#FFF",
  "&:hover": {
    background: "#7AB32E",
  }
}));

const StyledWithdrawButton = styled(StyledButtonBase)(() => ({
  background: "#DAA520",
  color: "#FFF",
  "&:hover": {
    background: "#C8941A",
  }
}));

const StyledRejectButton = styled(StyledButtonBase)(() => ({
  background: "#D54309",
  color: "#FFF",
  "&:hover": {
    background: "#B83A07",
  }
}));

const StyledCompleteButton = styled(StyledButtonBase)(() => ({
  background: "#4CAF50",
  color: "#FFF",
  "&:hover": {
    background: "#418E46",
  }
}));

const StyledCancelButton = styled(StyledButtonBase)(() => ({
  border: "1px solid #AEAEAE",
  background: "#757D88",
  color: "#FFF",
  "&:hover": {
    background: "#5B6169",
  }
}));

const StyledArchiveButton = styled(StyledButtonBase)(() => ({
  background: "#6A5ACD",
  color: "#FFF",
  "&:hover": {
    background: "#594ABF",
  }
}));

const StyledCard = styled(Card)(() => ({
  borderRadius: "8px",
  backgroundColor: "#FFFFFF",
  padding: 0,
  // boxShadow: "0px -5px 35px 0px rgba(53, 96, 160, 0.30)",
  "& .MuiCardContent-root": {
    padding: 0,
  },
  "& .MuiCardActions-root": {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingTop: "34px",
    paddingBottom: "41px",
    position: "relative"
  },
  "&.MuiPaper-root": {
    border: "1px solid #6CACDA"
  },
  "&::after": {
    content: '""',
    position: "absolute",
    zIndex: 1,
    bottom: 48,
    left: 0,
    pointerEvents: "none",
    backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0), rgba(251,253,255, 1) 20%)",
    width: "100%",
    height: "218px",
  },
}));

const StyledChartArea = styled("div")(() => ({
  height: "253.42px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  overflow: "visible",
  "& div": {
    overflow: "visible",
    margin: "0 auto",
    marginLeft: "30px",
    marginRight: "30px"
  }
}));

const StyledMainContentArea = styled("div")(() => ({
  borderRadius: 0,
  background: "#FFFFFF",
  minHeight: "300px",
  padding: "21px 40px 0",
}));

const StyledTabs = styled(Tabs)(() => ({
  position: 'relative',
  "& .MuiTabs-flexContainer": {
    justifyContent: "center"
  },
  "& .MuiTabs-indicator": {
    display: "none !important"
  },

  '&::before': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottom: '1.25px solid #6CACDA',
    zIndex: 1,
  },
}));

const StyledAlert = styled(Alert)({
  fontWeight: 400,
  fontSize: "16px",
  fontFamily: "'Nunito', 'Rubik', sans-serif",
  lineHeight: "19.6px",
  scrollMarginTop: "64px"
});

const StyledWrapper = styled("div")({
  background: "#FBFDFF",
});

const StyledRejectedStatus = styled("div")(() => ({
  color: "#E25C22",
  fontWeight: 600
}));

const StyledErrorCount = styled("div")(() => ({
  color: "#0D78C5",
  fontFamily: "Inter",
  fontSize: "16px",
  fontStyle: "normal",
  fontWeight: 600,
  lineHeight: "25px",
  textDecorationLine: "underline",
}));

const columns: Column<BatchFile>[] = [
  {
    label: "Batch ID",
    value: (data) => data?._id,
    field: "_id",
    default: true,
  },
  {
    label: "Uploaded Type",
    value: (data) => data?.uploadType,
    field: "uploadType",
  },
  {
    label: "File Count",
    value: (data) => Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(data?.fileCount || 0),
    field: "fileCount",
  },
  {
    label: "Status",
    value: (data) => (data.status === "Rejected" ? <StyledRejectedStatus>{data.status}</StyledRejectedStatus> : data.status),
    field: "status",
  },
  {
    label: "Last Access Date",
    value: (data) => (data?.submittedDate ? FormatDate(data.submittedDate, "M-D-YYYY hh:mm A") : ""),
    field: "submittedDate",
  },
  {
    label: "Error Count",
    value: (data) => (
      <StyledErrorCount>
        {data.errorCount > 0 ? `${data.errorCount} ${data.errorCount === 1 ? "Error" : "Errors"}` : ""}
      </StyledErrorCount>
    ),
    field: "errorCount",
  },
];

type UserRole = User["role"];

const SubmitRoles: UserRole[] = ["Submitter", "Organization Owner", "Data Curator", "Admin", "Federal Lead"];
const ReleaseRoles: UserRole[] = ["Data Curator", "Admin", "Federal Lead"];
const WithdrawRoles: UserRole[] = ["Submitter", "Organization Owner", "Federal Lead"];
const RejectRoles: UserRole[] = ["Data Curator", "Admin", "Federal Lead"];
const CompleteRoles: UserRole[] = ["Data Curator", "Admin", "Federal Lead"];
const CancelRoles: UserRole[] = ["Submitter", "Organization Owner", "Data Curator", "Admin", "Federal Lead"];
const ArchiveRoles: UserRole[] = ["Data Curator", "Admin", "Federal Lead"];

const SubmitStatuses: DataSubmissionStatus[] = ["In Progress"];
const ReleaseStatuses: DataSubmissionStatus[] = ["Submitted"];
const WithdrawStatuses: DataSubmissionStatus[] = ["Submitted"];
const RejectStatuses: DataSubmissionStatus[] = ["Submitted"];
const CompleteStatuses: DataSubmissionStatus[] = ["Released"];
const CancelStatuses: DataSubmissionStatus[] = ["New", "In Progress"];
const ArchiveStatuses: DataSubmissionStatus[] = ["Completed"];

const URLTabs = {
  DATA_UPLOAD: "data-upload",
  QUALITY_CONTROL: "quality-control"
};

const DataSubmission = () => {
  const { submissionId, tab } = useParams();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [dataSubmission, setDataSubmission] = useState<DataSubmission>(null);
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
  const [prevBatchFetch, setPrevBatchFetch] = useState<FetchListing<BatchFile>>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openAlert, setOpenAlert] = useState<string>(null);
  const isValidTab = tab && Object.values(URLTabs).includes(tab);

  const [getDataSubmission] = useLazyQuery<GetDataSubmissionResp>(GET_DATA_SUBMISSION, {
    variables: { id: "8887654" }, // TODO: Replace with submissionId
    context: { clientName: 'mockService' },
    fetchPolicy: 'no-cache'
  });

  const [getBatchFiles] = useLazyQuery<GetDataSubmissionBatchFilesResp>(GET_DATA_SUBMISSION_BATCH_FILES, {
    context: { clientName: 'mockService' },
    fetchPolicy: 'no-cache'
  });

  const handleFetchBatchFiles = async (fetchListing: FetchListing<BatchFile>) => {
    const { first, offset, sortDirection, orderBy } = fetchListing || {};
    if (!submissionId) {
      setError(true);
      return;
    }
    if (batchFiles?.length > 0 && isEqual(fetchListing, prevBatchFetch)) {
      return;
    }

    setPrevBatchFetch(fetchListing);

    try {
      setLoading(true);
      const { data: newBatchFiles, error: batchFilesError } = await getBatchFiles({
        variables: { // TODO: Replace with dynamic variables when real endpoint is created
          id: "8887654",
          first: 10,
          offset: 0,
          sortDirection: "desc",
          orderBy: "_id"
        },
        context: { clientName: 'mockService' },
        fetchPolicy: 'no-cache'
      });
      if (batchFilesError || !newBatchFiles?.getDataSubmissionBatchFiles) {
        setError(true);
        return;
      }
      setBatchFiles(newBatchFiles.getDataSubmissionBatchFiles.batchFiles);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!submissionId) {
      return;
    }
    (async () => {
      if (!dataSubmission?._id) {
        const { data: newDataSubmission, error } = await getDataSubmission();
        if (error || !newDataSubmission?.getDataSubmission) {
          setError(true);
          return;
        }
        setDataSubmission(newDataSubmission.getDataSubmission);
      }
    })();
  }, [submissionId]);

  const handleOnCancel = () => {
    navigate("/data-submissions");
  };

  const handleOnUpload = (message: string) => {
    setOpenAlert(message);
    setTimeout(() => setOpenAlert(null), 10000);
  };

  return (
    <StyledWrapper>
      <GenericAlert open={openAlert?.length > 0} key="data-submission-alert">
        <span>
          {openAlert}
        </span>
      </GenericAlert>
      <StyledBanner bannerSrc={bannerSvg} />
      <StyledBannerContentContainer maxWidth="xl">
        <StyledCard>
          <CardContent>
            {error && <StyledAlert severity="error">Oops! An error occurred. Unable to retrieve Data Submission.</StyledAlert>}
            <DataSubmissionSummary dataSubmission={dataSubmission} />
            <StyledChartArea>
              <Stack direction="row" justifyContent="center" sx={{ width: "960px", textAlign: "center" }}>
                <PieChart
                  label="Study"
                  series={[
                    {
                      innerRadius: 40,
                      outerRadius: 55,
                      data: [{ label: "inner", value: 1, color: "#9FD1D6" }],
                    },
                    {
                      innerRadius: 55,
                      outerRadius: 75,
                      data: dummyChartData,
                      highlighted: { additionalRadius: 5 },
                      highlightScope: { faded: 'none', highlighted: 'item' },
                    },
                  ]}
                  margin={{ right: 5 }}
                  width={150}
                  height={150}
                  legend={{ hidden: true }}
                  tooltip={{ trigger: 'none' }}
                  sx={{ rotate: "270deg", overflow: "visible" }}
                />
                <PieChart
                  label="Study"
                  series={[
                    {
                      innerRadius: 40,
                      outerRadius: 55,
                      data: [{ label: "inner", value: 1, color: "#9FD1D6" }],
                    },
                    {
                      innerRadius: 55,
                      outerRadius: 75,
                      data: dummyChartData,
                      highlighted: { additionalRadius: 5 },
                      highlightScope: { faded: 'none', highlighted: 'item' },
                    },
                  ]}
                  margin={{ right: 5 }}
                  width={150}
                  height={150}
                  legend={{ hidden: true }}
                  tooltip={{ trigger: 'none' }}
                  sx={{ rotate: "270deg", overflow: "visible" }}
                />
                <PieChart
                  label="Study"
                  series={[
                    {
                      innerRadius: 40,
                      outerRadius: 55,
                      data: [{ label: "inner", value: 1, color: "#9FD1D6" }],
                    },
                    {
                      innerRadius: 55,
                      outerRadius: 75,
                      data: dummyChartData,
                      highlighted: { additionalRadius: 5 },
                      highlightScope: { faded: 'none', highlighted: 'item' },
                    },
                  ]}
                  margin={{ right: 5 }}
                  width={150}
                  height={150}
                  legend={{ hidden: true }}
                  tooltip={{ trigger: 'none' }}
                  sx={{ rotate: "270deg", overflow: "visible" }}
                />
                <PieChart
                  label="Study"
                  series={[
                    {
                      innerRadius: 40,
                      outerRadius: 55,
                      data: [{ label: "inner", value: 1, color: "#9FD1D6" }],
                    },
                    {
                      innerRadius: 55,
                      outerRadius: 75,
                      data: dummyChartData,
                      highlighted: { additionalRadius: 5 },
                      highlightScope: { faded: 'none', highlighted: 'item' },
                    },
                  ]}
                  margin={{ right: 5 }}
                  width={150}
                  height={150}
                  legend={{ hidden: true }}
                  tooltip={{ trigger: 'none' }}
                  sx={{ rotate: "270deg", overflow: "visible" }}
                />
              </Stack>
            </StyledChartArea>

            <StyledTabs value={isValidTab ? tab : URLTabs.DATA_UPLOAD}>
              <LinkTab
                value={URLTabs.DATA_UPLOAD}
                label="Data Upload"
                to={`/data-submission/${submissionId}/${URLTabs.DATA_UPLOAD}`}
                selected={tab === URLTabs.DATA_UPLOAD}
              />
              <LinkTab
                value={URLTabs.QUALITY_CONTROL}
                label="Quality Control"
                to={`/data-submission/${submissionId}/${URLTabs.QUALITY_CONTROL}`}
                selected={tab === URLTabs.QUALITY_CONTROL}
              />
            </StyledTabs>

            <StyledMainContentArea>
              {tab === URLTabs.DATA_UPLOAD ? (
                <Stack direction="column" justifyContent="center">
                  <DataSubmissionUpload onUpload={handleOnUpload} />
                  <DataSubmissionBatchTable
                    columns={columns}
                    data={batchFiles || []}
                    total={batchFiles?.length || 0}
                    loading={loading}
                    onFetchData={handleFetchBatchFiles}
                  />
                </Stack>
              ) : null}
            </StyledMainContentArea>
          </CardContent>
          <CardActions>
            <StyledActionWrapper direction="row" spacing={2}>
              {SubmitStatuses.includes(dataSubmission?.status) && SubmitRoles.includes(user?.role) ? (
                <StyledSubmitButton
                  variant="contained"
                  disableElevation
                  disableRipple
                  disableTouchRipple
                >
                  Submit
                </StyledSubmitButton>
              ) : null}
              {ReleaseStatuses.includes(dataSubmission?.status) && ReleaseRoles.includes(user?.role) ? (
                <StyledReleaseButton
                  variant="contained"
                  disableElevation
                  disableRipple
                  disableTouchRipple
                >
                  Release
                </StyledReleaseButton>
              ) : null}
              {WithdrawStatuses.includes(dataSubmission?.status) && WithdrawRoles.includes(user?.role) ? (
                <StyledWithdrawButton
                  variant="contained"
                  disableElevation
                  disableRipple
                  disableTouchRipple
                >
                  Withdraw
                </StyledWithdrawButton>
              ) : null}
              {RejectStatuses.includes(dataSubmission?.status) && RejectRoles.includes(user?.role) ? (
                <StyledRejectButton
                  variant="contained"
                  disableElevation
                  disableRipple
                  disableTouchRipple
                >
                  Reject
                </StyledRejectButton>
              ) : null}
              {CompleteStatuses.includes(dataSubmission?.status) && CompleteRoles.includes(user?.role) ? (
                <StyledCompleteButton
                  variant="contained"
                  disableElevation
                  disableRipple
                  disableTouchRipple
                >
                  Complete
                </StyledCompleteButton>
              ) : null}
              {ArchiveStatuses.includes(dataSubmission?.status) && ArchiveRoles.includes(user?.role) ? (
                <StyledArchiveButton
                  variant="contained"
                  disableElevation
                  disableRipple
                  disableTouchRipple
                >
                  Archive
                </StyledArchiveButton>
              ) : null}
              {CancelStatuses.includes(dataSubmission?.status) && CancelRoles.includes(user?.role) ? (
                <StyledCancelButton
                  variant="contained"
                  onClick={handleOnCancel}
                  disableElevation
                  disableRipple
                  disableTouchRipple
                >
                  Cancel
                </StyledCancelButton>
              ) : null}
            </StyledActionWrapper>
          </CardActions>
        </StyledCard>
      </StyledBannerContentContainer>
    </StyledWrapper>
  );
};

export default DataSubmission;
