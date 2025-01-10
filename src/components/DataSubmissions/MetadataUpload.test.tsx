import { FC } from "react";
import { render, waitFor } from "@testing-library/react";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { axe } from "jest-axe";
import userEvent from "@testing-library/user-event";
import { Context, ContextState, Status as AuthStatus } from "../Contexts/AuthContext";
import MetadataUpload from "./MetadataUpload";
import { CREATE_BATCH, CreateBatchResp, UPDATE_BATCH, UpdateBatchResp } from "../../graphql";

// NOTE: We omit any properties that are explicitly used within component logic
const baseSubmission: Omit<
  Submission,
  "_id" | "metadataValidationStatus" | "fileValidationStatus"
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
  status: "New",
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

const baseNewBatch: Omit<NewBatch, "files" | "fileCount"> = {
  _id: "",
  submissionID: "",
  type: "metadata",
  status: "Uploading",
  errors: [],
  createdAt: "",
  updatedAt: "",
};

const baseBatch: Batch = {
  _id: "",
  displayID: 0,
  submissionID: "",
  type: "metadata",
  fileCount: 0,
  files: [],
  status: "Uploading",
  errors: [],
  createdAt: "",
  updatedAt: "",
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

describe("Accessibility", () => {
  it("should not have accessibility violations", async () => {
    const { container } = render(
      <TestParent context={{ ...baseContext, user: { ...baseUser, role: "Submitter" } }}>
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "example-accessibility-enabled-id",
            metadataValidationStatus: "New",
            fileValidationStatus: "New",
          }}
          onCreateBatch={jest.fn()}
          onUpload={jest.fn()}
        />
      </TestParent>
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("should not have accessibility violations (disabled)", async () => {
    const { container } = render(
      <TestParent context={{ ...baseContext, user: { ...baseUser, role: "Submitter" } }}>
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "example-accessibility-disabled-id",
            metadataValidationStatus: null, // NOTE: these properties disable the component
            fileValidationStatus: null,
          }}
          onCreateBatch={jest.fn()}
          onUpload={jest.fn()}
          readOnly // NOTE: this property also disables the component
        />
      </TestParent>
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("MetadataUpload Tooltip", () => {
  it("should display tooltip on hover with correct text", async () => {
    const { findByRole, getByLabelText } = render(
      <TestParent context={{ ...baseContext, user: { ...baseUser, role: "Submitter" } }}>
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "id-onCreateBatch-callback",
            metadataValidationStatus: "New",
            fileValidationStatus: "New",
          }}
          onCreateBatch={jest.fn()}
          onUpload={jest.fn()}
        />
      </TestParent>
    );

    const tooltipText =
      "The metadata uploaded will be compared with existing data within the submission. All new data will be added to the submission, including updates to existing information.";

    const tooltipBtn = getByLabelText("Toggle Tooltip");
    userEvent.hover(tooltipBtn);

    const tooltip = await findByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent(tooltipText);

    userEvent.unhover(tooltipBtn);

    await waitFor(() => {
      expect(tooltip).not.toBeInTheDocument();
    });
  });
});

describe("Basic Functionality", () => {
  beforeEach(() => {
    jest.spyOn(window, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should render without crashing", () => {
    render(
      <TestParent context={{ ...baseContext, user: { ...baseUser, role: "Submitter" } }}>
        <MetadataUpload submission={null} onCreateBatch={null} onUpload={null} readOnly />
      </TestParent>
    );
  });

  it("should show an alert when navigating away WITH selected files", () => {
    const { getByTestId } = render(
      <TestParent context={{ ...baseContext, user: { ...baseUser, role: "Submitter" } }}>
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "id-navigation-alert",
            metadataValidationStatus: null,
            fileValidationStatus: null,
          }}
          onCreateBatch={jest.fn()}
          onUpload={jest.fn()}
        />
      </TestParent>
    );

    const file = new File(["unused-content"], "metadata.txt", { type: "text/plain" });
    userEvent.upload(getByTestId("metadata-upload-file-input"), file);

    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("should not show an alert when navigating away WITHOUT selected files", () => {
    render(
      <TestParent context={{ ...baseContext, user: { ...baseUser, role: "Submitter" } }}>
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "id-no-navigation-alert",
            metadataValidationStatus: null,
            fileValidationStatus: null,
          }}
          onCreateBatch={jest.fn()}
          onUpload={jest.fn()}
        />
      </TestParent>
    );

    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it("should call onCreateBatch when successfully creating a batch", async () => {
    const onCreateBatchMock = jest.fn();
    const mocks: MockedResponse<CreateBatchResp | UpdateBatchResp>[] = [
      {
        request: {
          query: CREATE_BATCH,
        },
        variableMatcher: () => true,
        result: {
          data: {
            createBatch: {
              ...baseNewBatch,
              fileCount: 1,
              files: [{ fileName: "metadata.txt", signedURL: "example-signed-url" }],
            },
          },
        },
      },
      {
        request: {
          query: UPDATE_BATCH,
        },
        variableMatcher: () => true,
        result: {
          data: {
            updateBatch: { ...baseBatch },
          },
        },
      },
    ];

    const { getByTestId } = render(
      <TestParent
        mocks={mocks}
        context={{ ...baseContext, user: { ...baseUser, role: "Submitter" } }}
      >
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "id-onCreateBatch-callback",
            metadataValidationStatus: "New",
            fileValidationStatus: "New",
          }}
          onCreateBatch={onCreateBatchMock}
          onUpload={jest.fn()}
        />
      </TestParent>
    );

    const file = new File(["unused-content"], "metadata.txt", { type: "text/plain" });
    userEvent.upload(getByTestId("metadata-upload-file-input"), file);

    userEvent.click(getByTestId("metadata-upload-file-upload-button"));

    await waitFor(() => {
      expect(onCreateBatchMock).toHaveBeenCalledTimes(1);
    });
  });

  it("should call onUpload when successfully uploading metadata", async () => {
    const onUploadMock = jest.fn();
    const mocks: MockedResponse<CreateBatchResp | UpdateBatchResp>[] = [
      {
        request: {
          query: CREATE_BATCH,
        },
        variableMatcher: () => true,
        result: {
          data: {
            createBatch: {
              ...baseNewBatch,
              fileCount: 1,
              files: [{ fileName: "metadata.txt", signedURL: "example-signed-url" }],
            },
          },
        },
      },
      {
        request: {
          query: UPDATE_BATCH,
        },
        variableMatcher: () => true,
        result: {
          data: {
            updateBatch: { ...baseBatch },
          },
        },
      },
    ];

    const { getByTestId } = render(
      <TestParent
        mocks={mocks}
        context={{ ...baseContext, user: { ...baseUser, role: "Submitter" } }}
      >
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "id-onUpload-callback-pass",
            metadataValidationStatus: "New",
            fileValidationStatus: "New",
          }}
          onCreateBatch={jest.fn()}
          onUpload={onUploadMock}
        />
      </TestParent>
    );

    const file = new File(["unused-content"], "metadata.txt", { type: "text/plain" });
    userEvent.upload(getByTestId("metadata-upload-file-input"), file);

    userEvent.click(getByTestId("metadata-upload-file-upload-button"));

    await waitFor(() => {
      expect(onUploadMock).toHaveBeenCalledWith(expect.any(String), "success");
    });
  });

  it("should call onUpload when failing to upload metadata (CREATE BATCH)", async () => {
    const onUploadMock = jest.fn();
    const mocks: MockedResponse<CreateBatchResp | UpdateBatchResp>[] = [
      {
        request: {
          query: CREATE_BATCH,
        },
        variableMatcher: () => true,
        error: new Error("error"),
      },
      {
        request: {
          query: UPDATE_BATCH,
        },
        variableMatcher: () => true,
        result: {
          data: {
            updateBatch: {
              ...baseBatch,
              fileCount: 1,
              files: [
                {
                  fileName: "metadata.txt",
                },
              ],
            } as Batch,
          },
        },
      },
    ];

    const { getByTestId } = render(
      <TestParent
        mocks={mocks}
        context={{ ...baseContext, user: { ...baseUser, role: "Submitter" } }}
      >
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "id-onUpload-callback-fail",
            metadataValidationStatus: "New",
            fileValidationStatus: "New",
          }}
          onCreateBatch={jest.fn()}
          onUpload={onUploadMock}
        />
      </TestParent>
    );

    const file = new File(["unused-content"], "metadata.txt", { type: "text/plain" });
    userEvent.upload(getByTestId("metadata-upload-file-input"), file);

    userEvent.click(getByTestId("metadata-upload-file-upload-button"));

    await waitFor(() => {
      expect(onUploadMock).toHaveBeenCalledWith(expect.any(String), "error");
    });
  });

  it("should call onUpload when failing to upload metadata (UPDATE BATCH)", async () => {
    const onUploadMock = jest.fn();
    const mocks: MockedResponse<CreateBatchResp | UpdateBatchResp>[] = [
      {
        request: {
          query: CREATE_BATCH,
        },
        variableMatcher: () => true,
        result: {
          data: {
            createBatch: {
              ...baseNewBatch,
              fileCount: 1,
              files: [{ fileName: "metadata.txt", signedURL: "example-signed-url" }],
            },
          },
        },
      },
      {
        request: {
          query: UPDATE_BATCH,
        },
        variableMatcher: () => true,
        error: new Error("error"),
      },
    ];

    const { getByTestId } = render(
      <TestParent
        mocks={mocks}
        context={{ ...baseContext, user: { ...baseUser, role: "Submitter" } }}
      >
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "id-onUpload-callback-fail-batch",
            metadataValidationStatus: "New",
            fileValidationStatus: "New",
          }}
          onCreateBatch={jest.fn()}
          onUpload={onUploadMock}
        />
      </TestParent>
    );

    const file = new File(["unused-content"], "metadata.txt", { type: "text/plain" });
    userEvent.upload(getByTestId("metadata-upload-file-input"), file);

    userEvent.click(getByTestId("metadata-upload-file-upload-button"));

    await waitFor(() => {
      expect(onUploadMock).toHaveBeenCalledWith(expect.any(String), "error");
    });
  });

  it("should call onUpload when failing to upload metadata (FETCH)", async () => {
    jest
      .spyOn(window, "fetch")
      .mockImplementationOnce(() => Promise.reject(new Error("simulated")));

    const onUploadMock = jest.fn();
    const mocks: MockedResponse<CreateBatchResp | UpdateBatchResp>[] = [
      {
        request: {
          query: CREATE_BATCH,
        },
        variableMatcher: () => true,
        result: {
          data: {
            createBatch: {
              ...baseNewBatch,
              fileCount: 1,
              files: [{ fileName: "metadata.txt", signedURL: "example-signed-url" }],
            },
          },
        },
      },
      {
        request: {
          query: UPDATE_BATCH,
        },
        variableMatcher: () => true,
        result: {
          data: {
            updateBatch: { ...baseBatch },
          },
        },
      },
    ];

    const { getByTestId } = render(
      <TestParent
        mocks={mocks}
        context={{ ...baseContext, user: { ...baseUser, role: "Submitter" } }}
      >
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "id-onUpload-callback-fail-create",
            metadataValidationStatus: "New",
            fileValidationStatus: "New",
          }}
          onCreateBatch={jest.fn()}
          onUpload={onUploadMock}
        />
      </TestParent>
    );

    const file = new File(["unused-content"], "metadata.txt", { type: "text/plain" });
    userEvent.upload(getByTestId("metadata-upload-file-input"), file);

    userEvent.click(getByTestId("metadata-upload-file-upload-button"));

    await waitFor(() => {
      expect(onUploadMock).toHaveBeenCalledWith(expect.any(String), "error");
    });
  });
});

describe("Implementation Requirements", () => {
  beforeEach(() => {
    jest.spyOn(window, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should render the Upload with text 'Uploading...' when metadata is uploading", async () => {
    const mocks: MockedResponse<CreateBatchResp | UpdateBatchResp>[] = [
      {
        request: {
          query: CREATE_BATCH,
        },
        variableMatcher: () => true,
        result: {
          data: {
            createBatch: {
              ...baseNewBatch,
              fileCount: 1,
              files: [{ fileName: "metadata.txt", signedURL: "example-signed-url" }],
            },
          },
        },
      },
      {
        request: {
          query: UPDATE_BATCH,
        },
        variableMatcher: () => true,
        result: {
          data: {
            updateBatch: {
              ...baseBatch,
              status: "Uploaded",
            },
          },
        },
      },
    ];

    const { getByTestId } = render(
      <TestParent
        mocks={mocks}
        context={{ ...baseContext, user: { ...baseUser, role: "Submitter" } }}
      >
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "id-upload-button-text",
            metadataValidationStatus: "New",
            fileValidationStatus: "New",
          }}
          onCreateBatch={jest.fn()}
          onUpload={jest.fn()}
        />
      </TestParent>
    );

    const file = new File(["unused-content"], "metadata.txt", { type: "text/plain" });
    userEvent.upload(getByTestId("metadata-upload-file-input"), file);

    // NOTE: We're not awaiting this because we want to test the button state before the upload is complete
    userEvent.click(getByTestId("metadata-upload-file-upload-button"));

    await waitFor(() =>
      expect(getByTestId("metadata-upload-file-upload-button")).toHaveTextContent(/Uploading.../i)
    );
  });

  it("should show the total count of valid files selected", async () => {
    const { getByTestId } = render(
      <TestParent context={{ ...baseContext, user: { ...baseUser, role: "Submitter" } }}>
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "id-file-count-test",
            metadataValidationStatus: null,
            fileValidationStatus: null,
          }}
          onCreateBatch={jest.fn()}
          onUpload={jest.fn()}
        />
      </TestParent>
    );

    const files = new Array(10).fill(
      new File(["unused-content"], "fake-metadata.txt", { type: "text/plain" })
    );
    userEvent.upload(getByTestId("metadata-upload-file-input"), files);
    expect(getByTestId("metadata-upload-file-count")).toHaveTextContent(/10 files selected/i);
  });

  it("should reset the selected files if the user uploads no files after selecting some", async () => {
    const { getByTestId } = render(
      <TestParent context={{ ...baseContext, user: { ...baseUser, role: "Submitter" } }}>
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "id-file-count-test",
            metadataValidationStatus: null,
            fileValidationStatus: null,
          }}
          onCreateBatch={jest.fn()}
          onUpload={jest.fn()}
        />
      </TestParent>
    );

    const file = new File(["unused-content"], "fake-metadata.txt", { type: "text/plain" });
    userEvent.upload(getByTestId("metadata-upload-file-input"), file);
    expect(getByTestId("metadata-upload-file-count")).toHaveTextContent(/1 file selected/i);

    userEvent.upload(getByTestId("metadata-upload-file-input"), []);
    expect(getByTestId("metadata-upload-file-count")).toHaveTextContent(/No files selected/i);
  });

  it.each<{ ext: string; type: string }>([
    { ext: ".txt", type: "text/plain" },
    { ext: ".tsv", type: "text/tab-separated-values" },
  ])("should accept '$ext' extension for metadata files", async ({ ext, type }) => {
    const { getByTestId } = render(
      <TestParent context={{ ...baseContext, user: { ...baseUser, role: "Submitter" } }}>
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "id-approved-file-exts",
            metadataValidationStatus: null,
            fileValidationStatus: null,
          }}
          onCreateBatch={jest.fn()}
          onUpload={jest.fn()}
        />
      </TestParent>
    );

    const file = new File(["unused-content"], `allowed-text${ext}`, { type });
    userEvent.upload(getByTestId("metadata-upload-file-input"), file);
    expect(getByTestId("metadata-upload-file-count")).toHaveTextContent(/1 file selected/i);
  });

  // NOTE: This is just a generic smoke test, not a comprehensive test for all possible file types
  it.each<{ ext: string; type: string }>([
    { ext: ".json", type: "application/json" },
    { ext: ".csv", type: "text/csv" },
    { ext: ".xls", type: "application/vnd.ms-excel" },
  ])("should not accept '$ext' extension for metadata files", async ({ ext, type }) => {
    const { getByTestId } = render(
      <TestParent context={{ ...baseContext, user: { ...baseUser, role: "Submitter" } }}>
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "id-blacklisted-file-exts",
            metadataValidationStatus: null,
            fileValidationStatus: null,
          }}
          onCreateBatch={jest.fn()}
          onUpload={jest.fn()}
        />
      </TestParent>
    );

    // NOTE: this is already selected by default

    const file = new File(["unused-content"], `NOT-text${ext}`, { type });
    userEvent.upload(getByTestId("metadata-upload-file-input"), file);
    expect(getByTestId("metadata-upload-file-count")).toHaveTextContent(/No files selected/i);
  });

  it("should not be enabled when user is missing the required permissions", async () => {
    const { getByTestId } = render(
      <TestParent
        context={{
          ...baseContext,
          user: { ...baseUser, _id: "not-owner", role: "Submitter", permissions: [] },
        }}
      >
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: `readonly-for-non-owner`,
            metadataValidationStatus: "Passed",
            fileValidationStatus: "Passed",
            submitterID: "random-id-owner",
          }}
          onCreateBatch={jest.fn()}
          onUpload={jest.fn()}
        />
      </TestParent>
    );

    expect(getByTestId("metadata-upload-file-select-button")).toBeDisabled();
  });

  it("should be enabled when user has the required permissions", async () => {
    const { getByTestId } = render(
      <TestParent
        context={{
          ...baseContext,
          user: {
            ...baseUser,
            role: "Submitter",
            _id: "test-user",
            permissions: ["data_submission:view", "data_submission:create"],
          },
        }}
      >
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "readonly-for-non-owner",
            metadataValidationStatus: "Passed",
            fileValidationStatus: "Passed",
            submitterID: "test-user",
          }}
          onCreateBatch={jest.fn()}
          onUpload={jest.fn()}
        />
      </TestParent>
    );

    const uploadButton = getByTestId("metadata-upload-file-select-button");

    expect(uploadButton).toBeEnabled();
  });

  it("should disable the Choose Files button when readOnly is true", () => {
    const { getByTestId } = render(
      <TestParent context={{ ...baseContext, user: { ...baseUser, role: "Submitter" } }}>
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "id-readonly-choose-files",
            metadataValidationStatus: "Passed",
            fileValidationStatus: "Passed",
          }}
          onCreateBatch={jest.fn()}
          onUpload={jest.fn()}
          readOnly
        />
      </TestParent>
    );

    expect(getByTestId("metadata-upload-file-select-button")).toBeDisabled();
  });

  it("should disable the 'Choose Files' and 'Upload' buttons when a non-submission owner user does not have create permissions and is not a collaborator", () => {
    const { getByTestId } = render(
      <TestParent
        context={{
          ...baseContext,
          user: {
            ...baseUser,
            _id: "other-user-2",
            role: "Submitter",
            permissions: ["data_submission:view"],
          },
        }}
      >
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "id-readonly-choose-files",
            metadataValidationStatus: "Passed",
            fileValidationStatus: "Passed",
            submitterID: "some-other-user",
            collaborators: [
              {
                collaboratorID: "other-user",
                collaboratorName: "",
                permission: "Can Edit",
              },
            ],
          }}
          onCreateBatch={jest.fn()}
          onUpload={jest.fn()}
        />
      </TestParent>
    );

    expect(getByTestId("metadata-upload-file-select-button")).toBeDisabled();
    expect(getByTestId("metadata-upload-file-upload-button")).toBeDisabled();
  });

  it("should enable the 'Choose Files' and 'Upload' buttons when user is a collaborator without create permissions", () => {
    const { getByTestId } = render(
      <TestParent
        context={{
          ...baseContext,
          user: {
            ...baseUser,
            _id: "other-user",
            role: "Submitter",
            permissions: ["data_submission:view"],
          },
        }}
      >
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "id-readonly-choose-files",
            metadataValidationStatus: "Passed",
            fileValidationStatus: "Passed",
            submitterID: "some-other-user",
            collaborators: [
              {
                collaboratorID: "other-user",
                collaboratorName: "",
                permission: "Can Edit",
              },
            ],
          }}
          onCreateBatch={jest.fn()}
          onUpload={jest.fn()}
        />
      </TestParent>
    );

    expect(getByTestId("metadata-upload-file-select-button")).toBeEnabled();
    expect(getByTestId("metadata-upload-file-upload-button")).toBeDisabled();

    const file = new File(["unused-content"], "metadata.txt", { type: "text/plain" });
    userEvent.upload(getByTestId("metadata-upload-file-input"), file);

    expect(getByTestId("metadata-upload-file-upload-button")).toBeEnabled();
  });

  it("should enable the 'Choose Files' and 'Upload' buttons when when a collaborator has permissions", () => {
    const { getByTestId } = render(
      <TestParent
        context={{
          ...baseContext,
          user: {
            ...baseUser,
            _id: "collaborator-user",
            role: "Submitter",
            permissions: ["data_submission:view", "data_submission:create"],
          },
        }}
      >
        <MetadataUpload
          submission={{
            ...baseSubmission,
            _id: "id-readonly-choose-files",
            metadataValidationStatus: "Passed",
            fileValidationStatus: "Passed",
            submitterID: "some-other-user",
            collaborators: [
              {
                collaboratorID: "collaborator-user",
                collaboratorName: "",
                permission: "Can Edit",
              },
            ],
          }}
          onCreateBatch={jest.fn()}
          onUpload={jest.fn()}
        />
      </TestParent>
    );

    expect(getByTestId("metadata-upload-file-select-button")).toBeEnabled();
    expect(getByTestId("metadata-upload-file-upload-button")).toBeDisabled();

    const file = new File(["unused-content"], "metadata.txt", { type: "text/plain" });
    userEvent.upload(getByTestId("metadata-upload-file-input"), file);

    expect(getByTestId("metadata-upload-file-upload-button")).toBeEnabled();
  });
});
