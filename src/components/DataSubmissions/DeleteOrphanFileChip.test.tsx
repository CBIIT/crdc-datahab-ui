import { FC } from "react";
import { GraphQLError } from "graphql";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Context, ContextState, Status as AuthStatus } from "../Contexts/AuthContext";
import DeleteOrphanFileChip from "./DeleteOrphanFileChip";
import { DELETE_ORPHANED_FILE } from "../../graphql";

const baseSubmission: Submission = {
  _id: "submission-id",
  name: "",
  submitterID: "",
  submitterName: "",
  organization: null,
  dataCommons: "",
  modelVersion: "",
  studyAbbreviation: "",
  dbGaPID: "",
  bucketName: "",
  rootPath: "",
  metadataValidationStatus: "Passed",
  fileValidationStatus: "Passed",
  fileErrors: [
    {
      batchID: "",
      submissionID: "",
      type: "",
      validationType: "metadata",
      displayID: 0,
      submittedID: "mock-file-name",
      severity: "Error",
      uploadedDate: "",
      validatedDate: "",
      errors: [],
      warnings: [],
    },
  ],
  history: [],
  conciergeName: "",
  conciergeEmail: "",
  createdAt: "",
  updatedAt: "",
  intention: "New/Update",
  dataType: "Metadata and Data Files",
  status: "In Progress",
  crossSubmissionStatus: "Passed",
  otherSubmissions: "",
  archived: false,
  validationStarted: "",
  validationEnded: "",
  validationScope: "New",
  validationType: ["metadata", "file"],
  studyID: "",
  deletingData: false,
  nodeCount: 0,
  collaborators: [],
};

const baseContext: ContextState = {
  status: AuthStatus.LOADED,
  isLoggedIn: false,
  user: null,
};

const baseUser: Omit<User, "role"> = {
  _id: "",
  firstName: "",
  lastName: "",
  userStatus: "Active",
  IDP: "nih",
  email: "",
  organization: null,
  studies: null,
  dataCommons: [],
  createdAt: "",
  updateAt: "",
};

type ParentProps = {
  mocks?: MockedResponse[];
  context?: ContextState;
  children: React.ReactNode;
};

const TestParent: FC<ParentProps> = ({
  context = baseContext,
  mocks = [],
  children,
}: ParentProps) => (
  <Context.Provider value={context}>
    <MockedProvider mocks={mocks} showWarnings>
      {children}
    </MockedProvider>
  </Context.Provider>
);

const successMocks: MockedResponse[] = [
  {
    request: {
      query: DELETE_ORPHANED_FILE,
      variables: { _id: "submission-id", fileName: "mock-file-name" },
    },
    result: {
      data: {
        deleteOrphanedFile: { success: true },
      },
    },
  },
];

const failureMocks: MockedResponse[] = [
  {
    request: {
      query: DELETE_ORPHANED_FILE,
      variables: { _id: "submission-id", fileName: "mock-file-name" },
    },
    error: new Error("Unable to delete orphan file."),
  },
];

const graphqlErrorMocks: MockedResponse[] = [
  {
    request: {
      query: DELETE_ORPHANED_FILE,
      variables: { _id: "submission-id", fileName: "mock-file-name" },
    },
    error: new GraphQLError("Mock GraphQL error"),
  },
];

const failureMocksSuccessFalse: MockedResponse[] = [
  {
    request: {
      query: DELETE_ORPHANED_FILE,
      variables: { _id: "submission-id", fileName: "mock-file-name" },
    },
    result: {
      data: {
        deleteOrphanedFile: { success: false },
      },
    },
  },
];

describe("DeleteOrphanFileChip Component", () => {
  const onDeleteFile = jest.fn();

  beforeEach(() => {
    onDeleteFile.mockReset();
  });

  it("should render default chip with label and icon", () => {
    const { getByTestId } = render(
      <TestParent context={{ ...baseContext, user: { ...baseUser, role: "Admin" } }}>
        <DeleteOrphanFileChip
          submission={baseSubmission}
          submittedID="mock-file-name"
          onDeleteFile={onDeleteFile}
        />
      </TestParent>
    );

    expect(getByTestId("delete-orphaned-file-icon")).toBeDefined();
    expect(screen.getByText("Delete orphaned file")).toBeInTheDocument();
    expect(getByTestId("delete-orphaned-file-chip")).not.toHaveAttribute("aria-disabled");
    expect(getByTestId("delete-orphaned-file-chip")).not.toHaveClass("Mui-disabled");
  });

  it("should disable the button when in loading state", async () => {
    const { getByTestId } = render(
      <TestParent
        context={{ ...baseContext, user: { ...baseUser, role: "Admin" } }}
        mocks={successMocks}
      >
        <DeleteOrphanFileChip
          submission={baseSubmission}
          submittedID="mock-file-name"
          onDeleteFile={onDeleteFile}
        />
      </TestParent>
    );

    userEvent.click(getByTestId("delete-orphaned-file-chip"));

    expect(getByTestId("delete-orphaned-file-chip")).toHaveAttribute("aria-disabled");
    expect(getByTestId("delete-orphaned-file-chip")).toHaveClass("Mui-disabled");

    await waitFor(() => {
      expect(onDeleteFile).toHaveBeenCalledWith(true);
    });
  });

  it("should disable the button when disabled prop is passed", () => {
    const { getByTestId } = render(
      <TestParent
        context={{ ...baseContext, user: { ...baseUser, role: "Admin" } }}
        mocks={successMocks}
      >
        <DeleteOrphanFileChip
          submission={baseSubmission}
          submittedID="mock-file-name"
          onDeleteFile={onDeleteFile}
          disabled
        />
      </TestParent>
    );

    expect(getByTestId("delete-orphaned-file-chip")).toHaveAttribute("aria-disabled");
    expect(getByTestId("delete-orphaned-file-chip")).toHaveClass("Mui-disabled");
  });

  it("should call onDeleteFile with true on successful mutation", async () => {
    const { getByTestId } = render(
      <TestParent
        context={{ ...baseContext, user: { ...baseUser, role: "Admin" } }}
        mocks={successMocks}
      >
        <DeleteOrphanFileChip
          submission={baseSubmission}
          submittedID="mock-file-name"
          onDeleteFile={onDeleteFile}
        />
      </TestParent>
    );

    userEvent.click(getByTestId("delete-orphaned-file-chip"));

    await waitFor(() => {
      expect(onDeleteFile).toHaveBeenCalledWith(true);
    });
  });

  it("should call onDeleteFile with true and show message on success mutation", async () => {
    const { getByTestId } = render(
      <TestParent
        context={{ ...baseContext, user: { ...baseUser, role: "Admin" } }}
        mocks={successMocks}
      >
        <DeleteOrphanFileChip
          submission={baseSubmission}
          submittedID="mock-file-name"
          onDeleteFile={onDeleteFile}
        />
      </TestParent>
    );

    userEvent.click(getByTestId("delete-orphaned-file-chip"));

    await waitFor(() => {
      expect(onDeleteFile).toHaveBeenCalledWith(true);
      expect(global.mockEnqueue).toHaveBeenCalledWith(
        "The orphaned file has been successfully deleted.",
        {
          variant: "success",
        }
      );
    });
  });

  it("should call onDeleteFile with false and show error message on failed mutation", async () => {
    const { getByTestId } = render(
      <TestParent
        context={{ ...baseContext, user: { ...baseUser, role: "Admin" } }}
        mocks={failureMocks}
      >
        <DeleteOrphanFileChip
          submission={baseSubmission}
          submittedID="mock-file-name"
          onDeleteFile={onDeleteFile}
        />
      </TestParent>
    );

    userEvent.click(getByTestId("delete-orphaned-file-chip"));

    await waitFor(() => {
      expect(onDeleteFile).toHaveBeenCalledWith(false);
      expect(global.mockEnqueue).toHaveBeenCalledWith(
        "There was an issue deleting orphaned file.",
        {
          variant: "error",
        }
      );
    });
  });

  it("should call onDeleteFile with false and show error message on graphql error", async () => {
    const { getByTestId } = render(
      <TestParent
        context={{ ...baseContext, user: { ...baseUser, role: "Admin" } }}
        mocks={graphqlErrorMocks}
      >
        <DeleteOrphanFileChip
          submission={baseSubmission}
          submittedID="mock-file-name"
          onDeleteFile={onDeleteFile}
        />
      </TestParent>
    );

    userEvent.click(getByTestId("delete-orphaned-file-chip"));

    await waitFor(() => {
      expect(onDeleteFile).toHaveBeenCalledWith(false);
      expect(global.mockEnqueue).toHaveBeenCalledWith(
        "There was an issue deleting orphaned file.",
        {
          variant: "error",
        }
      );
    });
  });

  it("should call onDeleteFile with false and show error message on success false", async () => {
    const { getByTestId } = render(
      <TestParent
        context={{ ...baseContext, user: { ...baseUser, role: "Admin" } }}
        mocks={failureMocksSuccessFalse}
      >
        <DeleteOrphanFileChip
          submission={baseSubmission}
          submittedID="mock-file-name"
          onDeleteFile={onDeleteFile}
        />
      </TestParent>
    );

    userEvent.click(getByTestId("delete-orphaned-file-chip"));

    await waitFor(() => {
      expect(onDeleteFile).toHaveBeenCalledWith(false);
      expect(global.mockEnqueue).toHaveBeenCalledWith(
        "There was an issue deleting orphaned file.",
        {
          variant: "error",
        }
      );
    });
  });

  it("should never render when not an orphan file", async () => {
    const { getByTestId } = render(
      <TestParent
        context={{ ...baseContext, user: { ...baseUser, role: "Admin" } }}
        mocks={failureMocks}
      >
        <DeleteOrphanFileChip
          submission={{ ...baseSubmission, fileErrors: [] }}
          submittedID="mock-file-name"
          onDeleteFile={onDeleteFile}
        />
      </TestParent>
    );

    expect(() => getByTestId("delete-orphaned-file-chip")).toThrow();
    expect(() => getByTestId("delete-orphaned-file-icon")).toThrow();
  });

  it.each<User["role"]>(["Federal Lead", "Data Commons POC", "fake role" as User["role"]])(
    "should disable for the role %s",
    (role) => {
      const { getByTestId } = render(
        <TestParent context={{ ...baseContext, user: { ...baseUser, role } }} mocks={failureMocks}>
          <DeleteOrphanFileChip
            submission={baseSubmission}
            submittedID="mock-file-name"
            onDeleteFile={onDeleteFile}
          />
        </TestParent>
      );

      expect(getByTestId("delete-orphaned-file-chip")).toHaveAttribute("aria-disabled");
      expect(getByTestId("delete-orphaned-file-chip")).toHaveClass("Mui-disabled");
    }
  );
});
