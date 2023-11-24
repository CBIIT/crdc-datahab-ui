import { useMemo, useRef, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { isEqual } from "lodash";
import { Box, Button, styled } from "@mui/material";
import { SUBMISSION_QC_RESULTS, submissionQCResultsResp } from "../../graphql";
import GenericTable, { Column, FetchListing, TableMethods } from "../../components/DataSubmissions/GenericTable";
import { FormatDate } from "../../utils";
import ErrorDialog from "./ErrorDialog";
import QCResultsContext from "./Contexts/QCResultsContext";

const StyledErrorDetailsButton = styled(Button)({
  display: "inline",
  color: "#0D78C5",
  fontFamily: "'Nunito', 'Rubik', sans-serif",
  fontSize: "16px",
  fontStyle: "normal",
  fontWeight: 600,
  lineHeight: "19.6px",
  padding: 0,
  textDecorationLine: "underline",
  textTransform: "none",
  "&:hover": {
    background: "transparent",
    textDecorationLine: "underline",
  },
});

const testData: QCResults[] = [
  {
    _id: "1",
    submissionID: "c4366aab-8adf-41e9-9432-864b2101231d",
    nodeType: "Participant",
    batchID: "123a5678-8adf-41e9-9432-864b2108191d",
    nodeID: "123a5678-8adf-41e9-9432-864b2108191d",
    CRDC_ID: "123a5678-8adf-41e9-9432-864b2108191d",
    severity: "Error",
    description: [
      {
        title: "Incorrect control vocabulary.",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Eget duis at tellus at urna condimentum mattis. Eget nunc scelerisque viverra mauris in aliquam sem.",
      },
      {
        title: "Missing required field.",
        description: "Elit eget gravida cum sociis natoque. Risus quis varius quam quisque id diam vel quam. Senectus et netus et malesuada fames ac turpis egestas. Scelerisque eu ultrices vitae auctor eu augue ut.",
      },
      {
        title: "Value not in the range.",
        description: "Consectetur adipiscing elit pellentesque habitant morbi tristique senectus. Nec ullamcorper sit amet risus. Faucibus in ornare quam viverra orci sagittis. Venenatis urna cursus eget nunc.",
      },
    ],
    uploadedDate: "2023-11-08T19:39:15.469Z",
  },
  {
    _id: "2",
    submissionID: "c4366aab-8adf-41e9-9432-864b2101231d",
    nodeType: "Participant",
    batchID: "123a5678-8adf-41e9-9432-864b2108191d",
    nodeID: "123a5678-8adf-41e9-9432-864b2108191d",
    CRDC_ID: "123a5678-8adf-41e9-9432-864b2108191d",
    severity: "Error",
    description: [
      {
        title: "Missing required field.",
        description: "Elit eget gravida cum sociis natoque. Risus quis varius quam quisque id diam vel quam. Senectus et netus et malesuada fames ac turpis egestas. Scelerisque eu ultrices vitae auctor eu augue ut.",
      },
    ],
    uploadedDate: "2023-11-08T19:39:15.469Z",
  },
  {
    _id: "3",
    submissionID: "c4366aab-8adf-41e9-9432-864b2101231d",
    nodeType: "Participant",
    batchID: "123a5678-8adf-41e9-9432-864b2108191d",
    nodeID: "123a5678-8adf-41e9-9432-864b2108191d",
    CRDC_ID: "123a5678-8adf-41e9-9432-864b2108191d",
    severity: "Error",
    description: [
      {
        title: "Value not in the range.",
        description: "Consectetur adipiscing elit pellentesque habitant morbi tristique senectus. Nec ullamcorper sit amet risus. Faucibus in ornare quam viverra orci sagittis. Venenatis urna cursus eget nunc.",
      },
      {
        title: "Incorrect control vocabulary.",
        description: "Elit eget gravida cum sociis natoque. Risus quis varius quam quisque id diam vel quam. Senectus et netus et malesuada fames ac turpis egestas. Scelerisque eu ultrices vitae auctor eu augue ut.",
      },
    ],
    uploadedDate: "2023-11-08T19:39:15.469Z",
  },
];

const columns: Column<QCResults>[] = [
  {
    label: "Type",
    renderValue: (data) => data?.nodeType,
    field: "nodeType",
  },
  {
    label: "Batch ID",
    renderValue: (data) => data?.batchID,
    field: "batchID",
  },
  {
    label: "Node ID",
    renderValue: (data) => data?.nodeID,
    field: "nodeID",
  },
  {
    label: "CRDC ID",
    renderValue: (data) => data?.CRDC_ID,
    field: "CRDC_ID",
  },
  {
    label: "Severity",
    renderValue: (data) => <Box color={data?.severity === "Error" ? "#E25C22" : "#8D5809"}>{data?.severity}</Box>,
    field: "severity",
  },
  {
    label: "Submitted Date",
    renderValue: (data) => (data?.uploadedDate ? `${FormatDate(data.uploadedDate, "MM-DD-YYYY [at] hh:mm A")}` : ""),
    field: "uploadedDate",
    default: true
  },
  {
    label: "Description",
    renderValue: (data) => data?.description?.length > 0 && (
      <QCResultsContext.Consumer>
        {({ handleOpenErrorDialog }) => (
          <>
            <span>{data.description[0].title}</span>
            {" "}
            <StyledErrorDetailsButton
              onClick={() => handleOpenErrorDialog && handleOpenErrorDialog(data?._id)}
              variant="text"
            >
              See details
            </StyledErrorDetailsButton>
          </>
        )}
      </QCResultsContext.Consumer>
    ),
    field: "description",
  },
];

const QualityControl = () => {
  const { submissionId } = useParams();

  const [loading, setLoading] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string>(null);
  const [data, setData] = useState<QCResults[]>(testData);
  const [prevData, setPrevData] = useState<FetchListing<QCResults>>(null);
  const [totalData, setTotalData] = useState(testData.length);
  const [openErrorDialog, setOpenErrorDialog] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<string>(null);
  const tableRef = useRef<TableMethods>(null);
  const selectedData = data?.find((item) => item._id === selectedRow);

  const [submissionQCResults] = useLazyQuery<submissionQCResultsResp>(SUBMISSION_QC_RESULTS, {
    variables: { id: submissionId },
    context: { clientName: 'backend' },
    fetchPolicy: 'no-cache'
  });

  const handleFetchQCResults = async (fetchListing: FetchListing<QCResults>, force: boolean) => {
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
          orderBy
        },
        context: { clientName: 'backend' },
        fetchPolicy: 'no-cache'
      });
      if (error || !d?.submissionQCResults) {
        throw new Error("Unable to retrieve submission quality control results.");
        return;
      }
      setData(d.submissionQCResults.qcResults);
      setTotalData(d.submissionQCResults.total);
    } catch (err) {
      setError(err?.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleOpenErrorDialog = (id: string) => {
    setOpenErrorDialog(true);
    setSelectedRow(id);
  };

  const providerValue = useMemo(() => ({
    handleOpenErrorDialog
  }), [handleOpenErrorDialog]);

  return (
    <>
      <QCResultsContext.Provider value={providerValue}>
        <GenericTable
          ref={tableRef}
          columns={columns}
          data={data || []}
          total={totalData || 0}
          loading={loading}
          onFetchData={handleFetchQCResults}
        />
      </QCResultsContext.Provider>
      <ErrorDialog
        open={openErrorDialog}
        onClose={() => setOpenErrorDialog(false)}
        header="Data Submission"
        title="Error Count"
        errors={selectedData?.description}
        uploadedDate={selectedData?.uploadedDate}
      />
    </>
  );
};

export default QualityControl;
