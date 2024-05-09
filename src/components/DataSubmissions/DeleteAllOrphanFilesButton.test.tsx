import { FC } from "react";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Context, ContextState, Status as AuthStatus } from "../Contexts/AuthContext";
import { DELETE_ALL_EXTRA_FILES } from "../../graphql";
import DeleteAllOrphanFilesButton from "./DeleteAllOrphanFilesButton";

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
  intention: "New",
  status: "In Progress",
  crossSubmissionStatus: "Passed",
  otherSubmissions: "",
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
      query: DELETE_ALL_EXTRA_FILES,
      variables: { _id: "submission-id" },
    },
    result: {
      data: {
        deleteAllExtraFiles: { success: true },
      },
    },
  },
];

const failureMocks: MockedResponse[] = [
  {
    request: {
      query: DELETE_ALL_EXTRA_FILES,
      variables: { _id: "submission-id" },
    },
    error: new Error("Unable to delete orphan file."),
  },
];

describe("DeleteAllOrphanFilesButton Component", () => {
  const onDelete = jest.fn();

  beforeEach(() => {
    onDelete.mockReset();
  });

  it("should render default chip with label and icon", () => {
    const { getByTestId } = render(
      <TestParent context={{ ...baseContext, user: { ...baseUser, role: "Admin" } }}>
        <DeleteAllOrphanFilesButton submission={baseSubmission} onDelete={onDelete} />
      </TestParent>
    );

    expect(getByTestId("delete-all-orphan-files-icon")).toBeDefined();
    expect(getByTestId("delete-all-orphan-files-button")).not.toBeDisabled();
  });

  it("should open delete dialog when the button when is clicked", async () => {
    const { getByTestId } = render(
      <TestParent
        context={{ ...baseContext, user: { ...baseUser, role: "Admin" } }}
        mocks={successMocks}
      >
        <DeleteAllOrphanFilesButton submission={baseSubmission} onDelete={onDelete} />
      </TestParent>
    );

    userEvent.click(getByTestId("delete-all-orphan-files-button"));

    await waitFor(() => {
      expect(screen.getByText("Delete All Orphaned Files")).toBeInTheDocument();
    });
  });

  it("should disable the button when in loading state", async () => {
    const { getByTestId } = render(
      <TestParent
        context={{ ...baseContext, user: { ...baseUser, role: "Admin" } }}
        mocks={successMocks}
      >
        <DeleteAllOrphanFilesButton submission={baseSubmission} onDelete={onDelete} />
      </TestParent>
    );

    userEvent.click(getByTestId("delete-all-orphan-files-button"));

    await waitFor(() => {
      expect(screen.getByText("Delete All Orphaned Files")).toBeInTheDocument();
    });

    userEvent.click(getByTestId("delete-dialog-confirm-button"));

    expect(getByTestId("delete-all-orphan-files-button")).toBeDisabled();
  });

  it("should disable the button when disabled prop is passed", () => {
    const { getByTestId } = render(
      <TestParent
        context={{ ...baseContext, user: { ...baseUser, role: "Admin" } }}
        mocks={successMocks}
      >
        <DeleteAllOrphanFilesButton submission={baseSubmission} onDelete={onDelete} disabled />
      </TestParent>
    );

    expect(getByTestId("delete-all-orphan-files-button")).toBeDisabled();
  });

  it("should call onDelete with true on successful mutation", async () => {
    const { getByTestId } = render(
      <TestParent
        context={{ ...baseContext, user: { ...baseUser, role: "Admin" } }}
        mocks={successMocks}
      >
        <DeleteAllOrphanFilesButton submission={baseSubmission} onDelete={onDelete} />
      </TestParent>
    );

    userEvent.click(getByTestId("delete-all-orphan-files-button"));

    await waitFor(() => {
      expect(screen.getByText("Delete All Orphaned Files")).toBeInTheDocument();
    });

    userEvent.click(getByTestId("delete-dialog-confirm-button"));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(true);
    });
  });

  it("should call onDelete with true and show message on success mutation", async () => {
    const { getByTestId } = render(
      <TestParent
        context={{ ...baseContext, user: { ...baseUser, role: "Admin" } }}
        mocks={successMocks}
      >
        <DeleteAllOrphanFilesButton submission={baseSubmission} onDelete={onDelete} />
      </TestParent>
    );

    userEvent.click(getByTestId("delete-all-orphan-files-button"));

    await waitFor(() => {
      expect(screen.getByText("Delete All Orphaned Files")).toBeInTheDocument();
    });

    userEvent.click(getByTestId("delete-dialog-confirm-button"));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(true);
      expect(global.mockEnqueue).toHaveBeenCalledWith(
        "All orphaned files have been successfully deleted.",
        {
          variant: "success",
        }
      );
    });
  });

  it("should call onDelete with false and show error message on failed mutation", async () => {
    const { getByTestId } = render(
      <TestParent
        context={{ ...baseContext, user: { ...baseUser, role: "Admin" } }}
        mocks={failureMocks}
      >
        <DeleteAllOrphanFilesButton submission={baseSubmission} onDelete={onDelete} />
      </TestParent>
    );

    userEvent.click(getByTestId("delete-all-orphan-files-button"));

    await waitFor(() => {
      expect(screen.getByText("Delete All Orphaned Files")).toBeInTheDocument();
    });

    userEvent.click(getByTestId("delete-dialog-confirm-button"));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(false);
      expect(global.mockEnqueue).toHaveBeenCalledWith(
        "There was an issue deleting all orphaned files.",
        {
          variant: "error",
        }
      );
    });
  });

  it("should disable when submission has no fileErrors", async () => {
    const { getByTestId } = render(
      <TestParent
        context={{ ...baseContext, user: { ...baseUser, role: "Admin" } }}
        mocks={failureMocks}
      >
        <DeleteAllOrphanFilesButton
          submission={{ ...baseSubmission, fileErrors: [] }}
          onDelete={onDelete}
        />
      </TestParent>
    );

    expect(getByTestId("delete-all-orphan-files-button")).toBeDisabled();
  });

  it.each<User["role"]>(["Federal Lead", "Data Commons POC", "fake role" as User["role"]])(
    "should disable for the role %s",
    (role) => {
      const { getByTestId } = render(
        <TestParent context={{ ...baseContext, user: { ...baseUser, role } }} mocks={failureMocks}>
          <DeleteAllOrphanFilesButton submission={baseSubmission} onDelete={onDelete} />
        </TestParent>
      );

      expect(getByTestId("delete-all-orphan-files-button")).toBeDisabled();
    }
  );

  it("should show tooltip when hovering over icon button", async () => {
    const { getByTestId } = render(
      <TestParent
        context={{ ...baseContext, user: { ...baseUser, role: "Admin" } }}
        mocks={successMocks}
      >
        <DeleteAllOrphanFilesButton submission={{ ...baseSubmission }} onDelete={onDelete} />
      </TestParent>
    );

    const iconButton = getByTestId("delete-all-orphan-files-button");
    userEvent.hover(iconButton);

    await waitFor(() => {
      expect(screen.getByText("Delete All Orphaned Files")).toBeVisible();
      expect(getByTestId("delete-all-orphaned-files-tooltip")).toBeInTheDocument();
    });
  });

  it("should hide tooltip when unhovering over icon button", async () => {
    const { getByTestId } = render(
      <TestParent
        context={{ ...baseContext, user: { ...baseUser, role: "Admin" } }}
        mocks={successMocks}
      >
        <DeleteAllOrphanFilesButton submission={{ ...baseSubmission }} onDelete={onDelete} />
      </TestParent>
    );

    const iconButton = getByTestId("delete-all-orphan-files-button");
    userEvent.hover(iconButton);

    await waitFor(() => {
      expect(screen.getByText("Delete All Orphaned Files")).toBeVisible();
      expect(getByTestId("delete-all-orphaned-files-tooltip")).toBeInTheDocument();
    });

    userEvent.unhover(iconButton);

    await waitFor(() => {
      expect(screen.getByText("Delete All Orphaned Files")).not.toBeVisible();
    });
  });
});
