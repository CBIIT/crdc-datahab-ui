import React, { FC, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Container,
  Button,
  Stack,
  styled,
  TableCell,
  TableContainer,
  TableHead,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useLazyQuery, useMutation } from "@apollo/client";
import bannerSvg from "../../assets/banner/submission_banner.png";
import { ReactComponent as BellIcon } from "../../assets/icons/filled_bell_icon.svg";
import PageBanner from "../../components/PageBanner";
import { FormatDate, Logger } from "../../utils";
import { useAuthContext, Status as AuthStatus } from "../../components/Contexts/AuthContext";
import {
  LIST_APPLICATIONS,
  ListApplicationsInput,
  ListApplicationsResp,
  REVIEW_APP,
  ReviewAppInput,
  ReviewAppResp,
  SAVE_APP,
  SaveAppInput,
  SaveAppResp,
} from "../../graphql";
import usePageTitle from "../../hooks/usePageTitle";
import GenericTable, { Column } from "../../components/GenericTable";
import QuestionnaireContext from "./Contexts/QuestionnaireContext";
import TruncatedText from "../../components/TruncatedText";
import StyledTooltip from "../../components/StyledFormComponents/StyledTooltip";
import Tooltip from "../../components/Tooltip";
import { hasPermission } from "../../config/AuthPermissions";

type T = ListApplicationsResp["listApplications"]["applications"][number];

const StyledButton = styled(LoadingButton)({
  padding: "14px 20px",
  fontWeight: 700,
  fontSize: "16px",
  fontFamily: "'Nunito', 'Rubik', sans-serif",
  letterSpacing: "2%",
  lineHeight: "20.14px",
  borderRadius: "8px",
  color: "#fff",
  textTransform: "none",
  borderColor: "#26B893 !important",
  background: "#1B8369 !important",
  marginRight: "25px",
});

const StyledBannerBody = styled(Stack)({
  marginTop: "-20px",
});

const StyledContainer = styled(Container)({
  marginTop: "-62px",
});

const StyledTableContainer = styled(TableContainer)({
  borderRadius: "8px",
  border: "1px solid #083A50",
  marginBottom: "25px",
  position: "relative",
});

const StyledTableHead = styled(TableHead)({
  background: "#083A50",
});

const StyledHeaderCell = styled(TableCell)({
  fontWeight: 700,
  fontSize: "14px",
  color: "#fff !important",
  "&.MuiTableCell-root": {
    padding: "8px 16px",
    color: "#fff !important",
  },
  "& .MuiSvgIcon-root,  & .MuiButtonBase-root": {
    color: "#fff !important",
  },
  "&:last-of-type": {
    textAlign: "center",
  },
});

const StyledTableCell = styled(TableCell)({
  fontSize: "14px",
  color: "#083A50 !important",
  "&.MuiTableCell-root": {
    padding: "8px 16px",
  },
  "&:last-of-type": {
    textAlign: "center",
  },
});

const StyledActionButton = styled(Button)(
  ({ bg, text, border }: { bg: string; text: string; border: string }) => ({
    background: `${bg} !important`,
    borderRadius: "8px",
    border: `2px solid ${border}`,
    color: `${text} !important`,
    width: "100px",
    height: "30px",
    textTransform: "none",
    fontWeight: 700,
    fontSize: "16px",
  })
);

const StyledDateTooltip = styled(StyledTooltip)(() => ({
  cursor: "pointer",
}));

const StyledSpecialStatus = styled(Stack)({
  color: "#D82F00",
  fontWeight: 600,
});

const StyledBellIcon = styled(BellIcon)({
  width: "18px",
  marginLeft: "6px",
});

const columns: Column<T>[] = [
  {
    label: "Submitter Name",
    renderValue: (a) => <TruncatedText text={a.applicant?.applicantName} />,
    fieldKey: "applicant.applicantName",
  },
  {
    label: "Study",
    renderValue: (a) => (
      <TruncatedText text={a.studyAbbreviation || "NA"} disableInteractiveTooltip={false} />
    ),
    field: "studyAbbreviation",
  },
  {
    label: "Program",
    renderValue: (a) => (
      <TruncatedText text={a.programName || "NA"} disableInteractiveTooltip={false} />
    ),
    field: "programName",
  },
  {
    label: "Status",
    renderValue: ({ status, conditional, pendingConditions }) => {
      if (!conditional || !pendingConditions?.length || status !== "Approved") {
        return status;
      }

      return (
        <Tooltip
          title={pendingConditions?.join(" ")}
          placement="top"
          open={undefined}
          disableHoverListener={false}
          arrow
        >
          <StyledSpecialStatus direction="row" alignItems="center">
            <span>{status}</span>
            <StyledBellIcon data-testid="pending-conditions-icon" />
          </StyledSpecialStatus>
        </Tooltip>
      );
    },
    field: "status",
    sx: {
      width: "124px",
    },
  },
  {
    label: "Submitted Date",
    renderValue: (a) =>
      a.submittedDate ? (
        <StyledDateTooltip title={FormatDate(a.submittedDate, "M/D/YYYY h:mm A")} placement="top">
          <span>{FormatDate(a.submittedDate, "M/D/YYYY")}</span>
        </StyledDateTooltip>
      ) : (
        ""
      ),
    field: "submittedDate",
    default: true,
    sx: {
      width: "161px",
    },
  },
  {
    label: "Last Updated Date",
    renderValue: (a) =>
      a.updatedAt ? (
        <StyledDateTooltip title={FormatDate(a.updatedAt, "M/D/YYYY h:mm A")} placement="top">
          <span>{FormatDate(a.updatedAt, "M/D/YYYY")}</span>
        </StyledDateTooltip>
      ) : (
        ""
      ),
    field: "updatedAt",
    sx: {
      width: "181px",
    },
  },
  {
    label: "Action",
    renderValue: (a) => (
      <QuestionnaireContext.Consumer>
        {({ user, handleOnReviewClick }) => {
          if (
            hasPermission(user, "submission_request", "create") &&
            a.applicant?.applicantID === user._id &&
            ["New", "In Progress", "Inquired"].includes(a.status)
          ) {
            return (
              <Link to={`/submission/${a?.["_id"]}`} state={{ from: "/submissions" }}>
                <StyledActionButton bg="#99E3BB" text="#156071" border="#63BA90">
                  Resume
                </StyledActionButton>
              </Link>
            );
          }
          if (
            hasPermission(user, "submission_request", "review") &&
            ["Submitted", "In Review"].includes(a.status)
          ) {
            return (
              <StyledActionButton
                onClick={() => handleOnReviewClick(a)}
                bg="#F1C6B3"
                text="#5F564D"
                border="#DB9C62"
              >
                Review
              </StyledActionButton>
            );
          }

          return (
            <Link to={`/submission/${a?.["_id"]}`} state={{ from: "/submissions" }}>
              <StyledActionButton bg="#89DDE6" text="#156071" border="#84B4BE">
                View
              </StyledActionButton>
            </Link>
          );
        }}
      </QuestionnaireContext.Consumer>
    ),
    sortDisabled: true,
    sx: {
      width: "140px",
    },
  },
];

/**
 * View for List of Questionnaire/Submissions
 *
 * @returns {JSX.Element}
 */
const ListingView: FC = () => {
  usePageTitle("Submission Request List");

  const navigate = useNavigate();
  const { state } = useLocation();
  const { user, status: authStatus } = useAuthContext();

  const [creatingApplication, setCreatingApplication] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [data, setData] = useState<ListApplicationsResp["listApplications"]>(null);

  const tableRef = useRef<TableMethods>(null);

  const [listApplications] = useLazyQuery<ListApplicationsResp, ListApplicationsInput>(
    LIST_APPLICATIONS,
    {
      context: { clientName: "backend" },
      fetchPolicy: "no-cache",
    }
  );
  const [saveApp] = useMutation<SaveAppResp, SaveAppInput>(SAVE_APP, {
    context: { clientName: "backend" },
    fetchPolicy: "no-cache",
  });
  const [reviewApp] = useMutation<ReviewAppResp, ReviewAppInput>(REVIEW_APP, {
    context: { clientName: "backend" },
    fetchPolicy: "no-cache",
  });

  const createApp = async () => {
    setCreatingApplication(true);
    const { data: d, errors } = await saveApp({
      variables: {
        application: {
          _id: undefined,
          studyName: "",
          studyAbbreviation: "",
          questionnaireData: "{}",
          controlledAccess: false,
          openAccess: false,
          ORCID: "",
          PI: "",
          programName: "",
          programAbbreviation: "",
          programDescription: "",
        },
      },
    }).catch((e) => ({ data: null, errors: e }));

    setCreatingApplication(false);

    if (errors) {
      navigate("", {
        state: {
          error: "Unable to create a submission request. Please try again later",
        },
      });
      return;
    }

    navigate(`/submission/${d?.saveApplication?.["_id"] || "new"}`, {
      state: { from: "/submissions" },
    });
  };

  const handleFetchData = async (fetchListing: FetchListing<T>, force: boolean) => {
    const { first, offset, sortDirection, orderBy } = fetchListing || {};
    try {
      setLoading(true);

      const { data: d, error } = await listApplications({
        variables: {
          first,
          offset,
          sortDirection,
          orderBy,
        },
        context: { clientName: "backend" },
        fetchPolicy: "no-cache",
      });
      if (error || !d?.listApplications) {
        throw new Error("Unable to retrieve Data Submission List results.");
      }

      setData(d.listApplications);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOnReviewClick = async ({ _id, status }: T) => {
    if (status !== "Submitted") {
      navigate(`/submission/${_id}`, {
        state: {
          from: "/submissions",
        },
      });
      return;
    }

    try {
      const { data: d, errors } = await reviewApp({
        variables: {
          id: _id,
        },
      });

      if (errors || !d?.reviewApplication?._id) {
        throw new Error("Unable to review Submission Request.");
      }

      navigate(`/submission/${_id}`, {
        state: {
          from: "/submissions",
        },
      });
    } catch (err) {
      Logger.error("Error transitioning form from Submitted to In Review", err);
    }
  };

  const providerValue = useMemo(() => ({ user, handleOnReviewClick }), [user, handleOnReviewClick]);

  return (
    <>
      <PageBanner
        title="Submission Request List"
        subTitle="Below is a list of submission requests that are associated with your account. Please click on any of the submission requests to review or continue work."
        padding="57px 0 0 25px"
        body={
          <StyledBannerBody direction="row" alignItems="center" justifyContent="flex-end">
            {hasPermission(user, "submission_request", "create") && (
              <StyledButton type="button" onClick={createApp} loading={creatingApplication}>
                Start a Submission Request
              </StyledButton>
            )}
          </StyledBannerBody>
        }
        bannerSrc={bannerSvg}
      />

      <StyledContainer maxWidth="xl">
        {(state?.error || error) && (
          <Alert sx={{ mb: 3, p: 2 }} severity="error">
            {state?.error || "An error occurred while loading the data."}
          </Alert>
        )}

        <StyledTableContainer>
          <QuestionnaireContext.Provider value={providerValue}>
            <GenericTable
              ref={tableRef}
              columns={columns}
              data={data?.applications || []}
              total={data?.total || 0}
              loading={loading || authStatus === AuthStatus.LOADING}
              defaultRowsPerPage={20}
              defaultOrder="desc"
              position="bottom"
              noContentText="There are no submission requests associated with your account"
              onFetchData={handleFetchData}
              containerProps={{
                sx: {
                  marginBottom: "8px",
                  border: 0,
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                },
              }}
              CustomTableHead={StyledTableHead}
              CustomTableHeaderCell={StyledHeaderCell}
              CustomTableBodyCell={StyledTableCell}
            />
          </QuestionnaireContext.Provider>
        </StyledTableContainer>
      </StyledContainer>
    </>
  );
};

export default ListingView;
