import { FC, useEffect, useMemo, useRef, useState } from "react";
import { useLazyQuery, useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { isEqual } from "lodash";
import { Box, Button, FormControl, MenuItem, Select, styled } from "@mui/material";
import { Controller, useForm } from 'react-hook-form';
import { LIST_BATCHES, LIST_NODE_TYPES, ListBatchesResp, ListNodeTypesResp, SUBMISSION_QC_RESULTS, submissionQCResultsResp } from "../../graphql";
import GenericTable, { Column, FetchListing, TableMethods } from "../../components/DataSubmissions/GenericTable";
import { FormatDate } from "../../utils";
import ErrorDialog from "./ErrorDialog";
import QCResultsContext from "./Contexts/QCResultsContext";

type FilterForm = {
  nodeType: string | "All";
  batchID: number | "All";
  severity: QCResult["severity"] | "All";
};

const StyledErrorDetailsButton = styled(Button)({
  display: "inline",
  color: "#0D78C5",
  fontFamily: "'Nunito', 'Rubik', sans-serif",
  fontSize: "16px",
  fontStyle: "normal",
  fontWeight: 600,
  lineHeight: "19px",
  padding: 0,
  textDecorationLine: "underline",
  textTransform: "none",
  "&:hover": {
    background: "transparent",
    textDecorationLine: "underline",
  },
});

const StyledNodeType = styled(Box)({
  display: "flex",
  alignItems: "center",
  textTransform: "capitalize"
});

const StyledSeverity = styled(Box)({
  minHeight: 76.5,
  display: "flex",
  alignItems: "center",
});

const StyledBreakAll = styled(Box)({
  wordBreak: "break-all"
});

const StyledFilterContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  marginBottom: "19px",
  paddingLeft: "24px",
});

const StyledFormControl = styled(FormControl)({
  margin: "10px",
  marginRight: "15px",
  minWidth: "250px",
});

const StyledInlineLabel = styled('label')({
  padding: "0 10px",
  fontWeight: "700"
});

const baseTextFieldStyles = {
  borderRadius: "8px",
  "& .MuiInputBase-input": {
    fontWeight: 400,
    fontSize: "16px",
    fontFamily: "'Nunito', 'Rubik', sans-serif",
    padding: "10px",
    height: "20px",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#6B7294",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    border: "1px solid #209D7D",
    boxShadow: "2px 2px 4px 0px rgba(38, 184, 147, 0.10), -1px -1px 6px 0px rgba(38, 184, 147, 0.20)",
  },
  "& .Mui-disabled": {
    cursor: "not-allowed",
  },
  "& .MuiList-root": {
    padding: "0 !important",
  },
  "& .MuiMenuItem-root.Mui-selected": {
    background: "#3E7E6D !important",
    color: "#FFFFFF !important",
  },
  "& .MuiMenuItem-root:hover": {
    background: "#D5EDE5",
  },
};

const StyledSelect = styled(Select)(baseTextFieldStyles);

const columns: Column<QCResult>[] = [
  {
    label: "Type",
    renderValue: (data) => <StyledNodeType>{data?.nodeType}</StyledNodeType>,
    field: "nodeType",
  },
  {
    label: "Batch ID",
    renderValue: (data) => <StyledBreakAll>{data?.displayID}</StyledBreakAll>,
    field: "displayID",
  },
  {
    label: "Node ID",
    renderValue: (data) => <StyledBreakAll>{data?.nodeID}</StyledBreakAll>,
    field: "nodeID",
  },
  {
    label: "CRDC ID",
    renderValue: (data) => <StyledBreakAll>{data?.CRDC_ID}</StyledBreakAll>,
    field: "CRDC_ID",
  },
  {
    label: "Severity",
    renderValue: (data) => <StyledSeverity color={data?.severity === "Error" ? "#E25C22" : "#8D5809"}>{data?.severity}</StyledSeverity>,
    field: "severity",
  },
  {
    label: "Uploaded Date",
    renderValue: (data) => (data?.uploadedDate ? `${FormatDate(data.uploadedDate, "MM-DD-YYYY [at] hh:mm A")}` : ""),
    field: "uploadedDate",
    default: true
  },
  {
    label: "Reasons",
    renderValue: (data) => data?.description?.length > 0 && (
      <QCResultsContext.Consumer>
        {({ handleOpenErrorDialog }) => (
          <>
            <span>{data.description[0]?.title}</span>
            {" "}
            <StyledErrorDetailsButton
              onClick={() => handleOpenErrorDialog && handleOpenErrorDialog(data)}
              variant="text"
              disableRipple
              disableTouchRipple
              disableFocusRipple
            >
              See details
            </StyledErrorDetailsButton>
          </>
        )}
      </QCResultsContext.Consumer>
    ),
    field: "description",
    sortDisabled: true,
  },
];

const QualityControl: FC = () => {
  const { submissionId } = useParams();
  const { watch, control } = useForm<FilterForm>();

  const [loading, setLoading] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string>(null);
  const [data, setData] = useState<QCResult[]>([]);
  const [prevData, setPrevData] = useState<FetchListing<QCResult>>(null);
  const [totalData, setTotalData] = useState(0);
  const [openErrorDialog, setOpenErrorDialog] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<QCResult | null>(null);
  const tableRef = useRef<TableMethods>(null);

  const [submissionQCResults] = useLazyQuery<submissionQCResultsResp>(SUBMISSION_QC_RESULTS, {
    variables: { id: submissionId },
    context: { clientName: 'backend' },
    fetchPolicy: 'no-cache'
  });

  const { data: batchData } = useQuery<ListBatchesResp>(LIST_BATCHES, {
    variables: {
      submissionID: submissionId,
      first: 9999, // TODO: need to support -1 for all batches
      offset: 0,
      partial: true,
      orderBy: "displayID",
      sortDirection: "asc",
    },
    context: { clientName: 'backend' },
  });

  const { data: nodeTypes } = useQuery<ListNodeTypesResp>(LIST_NODE_TYPES, {
    variables: { submissionID: submissionId, },
    context: { clientName: 'backend' },
  });

  const handleFetchQCResults = async (fetchListing: FetchListing<QCResult>, force: boolean) => {
    const { first, offset, sortDirection, orderBy } = fetchListing || {};
    if (!submissionId) {
      setError("Invalid submission ID provided.");
      return;
    }
    if (!force && data?.length > 0 && isEqual(fetchListing, prevData)) {
      return;
    }

    setPrevData(fetchListing);

    try {
      setLoading(true);
      const { data: d, error } = await submissionQCResults({
        variables: {
          submissionID: submissionId,
          first,
          offset,
          sortDirection,
          orderBy,
          nodeTypes: watch("nodeType") === "All" ? null : [watch("nodeType")],
          batchID: watch("batchID") === "All" ? null : [watch("batchID")],
          severity: watch("severity"),
        },
        context: { clientName: 'backend' },
        fetchPolicy: 'no-cache'
      });
      if (error || !d?.submissionQCResults) {
        throw new Error("Unable to retrieve submission quality control results.");
        return;
      }
      setData(d.submissionQCResults.results);
      setTotalData(d.submissionQCResults.total);
    } catch (err) {
      setError(err?.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleOpenErrorDialog = (data: QCResult) => {
    setOpenErrorDialog(true);
    setSelectedRow(data);
  };

  const providerValue = useMemo(() => ({
    handleOpenErrorDialog
  }), [handleOpenErrorDialog]);

  useEffect(() => {
    handleFetchQCResults(null, true);
  }, [watch("nodeType"), watch("batchID"), watch("severity")]);

  return (
    <>
      <StyledFilterContainer>
        <StyledInlineLabel htmlFor="nodeType-filter">Node Type</StyledInlineLabel>
        <StyledFormControl>
          <Controller
            name="nodeType"
            control={control}
            render={({ field }) => (
              <StyledSelect
                {...field}
                defaultValue="All"
                value={field.value || "All"}
                MenuProps={{ disablePortal: true }}
                inputProps={{ id: "nodeType-filter" }}
              >
                <MenuItem value="All">All</MenuItem>
                {nodeTypes?.listSubmissionNodeTypes?.listNodeTypes?.map((nodeType) => (
                  <MenuItem key={nodeType} value={nodeType}>{nodeType}</MenuItem>
                ))}
              </StyledSelect>
            )}
          />
        </StyledFormControl>
        <StyledInlineLabel htmlFor="batchID-filter">Batch ID</StyledInlineLabel>
        <StyledFormControl>
          <Controller
            name="batchID"
            control={control}
            render={({ field }) => (
              <StyledSelect
                {...field}
                defaultValue="All"
                value={field.value || "All"}
                MenuProps={{ disablePortal: true }}
                inputProps={{ id: "batchID-filter" }}
              >
                <MenuItem value="All">All</MenuItem>
                {batchData?.listBatches?.batches?.map((batch) => (
                  <MenuItem key={batch._id} value={batch._id}>
                    {batch.displayID}
                    {` (${FormatDate(batch.createdAt, "MM/DD/YYYY")})`}
                  </MenuItem>
                ))}
              </StyledSelect>
            )}
          />
        </StyledFormControl>
        <StyledInlineLabel htmlFor="severity-filter">Severity</StyledInlineLabel>
        <StyledFormControl>
          <Controller
            name="severity"
            control={control}
            render={({ field }) => (
              <StyledSelect
                {...field}
                defaultValue="All"
                value={field.value || "All"}
                MenuProps={{ disablePortal: true }}
                inputProps={{ id: "severity-filter" }}
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Error">Error</MenuItem>
                <MenuItem value="Warning">Warning</MenuItem>
              </StyledSelect>
            )}
          />
        </StyledFormControl>
      </StyledFilterContainer>
      <QCResultsContext.Provider value={providerValue}>
        <GenericTable
          ref={tableRef}
          columns={columns}
          data={data || []}
          total={totalData || 0}
          loading={loading}
          defaultRowsPerPage={20}
          setItemKey={(item, idx) => `${idx}_${item.batchID}_${item.nodeID}`}
          onFetchData={handleFetchQCResults}
        />
      </QCResultsContext.Provider>
      <ErrorDialog
        open={openErrorDialog}
        onClose={() => setOpenErrorDialog(false)}
        header="Data Submission"
        title="Reasons"
        errors={selectedRow?.description?.map((error) => error.description)}
        uploadedDate={selectedRow?.uploadedDate}
      />
    </>
  );
};

export default QualityControl;
