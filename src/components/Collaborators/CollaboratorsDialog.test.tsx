import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { axe } from "jest-axe";
import { Status as AuthStatus, useAuthContext } from "../Contexts/AuthContext";
import { CollaboratorsProvider, useCollaboratorsContext } from "../Contexts/CollaboratorsContext";
import { useSubmissionContext } from "../Contexts/SubmissionContext";
import CollaboratorsDialog from "./CollaboratorsDialog";

jest.mock("../Contexts/AuthContext", () => ({
  ...jest.requireActual("../Contexts/AuthContext"),
  useAuthContext: jest.fn(),
}));

jest.mock("../Contexts/CollaboratorsContext", () => ({
  ...jest.requireActual("../Contexts/CollaboratorsContext"),
  useCollaboratorsContext: jest.fn(),
}));

jest.mock("../Contexts/SubmissionContext", () => ({
  ...jest.requireActual("../Contexts/SubmissionContext"),
  useSubmissionContext: jest.fn(),
}));

const mockUseAuthContext = useAuthContext as jest.Mock;
const mockUseCollaboratorsContext = useCollaboratorsContext as jest.Mock;
const mockUseSubmissionContext = useSubmissionContext as jest.Mock;

const mockUser: User = {
  _id: "user-1",
  role: "Submitter",
  email: "user1@example.com",
  firstName: "John",
  lastName: "Doe",
  dataCommons: [],
  studies: [],
  IDP: "nih",
  userStatus: "Active",
  updateAt: "",
  createdAt: "",
  permissions: ["data_submission:view", "data_submission:create"],
  notifications: [],
};

const mockSubmission = {
  _id: "submission-1",
  submitterID: "user-1",
  collaborators: [],
  organization: {
    _id: "org-1",
    name: "Organization 1",
  },
} as Submission;

const mockCollaborators = [
  {
    collaboratorID: "user-2",
    collaboratorName: "Jane Smith",
    permission: "Can Edit",
    Organization: {
      orgID: "org-2",
      orgName: "Organization 2",
    },
  },
];

const mockSaveCollaborators = jest.fn();
const mockLoadPotentialCollaborators = jest.fn();
const mockResetCollaborators = jest.fn();
const mockUpdateQuery = jest.fn();

type Props = {
  children: React.ReactNode;
};

const TestParent: React.FC<Props> = ({ children }) => (
  <MockedProvider mocks={[]}>
    <CollaboratorsProvider>{children}</CollaboratorsProvider>
  </MockedProvider>
);

describe("CollaboratorsDialog Accessibility Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuthContext.mockReturnValue({
      user: mockUser,
      status: AuthStatus.LOADED,
    });

    mockUseSubmissionContext.mockReturnValue({
      data: { getSubmission: mockSubmission },
      updateQuery: mockUpdateQuery,
    });

    mockUseCollaboratorsContext.mockReturnValue({
      saveCollaborators: mockSaveCollaborators,
      loadPotentialCollaborators: mockLoadPotentialCollaborators,
      resetCollaborators: mockResetCollaborators,
      loading: false,
    });
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <TestParent>
        <CollaboratorsDialog open onClose={jest.fn()} onSave={jest.fn()} />
      </TestParent>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("CollaboratorsDialog Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuthContext.mockReturnValue({
      user: mockUser,
      status: AuthStatus.LOADED,
    });

    mockUseSubmissionContext.mockReturnValue({
      data: { getSubmission: mockSubmission },
      updateQuery: mockUpdateQuery,
    });

    mockUseCollaboratorsContext.mockReturnValue({
      saveCollaborators: mockSaveCollaborators,
      loadPotentialCollaborators: mockLoadPotentialCollaborators,
      resetCollaborators: mockResetCollaborators,
      loading: false,
    });
  });

  it("renders the dialog when open is true", () => {
    const { getByTestId } = render(
      <TestParent>
        <CollaboratorsDialog open onClose={jest.fn()} onSave={jest.fn()} />
      </TestParent>
    );

    expect(getByTestId("collaborators-dialog")).toBeInTheDocument();
    expect(getByTestId("collaborators-dialog-header")).toHaveTextContent(
      "Data SubmissionCollaborators" // line break between "Submission" and "Collaborators" text
    );
    expect(getByTestId("collaborators-dialog-description")).toHaveTextContent(
      "Below is a list of collaborators who have been granted access to this data submission. Once added, each collaborator can contribute to the submission by uploading data, running validations, and submitting."
    );
  });

  it("does not render the dialog when open is false", () => {
    const { queryByTestId } = render(
      <TestParent>
        <CollaboratorsDialog open={false} onClose={jest.fn()} onSave={jest.fn()} />
      </TestParent>
    );

    expect(queryByTestId("collaborators-dialog")).toBeNull();
  });

  it("calls onClose when close icon is clicked", () => {
    const mockOnClose = jest.fn();
    const { getByTestId } = render(
      <TestParent>
        <CollaboratorsDialog open onClose={mockOnClose} onSave={jest.fn()} />
      </TestParent>
    );

    const closeButton = getByTestId("collaborators-dialog-close-icon-button");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when Close button is clicked", () => {
    mockUseAuthContext.mockReturnValue({
      user: { ...mockUser, _id: "some-other-user" } as User,
      status: AuthStatus.LOADED,
    });

    const mockOnClose = jest.fn();
    const { getByTestId } = render(
      <TestParent>
        <CollaboratorsDialog open onClose={mockOnClose} onSave={jest.fn()} />
      </TestParent>
    );

    const closeButton = getByTestId("collaborators-dialog-close-button");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onSave when Save button is clicked", async () => {
    const mockOnSave = jest.fn();
    const { getByTestId } = render(
      <TestParent>
        <CollaboratorsDialog open onClose={jest.fn()} onSave={mockOnSave} />
      </TestParent>
    );

    mockSaveCollaborators.mockResolvedValue(mockCollaborators);

    const saveButton = getByTestId("collaborators-dialog-save-button");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveCollaborators).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalledWith(mockCollaborators);
      expect(mockUpdateQuery).toHaveBeenCalled();
    });
  });

  it("calls resetCollaborators and onClose when Cancel button is clicked", () => {
    const mockOnClose = jest.fn();
    const { getByTestId } = render(
      <TestParent>
        <CollaboratorsDialog open onClose={mockOnClose} onSave={jest.fn()} />
      </TestParent>
    );

    const cancelButton = getByTestId("collaborators-dialog-cancel-button");
    fireEvent.click(cancelButton);

    expect(mockResetCollaborators).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("loads potential collaborators on mount", () => {
    render(
      <TestParent>
        <CollaboratorsDialog open onClose={jest.fn()} onSave={jest.fn()} />
      </TestParent>
    );

    expect(mockLoadPotentialCollaborators).toHaveBeenCalled();
  });

  it("disables buttons when loading", () => {
    mockUseCollaboratorsContext.mockReturnValue({
      saveCollaborators: mockSaveCollaborators,
      loadPotentialCollaborators: mockLoadPotentialCollaborators,
      resetCollaborators: mockResetCollaborators,
      loading: true,
    });

    const { getByTestId } = render(
      <TestParent>
        <CollaboratorsDialog open onClose={jest.fn()} onSave={jest.fn()} />
      </TestParent>
    );

    const saveButton = getByTestId("collaborators-dialog-save-button");
    const cancelButton = getByTestId("collaborators-dialog-cancel-button");

    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it("updates submission data correctly when previous data exists", async () => {
    const mockOnSave = jest.fn();

    mockUpdateQuery.mockImplementation((callback) => {
      const prev = { getSubmission: { otherData: "test" } };
      const result = callback(prev);
      expect(result).toEqual({
        ...prev,
        getSubmission: {
          ...prev.getSubmission,
          collaborators: mockCollaborators,
        },
      });
    });

    const { getByTestId } = render(
      <TestParent>
        <CollaboratorsDialog open onClose={jest.fn()} onSave={mockOnSave} />
      </TestParent>
    );

    mockSaveCollaborators.mockResolvedValue(mockCollaborators);

    const saveButton = getByTestId("collaborators-dialog-save-button");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveCollaborators).toHaveBeenCalled();
      expect(mockUpdateQuery).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalledWith(mockCollaborators);
    });
  });

  it("updates submission data correctly when previous data is undefined", async () => {
    const mockOnSave = jest.fn();

    mockUpdateQuery.mockImplementation((callback) => {
      const prev = undefined;
      const result = callback(prev);
      expect(result).toEqual({
        ...prev,
        getSubmission: {
          ...prev?.getSubmission,
          collaborators: mockCollaborators,
        },
      });
    });

    const { getByTestId } = render(
      <TestParent>
        <CollaboratorsDialog open onClose={jest.fn()} onSave={mockOnSave} />
      </TestParent>
    );

    mockSaveCollaborators.mockResolvedValue(mockCollaborators);

    const saveButton = getByTestId("collaborators-dialog-save-button");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveCollaborators).toHaveBeenCalled();
      expect(mockUpdateQuery).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalledWith(mockCollaborators);
    });
  });

  it("updates submission data correctly when getSubmission is undefined", async () => {
    const mockOnSave = jest.fn();

    mockUpdateQuery.mockImplementation((callback) => {
      const prev = { getSubmission: undefined };
      const result = callback(prev);
      expect(result).toEqual({
        ...prev,
        getSubmission: {
          ...prev.getSubmission,
          collaborators: mockCollaborators,
        },
      });
    });

    const { getByTestId } = render(
      <TestParent>
        <CollaboratorsDialog open onClose={jest.fn()} onSave={mockOnSave} />
      </TestParent>
    );

    mockSaveCollaborators.mockResolvedValue(mockCollaborators);

    const saveButton = getByTestId("collaborators-dialog-save-button");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveCollaborators).toHaveBeenCalled();
      expect(mockUpdateQuery).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalledWith(mockCollaborators);
    });
  });

  it("should disable inputs when user does not have required permissions", async () => {
    mockUseAuthContext.mockReturnValue({
      user: {
        ...mockUser,
        permissions: ["data_submission:view"],
      } as User,
      status: AuthStatus.LOADED,
    });

    const mockOnClose = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <TestParent>
        <CollaboratorsDialog open onClose={mockOnClose} onSave={jest.fn()} />
      </TestParent>
    );

    expect(queryByTestId("collaborators-dialog-save-button")).not.toBeInTheDocument();
    expect(queryByTestId("collaborators-dialog-cancel-button")).not.toBeInTheDocument();
    expect(getByTestId("collaborators-dialog-close-button")).toBeInTheDocument();
  });

  it("should enable inputs when user has the required permissions", async () => {
    mockUseAuthContext.mockReturnValue({
      user: {
        ...mockUser,
        permissions: ["data_submission:view", "data_submission:create"],
      } as User,
      status: AuthStatus.LOADED,
    });

    const mockOnClose = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <TestParent>
        <CollaboratorsDialog open onClose={mockOnClose} onSave={jest.fn()} />
      </TestParent>
    );

    expect(getByTestId("collaborators-dialog-save-button")).toBeInTheDocument();
    expect(getByTestId("collaborators-dialog-cancel-button")).toBeInTheDocument();
    expect(queryByTestId("collaborators-dialog-close-button")).not.toBeInTheDocument();
  });
});
