import { FC, useMemo } from "react";
import { act, render, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter } from "react-router-dom";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import {
  Context as AuthCtx,
  ContextState as AuthCtxState,
  Status as AuthStatus,
} from "../Contexts/AuthContext";
import { RETRIEVE_CLI_CONFIG, RetrieveCLIConfigResp } from "../../graphql";
import { DataUpload } from "./DataUpload";

jest.mock("../../env", () => ({
  ...jest.requireActual("../../env"),
  REACT_APP_BACKEND_API: "mocked-backend-api-url",
}));

const mockDownloadBlob = jest.fn();
jest.mock("../../utils", () => ({
  ...jest.requireActual("../../utils"),
  downloadBlob: (...args) => mockDownloadBlob(...args),
}));

const baseSubmission: Omit<Submission, "_id"> = {
  name: "",
  submitterID: "current-user",
  submitterName: "",
  organization: undefined,
  dataCommons: "",
  modelVersion: "",
  studyAbbreviation: "",
  dbGaPID: "",
  bucketName: "",
  rootPath: "",
  status: "New",
  metadataValidationStatus: "New",
  fileValidationStatus: "New",
  fileErrors: [],
  history: [],
  conciergeName: "",
  conciergeEmail: "",
  intention: "New/Update",
  dataType: "Metadata and Data Files",
  createdAt: "",
  updatedAt: "",
  crossSubmissionStatus: null,
  otherSubmissions: null,
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

const baseUser: Omit<User, "permissions"> = {
  _id: "current-user",
  firstName: "",
  lastName: "",
  userStatus: "Active",
  role: "Submitter", // NOTE: This base role allows for all actions
  IDP: "nih",
  email: "",
  studies: null,
  dataCommons: null,
  createdAt: "",
  updateAt: "",
  notifications: [],
};

type ParentProps = {
  mocks?: MockedResponse[];
  role?: UserRole;
  permissions?: AuthPermissions[];
  children: React.ReactNode;
};

const TestParent: FC<ParentProps> = ({
  mocks = [],
  role = "Submitter",
  permissions = ["data_submission:view", "data_submission:create"],
  children,
}) => {
  const authCtxState: AuthCtxState = useMemo<AuthCtxState>(
    () => ({
      status: AuthStatus.LOADED,
      isLoggedIn: true,
      user: { ...baseUser, role, permissions },
    }),
    [role]
  );

  return (
    <MockedProvider mocks={mocks} addTypename={false}>
      <AuthCtx.Provider value={authCtxState}>
        <MemoryRouter basename="">{children}</MemoryRouter>
      </AuthCtx.Provider>
    </MockedProvider>
  );
};

describe("Accessibility", () => {
  it("should have no violations", async () => {
    const { container } = render(
      <TestParent>
        <DataUpload submission={{ ...baseSubmission, _id: "accessibility-base" }} />
      </TestParent>
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Basic Functionality", () => {
  it("should render without crashing", () => {
    const { getByTestId } = render(
      <TestParent>
        <DataUpload submission={{ ...baseSubmission, _id: "smoke-test-id" }} />
      </TestParent>
    );

    expect(getByTestId("uploader-cli-footer")).toBeVisible();
  });

  it("should not crash when the submission is null", () => {
    const { getByText } = render(
      <TestParent>
        <DataUpload submission={null} />
      </TestParent>
    );

    expect(getByText("Upload Data Files")).toBeVisible();
  });

  it("should handle API network errors gracefully", async () => {
    const mocks: MockedResponse<RetrieveCLIConfigResp>[] = [
      {
        request: {
          query: RETRIEVE_CLI_CONFIG,
        },
        variableMatcher: () => true,
        error: new Error("Simulated network error"),
      },
    ];

    const { getByTestId, getByText } = render(
      <TestParent mocks={mocks}>
        <DataUpload submission={{ ...baseSubmission, _id: "network-error-handling" }} />
      </TestParent>
    );

    // Open the dialog
    userEvent.click(getByTestId("uploader-cli-config-button"));

    userEvent.type(getByTestId("uploader-config-dialog-input-data-folder"), "test-folder");
    userEvent.type(getByTestId("uploader-config-dialog-input-manifest"), "test-manifest");

    userEvent.click(getByText("Download"));

    await waitFor(() => {
      expect(global.mockEnqueue).toHaveBeenCalledWith(
        "Unable to download Uploader CLI config file",
        {
          variant: "error",
        }
      );
    });
  });

  it("should handle API GraphQL errors gracefully", async () => {
    const mocks: MockedResponse<RetrieveCLIConfigResp>[] = [
      {
        request: {
          query: RETRIEVE_CLI_CONFIG,
        },
        variableMatcher: () => true,
        result: {
          errors: [new GraphQLError("Simulated GraphQL error")],
        },
      },
    ];

    const { getByTestId, getByText } = render(
      <TestParent mocks={mocks}>
        <DataUpload submission={{ ...baseSubmission, _id: "graphql-error-handling" }} />
      </TestParent>
    );

    // Open the dialog
    userEvent.click(getByTestId("uploader-cli-config-button"));

    userEvent.type(getByTestId("uploader-config-dialog-input-data-folder"), "test-folder");
    userEvent.type(getByTestId("uploader-config-dialog-input-manifest"), "test-manifest");

    userEvent.click(getByText("Download"));

    await waitFor(() => {
      expect(global.mockEnqueue).toHaveBeenCalledWith(
        "Unable to download Uploader CLI config file",
        {
          variant: "error",
        }
      );
    });
  });

  it("should hide the CLI Configuration dialog when onClose is called", async () => {
    const { getByTestId, findAllByRole, queryByRole } = render(
      <TestParent mocks={[]}>
        <DataUpload
          submission={{
            ...baseSubmission,
            _id: "hide-config-dialog-on-close",
            dataType: "Metadata and Data Files",
          }}
        />
      </TestParent>
    );

    // Open the dialog
    userEvent.click(getByTestId("uploader-cli-config-button"));

    const dialog = await findAllByRole("presentation");

    expect(dialog[1]).toBeVisible();

    // Close the dialog
    userEvent.click(dialog[1]);

    await waitFor(() => {
      expect(queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("should hide the Uploader CLI dialog when onClose is called", async () => {
    const { getByTestId, findAllByRole, queryByRole } = render(
      <TestParent mocks={[]}>
        <DataUpload
          submission={{
            ...baseSubmission,
            _id: "hide-cli-dialog-on-close",
          }}
        />
      </TestParent>
    );

    // Open the dialog
    userEvent.click(getByTestId("uploader-cli-download-button"));

    const dialog = await findAllByRole("presentation");

    expect(dialog[1]).toBeVisible();

    // Close the dialog
    userEvent.click(dialog[1]);

    await waitFor(() => {
      expect(queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});

describe("Implementation Requirements", () => {
  it("should have the Uploader CLI download dialog button", async () => {
    const { getByText, getByTestId } = render(
      <TestParent>
        <DataUpload submission={{ ...baseSubmission, _id: "cli-download-link-id" }} />
      </TestParent>
    );

    const link = getByTestId("uploader-cli-download-button");

    expect(getByText(/CLI Tool download/i)).toBeVisible();
    expect(link).toContainElement(getByText(/CLI Tool download/i));

    userEvent.click(link);

    await waitFor(() => {
      expect(getByText(/Uploader CLI Tool/i)).toBeInTheDocument();
    });
  });

  it("should have the Configuration download link when 'Metadata and Data Files' dataType", async () => {
    const mocks: MockedResponse[] = [];

    const { getByText, getByTestId } = render(
      <TestParent mocks={mocks}>
        <DataUpload
          submission={{
            ...baseSubmission,
            _id: "config-download-link-id",
            dataType: "Metadata and Data Files",
          }}
        />
      </TestParent>
    );
    const button = getByTestId("uploader-cli-config-button");

    expect(getByText(/download configuration file/i)).toBeVisible();
    expect(button).toBeVisible();
  });

  it("should enable the Uploader CLI download button when user has required permissions", async () => {
    const { getByTestId } = render(
      <DataUpload
        submission={{
          ...baseSubmission,
          _id: "config-download-role-check",
          dataType: "Metadata and Data Files", // NOTE: Required for the button to show
        }}
      />,
      {
        wrapper: (p) => (
          <TestParent {...p} permissions={["data_submission:view", "data_submission:create"]} />
        ),
      }
    );

    expect(getByTestId("uploader-cli-config-button")).toBeEnabled();
  });

  it("should disable the Uploader CLI download button when user is missing required permissions", async () => {
    const { getByTestId } = render(
      <DataUpload
        submission={{
          ...baseSubmission,
          _id: "config-download-role-check",
          dataType: "Metadata and Data Files", // NOTE: Required for the button to show
        }}
      />,
      { wrapper: (p) => <TestParent {...p} permissions={[]} /> }
    );

    expect(getByTestId("uploader-cli-config-button")).toBeDisabled();
  });

  it("should enable the Uploader CLI download button when user is a collaborator", async () => {
    const { getByTestId } = render(
      <DataUpload
        submission={{
          ...baseSubmission,
          _id: "config-download-check",
          dataType: "Metadata and Data Files", // NOTE: Required for the button to show
          submitterID: "some-other-user",
          collaborators: [
            {
              collaboratorID: "current-user",
              collaboratorName: "",
              permission: "Can Edit",
            },
          ],
        }}
      />,
      { wrapper: (p) => <TestParent {...p} role="Submitter" /> }
    );

    expect(getByTestId("uploader-cli-config-button")).toBeEnabled();
  });

  it("should render alt CLI footer when 'Metadata Only' dataType", async () => {
    const mocks: MockedResponse[] = [];

    const { getByText, getByTestId } = render(
      <TestParent mocks={mocks}>
        <DataUpload
          submission={{
            ...baseSubmission,
            _id: "config-download-link-id",
            dataType: "Metadata Only",
          }}
        />
      </TestParent>
    );

    expect(getByTestId("uploader-cli-footer-alt")).toBeVisible();
    expect(
      getByText(/This submission is for metadata only; there is no need to upload data files./i)
    ).toBeVisible();
  });

  it("should download the Uploader CLI configuration file on click", async () => {
    let called = false;
    const mocks: MockedResponse<RetrieveCLIConfigResp>[] = [
      {
        request: {
          query: RETRIEVE_CLI_CONFIG,
        },
        variableMatcher: () => true,
        result: () => {
          called = true;

          return {
            data: {
              retrieveCLIConfig: `abc_file_one=123\nline_two=456\nline_three=789\n`,
            },
          };
        },
      },
    ];

    const { getByTestId, getByText } = render(
      <TestParent mocks={mocks}>
        <DataUpload submission={{ ...baseSubmission, _id: "cli-download-on-click" }} />
      </TestParent>
    );

    expect(called).toBe(false);

    // eslint-disable-next-line testing-library/no-unnecessary-act -- RHF is throwing an error without act
    await act(async () => {
      // Open the dialog
      userEvent.click(getByTestId("uploader-cli-config-button"));
    });

    userEvent.type(getByTestId("uploader-config-dialog-input-data-folder"), "test-folder");
    userEvent.type(getByTestId("uploader-config-dialog-input-manifest"), "test-manifest");

    // eslint-disable-next-line testing-library/no-unnecessary-act -- RHF is throwing an error without act
    await act(async () => {
      userEvent.click(getByText("Download"));
    });

    await waitFor(() => {
      expect(called).toBe(true);
    });
  });

  it.each<{ input: string; expected: string }>([
    { input: "A B C 1 2 3", expected: "cli-config-A-B-C-1-2-3.yml" },
    { input: "long name".repeat(100), expected: `cli-config-${"long-name".repeat(100)}.yml` },
    { input: "", expected: "cli-config.yml" }, // NOTE: empty string should default to "cli-config.yml"
    { input: `non $alpha name $@!819`, expected: "cli-config-non-alpha-name-819.yml" },
    { input: "  ", expected: "cli-config.yml" }, // NOTE: empty whitespace is trimmed down to nothing
    { input: `_-"a-b+c=d`, expected: "cli-config--a-bcd.yml" },
    { input: "CRDCDH-1234", expected: "cli-config-CRDCDH-1234.yml" },
    { input: "SPACE-AT-END ", expected: "cli-config-SPACE-AT-END.yml" },
  ])(
    "should safely name the Uploader CLI config file based on the submission name",
    async ({ input, expected }) => {
      const mocks: MockedResponse<RetrieveCLIConfigResp>[] = [
        {
          request: {
            query: RETRIEVE_CLI_CONFIG,
          },
          variableMatcher: () => true,
          result: {
            data: {
              retrieveCLIConfig: `abc_file_one=123\nline_two=456\nline_three=789\n`,
            },
          },
        },
      ];

      const { getByTestId, getByText } = render(
        <TestParent mocks={mocks}>
          <DataUpload submission={{ ...baseSubmission, _id: "safe-filename-test", name: input }} />
        </TestParent>
      );

      // Open the dialog
      userEvent.click(getByTestId("uploader-cli-config-button"));

      userEvent.type(getByTestId("uploader-config-dialog-input-data-folder"), "test-folder");
      userEvent.type(getByTestId("uploader-config-dialog-input-manifest"), "test-manifest");

      userEvent.click(getByText("Download"));

      await waitFor(() => {
        expect(mockDownloadBlob).toHaveBeenCalledWith(
          expect.any(String),
          expected,
          "application/yaml"
        );
      });
    }
  );
});
