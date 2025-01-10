import { FC, useMemo } from "react";
import { getByLabelText, render, waitFor } from "@testing-library/react";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { axe } from "jest-axe";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import {
  Context as AuthCtx,
  ContextState as AuthCtxState,
  Status as AuthStatus,
} from "../Contexts/AuthContext";
import ValidationControls from "./ValidationControls";
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
  "_id" | "status" | "metadataValidationStatus" | "fileValidationStatus"
> = {
  name: "",
  submitterID: "current-user",
  submitterName: "",
  organization: null,
  dataCommons: "",
  modelVersion: "",
  studyAbbreviation: "",
  dbGaPID: "",
  bucketName: "",
  rootPath: "",
  crossSubmissionStatus: null,
  fileErrors: [],
  history: [],
  otherSubmissions: null,
  conciergeName: "",
  conciergeEmail: "",
  createdAt: "",
  updatedAt: "",
  intention: "New/Update",
  dataType: "Metadata and Data Files",
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
  _id: "current-user",
  firstName: "",
  lastName: "",
  userStatus: "Active",
  IDP: "nih",
  email: "",
  studies: null,
  dataCommons: [],
  createdAt: "",
  updateAt: "",
  permissions: ["data_submission:view", "data_submission:create"],
  notifications: [],
};

type ParentProps = {
  mocks?: MockedResponse[];
  authCtxState?: AuthCtxState;
  submissionCtxState?: Pick<SubmissionCtxState, "startPolling" | "stopPolling" | "refetch">;
  submission: Submission;
  children: React.ReactNode;
};

const TestParent: FC<ParentProps> = ({
  submission,
  authCtxState = baseAuthCtx,
  submissionCtxState,
  mocks = [],
  children,
}: ParentProps) => {
  const value = useMemo<SubmissionCtxState>(
    () => ({
      ...baseSubmissionCtx,
      ...submissionCtxState,
      data: {
        getSubmission: { ...submission },
        submissionStats: { stats: [] },
        batchStatusList: { batches: [] },
      },
    }),
    [submissionCtxState, submission]
  );

  return (
    <AuthCtx.Provider value={authCtxState}>
      <SubmissionContext.Provider value={value}>
        <MockedProvider mocks={mocks} showWarnings>
          {children}
        </MockedProvider>
      </SubmissionContext.Provider>
    </AuthCtx.Provider>
  );
};

describe("Accessibility", () => {
  it("should not have accessibility violations", async () => {
    const { container } = render(
      <TestParent
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={{
          ...baseSubmission,
          _id: "example-sub-id",
          status: "In Progress",
          metadataValidationStatus: "New",
          fileValidationStatus: "New",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("should not have accessibility violations (disabled)", async () => {
    const { container } = render(
      <TestParent
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={{
          ...baseSubmission,
          _id: "example-sub-id-disabled",
          status: "Submitted", // NOTE: This disables the entire component
          metadataValidationStatus: "Passed",
          fileValidationStatus: "Passed",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Basic Functionality", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should render without crashing", () => {
    render(
      <TestParent
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={null}
      >
        <ValidationControls />
      </TestParent>
    );
  });

  it("should show a success snackbar when validation is successful", async () => {
    const submissionID = "base-success-test-onclick-id";
    let called = false;
    const mocks: MockedResponse<ValidateSubmissionResp, ValidateSubmissionInput>[] = [
      {
        request: {
          query: VALIDATE_SUBMISSION,
        },
        variableMatcher: () => true,
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
        authCtxState={{
          ...baseAuthCtx,
          user: {
            ...baseUser,
            role: "Submitter",
            permissions: ["data_submission:view", "data_submission:create"],
          },
        }}
        submission={{
          ...baseSubmission,
          _id: submissionID,
          submitterID: "current-user",
          status: "In Progress",
          metadataValidationStatus: "New",
          fileValidationStatus: "New",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    expect(called).toBe(false);

    userEvent.click(getByTestId("validate-controls-validate-button"));

    await waitFor(() => {
      expect(called).toBe(true);
      expect(global.mockEnqueue).toHaveBeenCalledWith(
        "Validation process is starting; this may take some time. Please wait before initiating another validation.",
        {
          variant: "success",
        }
      );
    });
  });

  it("should initiate Metadata validation when 'Validate Metadata' is selected", async () => {
    const submissionID = "base-onclick-metadata-id";
    let called = false;
    const mocks: MockedResponse<ValidateSubmissionResp, ValidateSubmissionInput>[] = [
      {
        request: {
          query: VALIDATE_SUBMISSION,
          variables: {
            _id: submissionID,
            types: ["metadata"],
            scope: "New",
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
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={{
          ...baseSubmission,
          _id: submissionID,
          status: "In Progress",
          metadataValidationStatus: "New",
          fileValidationStatus: null,
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    expect(called).toBe(false);

    const radio = getByTestId("validate-controls-validation-type") as HTMLInputElement;

    userEvent.click(getByLabelText(radio, "Validate Metadata"));

    userEvent.click(getByTestId("validate-controls-validate-button"));

    await waitFor(() => {
      expect(called).toBe(true);
    });
  });

  it("should initiate Data Files validation when 'Validate Data Files' is selected", async () => {
    const submissionID = "data-files-validation-id";
    let called = false;
    const mocks: MockedResponse<ValidateSubmissionResp, ValidateSubmissionInput>[] = [
      {
        request: {
          query: VALIDATE_SUBMISSION,
          variables: {
            _id: submissionID,
            types: ["file"],
            scope: "New",
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
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={{
          ...baseSubmission,
          _id: submissionID,
          status: "In Progress",
          metadataValidationStatus: null,
          fileValidationStatus: "New",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    expect(called).toBe(false);

    const radio = getByTestId("validate-controls-validation-type") as HTMLInputElement;
    userEvent.click(getByLabelText(radio, "Validate Data Files"));

    userEvent.click(getByTestId("validate-controls-validate-button"));

    await waitFor(() => {
      expect(called).toBe(true);
    });
  });

  it("should initiate Metadata and Data Files validation when 'Both' is selected", async () => {
    const submissionID = "metadata-and-files-validation-id";
    let called = false;
    const mocks: MockedResponse<ValidateSubmissionResp, ValidateSubmissionInput>[] = [
      {
        request: {
          query: VALIDATE_SUBMISSION,
          variables: {
            _id: submissionID,
            types: ["metadata", "file"],
            scope: "New",
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
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={{
          ...baseSubmission,
          _id: submissionID,
          status: "In Progress",
          metadataValidationStatus: "New",
          fileValidationStatus: "New",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    expect(called).toBe(false);

    const radio = getByTestId("validate-controls-validation-type") as HTMLInputElement;
    userEvent.click(getByLabelText(radio, "Both"));

    userEvent.click(getByTestId("validate-controls-validate-button"));

    await waitFor(() => {
      expect(called).toBe(true);
    });
  });

  it("should initiate against 'New' files when 'New Uploaded Data' is selected", async () => {
    const submissionID = "new-uploads-validation-id";
    let called = false;
    const mocks: MockedResponse<ValidateSubmissionResp, ValidateSubmissionInput>[] = [
      {
        request: {
          query: VALIDATE_SUBMISSION,
          variables: {
            _id: submissionID,
            types: ["metadata"], // NOTE: this is just the default type
            scope: "New",
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
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={{
          ...baseSubmission,
          _id: submissionID,
          status: "In Progress",
          metadataValidationStatus: "New",
          fileValidationStatus: null,
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    expect(called).toBe(false);

    const radio = getByTestId("validate-controls-validation-target") as HTMLInputElement;
    userEvent.click(getByLabelText(radio, "New Uploaded Data"));

    userEvent.click(getByTestId("validate-controls-validate-button"));

    await waitFor(() => {
      expect(called).toBe(true);
    });
  });

  it.each<ValidationTarget>(["New", "All"])(
    "should initiate against '%s Uploaded Data' when the option is selected",
    async (target) => {
      const submissionID = `${target}-uploads-validation-id`;
      let called = false;
      const mocks: MockedResponse<ValidateSubmissionResp, ValidateSubmissionInput>[] = [
        {
          request: {
            query: VALIDATE_SUBMISSION,
            variables: {
              _id: submissionID,
              types: ["metadata"], // NOTE: this is just the default type
              scope: target,
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
          authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
          submission={{
            ...baseSubmission,
            _id: submissionID,
            status: "In Progress",
            metadataValidationStatus: "New",
            fileValidationStatus: null,
          }}
        >
          <ValidationControls />
        </TestParent>
      );

      expect(called).toBe(false);

      const radio = getByTestId("validate-controls-validation-target") as HTMLInputElement;
      userEvent.click(getByLabelText(radio, `${target} Uploaded Data`));

      userEvent.click(getByTestId("validate-controls-validate-button"));

      await waitFor(() => {
        expect(called).toBe(true);
      });
    }
  );

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
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={{
          ...baseSubmission,
          _id: submissionID,
          status: "In Progress",
          metadataValidationStatus: "New",
          fileValidationStatus: "New",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    userEvent.click(getByTestId("validate-controls-validate-button"));

    await waitFor(() => {
      expect(global.mockEnqueue).toHaveBeenCalledWith("Unable to initiate validation process.", {
        variant: "error",
      });
      expect(getByTestId("validate-controls-validate-button")).toBeEnabled();
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
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={{
          ...baseSubmission,
          _id: submissionID,
          status: "In Progress",
          metadataValidationStatus: "New",
          fileValidationStatus: "New",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    userEvent.click(getByTestId("validate-controls-validate-button"));

    await waitFor(() => {
      expect(global.mockEnqueue).toHaveBeenCalledWith("Unable to initiate validation process.", {
        variant: "error",
      });
      expect(getByTestId("validate-controls-validate-button")).toBeEnabled();
    });
  });
});

describe("Implementation Requirements", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should render as disabled with text 'Validating...' when metadata is validating", () => {
    const { getByTestId } = render(
      <TestParent
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={{
          ...baseSubmission,
          _id: "example-sub-id-disabled",
          status: "In Progress",
          metadataValidationStatus: "Validating",
          fileValidationStatus: null,
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    expect(getByTestId("validate-controls-validate-button")).toBeDisabled();
    expect(getByTestId("validate-controls-validate-button")).toHaveTextContent("Validating...");
  });

  it("should render as disabled with text 'Validating...' when data files are validating", () => {
    const { getByTestId } = render(
      <TestParent
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={{
          ...baseSubmission,
          _id: "example-sub-id-disabled",
          status: "In Progress",
          metadataValidationStatus: null,
          fileValidationStatus: "Validating",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    expect(getByTestId("validate-controls-validate-button")).toBeDisabled();
    expect(getByTestId("validate-controls-validate-button")).toHaveTextContent("Validating...");
  });

  it("should render as disabled when user is not submission owner with permissions or collaborator", () => {
    const { getByTestId } = render(
      <TestParent
        authCtxState={{
          ...baseAuthCtx,
          user: {
            ...baseUser,
            _id: "some-other-user",
            role: "Submitter",
            permissions: ["data_submission:view"],
          },
        }}
        submission={{
          ...baseSubmission,
          _id: "example-sub-id-disabled",
          status: "In Progress",
          metadataValidationStatus: "New",
          fileValidationStatus: "New",
          submitterID: "some-other-user",
          collaborators: [
            {
              collaboratorID: "collaborator-user",
              collaboratorName: "",
              permission: "Can Edit",
            },
          ],
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    const typeRadio = getByTestId("validate-controls-validation-type") as HTMLInputElement;
    const targetRadio = getByTestId("validate-controls-validation-target") as HTMLInputElement;

    expect(getByTestId("validate-controls-validate-button")).toBeDisabled();
    expect(getByLabelText(typeRadio, "Validate Metadata")).toBeDisabled();
    expect(getByLabelText(typeRadio, "Validate Data Files")).toBeDisabled();
    expect(getByLabelText(typeRadio, "Both")).toBeDisabled();
    expect(getByLabelText(targetRadio, "New Uploaded Data")).toBeDisabled();
    expect(getByLabelText(targetRadio, "All Uploaded Data")).toBeDisabled();
  });

  it("should render as enabled when user is collaborator without permissions", () => {
    const { getByTestId } = render(
      <TestParent
        authCtxState={{
          ...baseAuthCtx,
          user: {
            ...baseUser,
            _id: "collaborator-user",
            role: "Submitter",
            permissions: [],
          },
        }}
        submission={{
          ...baseSubmission,
          _id: "example-sub-id-disabled",
          status: "In Progress",
          metadataValidationStatus: "New",
          fileValidationStatus: "New",
          submitterID: "some-other-user",
          collaborators: [
            {
              collaboratorID: "collaborator-user",
              collaboratorName: "",
              permission: "Can Edit",
            },
          ],
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    const typeRadio = getByTestId("validate-controls-validation-type") as HTMLInputElement;
    const targetRadio = getByTestId("validate-controls-validation-target") as HTMLInputElement;

    expect(getByTestId("validate-controls-validate-button")).toBeEnabled();
    expect(getByLabelText(typeRadio, "Validate Metadata")).toBeEnabled();
    expect(getByLabelText(typeRadio, "Validate Data Files")).toBeEnabled();
    expect(getByLabelText(typeRadio, "Both")).toBeEnabled();
    expect(getByLabelText(targetRadio, "New Uploaded Data")).toBeEnabled();
    expect(getByLabelText(targetRadio, "All Uploaded Data")).toBeEnabled();
  });

  it("should NOT reset the validation type and upload type after starting validation", async () => {
    const submissionID = "reset-state-onclick-id";
    const mocks: MockedResponse<ValidateSubmissionResp, ValidateSubmissionInput>[] = [
      {
        request: {
          query: VALIDATE_SUBMISSION,
        },
        variableMatcher: () => true,
        result: {
          data: {
            validateSubmission: {
              success: true,
            },
          },
        },
      },
    ];

    const mockRefetch = jest.fn();
    const { getByTestId } = render(
      <TestParent
        mocks={mocks}
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submissionCtxState={{
          ...baseSubmissionCtx,
          refetch: mockRefetch,
        }}
        submission={{
          ...baseSubmission,
          _id: submissionID,
          status: "In Progress",
          metadataValidationStatus: "New",
          fileValidationStatus: "New",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    // Change from default type
    const typeRadio = getByTestId("validate-controls-validation-type") as HTMLInputElement;
    userEvent.click(getByLabelText(typeRadio, "Both"));

    // Change from default target
    const targetRadio = getByTestId("validate-controls-validation-target") as HTMLInputElement;
    userEvent.click(getByLabelText(targetRadio, "All Uploaded Data"));

    userEvent.click(getByTestId("validate-controls-validate-button"));

    await waitFor(
      () => {
        expect(mockRefetch).toHaveBeenCalledTimes(1);
      },
      { timeout: 1500 }
    );

    // NOTE: We're asserting that the state is not reset to the default values
    expect(getByLabelText(typeRadio, "Both")).toBeChecked();
    expect(getByLabelText(targetRadio, "All Uploaded Data")).toBeChecked();
  });

  it("should reset the validation type and upload type after validation ends", async () => {
    const submissionID = "reset-state-onclick-id";
    const mocks: MockedResponse<ValidateSubmissionResp, ValidateSubmissionInput>[] = [
      {
        request: {
          query: VALIDATE_SUBMISSION,
        },
        variableMatcher: () => true,
        result: {
          data: {
            validateSubmission: {
              success: true,
            },
          },
        },
      },
    ];

    const mockRefetch = jest.fn();
    const { getByTestId, rerender } = render(
      <TestParent
        mocks={mocks}
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submissionCtxState={{
          ...baseSubmissionCtx,
          refetch: mockRefetch,
        }}
        submission={{
          ...baseSubmission,
          _id: submissionID,
          status: "In Progress",
          metadataValidationStatus: "New",
          fileValidationStatus: "New",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    // Change from default type
    const typeRadio = getByTestId("validate-controls-validation-type") as HTMLInputElement;
    userEvent.click(getByLabelText(typeRadio, "Validate Data Files"));

    // Change from default target
    const targetRadio = getByTestId("validate-controls-validation-target") as HTMLInputElement;
    userEvent.click(getByLabelText(targetRadio, "All Uploaded Data"));

    userEvent.click(getByTestId("validate-controls-validate-button"));

    await waitFor(
      () => {
        expect(mockRefetch).toHaveBeenCalledTimes(1);
        expect(getByLabelText(typeRadio, "Validate Data Files")).toBeChecked();
        expect(getByLabelText(targetRadio, "All Uploaded Data")).toBeChecked();
      },
      { timeout: 1500 }
    );

    // Trigger re-render with validation statuses as 'Validating'
    rerender(
      <TestParent
        mocks={mocks}
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={{
          ...baseSubmission,
          _id: submissionID,
          status: "In Progress",
          metadataValidationStatus: "Validating",
          fileValidationStatus: "Validating",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalledTimes(1);
      expect(getByLabelText(typeRadio, "Validate Data Files")).toBeChecked();
      expect(getByLabelText(targetRadio, "All Uploaded Data")).toBeChecked();
    });

    // Trigger re-render with validation statuses as 'Passed'
    rerender(
      <TestParent
        mocks={mocks}
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={{
          ...baseSubmission,
          _id: submissionID,
          status: "In Progress",
          metadataValidationStatus: "Passed",
          fileValidationStatus: "Passed",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    await waitFor(() => {
      // NOTE: Instead of calculating which radio should be checked, we're just asserting
      // that the ones we selected are definitely not checked
      expect(getByLabelText(typeRadio, "Validate Data Files")).not.toBeChecked();
      expect(getByLabelText(targetRadio, "All Uploaded Data")).not.toBeChecked();
    });
  });

  it("should select 'Validate Metadata' Validation Type by default", () => {
    const { getByTestId } = render(
      <TestParent
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={{
          ...baseSubmission,
          _id: "example-sub-id-disabled",
          status: "In Progress",
          metadataValidationStatus: null,
          fileValidationStatus: null,
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    const radio = getByTestId("validate-controls-validation-type") as HTMLInputElement;

    expect(getByLabelText(radio, "Validate Metadata")).toBeChecked();
    expect(getByLabelText(radio, "Validate Metadata")).toBeDisabled();
    expect(getByLabelText(radio, "Validate Data Files")).toBeDisabled();
    expect(getByLabelText(radio, "Both")).toBeDisabled();
  });

  it("should select 'Validate Data Files' validation type when only Data Files are uploaded", () => {
    const { getByTestId } = render(
      <TestParent
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={{
          ...baseSubmission,
          _id: "example-sub-id-disabled",
          status: "In Progress",
          metadataValidationStatus: null,
          fileValidationStatus: "New",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    const radio = getByTestId("validate-controls-validation-type") as HTMLInputElement;

    expect(getByLabelText(radio, "Validate Metadata")).toBeDisabled();
    expect(getByLabelText(radio, "Validate Data Files")).toBeChecked();
    expect(getByLabelText(radio, "Both")).toBeDisabled();
  });

  it("should enable all options when both Metadata and Data Files are uploaded", () => {
    const { getByTestId } = render(
      <TestParent
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={{
          ...baseSubmission,
          _id: "example-sub-id-disabled",
          status: "In Progress",
          metadataValidationStatus: "New",
          fileValidationStatus: "New",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    const radio = getByTestId("validate-controls-validation-type") as HTMLInputElement;

    expect(getByLabelText(radio, "Validate Metadata")).toBeEnabled();
    expect(getByLabelText(radio, "Validate Data Files")).toBeEnabled();
    expect(getByLabelText(radio, "Both")).toBeEnabled();
  });

  it("should disable 'Validate Data Files' and 'Both' for the submission intent of 'Delete'", () => {
    const { getByTestId } = render(
      <TestParent
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={{
          ...baseSubmission,
          _id: "example-sub-id-disabled",
          status: "In Progress",
          metadataValidationStatus: "New",
          fileValidationStatus: "New",
          intention: "Delete",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    const radio = getByTestId("validate-controls-validation-type") as HTMLInputElement;

    expect(getByLabelText(radio, "Validate Metadata")).toBeEnabled();
    expect(getByLabelText(radio, "Validate Data Files")).toBeDisabled();
    expect(getByLabelText(radio, "Both")).toBeDisabled();
  });

  it("should disable 'Validate Data Files' and 'Both' for the submission dataType of 'Metadata Only'", () => {
    const { getByTestId } = render(
      <TestParent
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={{
          ...baseSubmission,
          _id: "example-sub-id-disabled",
          status: "In Progress",
          metadataValidationStatus: "New",
          fileValidationStatus: "New",
          intention: "New/Update",
          dataType: "Metadata Only",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    const radio = getByTestId("validate-controls-validation-type") as HTMLInputElement;

    expect(getByLabelText(radio, "Validate Metadata")).toBeEnabled();
    expect(getByLabelText(radio, "Validate Data Files")).toBeDisabled();
    expect(getByLabelText(radio, "Both")).toBeDisabled();
  });

  it("should select 'All Uploaded Data' when the submission is 'Submitted' and the user has review permissions", async () => {
    const { getByTestId } = render(
      <TestParent
        authCtxState={{
          ...baseAuthCtx,
          user: {
            ...baseUser,
            role: "Admin",
            permissions: ["data_submission:view", "data_submission:review"],
          },
        }}
        submission={{
          ...baseSubmission,
          _id: "example-sub-id-disabled",
          status: "Submitted",
          metadataValidationStatus: "Passed",
          fileValidationStatus: "Passed",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    const radio = getByTestId("validate-controls-validation-target") as HTMLInputElement;

    await waitFor(() => {
      expect(getByLabelText(radio, "New Uploaded Data")).toBeDisabled();
      expect(getByLabelText(radio, "New Uploaded Data")).not.toBeChecked();
      expect(getByLabelText(radio, "All Uploaded Data")).toBeEnabled();
      expect(getByLabelText(radio, "All Uploaded Data")).toBeChecked();
    });
  });

  // NOTE: This is an inverse sanity check of the above test
  it("should select 'New Uploaded Data' when the submission is 'Submitted' and user is missing review permissions", async () => {
    const { getByTestId } = render(
      <TestParent
        authCtxState={{
          ...baseAuthCtx,
          user: {
            ...baseUser,
            role: "Admin",
            permissions: ["data_submission:view", "data_submission:create"],
          },
        }}
        submission={{
          ...baseSubmission,
          _id: "example-sub-id-disabled",
          status: "Submitted",
          metadataValidationStatus: "Passed",
          fileValidationStatus: "Passed",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    const radio = getByTestId("validate-controls-validation-target") as HTMLInputElement;

    expect(getByLabelText(radio, "New Uploaded Data")).toBeDisabled();
    expect(getByLabelText(radio, "New Uploaded Data")).toBeChecked();
    expect(getByLabelText(radio, "All Uploaded Data")).toBeDisabled();
  });

  it("should select 'Validate Metadata' when the submission is 'Submitted' with metadata and the user has review permissions", async () => {
    const { rerender, getByTestId } = render(
      <TestParent
        authCtxState={{
          ...baseAuthCtx,
          user: {
            ...baseUser,
            role: "Admin",
            permissions: ["data_submission:view", "data_submission:review"],
          },
        }}
        submission={null}
      >
        <ValidationControls />
      </TestParent>
    );

    const radio = getByTestId("validate-controls-validation-type") as HTMLInputElement;

    // NOTE: We're simulating the same rendering logic used for the component impl.
    rerender(
      <TestParent
        authCtxState={{
          ...baseAuthCtx,
          user: {
            ...baseUser,
            role: "Admin",
            permissions: ["data_submission:view", "data_submission:review"],
          },
        }}
        submission={{
          ...baseSubmission,
          _id: "example-sub-id-disabled",
          status: "Submitted",
          metadataValidationStatus: "Passed",
          fileValidationStatus: null, // NOTE: No files uploaded
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    await waitFor(() => {
      expect(getByLabelText(radio, "Validate Metadata")).toBeChecked();
      expect(getByLabelText(radio, "Validate Data Files")).toBeDisabled();
      expect(getByLabelText(radio, "Both")).toBeDisabled();
    });
  });

  it("should select 'Both' when the submission is 'Submitted' with all data and the user has review permissions", async () => {
    const { getByTestId } = render(
      <TestParent
        authCtxState={{
          ...baseAuthCtx,
          user: {
            ...baseUser,
            role: "Admin",
            permissions: ["data_submission:view", "data_submission:review"],
          },
        }}
        submission={{
          ...baseSubmission,
          _id: "example-sub-id-disabled",
          status: "Submitted",
          metadataValidationStatus: "Passed",
          fileValidationStatus: "Passed",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    const radio = getByTestId("validate-controls-validation-type") as HTMLInputElement;

    await waitFor(() => {
      expect(getByLabelText(radio, "Both")).toBeChecked();
      expect(getByLabelText(radio, "Both")).toBeEnabled();
    });
  });

  it.each<SubmissionStatus>([
    "New",
    "Submitted",
    "Released",
    "Completed",
    "Canceled",
    "fake status" as SubmissionStatus,
  ])("should be disabled when the Submission status is '%s'", (status) => {
    const { getByTestId } = render(
      <TestParent
        authCtxState={{
          ...baseAuthCtx,
          user: {
            ...baseUser,
            role: "Submitter",
            permissions: ["data_submission:view", "data_submission:create"],
          },
        }}
        submission={{
          ...baseSubmission,
          _id: "example-sub-id-disabled",
          status,
          metadataValidationStatus: "Passed",
          fileValidationStatus: "Passed",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    const radio = getByTestId("validate-controls-validation-type") as HTMLInputElement;

    expect(getByTestId("validate-controls-validate-button")).toBeDisabled();
    expect(getByLabelText(radio, "Validate Metadata")).toBeDisabled();
    expect(getByLabelText(radio, "Validate Data Files")).toBeDisabled();
    expect(getByLabelText(radio, "Both")).toBeDisabled();
  });

  it("should be enabled for a user with review permissions when the Submission status is 'Submitted'", async () => {
    const { getByTestId } = render(
      <TestParent
        authCtxState={{
          ...baseAuthCtx,
          user: {
            ...baseUser,
            role: "Admin",
            permissions: ["data_submission:view", "data_submission:review"],
          },
        }}
        submission={{
          ...baseSubmission,
          _id: "example-sub-id-disabled",
          status: "Submitted",
          metadataValidationStatus: "Passed",
          fileValidationStatus: "Passed",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    const radio = getByTestId("validate-controls-validation-type") as HTMLInputElement;

    expect(getByTestId("validate-controls-validate-button")).not.toBeDisabled();
    expect(getByLabelText(radio, "Validate Metadata")).not.toBeDisabled();
    expect(getByLabelText(radio, "Validate Data Files")).not.toBeDisabled();
    expect(getByLabelText(radio, "Both")).not.toBeDisabled();
  });

  it("should be disabled for a user missing review permissions when the Submission status is 'Submitted'", async () => {
    const { getByTestId } = render(
      <TestParent
        authCtxState={{
          ...baseAuthCtx,
          user: {
            ...baseUser,
            role: "Admin",
            permissions: ["data_submission:view", "data_submission:create"],
          },
        }}
        submission={{
          ...baseSubmission,
          _id: "example-sub-id-disabled",
          status: "Submitted",
          metadataValidationStatus: "Passed",
          fileValidationStatus: "Passed",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    const radio = getByTestId("validate-controls-validation-type") as HTMLInputElement;

    expect(getByTestId("validate-controls-validate-button")).toBeDisabled();
    expect(getByLabelText(radio, "Validate Metadata")).toBeDisabled();
    expect(getByLabelText(radio, "Validate Data Files")).toBeDisabled();
    expect(getByLabelText(radio, "Both")).toBeDisabled();
  });

  it("should update back to the default text when the submission is no longer validating", () => {
    const submission: Submission = {
      ...baseSubmission,
      _id: "validating-test-id",
      status: "In Progress",
      metadataValidationStatus: "Validating",
      fileValidationStatus: "Validating",
    };

    const { getByTestId, rerender } = render(
      <TestParent
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={submission}
      >
        <ValidationControls />
      </TestParent>
    );

    expect(getByTestId("validate-controls-validate-button")).toBeDisabled();
    expect(getByTestId("validate-controls-validate-button")).toHaveTextContent("Validating...");

    rerender(
      <TestParent
        authCtxState={{ ...baseAuthCtx, user: { ...baseUser, role: "Submitter" } }}
        submission={{
          ...submission,
          metadataValidationStatus: "Passed",
          fileValidationStatus: "Passed",
        }}
      >
        <ValidationControls />
      </TestParent>
    );

    expect(getByTestId("validate-controls-validate-button")).toBeEnabled();
    expect(getByTestId("validate-controls-validate-button")).toHaveTextContent(/validate/i);
  });
});
