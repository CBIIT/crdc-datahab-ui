import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter } from "react-router-dom";
import { FC, useMemo } from "react";
import {
  Context as AuthContext,
  ContextState as AuthContextState,
  Status as AuthContextStatus,
} from "../../components/Contexts/AuthContext";
import DashboardView from "./DashboardView";

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
  role?: UserRole;
  permissions?: AuthPermissions[];
  children: React.ReactElement;
};

const MockParent: FC<ParentProps> = ({
  role = "Admin",
  permissions = ["dashboard:view"],
  children,
}) => {
  const baseAuthCtx: AuthContextState = useMemo<AuthContextState>(
    () => ({
      status: AuthContextStatus.LOADED,
      isLoggedIn: role !== null,
      user: { ...baseUser, role, permissions },
    }),
    [role]
  );

  return (
    <AuthContext.Provider value={baseAuthCtx}>
      <MemoryRouter basename="/">{children}</MemoryRouter>
    </AuthContext.Provider>
  );
};

describe("Accessibility", () => {
  it("should not have any accessibility violations when loading", async () => {
    const { container } = render(<DashboardView url={null} loading currentType="Submission" />, {
      wrapper: MockParent,
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it("should not have any accessibility violations in the default state", async () => {
    const { container } = render(
      <DashboardView url={null} loading={false} currentType="Submission" />,
      {
        wrapper: MockParent,
      }
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
