import { FC } from "react";
import { render, waitFor } from "@testing-library/react";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { axe } from "jest-axe";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import {
  Context as AuthCtx,
  ContextState as AuthCtxState,
  Status as AuthStatus,
} from "../Contexts/AuthContext";
import { CrossValidationButton } from "./CrossValidationButton";
import {
  VALIDATE_SUBMISSION,
  ValidateSubmissionInput,
  ValidateSubmissionResp,
} from "../../graphql";
import {
  SubmissionContext,
  SubmissionCtxState,
  SubmissionCtxStatus,
} from "../Contexts/SubmissionContext";

// NOTE: We omit all properties that the component specifically depends on
const baseSubmission: Omit<
  Submission,
  "_id" | "status" | "crossSubmissionStatus" | "otherSubmissions"
> = {
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
  fileErrors: [],
  history: [],
  conciergeName: "",
  conciergeEmail: "",
  createdAt: "",
  updatedAt: "",
  intention: "New/Update",
  dataType: "Metadata and Data Files",
  validationStarted: "",
  validationEnded: "",
  validationScope: "new",
  validationType: ["metadata", "file"],
};

const baseAuthCtx: AuthCtxState = {
  status: AuthStatus.LOADED,
  isLoggedIn: false,
  user: null,
};

const baseSubmissionCtx: SubmissionCtxState = {
  status: SubmissionCtxStatus.LOADING,
  data: null,
  error: null,
  startPolling: jest.fn(),
  stopPolling: jest.fn(),
  refetch: jest.fn(),
  updateQuery: jest.fn(),
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
  authCtxState?: AuthCtxState;
  submissionCtxState?: SubmissionCtxState;
  children: React.ReactNode;
};

const TestParent: FC<ParentProps> = ({
  authCtxState = baseAuthCtx,
  submissionCtxState = baseSubmissionCtx,
  mocks = [],
  children,
}: ParentProps) => (
  <AuthCtx.Provider value={authCtxState}>
    <SubmissionContext.Provider value={submissionCtxState}>
      <MockedProvider mocks={mocks} showWarnings>
        {children}
      </MockedProvider>
    </SubmissionContext.Provider>
  </AuthCtx.Provider>
);

describe("Accessibility", () => {
  it("should not have accessibility violations", async () => {
    const { container } = render(
      <TestParent authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Admin" } }}>
        <CrossValidationButton
          submission={{
            ...baseSubmission,
            _id: "example-sub-id",
            status: "Submitted",
            crossSubmissionStatus: "New",
            otherSubmissions: JSON.stringify({
              "In Progress": [],
              Submitted: ["submitted-id"],
            }),
          }}
        />
      </TestParent>
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("should not have accessibility violations (disabled)", async () => {
    const { container, getByTestId } = render(
      <TestParent authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Admin" } }}>
        <CrossValidationButton
          submission={{
            ...baseSubmission,
            _id: "example-sub-id",
            status: "Submitted",
            crossSubmissionStatus: null,
            otherSubmissions: JSON.stringify({
              "In Progress": [],
              // NOTE: this is needed otherwise the button won't render
              Submitted: ["submitted-id"],
            }),
          }}
          disabled
        />
      </TestParent>
    );

    expect(getByTestId("cross-validate-button")).toBeDisabled();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Basic Functionality", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should render without crashing", () => {
    render(
      <TestParent authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Admin" } }}>
        <CrossValidationButton
          submission={{
            ...baseSubmission,
            _id: "smoke-test-id",
            status: null,
            otherSubmissions: null,
            crossSubmissionStatus: null,
          }}
        />
      </TestParent>
    );
  });

  it("should initiate cross validation when clicked", async () => {
    const submissionID = "base-success-test-onclick-id";
    let called = false;
    const mocks: MockedResponse<ValidateSubmissionResp, ValidateSubmissionInput>[] = [
      {
        request: {
          query: VALIDATE_SUBMISSION,
          variables: {
            _id: submissionID,
            types: ["cross-submission"],
            scope: "all",
          },
        },
        result: () => {
          called = true;

          return {
            data: {
              validateSubmission: {
                success: true,
              },
            },
          };
        },
      },
    ];

    const { getByTestId } = render(
      <TestParent
        mocks={mocks}
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Admin" } }}
      >
        <CrossValidationButton
          submission={{
            ...baseSubmission,
            _id: submissionID,
            status: "Submitted",
            crossSubmissionStatus: "New",
            otherSubmissions: JSON.stringify({
              "In Progress": [],
              Submitted: ["submitted-id"],
            }),
          }}
        />
      </TestParent>
    );

    expect(called).toBe(false);

    userEvent.click(getByTestId("cross-validate-button"));

    await waitFor(() => {
      expect(called).toBe(true);
      expect(global.mockEnqueue).toHaveBeenCalledWith(
        "Validation process is starting; this may take some time. Please wait before initiating another validation.",
        {
          variant: "success",
        }
      );
      expect(getByTestId("cross-validate-button")).toBeDisabled();
    });
  });

  it("should handle API network errors gracefully", async () => {
    const submissionID = "base-network-error-test-id";
    const mocks: MockedResponse<ValidateSubmissionResp, ValidateSubmissionInput>[] = [
      {
        request: {
          query: VALIDATE_SUBMISSION,
        },
        variableMatcher: () => true,
        error: new Error("Mock network error"),
      },
    ];

    const { getByTestId } = render(
      <TestParent
        mocks={mocks}
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Admin" } }}
      >
        <CrossValidationButton
          submission={{
            ...baseSubmission,
            _id: submissionID,
            status: "Submitted",
            crossSubmissionStatus: "New",
            otherSubmissions: JSON.stringify({
              "In Progress": [],
              Submitted: ["submitted-id"],
            }),
          }}
        />
      </TestParent>
    );

    userEvent.click(getByTestId("cross-validate-button"));

    await waitFor(() => {
      expect(global.mockEnqueue).toHaveBeenCalledWith("Unable to initiate validation process.", {
        variant: "error",
      });
      expect(getByTestId("cross-validate-button")).toBeEnabled();
    });
  });

  it("should handle API GraphQL errors gracefully", async () => {
    const submissionID = "base-GraphQL-error-test-id";
    const mocks: MockedResponse<ValidateSubmissionResp, ValidateSubmissionInput>[] = [
      {
        request: {
          query: VALIDATE_SUBMISSION,
        },
        variableMatcher: () => true,
        result: {
          errors: [new GraphQLError("Mock GraphQL error")],
        },
      },
    ];

    const { getByTestId } = render(
      <TestParent
        mocks={mocks}
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Admin" } }}
      >
        <CrossValidationButton
          submission={{
            ...baseSubmission,
            _id: submissionID,
            status: "Submitted",
            crossSubmissionStatus: "New",
            otherSubmissions: JSON.stringify({
              "In Progress": [],
              Submitted: ["submitted-id"],
            }),
          }}
        />
      </TestParent>
    );

    userEvent.click(getByTestId("cross-validate-button"));

    await waitFor(() => {
      expect(global.mockEnqueue).toHaveBeenCalledWith("Unable to initiate validation process.", {
        variant: "error",
      });
      expect(getByTestId("cross-validate-button")).toBeEnabled();
    });
  });
});

describe("Implementation Requirements", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should be named 'Cross Validate'", () => {
    const { getByText } = render(
      <TestParent authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Admin" } }}>
        <CrossValidationButton
          submission={{
            ...baseSubmission,
            _id: "example-sub-id",
            status: "Submitted",
            crossSubmissionStatus: "New",
            otherSubmissions: JSON.stringify({
              "In Progress": [],
              Submitted: ["submitted-id"],
            }),
          }}
        />
      </TestParent>
    );

    expect(getByText("Cross Validate")).toBeInTheDocument();
  });

  it("should render as disabled with text 'Validating...' when the submission is validating", () => {
    const { getByTestId } = render(
      <TestParent authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Admin" } }}>
        <CrossValidationButton
          submission={{
            ...baseSubmission,
            _id: "validating-test-id",
            status: "Submitted",
            crossSubmissionStatus: "Validating",
            otherSubmissions: JSON.stringify({
              "In Progress": ["some-other-id"],
              Submitted: ["submitted-id"],
            }),
          }}
        />
      </TestParent>
    );

    expect(getByTestId("cross-validate-button")).toBeDisabled();
    expect(getByTestId("cross-validate-button")).toHaveTextContent("Validating...");
  });

  it("should update back to the default text when the submission is no longer validating", () => {
    const submission: Submission = {
      ...baseSubmission,
      _id: "validating-test-id",
      status: "Submitted",
      crossSubmissionStatus: "Validating",
      otherSubmissions: JSON.stringify({
        "In Progress": [],
        Submitted: ["submitted-id"],
      }),
    };

    const { getByTestId, rerender } = render(
      <TestParent authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Admin" } }}>
        <CrossValidationButton submission={submission} />
      </TestParent>
    );

    expect(getByTestId("cross-validate-button")).toBeDisabled();
    expect(getByTestId("cross-validate-button")).toHaveTextContent("Validating...");

    rerender(
      <TestParent authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Admin" } }}>
        <CrossValidationButton
          submission={{
            ...submission,
            crossSubmissionStatus: "Passed",
          }}
        />
      </TestParent>
    );

    expect(getByTestId("cross-validate-button")).toBeEnabled();
    expect(getByTestId("cross-validate-button")).toHaveTextContent(/validate/i);
  });

  it("should be enabled only if there are other related Submitted submissions", () => {
    const { getByTestId } = render(
      <TestParent authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Admin" } }}>
        <CrossValidationButton
          submission={{
            ...baseSubmission,
            _id: "validating-test-id",
            status: "Submitted",
            crossSubmissionStatus: "New",
            otherSubmissions: JSON.stringify({
              "In Progress": [],
              Submitted: ["submitted-id", "another-submitted-id"],
            }),
          }}
        />
      </TestParent>
    );

    expect(getByTestId("cross-validate-button")).toBeInTheDocument();
    expect(getByTestId("cross-validate-button")).toBeEnabled();
  });

  it("should be HIDDEN if there are no other related Submitted submissions", () => {
    const { getByTestId } = render(
      <TestParent authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Admin" } }}>
        <CrossValidationButton
          submission={{
            ...baseSubmission,
            _id: "validating-test-id",
            status: "Submitted",
            crossSubmissionStatus: "New",
            otherSubmissions: JSON.stringify({
              "In Progress": ["in-prog-id", "another-in-prog-id"],
              Submitted: [], // NOTE: This disables the button
            }),
          }}
        />
      </TestParent>
    );

    expect(() => getByTestId("cross-validate-button")).toThrow();
  });

  it.each<CrossSubmissionStatus>(["Passed", "Error"])(
    "should not be disabled based on the crossSubmissionStatus (checking '%s')",
    (status) => {
      const { getByTestId } = render(
        <TestParent authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Admin" } }}>
          <CrossValidationButton
            submission={{
              ...baseSubmission,
              _id: `not-disabled-assertion-${status}-id`,
              status: "Submitted",
              crossSubmissionStatus: status,
              otherSubmissions: JSON.stringify({
                "In Progress": ["submitted-id", "another-submitted-id"],
                Submitted: ["submitted-id", "another-submitted-id"],
              }),
            }}
          />
        </TestParent>
      );

      expect(getByTestId("cross-validate-button")).toBeInTheDocument();
      expect(getByTestId("cross-validate-button")).toBeEnabled();
    }
  );

  it.each<User["role"]>(["Data Curator", "Admin"])(
    "should always render for the role %s with Other Submissions present",
    (role) => {
      const { getByTestId } = render(
        <TestParent authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role } }}>
          <CrossValidationButton
            submission={{
              ...baseSubmission,
              status: "Submitted",
              _id: `render-role-test-${role}-id`,
              crossSubmissionStatus: null,
              otherSubmissions: JSON.stringify({
                "In Progress": [],
                Submitted: ["submitted-id", "another-submitted-id"],
              }),
            }}
          />
        </TestParent>
      );

      expect(getByTestId("cross-validate-button")).toBeInTheDocument();
    }
  );

  it.each<User["role"]>([
    "Submitter",
    "Organization Owner",
    "Federal Lead",
    "Data Commons POC",
    "fake role" as User["role"],
  ])("should never render for the role %s", (role) => {
    const { getByTestId } = render(
      <TestParent authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role } }}>
        <CrossValidationButton
          submission={{
            ...baseSubmission,
            _id: `role-test-${role}-id`,
            status: "Submitted",
            crossSubmissionStatus: null,
            otherSubmissions: JSON.stringify({
              "In Progress": [],
              // NOTE: Even with these values, the button should not render
              Submitted: ["submitted-id", "another-submitted-id"],
            }),
          }}
        />
      </TestParent>
    );

    expect(() => getByTestId("cross-validate-button")).toThrow();
  });

  it("should only be enabled for the Submission status of 'Submitted'", () => {
    const { getByTestId } = render(
      <TestParent authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Admin" } }}>
        <CrossValidationButton
          submission={{
            ...baseSubmission,
            _id: "render-status-test-Submitted-id",
            status: "Submitted",
            crossSubmissionStatus: "New",
            otherSubmissions: JSON.stringify({
              "In Progress": [],
              Submitted: ["this-enables-the-button"],
            }),
          }}
        />
      </TestParent>
    );

    expect(getByTestId("cross-validate-button")).toBeInTheDocument();
    expect(getByTestId("cross-validate-button")).toBeEnabled();
  });

  it.each<Submission["status"]>([
    "New",
    "In Progress",
    "Withdrawn",
    "Released",
    "Completed",
    "Archived",
    "Canceled",
    "fake status" as Submission["status"],
  ])("should never be visible for the Submission status of '%s'", (status) => {
    const { getByTestId } = render(
      <TestParent authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Admin" } }}>
        <CrossValidationButton
          submission={{
            ...baseSubmission,
            _id: `render-status-test-${status}-id`,
            status,
            crossSubmissionStatus: "New",
            otherSubmissions: JSON.stringify({
              "In Progress": [],
              Submitted: ["this-enables-the-button"],
            }),
          }}
        />
      </TestParent>
    );

    expect(() => getByTestId("cross-validate-button")).toThrow();
  });
});
