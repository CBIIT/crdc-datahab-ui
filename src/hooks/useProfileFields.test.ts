import { renderHook } from "@testing-library/react";
import * as Auth from "../components/Contexts/AuthContext";
import useProfileFields, { FieldState } from "./useProfileFields";

describe("Users View", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // NOTE: This is mostly a sanity check to ensure we're ignoring the signed-in user's role
  it.each<UserRole>(["Admin", "Data Commons Personnel", "Federal Lead", "Submitter", "User"])(
    "should return UNLOCKED for role, status, and PBAC when viewing users with management permission (%s)",
    (role) => {
      const user = { _id: "User-A", role, permissions: ["user:manage"] } as User;
      const profileOf: Pick<User, "_id" | "role"> = { _id: "I-Am-User-B", role: "Submitter" };

      jest.spyOn(Auth, "useAuthContext").mockReturnValue({ user } as Auth.ContextState);

      const { result } = renderHook(() => useProfileFields(profileOf, "users"));

      expect(result.current.role).toBe("UNLOCKED");
      expect(result.current.userStatus).toBe("UNLOCKED");
      expect(result.current.permissions).toBe("UNLOCKED");
      expect(result.current.notifications).toBe("UNLOCKED");
    }
  );

  it("should return READ_ONLY for all standard fields when a Submitter views the page", () => {
    const user = { _id: "User-A", role: "Submitter" } as User;
    const profileOf: Pick<User, "_id" | "role"> = { _id: "I-Am-User-B", role: "Submitter" };

    jest.spyOn(Auth, "useAuthContext").mockReturnValue({ user } as Auth.ContextState);

    const { result } = renderHook(() => useProfileFields(profileOf, "users"));

    expect(result.current.firstName).toBe("READ_ONLY");
    expect(result.current.lastName).toBe("READ_ONLY");
    expect(result.current.role).toBe("READ_ONLY");
    expect(result.current.userStatus).toBe("READ_ONLY");
  });

  it.each<[FieldState, UserRole]>([
    ["HIDDEN", "User"],
    ["HIDDEN", "Data Commons Personnel"],
    ["HIDDEN", "Admin"],
    ["HIDDEN", "fake role" as UserRole],
    // NOTE: All of the following are assigned to studies
    ["UNLOCKED", "Federal Lead"],
    ["UNLOCKED", "Submitter"],
  ])("should return %s for the studies field on the users page for role %s", (state, role) => {
    const user = { _id: "User-A", role: "Admin", permissions: ["user:manage"] } as User;
    const profileOf: Pick<User, "_id" | "role"> = { _id: "I-Am-User-B", role };

    jest.spyOn(Auth, "useAuthContext").mockReturnValue({ user } as Auth.ContextState);

    const { result } = renderHook(() => useProfileFields(profileOf, "users"));

    expect(result.current.studies).toBe(state);
  });

  it.each<[FieldState, UserRole]>([
    ["HIDDEN", "User"],
    ["HIDDEN", "Submitter"],
    ["HIDDEN", "Federal Lead"],
    ["UNLOCKED", "Data Commons Personnel"], // NOTE: accepts Data Commons
    ["HIDDEN", "Admin"],
    ["HIDDEN", "fake role" as UserRole],
    ["UNLOCKED", "Data Commons Personnel"], // NOTE: accepts Data Commons
  ])("should return %s for the dataCommons field on the users page for role %s", (state, role) => {
    const user = { _id: "User-A", role: "Admin", permissions: ["user:manage"] } as User;
    const profileOf: Pick<User, "_id" | "role"> = { _id: "I-Am-User-B", role };

    jest.spyOn(Auth, "useAuthContext").mockReturnValue({ user } as Auth.ContextState);

    const { result } = renderHook(() => useProfileFields(profileOf, "users"));

    expect(result.current.dataCommons).toBe(state);
  });

  it("should always return READ_ONLY for the firstName and lastName fields on the users page", () => {
    const user = { _id: "User-A", role: "Admin" } as User;
    const profileOf: Pick<User, "_id" | "role"> = { _id: "I-Am-User-B", role: "Submitter" };

    jest.spyOn(Auth, "useAuthContext").mockReturnValue({ user } as Auth.ContextState);

    const { result } = renderHook(() => useProfileFields(profileOf, "users"));

    expect(result.current.firstName).toBe("READ_ONLY");
    expect(result.current.lastName).toBe("READ_ONLY");
  });
});

describe("Profile View", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return UNLOCKED for firstName and lastName when viewing own profile", () => {
    const user = { _id: "User-A", role: "User" } as User;
    const profileOf: Pick<User, "_id" | "role"> = { _id: "User-A", role: "User" };

    jest.spyOn(Auth, "useAuthContext").mockReturnValue({ user } as Auth.ContextState);

    const { result } = renderHook(() => useProfileFields(profileOf, "profile"));

    expect(result.current.firstName).toBe("UNLOCKED");
    expect(result.current.lastName).toBe("UNLOCKED");
  });

  it("should return READ_ONLY for all other normal fields when viewing own profile", () => {
    const user = { _id: "User-A", role: "User" } as User;
    const profileOf: Pick<User, "_id" | "role"> = { _id: "User-A", role: "User" };

    jest.spyOn(Auth, "useAuthContext").mockReturnValue({ user } as Auth.ContextState);

    const { result } = renderHook(() => useProfileFields(profileOf, "profile"));

    expect(result.current.role).toBe("READ_ONLY");
    expect(result.current.userStatus).toBe("READ_ONLY");
  });

  it.each<UserRole>([
    "User",
    "Submitter",
    "Federal Lead",
    "Data Commons Personnel",
    "fake role" as UserRole,
  ])("should return HIDDEN for the studies field on the profile page for role %s", (role) => {
    const user = { _id: "User-A", role } as User;
    const profileOf: Pick<User, "_id" | "role"> = { _id: "User-A", role };

    jest.spyOn(Auth, "useAuthContext").mockReturnValue({ user } as Auth.ContextState);

    const { result } = renderHook(() => useProfileFields(profileOf, "profile"));

    expect(result.current.studies).toBe("HIDDEN");
  });

  it.each<UserRole>([
    "User",
    "Submitter",
    "Federal Lead",
    "Data Commons Personnel",
    "fake role" as UserRole,
  ])(
    "should return HIDDEN for the permissions and notifications panel on the profile page for role %s",
    (role) => {
      const user = { _id: "User-A", role } as User;
      const profileOf: Pick<User, "_id" | "role"> = { _id: "User-A", role };

      jest.spyOn(Auth, "useAuthContext").mockReturnValue({ user } as Auth.ContextState);

      const { result } = renderHook(() => useProfileFields(profileOf, "profile"));

      expect(result.current.permissions).toBe("HIDDEN");
      expect(result.current.notifications).toBe("HIDDEN");
    }
  );

  it.each<[state: FieldState, role: UserRole]>([
    ["HIDDEN", "User"],
    ["HIDDEN", "Submitter"],
    ["HIDDEN", "Federal Lead"],
    ["READ_ONLY", "Data Commons Personnel"], // NOTE: Data Commons visible but read-only
    ["HIDDEN", "Admin"],
    ["HIDDEN", "fake role" as UserRole],
  ])("should return %s for the dataCommons field for the role %s", (state, role) => {
    const user = { _id: "User-A", role } as User;
    const profileOf: Pick<User, "_id" | "role"> = { _id: "User-A", role };

    jest.spyOn(Auth, "useAuthContext").mockReturnValue({ user } as Auth.ContextState);

    const { result } = renderHook(() => useProfileFields(profileOf, "profile"));

    expect(result.current.dataCommons).toBe(state);
  });

  // NOTE: This is a fallback case that should never be reached in the current implementation
  it.each<UserRole>([
    "Admin",
    "Data Commons Personnel",
    "Federal Lead",
    "Submitter",
    "User",
    "fake role" as UserRole,
  ])(
    "should return READ_ONLY for all fields when viewing another user's profile for all roles",
    (role) => {
      const user = { _id: "User-A", role } as User;
      const profileOf: Pick<User, "_id" | "role"> = { _id: "Not-User-B", role: "Submitter" };

      jest.spyOn(Auth, "useAuthContext").mockReturnValue({ user } as Auth.ContextState);

      const { result } = renderHook(() => useProfileFields(profileOf, "profile"));

      expect(result.current.firstName).toBe("READ_ONLY");
      expect(result.current.lastName).toBe("READ_ONLY");
      expect(result.current.role).toBe("READ_ONLY");
      expect(result.current.userStatus).toBe("READ_ONLY");
      expect(result.current.dataCommons).toBe("HIDDEN");
      expect(result.current.studies).toBe("HIDDEN");
      expect(result.current.permissions).toBe("HIDDEN");
      expect(result.current.notifications).toBe("HIDDEN");
    }
  );

  // NOTE: This scenario is obscure to reproduce, but if a Data Commons POC is changed
  // to an Admin and refreshes their profile page, this field would appear unlocked
  it("should return READ_ONLY for an Admin viewing a Data Commons POC profile", () => {
    const user = { _id: "User-A", role: "Admin" } as User;
    const profileOf: Pick<User, "_id" | "role"> = {
      _id: "Not-User-B",
      role: "Data Commons Personnel",
    };

    jest.spyOn(Auth, "useAuthContext").mockReturnValue({ user } as Auth.ContextState);

    const { result } = renderHook(() => useProfileFields(profileOf, "profile"));

    expect(result.current.dataCommons).toBe("READ_ONLY");
  });
});
