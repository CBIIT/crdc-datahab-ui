import { FC, useMemo } from "react";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import ExportRequestButton from "./index";
import {
  ContextState as FormContextState,
  Context as FormContext,
  Status as FormStatus,
} from "../Contexts/FormContext";
import { ContextState, Context as AuthCtx, Status as AuthStatus } from "../Contexts/AuthContext";
import { InitialApplication, InitialQuestionnaire } from "../../config/InitialValues";

const mockGenerate = jest.fn();
jest.mock("./pdf/Generate", () => ({
  GenerateDocument: (...args) => mockGenerate(...args),
}));

const mockDownloadBlob = jest.fn();
jest.mock("../../utils", () => ({
  ...jest.requireActual("../../utils"),
  downloadBlob: (...args) => mockDownloadBlob(...args),
}));

type TestParentProps = {
  /**
   * The status of the form context.
   */
  formStatus?: FormStatus;
  /**
   * The form data to provide to the form context.
   */
  formData?: Partial<Application>;
  /**
   * The role of the "current user" viewing the element
   */
  userRole?: UserRole;
  /**
   * The element to use as the print region for the PDF.
   */
  printRegion?: React.ReactNode;
  /**
   * The children to render within the test parent.
   */
  children: React.ReactNode;
};

const TestParent: FC<TestParentProps> = ({
  formStatus = FormStatus.LOADED,
  formData = {},
  userRole = "User",
  printRegion = <div data-pdf-print-region="1" />,
  children,
}: TestParentProps) => {
  const formValue = useMemo<FormContextState>(
    () => ({
      status: formStatus,
      data:
        formStatus === FormStatus.LOADED
          ? {
              ...InitialApplication,
              ...formData,
              questionnaireData: { ...InitialQuestionnaire, ...formData?.questionnaireData },
            }
          : null,
    }),
    [formStatus, formData]
  );

  const authValue = useMemo<ContextState>(
    () => ({
      status: AuthStatus.LOADED,
      user: { role: userRole } as User,
      isLoggedIn: true,
    }),
    [userRole]
  );

  return (
    <AuthCtx.Provider value={authValue}>
      <FormContext.Provider value={formValue}>
        {printRegion}
        {children}
      </FormContext.Provider>
    </AuthCtx.Provider>
  );
};

describe("Accessibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not have any violations", async () => {
    const { container } = render(<ExportRequestButton />, {
      wrapper: (p) => <TestParent {...p} />,
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it("should not have any violations (hover)", async () => {
    const { container, getByTestId, getByRole } = render(<ExportRequestButton />, {
      wrapper: (p) => <TestParent {...p} />,
    });

    userEvent.hover(getByTestId("export-submission-request-button"));

    await waitFor(() => {
      expect(getByRole("tooltip")).toBeInTheDocument();
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it("should not have any violations (disabled)", async () => {
    const { container } = render(<ExportRequestButton disabled />, {
      wrapper: (p) => <TestParent {...p} />,
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Basic Functionality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it("should render without crashing", () => {
    expect(() =>
      render(<ExportRequestButton />, { wrapper: (p) => <TestParent {...p} /> })
    ).not.toThrow();
  });

  it("should disable the button when building the document", async () => {
    jest.useFakeTimers();
    mockGenerate.mockImplementation(
      () =>
        new Promise((res) => {
          setTimeout(() => {
            res("mock pdf data"); // NOTE: This is a placeholder value.
          }, 1000);
        })
    );

    const { getByTestId } = render(<ExportRequestButton />, {
      wrapper: (p) => <TestParent {...p} />,
    });

    userEvent.click(getByTestId("export-submission-request-button"));

    await waitFor(() => {
      expect(getByTestId("export-submission-request-button")).toBeDisabled();
    });

    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it("should disable the button when the disabled prop is passed", () => {
    const { getByTestId } = render(<ExportRequestButton disabled />, {
      wrapper: (p) => <TestParent {...p} />,
    });

    expect(getByTestId("export-submission-request-button")).toBeDisabled();
  });

  it("should disable the button when the FormContext is not loaded", () => {
    const { getByTestId } = render(<ExportRequestButton />, {
      wrapper: (p) => <TestParent formStatus={FormStatus.LOADING} {...p} />,
    });

    expect(getByTestId("export-submission-request-button")).toBeDisabled();
  });

  it("should display an error message on failed export", async () => {
    jest.spyOn(console, "error").mockImplementation(() => null);

    mockGenerate.mockRejectedValue(new Error("mock error"));

    const { getByTestId } = render(<ExportRequestButton />, {
      wrapper: (p) => <TestParent {...p} />,
    });

    userEvent.click(getByTestId("export-submission-request-button"));

    await waitFor(() => {
      expect(global.mockEnqueue).toHaveBeenCalledWith(
        "An error occurred while exporting the Submission Request to PDF.",
        { variant: "error" }
      );
    });
  });

  it("should display an error message if no print region is found", async () => {
    const { getByTestId } = render(<ExportRequestButton />, {
      wrapper: (p) => <TestParent printRegion={null} {...p} />,
    });

    userEvent.click(getByTestId("export-submission-request-button"));

    await waitFor(() => {
      expect(global.mockEnqueue).toHaveBeenCalledWith(
        "An error occurred while exporting the Submission Request to PDF.",
        { variant: "error" }
      );
    });
  });
});

describe("Implementation Requirements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should have a tooltip on hover", async () => {
    const { getByTestId, getByRole, queryByRole } = render(<ExportRequestButton />, {
      wrapper: (p) => <TestParent {...p} />,
    });

    userEvent.hover(getByTestId("export-submission-request-button"));

    await waitFor(() => {
      expect(getByRole("tooltip")).toBeInTheDocument();
    });

    expect(getByRole("tooltip")).toHaveTextContent(
      "Click to export this Submission Request as a PDF."
    );

    userEvent.unhover(getByTestId("export-submission-request-button"));

    await waitFor(() => {
      expect(queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  // NOTE: This component does not currently implement any authorization,
  // this is just future-proofing test coverage.
  it.each<UserRole>(["User", "Submitter", "Federal Lead", "Admin", "fake role" as UserRole])(
    "should be enabled for the user role %s if they can access the page",
    (role) => {
      const { getByTestId } = render(<ExportRequestButton />, {
        wrapper: (p) => <TestParent userRole={role} {...p} />,
      });

      expect(getByTestId("export-submission-request-button")).toBeEnabled();
    }
  );

  it("should format the PDF filename as 'CRDCSubmissionPortal-Request-{studyAbbr}-{submittedDate}.pdf'", async () => {
    const mockFormObject: Partial<Application> = {
      status: "Submitted",
      updatedAt: "2024-09-30T09:10:00.000Z",
      submittedDate: "2024-09-30T09:10:00.000Z",
      questionnaireData: {
        ...InitialQuestionnaire,
        study: {
          ...InitialQuestionnaire.study,
          abbreviation: "TEST",
          name: "Test Study",
        },
      },
      history: [],
    };

    const { getByTestId } = render(<ExportRequestButton />, {
      wrapper: (p) => (
        <TestParent formStatus={FormStatus.LOADED} formData={mockFormObject} {...p} />
      ),
    });

    userEvent.click(getByTestId("export-submission-request-button"));

    await waitFor(() => {
      expect(mockDownloadBlob).toHaveBeenCalledTimes(1);
      expect(mockDownloadBlob).toHaveBeenCalledWith(
        undefined,
        "CRDCSubmissionPortal-Request-TEST-2024-09-30.pdf",
        "application/pdf"
      );
    });
  });

  it.each(["", null, undefined])(
    "should fallback to the study name if the abbreviation is not provided",
    async (abbreviation) => {
      const mockFormObject: Partial<Application> = {
        status: "Submitted",
        updatedAt: "2024-09-30T09:10:00.000Z",
        submittedDate: "2024-09-30T09:10:00.000Z",
        questionnaireData: {
          ...InitialQuestionnaire,
          study: {
            ...InitialQuestionnaire.study,
            abbreviation,
            name: "Test Study",
          },
        },
        history: [],
      };

      const { getByTestId } = render(<ExportRequestButton />, {
        wrapper: (p) => (
          <TestParent formStatus={FormStatus.LOADED} formData={mockFormObject} {...p} />
        ),
      });

      userEvent.click(getByTestId("export-submission-request-button"));

      await waitFor(() => {
        expect(mockDownloadBlob).toHaveBeenCalledTimes(1);
        expect(mockDownloadBlob).toHaveBeenCalledWith(
          undefined,
          "CRDCSubmissionPortal-Request-Test Study-2024-09-30.pdf",
          "application/pdf"
        );
      });
    }
  );

  it("should use the updatedAt date if the status is 'In Progress'", async () => {
    const mockFormObject: Partial<Application> = {
      status: "In Progress",
      updatedAt: "2024-09-30T09:10:00.000Z",
      submittedDate: "2024-10-22T14:10:00.000Z",
      questionnaireData: {
        ...InitialQuestionnaire,
        study: {
          ...InitialQuestionnaire.study,
          abbreviation: "TEST",
          name: "Test Study",
        },
      },
      history: [],
    };

    const { getByTestId } = render(<ExportRequestButton />, {
      wrapper: (p) => (
        <TestParent formStatus={FormStatus.LOADED} formData={mockFormObject} {...p} />
      ),
    });

    userEvent.click(getByTestId("export-submission-request-button"));

    await waitFor(() => {
      expect(mockDownloadBlob).toHaveBeenCalledTimes(1);
      expect(mockDownloadBlob).toHaveBeenCalledWith(
        undefined,
        "CRDCSubmissionPortal-Request-TEST-2024-09-30.pdf",
        "application/pdf"
      );
    });
  });
});
