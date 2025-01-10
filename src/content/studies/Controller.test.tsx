import React, { FC, useMemo } from "react";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import {
  Context as AuthContext,
  ContextState as AuthContextState,
  Status as AuthContextStatus,
} from "../../components/Contexts/AuthContext";
import StudiesController from "./Controller";
import { SearchParamsProvider } from "../../components/Contexts/SearchParamsContext";
import {
  GET_APPROVED_STUDY,
  GetApprovedStudyInput,
  GetApprovedStudyResp,
  LIST_APPROVED_STUDIES,
  ListApprovedStudiesInput,
  ListApprovedStudiesResp,
} from "../../graphql";

// NOTE: Omitting fields depended on by the component
const baseUser: Omit<User, "role" | "permissions"> = {
  _id: "",
  firstName: "",
  lastName: "",
  userStatus: "Active",
  IDP: "nih",
  email: "",
  dataCommons: [],
  createdAt: "",
  updateAt: "",
  studies: null,
  notifications: [],
};

type ParentProps = {
  role: UserRole;
  permissions?: AuthPermissions[];
  initialEntry?: string;
  mocks?: MockedResponse[];
  ctxStatus?: AuthContextStatus;
  children: React.ReactNode;
};

const TestParent: FC<ParentProps> = ({
  role,
  permissions = ["study:manage"],
  initialEntry = "/studies",
  mocks = [],
  ctxStatus = AuthContextStatus.LOADED,
  children,
}: ParentProps) => {
  const baseAuthCtx: AuthContextState = useMemo<AuthContextState>(
    () => ({
      status: ctxStatus,
      isLoggedIn: role !== null,
      user: { ...baseUser, role, permissions },
    }),
    [role, ctxStatus]
  );

  return (
    <MockedProvider mocks={mocks} showWarnings>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/studies/:studyId?"
            element={
              <AuthContext.Provider value={baseAuthCtx}>
                <SearchParamsProvider>{children}</SearchParamsProvider>
              </AuthContext.Provider>
            }
          />
          <Route path="/" element={<div>Root Page</div>} />
        </Routes>
      </MemoryRouter>
    </MockedProvider>
  );
};

describe("StudiesController", () => {
  it("should render the page without crashing", async () => {
    const listApprovedStudiesMock: MockedResponse<
      ListApprovedStudiesResp,
      ListApprovedStudiesInput
    > = {
      request: {
        query: LIST_APPROVED_STUDIES,
      },
      variableMatcher: () => true,
      result: {
        data: {
          listApprovedStudies: {
            total: 1,
            studies: [
              {
                _id: "study-id-1",
                studyName: "Study Name 1",
                studyAbbreviation: "SN1",
                dbGaPID: "db123456",
                controlledAccess: true,
                openAccess: false,
                PI: "Dr. Smith",
                ORCID: "0000-0001-2345-6789",
                createdAt: "2022-01-01T00:00:00Z",
                originalOrg: "",
              },
            ],
          },
        },
      },
    };

    const { getByTestId } = render(
      <TestParent
        role="Admin"
        ctxStatus={AuthContextStatus.LOADED}
        mocks={[listApprovedStudiesMock]}
      >
        <StudiesController />
      </TestParent>
    );

    await waitFor(() => {
      expect(getByTestId("list-studies-container")).toBeInTheDocument();
    });
  });

  it("should show a loading spinner when the AuthCtx is loading", async () => {
    const { getByTestId } = render(
      <TestParent role="Admin" ctxStatus={AuthContextStatus.LOADING}>
        <StudiesController />
      </TestParent>
    );

    await waitFor(() => {
      expect(getByTestId("studies-suspense-loader")).toBeInTheDocument();
    });
  });

  it("should redirect the user missing the required permissions to the home page", async () => {
    const { getByText } = render(
      <TestParent role="Admin" permissions={[]}>
        <StudiesController />
      </TestParent>
    );

    expect(getByText("Root Page")).toBeInTheDocument();
  });

  it("should render the StudyView when a studyId param is provided", async () => {
    const studyId = "study-id-1";

    const getApprovedStudyMock: MockedResponse<GetApprovedStudyResp, GetApprovedStudyInput> = {
      request: {
        query: GET_APPROVED_STUDY,
      },
      variableMatcher: () => true,
      result: {
        data: {
          getApprovedStudy: {
            _id: studyId,
            studyName: "Study Name 1",
            studyAbbreviation: "SN1",
            dbGaPID: "db123456",
            controlledAccess: true,
            openAccess: false,
            PI: "Dr. Smith",
            ORCID: "0000-0001-2345-6789",
            createdAt: "2022-01-01T00:00:00Z",
            originalOrg: "",
          },
        },
      },
    };

    const { getByTestId } = render(
      <TestParent
        role="Admin"
        ctxStatus={AuthContextStatus.LOADED}
        mocks={[getApprovedStudyMock]}
        initialEntry={`/studies/${studyId}`}
      >
        <StudiesController />
      </TestParent>
    );

    await waitFor(() => {
      expect(getByTestId("study-view-container")).toBeInTheDocument();
    });
  });
});
