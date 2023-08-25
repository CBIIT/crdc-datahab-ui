import React, { FC, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert, Container, Stack, styled,
  Table, TableBody, TableCell,
  TableContainer, TableHead,
  TablePagination, TableRow,
  TableSortLabel, Typography, Box, CircularProgress,
} from "@mui/material";
import { LoadingButton } from '@mui/lab';
import { useMutation, useQuery } from '@apollo/client';
import { query, Response } from '../../graphql/listApplications';
import bannerSvg from "../../assets/banner/data_submissions_banner.png";
import PageBanner from '../../components/PageBanner';
import { FormatDate } from '../../utils';
import { useAuthContext } from '../../components/Contexts/AuthContext';
import { mutation as SAVE_APP, Response as SaveAppResp } from '../../graphql/saveApplication';
import SelectInput from "../../components/Questionnaire/SelectInput";

type T = DataSubmission;

type Column = {
  label: string;
  value: (a: T, user: User) => string | boolean | number | React.ReactNode;
  field?: string;
  default?: true;
};

const StyledButton = styled(LoadingButton)({
  height: "51px",
  width: "261px",
  padding: "14px 20px",
  fontWeight: 700,
  fontSize: "16px",
  fontFamily: "'Nunito', 'Rubik', sans-serif",
  letterSpacing: "2%",
  lineHeight: "20.14px",
  borderRadius: "8px",
  color: "#fff",
  textTransform: "none",
  borderColor: "#005EA2 !important",
  background: "#005EA2 !important",
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

const OrganizationStatusContainer = styled('div')({
  height: "45px",
  fontFamily: "Nunito",
  fontSize: "16px",
  fontWeight: "700",
  lineHeight: "20px",
  letterSpacing: "0em",
  textAlign: "left",
  display: "flex",
  alignItems: "center",
  paddingLeft: "16px",
});

const StyledHeaderCell = styled(TableCell)({
  fontWeight: 700,
  fontSize: "16px",
  color: "#fff !important",
  "&.MuiTableCell-root": {
    padding: "8px 8px",
    color: "#fff !important",
  },
  "& .MuiSvgIcon-root,  & .MuiButtonBase-root": {
    color: "#fff !important",
  },
  "&:last-of-type": {
    paddingRight: "4px",
  },
});

const StyledTableCell = styled(TableCell)({
  fontSize: "16px",
  color: "#083A50 !important",
  "&.MuiTableCell-root": {
    padding: "8px 8px",
  },
  "&:last-of-type": {
    paddingRight: "4px",
  },
});

const columns: Column[] = [
  {
    label: "Submission ID",
    value: (a) => a.id,
    field: "applicant.applicantName",
  },
  {
    label: "Submitter Name",
    value: (a) => a.submitterName,
    field: "applicant.applicantName",
  },
  {
    label: "Data Commons",
    value: (a) => a.dataCommons,
    field: "applicant.applicantName",
  },
  {
    label: "Organization",
    value: (a) => a.organization,
    field: "organization.name",
  },
  {
    label: "Study",
    value: (a) => a.study,
    field: "studyAbbreviation",
  },
  {
    label: "dbGap ID",
    value: (a) => a.dbGapID,
    field: "studyAbbreviation",
  },
  {
    label: "Status",
    value: (a) => a.status,
    field: "status",
  },
  {
    label: "Data Hub Concierge",
    value: (a) => a.dataHubConcierge,
    field: "applicant.applicantName",
  },
  {
    label: "Last Updated Date",
    value: (a) => (a.updatedAt ? FormatDate(a.updatedAt, "M/D/YYYY h:mm A") : ""),
    field: "updatedAt",
  },
];

const statusValues: DataSubmissionStatus[] = ["Initialized", "In Progress", "Submitted", "Released", "Completed", "Archived"];
const statusOptionArray: SelectOption[] = statusValues.map((v) => ({ label: v, value: v }));
/**
 * View for List of Questionnaire/Submissions
 *
 * @returns {JSX.Element}
 */
const ListingView: FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useAuthContext();

  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [orderBy, setOrderBy] = useState<Column>(
    columns.find((c) => c.default)
    || columns.find((c) => c.field)
  );
  const [page, setPage] = useState<number>(0);
  const [perPage, setPerPage] = useState<number>(10);
  const [creatingApplication, setCreatingApplication] = useState<boolean>(false);

  const tempDataSubmissions: Array<T> = [
    {
      id: "000001",
      submitterName: "John Doe",
      dataCommons: "CDS",
      organization: "NIH",
      study: "ABC",
      dbGapID: "3766-26",
      status: "Initialized",
      dataHubConcierge: "Name AAA",
      updatedAt: "07-22-2022 06:45 AM" // YYYY-MM-DDTHH:MM:SSZ format
    },
    {
      id: "000002",
      submitterName: "Teri Dactyl",
      dataCommons: "CDS",
      organization: "CBIIT",
      study: "ABC",
      dbGapID: "1234-65",
      status: "Initialized",
      dataHubConcierge: "Name AAA",
      updatedAt: "07-22-2022 06:45 AM" // YYYY-MM-DDTHH:MM:SSZ format
    },
    {
      id: "000003",
      submitterName: "Peg Legge",
      dataCommons: "CDS",
      organization: "uAlberta",
      study: "ABC",
      dbGapID: "6324-00",
      status: "Initialized",
      dataHubConcierge: "Name AAA",
      updatedAt: "07-22-2022 06:45 AM" // YYYY-MM-DDTHH:MM:SSZ format
    },
    {
      id: "000004",
      submitterName: "John Doe",
      dataCommons: "CDS",
      organization: "NIH",
      study: "ABC",
      dbGapID: "2455-26",
      status: "Archived",
      dataHubConcierge: "Name AAA",
      updatedAt: "07-22-2022 06:45 AM" // YYYY-MM-DDTHH:MM:SSZ format
    },
    {
      id: "000005",
      submitterName: "Allie Grater",
      dataCommons: "CDS",
      organization: "CBIIT",
      study: "ABC",
      dbGapID: "1233-35",
      status: "Completed",
      dataHubConcierge: "Name AAA",
      updatedAt: "07-22-2022 06:45 AM" // YYYY-MM-DDTHH:MM:SSZ format
    },
    {
      id: "000006",
      submitterName: "Olive Yew",
      dataCommons: "CDS",
      organization: "uAblerta",
      study: "ABC",
      dbGapID: "0004-43",
      status: "Released",
      dataHubConcierge: "Name AAA",
      updatedAt: "07-22-2022 06:45 AM" // YYYY-MM-DDTHH:MM:SSZ format
    },
    {
      id: "000007",
      submitterName: "Aida Bugg",
      dataCommons: "CDS",
      organization: "NIH",
      study: "ABC",
      dbGapID: "3434-36",
      status: "Submitted",
      dataHubConcierge: "Name AAA",
      updatedAt: "07-22-2022 06:45 AM" // YYYY-MM-DDTHH:MM:SSZ format
    },
    {
      id: "000008",
      submitterName: "Funny Pun",
      dataCommons: "CDS",
      organization: "CBIIT",
      study: "ABC",
      dbGapID: "4509-88",
      status: "In Progress",
      dataHubConcierge: "Name AAA",
      updatedAt: "07-22-2022 06:45 AM" // YYYY-MM-DDTHH:MM:SSZ format
    },
    {
      id: "000009",
      submitterName: "Marsh Mallow",
      dataCommons: "CDS",
      organization: "NIH",
      study: "ABC",
      dbGapID: "5966-10",
      status: "Initialized",
      dataHubConcierge: "Name AAA",
      updatedAt: "07-22-2022 06:45 AM" // YYYY-MM-DDTHH:MM:SSZ format
    },
  ];
  const tempData = { listDataSubmissions: { total: tempDataSubmissions.length, dataSubmissions: tempDataSubmissions } };

  const { data, loading, error } = { data: tempData, loading: false, error: "" };

  // const { data, loading, error } = useQuery<Response>(query, {
  //   variables: {
  //     first: perPage,
  //     offset: page * perPage,
  //     sortDirection: order.toUpperCase(),
  //     orderBy: orderBy.field,
  //   },
  //   context: { clientName: 'backend' },
  //   fetchPolicy: "no-cache",
  // });

  const [saveApp] = useMutation<SaveAppResp, { application: ApplicationInput }>(SAVE_APP, {
    context: { clientName: 'backend' },
    fetchPolicy: 'no-cache'
  });

  // eslint-disable-next-line arrow-body-style
  const emptyRows = useMemo(() => {
    return (page > 0 && data?.listDataSubmissions?.total)
      ? Math.max(0, (1 + page) * perPage - (data?.listDataSubmissions?.total || 0))
      : 0;
  }, [data]);

  const handleRequestSort = (column: Column) => {
    setOrder(orderBy === column && order === "asc" ? "desc" : "asc");
    setOrderBy(column);
  };

  const handleChangeRowsPerPage = (event) => {
    setPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const createApp = async () => {
    setCreatingApplication(true);
    const { data: d, errors } = await saveApp({
      variables: {
        application: {
          _id: undefined,
          programName: "",
          studyAbbreviation: "",
          questionnaireData: "{}",
        }
      }
    });

    setCreatingApplication(false);

    if (errors) {
      navigate("", {
        state: {
          error: "Unable to create a submission request. Please try again later"
        }
      });
      return;
    }

    navigate(`/submission/${d?.saveApplication?.["_id"] || "new"}`);
  };

  return (
    <>
      <PageBanner
        title="Data Submission List"
        subTitle="Below is a list of data submissions that are associated with your account. Please click on any of the data submissions to review or continue work."
        padding="57px 0 0 25px"
        body={(
          <StyledBannerBody direction="row" alignItems="center" justifyContent="flex-end">
            {/* NOTE For MVP-2: Organization Owners are just Users */}
            {user?.role === "User" && (
              <StyledButton
                type="button"
                onClick={createApp}
                loading={creatingApplication}
              >
                Create a Submission
              </StyledButton>
            )}
          </StyledBannerBody>
        )}
        bannerSrc={bannerSvg}
      />

      <StyledContainer maxWidth="xl">
        {(state?.error || error) && (
          <Alert sx={{ mb: 3, p: 2 }} severity="error">
            {state?.error || "An error occurred while loading the data."}
          </Alert>
        )}

        <StyledTableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell colSpan={12}>
                  <OrganizationStatusContainer>
                    Organization
                    <SelectInput
                      sx={{ minWidth: "300px", marginLeft: "24px", marginRight: "64px" }}
                      id="data-submissions-table-organization"
                      label=""
                      options={[{ label: "CBIIT", value: "CBIIT" }, { label: "NIH", value: "NIH" }]}
                      value=""
                      placeholder="Select an organization"
                      readOnly={false}
                    />
                    Status
                    <SelectInput
                      sx={{ minWidth: "300px", marginLeft: "24px", marginRight: "64px" }}
                      id="data-submissions-table-status"
                      label=""
                      options={statusOptionArray}
                      value=""
                      placeholder="Select a status"
                      readOnly={false}
                    />
                  </OrganizationStatusContainer>
                </TableCell>
              </TableRow>
              <TableRow sx={{ background: "#083A50" }}>
                {columns.map((col: Column, index) => (
                  <StyledHeaderCell sx={{ paddingLeft: (index === 0 ? "32px !important" : "") }} key={col.label}>
                    {col.field ? (
                      <TableSortLabel
                        active={orderBy === col}
                        direction={orderBy === col ? order : "asc"}
                        onClick={() => handleRequestSort(col)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </StyledHeaderCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell>
                    <Box
                      sx={{
                        position: 'absolute',
                        background: "#fff",
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: "9999",
                      }}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <CircularProgress size={64} disableShrink thickness={3} />
                    </Box>
                  </TableCell>
                </TableRow>
              )}
              {data?.listDataSubmissions?.dataSubmissions?.map((d: T, index) => (
                <TableRow sx={{ background: (index % 2 === 0 ? "#fff" : "#E3EEF9") }} tabIndex={-1} hover key={d["_id"]}>
                  {columns.map((col: Column, index) => (
                    <StyledTableCell sx={{ paddingLeft: (index === 0 ? "32px !important" : "") }} key={`${d["_id"]}_${col.label}`}>
                      {col.value(d, user)}
                    </StyledTableCell>
                  ))}
                </TableRow>
              ))}

              {/* Fill the difference between perPage and count to prevent height changes */}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={columns.length} />
                </TableRow>
              )}

              {/* No content message */}
              {(!data?.listDataSubmissions?.total || data?.listDataSubmissions?.total === 0) && (
                <TableRow style={{ height: 53 * 10 }}>
                  <TableCell colSpan={columns.length}>
                    <Typography
                      variant="h6"
                      align="center"
                      fontSize={18}
                      color="#AAA"
                    >
                      There are no data submissions associated with your account
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 20, 50]}
            component="div"
            count={data?.listDataSubmissions?.total || 0}
            rowsPerPage={perPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={handleChangeRowsPerPage}
            nextIconButtonProps={{
              disabled: perPage === -1
                || !data?.listDataSubmissions
                || data?.listDataSubmissions?.total === 0
                || data?.listDataSubmissions?.total <= (page + 1) * perPage
                || emptyRows > 0
                || loading
            }}
            backIconButtonProps={{ disabled: page === 0 || loading }}
          />
        </StyledTableContainer>
      </StyledContainer>
    </>
  );
};

export default ListingView;
