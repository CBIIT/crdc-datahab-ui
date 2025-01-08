import React, { FC, MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { isEqual } from "lodash";
import { Box, Button, Stack, styled } from "@mui/material";
import { useSnackbar } from "notistack";
import { useLazyQuery } from "@apollo/client";
import GenericTable, { Column } from "../../components/GenericTable";
import { FormatDate, Logger, titleCase } from "../../utils";
import ErrorDetailsDialog from "../../components/ErrorDetailsDialog";
import QCResultsContext from "./Contexts/QCResultsContext";
import { ExportValidationButton } from "../../components/DataSubmissions/ExportValidationButton";
import { useSubmissionContext } from "../../components/Contexts/SubmissionContext";
import StyledTooltip from "../../components/StyledFormComponents/StyledTooltip";
import TruncatedText from "../../components/TruncatedText";
import DoubleLabelSwitch from "../../components/DoubleLabelSwitch";
import {
  AGGREGATED_SUBMISSION_QC_RESULTS,
  SUBMISSION_QC_RESULTS,
  AggregatedSubmissionQCResultsInput,
  AggregatedSubmissionQCResultsResp,
  SubmissionQCResultsInput,
  SubmissionQCResultsResp,
} from "../../graphql";
import QualityControlFilters from "../../components/DataSubmissions/QualityControlFilters";

type FilterForm = {
  issueType: string;
  /**
   * The node type to filter by.
   *
   * @default "All"
   */
  nodeType: string;
  batchID: number | "All";
  severity: QCResult["severity"] | "All";
};

const StyledErrorDetailsButton = styled(Button)({
  display: "inline",
  color: "#0B6CB1",
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
  textTransform: "capitalize",
});

const StyledSeverity = styled(Box)({
  display: "flex",
  alignItems: "center",
});

const StyledBreakAll = styled(Box)({
  wordBreak: "break-all",
});

const StyledIssuesTextWrapper = styled(Box)({
  whiteSpace: "nowrap",
  wordBreak: "break-word",
});

const StyledDateTooltip = styled(StyledTooltip)(() => ({
  cursor: "pointer",
}));

type RowData = QCResult | AggregatedQCResult;

const aggregatedColumns: Column<AggregatedQCResult>[] = [
  {
    label: "Issue Type",
    renderValue: (data) => <TruncatedText text={data.title} maxCharacters={50} />,
    field: "title",
  },
  {
    label: "Severity",
    renderValue: (data) => (
      <StyledSeverity color={data?.severity === "Error" ? "#B54717" : "#8D5809"}>
        {data?.severity}
      </StyledSeverity>
    ),
    field: "severity",
  },
  {
    label: "Count",
    renderValue: (data) =>
      Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(data.count || 0),
    field: "count",
    default: true,
  },
  {
    label: "Expand",
    renderValue: (data) => (
      <QCResultsContext.Consumer>
        {({ handleExpandClick }) => (
          <StyledErrorDetailsButton
            onClick={() => handleExpandClick?.(data)}
            variant="text"
            disableRipple
            disableTouchRipple
            disableFocusRipple
          >
            Expand
          </StyledErrorDetailsButton>
        )}
      </QCResultsContext.Consumer>
    ),
    fieldKey: "expand",
    sortDisabled: true,
    sx: {
      width: "104px",
      textAlign: "center",
    },
  },
];

const expandedColumns: Column<QCResult>[] = [
  {
    label: "Batch ID",
    renderValue: (data) => <StyledBreakAll>{data?.displayID}</StyledBreakAll>,
    field: "displayID",
    default: true,
    sx: {
      width: "122px",
    },
  },
  {
    label: "Node Type",
    renderValue: (data) => (
      <StyledNodeType>
        <TruncatedText text={data?.type} maxCharacters={15} disableInteractiveTooltip={false} />
      </StyledNodeType>
    ),
    field: "type",
  },
  {
    label: "Submitted Identifier",
    renderValue: (data) => (
      <TruncatedText
        text={data?.submittedID}
        maxCharacters={15}
        disableInteractiveTooltip={false}
      />
    ),
    field: "submittedID",
  },
  {
    label: "Severity",
    renderValue: (data) => (
      <StyledSeverity color={data?.severity === "Error" ? "#B54717" : "#8D5809"}>
        {data?.severity}
      </StyledSeverity>
    ),
    field: "severity",
    sx: {
      width: "148px",
    },
  },
  {
    label: "Validated Date",
    renderValue: (data) =>
      data.validatedDate ? (
        <StyledDateTooltip
          title={FormatDate(data.validatedDate, "M/D/YYYY h:mm A")}
          placement="top"
        >
          <span>{FormatDate(data.validatedDate, "M/D/YYYY")}</span>
        </StyledDateTooltip>
      ) : (
        ""
      ),
    field: "validatedDate",
    sx: {
      width: "193px",
    },
  },
  {
    label: "Issues",
    renderValue: (data) =>
      (data?.errors?.length > 0 || data?.warnings?.length > 0) && (
        <QCResultsContext.Consumer>
          {({ handleOpenErrorDialog }) => (
            <Stack direction="row">
              <StyledIssuesTextWrapper>
                <TruncatedText
                  text={`${data.errors?.[0]?.title || data.warnings?.[0]?.title}.`}
                  maxCharacters={15}
                  wrapperSx={{ display: "inline" }}
                  labelSx={{ display: "inline" }}
                  disableInteractiveTooltip={false}
                />{" "}
                <StyledErrorDetailsButton
                  onClick={() => handleOpenErrorDialog && handleOpenErrorDialog(data)}
                  variant="text"
                  disableRipple
                  disableTouchRipple
                  disableFocusRipple
                >
                  See details.
                </StyledErrorDetailsButton>
              </StyledIssuesTextWrapper>
            </Stack>
          )}
        </QCResultsContext.Consumer>
      ),
    sortDisabled: true,
  },
];

// CSV columns used for exporting table data
export const csvColumns = {
  "Batch ID": (d: QCResult) => d.displayID,
  "Node Type": (d: QCResult) => d.type,
  "Submitted Identifier": (d: QCResult) => d.submittedID,
  Severity: (d: QCResult) => d.severity,
  "Validated Date": (d: QCResult) => FormatDate(d?.validatedDate, "MM-DD-YYYY [at] hh:mm A", ""),
  Issues: (d: QCResult) => {
    const value = d.errors[0]?.description ?? d.warnings[0]?.description;

    // NOTE: The ErrorMessage descriptions contain non-standard double quotes
    // that don't render correctly in Excel. This replaces them with standard double quotes.
    return value.replaceAll(/[“”‟〞＂]/g, `"`);
  },
};

export const aggregatedCSVColumns = {
  "Issue Type": (d: AggregatedQCResult) => d.title,
  Severity: (d: AggregatedQCResult) => d.severity,
  Count: (d: AggregatedQCResult) => d.count,
};

const QualityControl: FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { data: submissionData } = useSubmissionContext();
  const {
    _id: submissionId,
    metadataValidationStatus,
    fileValidationStatus,
  } = submissionData?.getSubmission || {};

  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<RowData[]>([]);
  const [prevData, setPrevData] = useState<FetchListing<RowData>>(null);
  const [totalData, setTotalData] = useState(0);
  const [openErrorDialog, setOpenErrorDialog] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<RowData | null>(null);
  const [isAggregated, setIsAggregated] = useState<boolean>(true);
  const [issueType, setIssueType] = useState<string | null>(null);
  const filtersRef: MutableRefObject<FilterForm> = useRef({
    issueType: "All",
    batchID: "All",
    nodeType: "All",
    severity: "All",
  });
  const tableRef = useRef<TableMethods>(null);

  const errorDescriptions = useMemo(() => {
    if (selectedRow && "errors" in selectedRow) {
      return selectedRow.errors?.map((error) => `(Error) ${error.description}`) ?? [];
    }
    return [];
  }, [selectedRow]);

  const warningDescriptions = useMemo(() => {
    if (selectedRow && "warnings" in selectedRow) {
      return (
        (selectedRow as QCResult).warnings?.map((warning) => `(Warning) ${warning.description}`) ??
        []
      );
    }
    return [];
  }, [selectedRow]);

  const allDescriptions = useMemo(
    () => [...errorDescriptions, ...warningDescriptions],
    [errorDescriptions, warningDescriptions]
  );

  const [submissionQCResults] = useLazyQuery<SubmissionQCResultsResp, SubmissionQCResultsInput>(
    SUBMISSION_QC_RESULTS,
    {
      context: { clientName: "backend" },
      fetchPolicy: "cache-and-network",
    }
  );

  const [aggregatedSubmissionQCResults] = useLazyQuery<
    AggregatedSubmissionQCResultsResp,
    AggregatedSubmissionQCResultsInput
  >(AGGREGATED_SUBMISSION_QC_RESULTS, {
    context: { clientName: "backend" },
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    tableRef.current?.refresh();
  }, [metadataValidationStatus, fileValidationStatus]);

  const handleFetchQCResults = async (fetchListing: FetchListing<QCResult>, force: boolean) => {
    const { first, offset, sortDirection, orderBy } = fetchListing || {};
    if (!force && data?.length > 0 && isEqual(fetchListing, prevData)) {
      return;
    }

    setPrevData(fetchListing);

    try {
      setLoading(true);

      const { data: d, error } = await submissionQCResults({
        variables: {
          id: submissionId,
          first,
          offset,
          sortDirection,
          orderBy,
          issueCode:
            !filtersRef.current.issueType || filtersRef.current.issueType === "All"
              ? undefined
              : filtersRef.current.issueType,
          nodeTypes:
            !filtersRef.current.nodeType || filtersRef.current.nodeType === "All"
              ? undefined
              : [filtersRef.current.nodeType],
          batchIDs:
            !filtersRef.current.batchID || filtersRef.current.batchID === "All"
              ? undefined
              : [filtersRef.current.batchID],
          severities: filtersRef.current.severity || "All",
        },
        context: { clientName: "backend" },
        fetchPolicy: "no-cache",
      });
      if (error || !d?.submissionQCResults) {
        throw new Error("Unable to retrieve submission quality control results.");
      }
      setData(d.submissionQCResults.results);
      setTotalData(d.submissionQCResults.total);
    } catch (err) {
      enqueueSnackbar(err?.toString(), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAggQCResults = async (
    fetchListing: FetchListing<AggregatedQCResult>,
    force: boolean
  ) => {
    const { first, offset, sortDirection, orderBy } = fetchListing || {};

    if (!force && data?.length > 0 && isEqual(fetchListing, prevData)) {
      return;
    }

    setPrevData(fetchListing);

    try {
      setLoading(true);

      const { data: d, error } = await aggregatedSubmissionQCResults({
        variables: {
          submissionID: submissionId,
          severity: filtersRef.current.severity?.toLowerCase() || "all",
          first,
          offset,
          sortDirection,
          orderBy,
        },
        context: { clientName: "backend" },
        fetchPolicy: "no-cache",
      });
      if (error || !d?.aggregatedSubmissionQCResults) {
        throw new Error("Unable to retrieve submission aggregated quality control results.");
      }
      setData(d.aggregatedSubmissionQCResults.results);
      setTotalData(d.aggregatedSubmissionQCResults.total);
    } catch (err) {
      Logger.error(`QualityControl: ${err?.toString()}`);
      enqueueSnackbar(err?.toString(), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchData = (fetchListing: FetchListing<RowData>, force: boolean) => {
    if (!submissionId || !filtersRef.current) {
      return;
    }

    isAggregated
      ? handleFetchAggQCResults(fetchListing, force)
      : handleFetchQCResults(fetchListing, force);
  };

  const handleOpenErrorDialog = (data: QCResult) => {
    setOpenErrorDialog(true);
    setSelectedRow(data);
  };

  const Actions = useMemo<React.ReactNode>(
    () => (
      <Stack direction="row" alignItems="center" gap="8px" marginRight="37px">
        <ExportValidationButton
          submission={submissionData?.getSubmission}
          fields={isAggregated ? aggregatedCSVColumns : csvColumns}
          isAggregated={isAggregated}
          disabled={totalData <= 0}
        />
      </Stack>
    ),
    [submissionData?.getSubmission, totalData, isAggregated]
  );

  const handleOnFiltersChange = (data: FilterForm) => {
    filtersRef.current = data;
    tableRef.current?.setPage(0, true);
  };

  const onSwitchToggle = () => {
    setData([]);
    setPrevData(null);
    setTotalData(0);
    setIsAggregated((prev) => !prev);
  };

  const currentColumns = useMemo(
    () => (isAggregated ? aggregatedColumns : expandedColumns),
    [isAggregated]
  ) as Column<RowData>[];

  const handleExpandClick = (issue: AggregatedQCResult) => {
    if (!issue?.code) {
      Logger.error("QualityControl: Unable to expand invalid issue.");
      return;
    }

    setIssueType(issue?.code);
    setIsAggregated(false);
  };

  const providerValue = useMemo(
    () => ({
      handleOpenErrorDialog,
      handleExpandClick,
    }),
    [handleOpenErrorDialog, handleExpandClick]
  );

  return (
    <>
      <QualityControlFilters
        onChange={handleOnFiltersChange}
        issueType={issueType}
        isAggregated={isAggregated}
      />

      <QCResultsContext.Provider value={providerValue}>
        <GenericTable
          ref={tableRef}
          columns={currentColumns}
          data={data || []}
          total={totalData || 0}
          loading={loading}
          defaultRowsPerPage={20}
          defaultOrder="desc"
          position="both"
          noContentText="No validation issues found. Either no validation has been conducted yet, or all issues have been resolved."
          setItemKey={(item, idx) => `${idx}_${"title" in item ? item?.title : item?.batchID}`}
          onFetchData={handleFetchData}
          AdditionalActions={{
            top: {
              before: (
                <DoubleLabelSwitch
                  leftLabel="Aggregated"
                  rightLabel="Expanded"
                  id="table-state-switch"
                  data-testid="table-view-switch"
                  checked={!isAggregated}
                  onChange={onSwitchToggle}
                  inputProps={{ "aria-label": "Aggregated or Expanded table view switch" }}
                />
              ),
              after: Actions,
            },
            bottom: {
              after: Actions,
            },
          }}
          containerProps={{ sx: { marginBottom: "8px" } }}
        />
      </QCResultsContext.Provider>
      {!isAggregated && (
        <ErrorDetailsDialog
          open={openErrorDialog}
          onClose={() => setOpenErrorDialog(false)}
          header={null}
          title="Validation Issues"
          nodeInfo={`For ${titleCase((selectedRow as QCResult)?.type)}${
            (selectedRow as QCResult)?.type?.toLocaleLowerCase() !== "data file" ? " Node" : ""
          } ID ${(selectedRow as QCResult)?.submittedID}`}
          errors={allDescriptions}
          errorCount={`${allDescriptions?.length || 0} ${
            allDescriptions?.length === 1 ? "ISSUE" : "ISSUES"
          }`}
        />
      )}
    </>
  );
};

export default React.memo(QualityControl);
