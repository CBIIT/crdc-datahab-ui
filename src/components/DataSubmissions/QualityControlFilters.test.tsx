import React, { FC, useMemo } from "react";
import { render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { MemoryRouter } from "react-router-dom";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import QualityControlFilters from "./QualityControlFilters";
import {
  AGGREGATED_SUBMISSION_QC_RESULTS,
  SUBMISSION_STATS,
  LIST_BATCHES,
  AggregatedSubmissionQCResultsResp,
  AggregatedSubmissionQCResultsInput,
  ListBatchesResp,
  ListBatchesInput,
  SubmissionStatsResp,
  SubmissionStatsInput,
} from "../../graphql";
import {
  SubmissionContext,
  SubmissionCtxState,
  SubmissionCtxStatus,
} from "../Contexts/SubmissionContext";

const mockSubmission: Submission = {
  _id: "sub123",
  name: "Test Submission",
  submitterID: "user1",
  submitterName: "Test User",
  organization: { _id: "Org1", name: "Organization 1" },
  createdAt: "2021-01-01T00:00:00Z",
  updatedAt: "2021-01-02T00:00:00Z",
  status: "In Progress",
  dataCommons: "",
  modelVersion: "",
  studyID: "",
  studyAbbreviation: "",
  dbGaPID: "",
  bucketName: "",
  rootPath: "",
  metadataValidationStatus: "New",
  fileValidationStatus: "New",
  crossSubmissionStatus: "New",
  deletingData: false,
  archived: false,
  validationStarted: "",
  validationEnded: "",
  validationScope: "New",
  validationType: [],
  fileErrors: [],
  history: [],
  conciergeName: "",
  conciergeEmail: "",
  intention: "New/Update",
  dataType: "Metadata Only",
  otherSubmissions: "",
  nodeCount: 0,
  collaborators: [],
};

const defaultSubmissionContextValue: SubmissionCtxState = {
  data: {
    getSubmission: mockSubmission,
    submissionStats: null,
    batchStatusList: null,
  },
  status: undefined,
  error: undefined,
};

interface TestParentProps {
  submissionContextValue?: SubmissionCtxState;
  issueTypeProp?: string | null;
  isAggregated?: boolean;
  onChange?: jest.Mock;
  mocks?: MockedResponse[];
}

const TestParent: FC<TestParentProps> = ({
  submissionContextValue,
  issueTypeProp = null,
  isAggregated = false,
  onChange = jest.fn(),
  mocks = [],
}) => {
  const value = useMemo<SubmissionCtxState>(
    () => submissionContextValue || defaultSubmissionContextValue,
    [submissionContextValue]
  );

  return (
    <MemoryRouter>
      <MockedProvider mocks={mocks}>
        <SubmissionContext.Provider value={value}>
          <QualityControlFilters
            issueType={issueTypeProp}
            isAggregated={isAggregated}
            onChange={onChange}
          />
        </SubmissionContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  );
};

const issueTypesMock: MockedResponse<
  AggregatedSubmissionQCResultsResp,
  AggregatedSubmissionQCResultsInput
> = {
  request: {
    query: AGGREGATED_SUBMISSION_QC_RESULTS,
    variables: {
      submissionID: "sub123",
      partial: true,
      first: -1,
      orderBy: "title",
      sortDirection: "asc",
    },
    context: { clientName: "backend" },
  },
  result: {
    data: {
      aggregatedSubmissionQCResults: {
        total: 1,
        results: [
          {
            code: "ISSUE1",
            title: "Issue Title 1",
            count: 100,
            description: "",
            severity: "Error",
            __typename: "aggregatedQCResult", // Necessary or tests fail due to query fragments relying on type
          } as AggregatedQCResult,
        ],
      },
    },
  },
};

const batchDataMock: MockedResponse<ListBatchesResp, ListBatchesInput> = {
  request: {
    query: LIST_BATCHES,
    context: { clientName: "backend" },
  },
  variableMatcher: () => true,
  result: {
    data: {
      listBatches: {
        total: 1,
        batches: [
          {
            _id: "999",
            displayID: 1,
            createdAt: "",
            errors: [],
            fileCount: 1,
            files: [],
            status: "Uploaded",
            submissionID: "",
            type: "metadata",
            updatedAt: "",
            submitterName: "",
            __typename: "Batch",
          } as Batch,
        ],
      },
      batchStatusList: {
        batches: [],
      },
    },
  },
};

const submissionStatsMock: MockedResponse<SubmissionStatsResp, SubmissionStatsInput> = {
  request: {
    query: SUBMISSION_STATS,
    variables: { id: "sub123" },
    context: { clientName: "backend" },
  },
  result: {
    data: {
      submissionStats: {
        stats: [
          { nodeName: "SAMPLE", error: 2, warning: 0, new: 0, passed: 0, total: 2 },
          { nodeName: "FILE", error: 1, warning: 1, new: 0, passed: 0, total: 2 },
        ],
      },
    },
  },
};

const emptyIssueTypesMock: MockedResponse<
  AggregatedSubmissionQCResultsResp,
  AggregatedSubmissionQCResultsInput
> = {
  ...issueTypesMock,
  result: {
    data: {
      aggregatedSubmissionQCResults: {
        total: 0,
        results: [],
      },
    },
  },
};

const emptyBatchDataMock: MockedResponse<ListBatchesResp, ListBatchesInput> = {
  ...batchDataMock,
  result: {
    data: {
      listBatches: {
        total: 0,
        batches: [],
      },
      batchStatusList: {
        batches: [],
      },
    },
  },
};

const emptySubmissionStatsMock: MockedResponse<SubmissionStatsResp, SubmissionStatsInput> = {
  ...submissionStatsMock,
  result: {
    data: {
      submissionStats: {
        stats: [],
      },
    },
  },
};

describe("Acessibility", () => {
  it("has no axe violations", async () => {
    const { container, getByTestId } = render(
      <TestParent
        issueTypeProp={null}
        mocks={[issueTypesMock, batchDataMock, submissionStatsMock]}
      />
    );

    await waitFor(() => {
      expect(getByTestId("quality-control-filters")).toBeInTheDocument();
    });

    await waitFor(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

describe("QualityControlFilters", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders with no submissionID (queries skipped)", async () => {
    const onChange = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <TestParent
        onChange={onChange}
        submissionContextValue={{
          data: {
            getSubmission: null,
            submissionStats: null,
            batchStatusList: null,
          },
          status: SubmissionCtxStatus.LOADED,
          error: undefined,
        }}
      />
    );

    await waitFor(() => {
      expect(getByTestId("quality-control-filters")).toBeInTheDocument();
    });

    userEvent.click(getByTestId("quality-control-issueType-filter"));
    expect(queryByTestId("issueType-ISSUE1")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders defaults and triggers queries when submissionID is available", async () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <TestParent
        issueTypeProp={null}
        onChange={onChange}
        mocks={[issueTypesMock, batchDataMock, submissionStatsMock]}
      />
    );

    await waitFor(() => {
      expect(getByTestId("quality-control-filters")).toBeInTheDocument();
    });

    expect(onChange).not.toHaveBeenCalled();

    const issueTypeSelect = within(getByTestId("quality-control-issueType-filter")).getByRole(
      "button"
    );

    userEvent.click(issueTypeSelect);

    await waitFor(() => {
      const muiSelectList = within(getByTestId("quality-control-issueType-filter")).getByRole(
        "listbox",
        {
          hidden: true,
        }
      );
      expect(within(muiSelectList).getByTestId("issueType-ISSUE1")).toBeInTheDocument();
    });
  });

  it("updates issueType filter from prop if different", async () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <TestParent
        issueTypeProp="ISSUE1"
        onChange={onChange}
        mocks={[issueTypesMock, batchDataMock, submissionStatsMock]}
      />
    );

    await waitFor(() => {
      expect(getByTestId("quality-control-issueType-filter")).toHaveTextContent("Issue Title 1");
    });
  });

  it("does not update issueType if prop is null or same as current", async () => {
    const onChange = jest.fn();
    const { getByTestId, rerender } = render(
      <TestParent
        issueTypeProp={null}
        onChange={onChange}
        mocks={[issueTypesMock, batchDataMock, submissionStatsMock]}
      />
    );

    await waitFor(() => {
      expect(getByTestId("quality-control-issueType-filter")).toHaveTextContent("All");
    });

    rerender(
      <TestParent
        issueTypeProp="All"
        onChange={onChange}
        mocks={[issueTypesMock, batchDataMock, submissionStatsMock]}
      />
    );

    await waitFor(() => {
      expect(getByTestId("quality-control-issueType-filter")).toHaveTextContent("All");
    });
  });

  it("calls onChange after a filter is touched", async () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <TestParent
        onChange={onChange}
        mocks={[issueTypesMock, batchDataMock, submissionStatsMock]}
      />
    );

    await waitFor(() => {
      expect(getByTestId("quality-control-filters")).toBeInTheDocument();
    });

    const severitySelect = within(getByTestId("quality-control-severity-filter")).getByRole(
      "button"
    );
    const issueTypeSelect = within(getByTestId("quality-control-issueType-filter")).getByRole(
      "button"
    );
    const batchIDSelect = within(getByTestId("quality-control-batchID-filter")).getByRole("button");
    const nodeTypeSelect = within(getByTestId("quality-control-nodeType-filter")).getByRole(
      "button"
    );

    userEvent.click(severitySelect);

    await waitFor(() => {
      const muiSelectList = within(getByTestId("quality-control-severity-filter")).getByRole(
        "listbox",
        {
          hidden: true,
        }
      );
      expect(within(muiSelectList).getByTestId("severity-error")).toBeInTheDocument();
    });

    userEvent.click(getByTestId("severity-error"));

    userEvent.click(issueTypeSelect);

    await waitFor(() => {
      const muiSelectList = within(getByTestId("quality-control-issueType-filter")).getByRole(
        "listbox",
        {
          hidden: true,
        }
      );
      expect(within(muiSelectList).getByTestId("issueType-ISSUE1")).toBeInTheDocument();
    });

    userEvent.click(getByTestId("issueType-ISSUE1"));

    userEvent.click(batchIDSelect);

    await waitFor(() => {
      const muiSelectList = within(getByTestId("quality-control-batchID-filter")).getByRole(
        "listbox",
        {
          hidden: true,
        }
      );
      expect(within(muiSelectList).getByTestId("batchID-999")).toBeInTheDocument();
    });

    userEvent.click(getByTestId("batchID-999"));

    userEvent.click(nodeTypeSelect);

    await waitFor(() => {
      const muiSelectList = within(getByTestId("quality-control-nodeType-filter")).getByRole(
        "listbox",
        {
          hidden: true,
        }
      );
      expect(within(muiSelectList).getByTestId("nodeType-SAMPLE")).toBeInTheDocument();
    });

    userEvent.click(getByTestId("nodeType-SAMPLE"));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({
        issueType: "ISSUE1",
        nodeType: "SAMPLE",
        batchID: "999",
        severity: "Error",
      });
    });
  });

  it("displays batchIDs from query", async () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <TestParent
        onChange={onChange}
        mocks={[issueTypesMock, batchDataMock, submissionStatsMock]}
      />
    );

    userEvent.click(getByTestId("quality-control-batchID-filter"));

    const batchIDSelect = within(getByTestId("quality-control-batchID-filter")).getByRole("button");

    userEvent.click(batchIDSelect);

    await waitFor(() => {
      const muiSelectList = within(getByTestId("quality-control-batchID-filter")).getByRole(
        "listbox",
        {
          hidden: true,
        }
      );
      expect(within(muiSelectList).getByTestId("batchID-999")).toBeInTheDocument();
    });
  });

  it("displays nodeTypes from submissionStats", async () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <TestParent
        onChange={onChange}
        mocks={[issueTypesMock, batchDataMock, submissionStatsMock]}
      />
    );

    userEvent.click(getByTestId("quality-control-nodeType-filter"));

    const nodeTypeSelect = within(getByTestId("quality-control-nodeType-filter")).getByRole(
      "button"
    );

    userEvent.click(nodeTypeSelect);

    await waitFor(() => {
      const muiSelectList = within(getByTestId("quality-control-nodeType-filter")).getByRole(
        "listbox",
        {
          hidden: true,
        }
      );
      expect(within(muiSelectList).getByTestId("nodeType-SAMPLE")).toBeInTheDocument();
      expect(within(muiSelectList).getByTestId("nodeType-FILE")).toBeInTheDocument();
    });
  });

  it("only shows 'All' for empty issueTypes", async () => {
    const onChange = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <TestParent
        onChange={onChange}
        mocks={[emptyIssueTypesMock, batchDataMock, submissionStatsMock]}
      />
    );

    const issueTypeSelect = within(getByTestId("quality-control-issueType-filter")).getByRole(
      "button"
    );

    userEvent.click(issueTypeSelect);

    await waitFor(() => {
      const muiSelectList = within(getByTestId("quality-control-issueType-filter")).getByRole(
        "listbox",
        {
          hidden: true,
        }
      );
      expect(within(muiSelectList).getByTestId("issueType-all")).toBeInTheDocument();
    });

    expect(queryByTestId("issueType-ISSUE1")).not.toBeInTheDocument();
  });

  it("only shows 'All' for empty batches", async () => {
    const onChange = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <TestParent
        onChange={onChange}
        mocks={[issueTypesMock, emptyBatchDataMock, submissionStatsMock]}
      />
    );

    userEvent.click(getByTestId("quality-control-batchID-filter"));

    const batchIDSelect = within(getByTestId("quality-control-batchID-filter")).getByRole("button");

    userEvent.click(batchIDSelect);

    await waitFor(() => {
      const muiSelectList = within(getByTestId("quality-control-batchID-filter")).getByRole(
        "listbox",
        {
          hidden: true,
        }
      );
      expect(within(muiSelectList).getByTestId("batchID-all")).toBeInTheDocument();
    });

    expect(queryByTestId("batchID-999")).not.toBeInTheDocument();
  });

  it("only shows 'All' for nodeTypes if empty stats", async () => {
    const onChange = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <TestParent
        onChange={onChange}
        mocks={[issueTypesMock, batchDataMock, emptySubmissionStatsMock]}
      />
    );

    userEvent.click(getByTestId("quality-control-nodeType-filter"));

    const nodeTypeSelect = within(getByTestId("quality-control-nodeType-filter")).getByRole(
      "button"
    );

    userEvent.click(nodeTypeSelect);

    await waitFor(() => {
      const muiSelectList = within(getByTestId("quality-control-nodeType-filter")).getByRole(
        "listbox",
        {
          hidden: true,
        }
      );
      expect(within(muiSelectList).getByTestId("nodeType-all")).toBeInTheDocument();
    });

    expect(queryByTestId("nodeType-SAMPLE")).not.toBeInTheDocument();
    expect(queryByTestId("nodeType-FILE")).not.toBeInTheDocument();
  });

  it("displays only severity filter when table is in aggregated view", async () => {
    const onChange = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <TestParent
        onChange={onChange}
        mocks={[issueTypesMock, batchDataMock, submissionStatsMock]}
        isAggregated
      />
    );

    expect(getByTestId("quality-control-severity-filter")).toBeInTheDocument();
    expect(queryByTestId("quality-control-issueType-filter")).not.toBeInTheDocument();
    expect(queryByTestId("quality-control-batchID-filter")).not.toBeInTheDocument();
    expect(queryByTestId("quality-control-nodeType-filter")).not.toBeInTheDocument();
  });
});
