import * as utils from "./profileUtils";

describe("formatIDP cases", () => {
  it("should format NIH IDP", () => {
    expect(utils.formatIDP("nih")).toBe("NIH");
  });

  it("should format Login.gov IDP", () => {
    expect(utils.formatIDP("login.gov")).toBe("Login.gov");
  });

  it("should ignore case", () => {
    expect(utils.formatIDP("LoGiN.gOv" as User["IDP"])).toBe("Login.gov");
  });

  it("should return the unmodified IDP if it is not a known service", () => {
    expect(utils.formatIDP("unknown" as User["IDP"])).toBe("unknown");
  });

  it("should invalid input without crashing", () => {
    expect(utils.formatIDP(undefined as User["IDP"])).toBe("");
    expect(utils.formatIDP(null as User["IDP"])).toBe("");
    expect(utils.formatIDP({} as User["IDP"])).toBe("");
  });
});

describe("userToCollaborator cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should convert a full user object to a collaborator with default permission", () => {
    const user: Partial<User> = {
      _id: "user-1",
      firstName: "John",
      lastName: "Doe",
    };

    const collaborator = utils.userToCollaborator(user);

    expect(collaborator).toEqual({
      collaboratorID: "user-1",
      collaboratorName: "Doe, John",
      permission: "Can Edit",
    });
  });

  it("should use provided permission", () => {
    const user: Partial<User> = {
      _id: "user-1",
      firstName: "John",
      lastName: "Doe",
    };

    const collaborator = utils.userToCollaborator(user, "Can Edit");

    expect(collaborator.permission).toBe("Can Edit");
  });

  it("should handle missing firstName", () => {
    const user: Partial<User> = {
      _id: "user-1",
      lastName: "Doe",
    };

    const collaborator = utils.userToCollaborator(user);

    expect(collaborator.collaboratorName).toBe("Doe, ");
  });

  it("should handle missing lastName", () => {
    const user: Partial<User> = {
      _id: "user-1",
      firstName: "John",
    };

    const collaborator = utils.userToCollaborator(user);

    expect(collaborator.collaboratorName).toBe(", John");
  });

  it("should handle missing _id", () => {
    const user: Partial<User> = {
      firstName: "John",
      lastName: "Doe",
    };

    const collaborator = utils.userToCollaborator(user);

    expect(collaborator.collaboratorID).toBeUndefined();
  });

  it("should handle null user", () => {
    const collaborator = utils.userToCollaborator(null);

    expect(collaborator).toEqual({
      collaboratorID: undefined,
      collaboratorName: ", ",
      permission: "Can Edit",
    });
  });

  it("should handle undefined user", () => {
    const collaborator = utils.userToCollaborator(undefined);

    expect(collaborator).toEqual({
      collaboratorID: undefined,
      collaboratorName: ", ",
      permission: "Can Edit",
    });
  });

  it("should handle user with empty properties", () => {
    const user: Partial<User> = {
      _id: "",
      firstName: "",
      lastName: "",
    };

    const collaborator = utils.userToCollaborator(user);

    expect(collaborator).toEqual({
      collaboratorID: "",
      collaboratorName: ", ",
      permission: "Can Edit",
    });
  });

  it("should handle user with additional properties", () => {
    const user: Partial<User> = {
      _id: "user-1",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      role: "Admin",
    };

    const collaborator = utils.userToCollaborator(user);

    expect(collaborator).toEqual({
      collaboratorID: "user-1",
      collaboratorName: "Doe, John",
      permission: "Can Edit",
    });
  });
});

describe("columnizePBACGroups cases", () => {
  const baseDefault: PBACDefault = {
    _id: "access:request", // The _id field is not actually used by the util
    name: "",
    group: "",
    order: 0,
    checked: false,
    disabled: false,
  };

  it("should return empty array for invalid input", () => {
    expect(utils.columnizePBACGroups([])).toEqual([]);
    expect(utils.columnizePBACGroups(null)).toEqual([]);
    expect(utils.columnizePBACGroups(undefined)).toEqual([]);
  });

  it("should group PBACDefaults into columns using the default colCount", () => {
    const pbacDefaults: PBACDefault[] = [
      { ...baseDefault, name: "1", group: "A" },
      { ...baseDefault, name: "2", group: "A" },
      { ...baseDefault, name: "3", group: "B" },
      { ...baseDefault, name: "4", group: "B" },
      { ...baseDefault, name: "5", group: "C" },
      { ...baseDefault, name: "6", group: "C" },
    ];

    const columnized = utils.columnizePBACGroups(pbacDefaults);

    expect(columnized).toHaveLength(3);
    expect(columnized[0]).toHaveLength(1);
    expect(columnized[1]).toHaveLength(1);
    expect(columnized[2]).toHaveLength(1);

    expect(columnized[0][0].data).toEqual([
      { ...baseDefault, name: "1", group: "A" },
      { ...baseDefault, name: "2", group: "A" },
    ]);

    expect(columnized[1][0].data).toEqual([
      { ...baseDefault, name: "3", group: "B" },
      { ...baseDefault, name: "4", group: "B" },
    ]);

    expect(columnized[2][0].data).toEqual([
      { ...baseDefault, name: "5", group: "C" },
      { ...baseDefault, name: "6", group: "C" },
    ]);
  });

  it("should group PBACDefaults into columns using a custom colCount", () => {
    const pbacDefaults: PBACDefault[] = [
      { ...baseDefault, name: "1", group: "A" },
      { ...baseDefault, name: "2", group: "B" },
      { ...baseDefault, name: "3", group: "C" },
      { ...baseDefault, name: "4", group: "D" },
      { ...baseDefault, name: "5", group: "E" },
      { ...baseDefault, name: "6", group: "F" },
    ];

    const columnized = utils.columnizePBACGroups(pbacDefaults, 2);

    expect(columnized).toHaveLength(2);
    expect(columnized[0]).toHaveLength(1);
    expect(columnized[1]).toHaveLength(5);
  });

  it("should handle a higher colCount than the number of groups", () => {
    const pbacDefaults: PBACDefault[] = [
      { ...baseDefault, name: "1", group: "A" },
      { ...baseDefault, name: "2", group: "B" },
      { ...baseDefault, name: "3", group: "C" },
    ];

    const columnized = utils.columnizePBACGroups(pbacDefaults, 10);

    expect(columnized).toHaveLength(3);
    expect(columnized[0]).toHaveLength(1);
    expect(columnized[1]).toHaveLength(1);
    expect(columnized[2]).toHaveLength(1);
  });

  it("should handle PBACDefaults with no group", () => {
    const pbacDefaults: PBACDefault[] = [
      { ...baseDefault, name: "1", group: "A" },
      { ...baseDefault, name: "2", group: "B" },
      { ...baseDefault, name: "3", group: "" },
    ];

    const columnized = utils.columnizePBACGroups(pbacDefaults);

    expect(columnized).toHaveLength(3);
    expect(columnized[0]).toHaveLength(1);
    expect(columnized[1]).toHaveLength(1);
    expect(columnized[2]).toHaveLength(1);

    expect(columnized[2][0].data).toEqual([{ ...baseDefault, name: "3", group: "" }]);
  });

  it("should fallback to an empty group name if the PBACDefault has an invalid group name", () => {
    const pbacDefaults: PBACDefault[] = [
      { ...baseDefault, name: "1", group: "valid" },
      { ...baseDefault, name: "2", group: undefined },
      { ...baseDefault, name: "3", group: null },
      { ...baseDefault, name: "4", group: 3 as unknown as string },
      { ...baseDefault, name: "5", group: { Obj: "yes" } as unknown as string },
    ];

    const columnized = utils.columnizePBACGroups(pbacDefaults, 10); // Set to 10 to ensure all groups COULD go to their own column

    expect(columnized).toHaveLength(2);
    expect(columnized[0]).toHaveLength(1);
    expect(columnized[1]).toHaveLength(1); // 1 Group for all invalid

    expect(columnized[0][0].data).toEqual([{ ...baseDefault, name: "1", group: "valid" }]);
    expect(columnized[1][0].name).toBe("");
    expect(columnized[1][0].data).toHaveLength(4); // All invalid groups are together
    expect(columnized[1][0].data).toEqual([
      pbacDefaults[1],
      pbacDefaults[2],
      pbacDefaults[3],
      pbacDefaults[4],
    ]);
  });

  it("should sort the groups in the order: Submission Request, Data Submission, Admin, Miscellaneous", () => {
    const pbacDefaults: PBACDefault[] = [
      { ...baseDefault, name: "6", group: "Random Group 1" }, // 5
      { ...baseDefault, name: "1", group: "Data Submission" }, // 2
      { ...baseDefault, name: "3", group: "Miscellaneous" }, // 4
      { ...baseDefault, name: "2", group: "Admin" }, // 3
      { ...baseDefault, name: "4", group: "Submission Request" }, // 1
    ];

    const columnized = utils.columnizePBACGroups(pbacDefaults, 4);

    expect(columnized).toHaveLength(4);
    expect(columnized[0]).toHaveLength(1);
    expect(columnized[1]).toHaveLength(1);
    expect(columnized[2]).toHaveLength(1);
    expect(columnized[3]).toHaveLength(2);

    expect(columnized[0][0].data).toEqual([
      { ...baseDefault, name: "4", group: "Submission Request" },
    ]);
    expect(columnized[1][0].data).toEqual([
      { ...baseDefault, name: "1", group: "Data Submission" },
    ]);
    expect(columnized[2][0].data).toEqual([{ ...baseDefault, name: "2", group: "Admin" }]);
    expect(columnized[3][0].data).toEqual([{ ...baseDefault, name: "3", group: "Miscellaneous" }]);
    expect(columnized[3][1].data).toEqual([{ ...baseDefault, name: "6", group: "Random Group 1" }]);
  });

  it("should sort the options within each group by their order", () => {
    const pbacDefaults: PBACDefault[] = [
      { ...baseDefault, name: "entry 1", group: "Group01", order: 5 },
      { ...baseDefault, name: "entry 2", group: "Group01", order: 1 },
      { ...baseDefault, name: "entry 3", group: "Group01", order: 3 },
      { ...baseDefault, name: "entry 4", group: "Group01", order: 2 },
      { ...baseDefault, name: "entry 5", group: "Group01", order: 4 },
    ];

    const columnized = utils.columnizePBACGroups(pbacDefaults);
    expect(columnized[0][0].data).toEqual([
      { ...baseDefault, name: "entry 2", group: "Group01", order: 1 },
      { ...baseDefault, name: "entry 4", group: "Group01", order: 2 },
      { ...baseDefault, name: "entry 3", group: "Group01", order: 3 },
      { ...baseDefault, name: "entry 5", group: "Group01", order: 4 },
      { ...baseDefault, name: "entry 1", group: "Group01", order: 5 },
    ]);
  });

  it("should leave the order unchanged if 'order' is null", () => {
    const pbacDefaults: PBACDefault[] = [
      { ...baseDefault, name: "entry 1", group: "Group01", order: null },
      { ...baseDefault, name: "entry 2", group: "Group01", order: null },
      { ...baseDefault, name: "entry 3", group: "Group01", order: null },
    ];

    const columnized = utils.columnizePBACGroups(pbacDefaults);
    expect(columnized[0][0].data).toEqual([
      { ...baseDefault, name: "entry 1", group: "Group01", order: null },
      { ...baseDefault, name: "entry 2", group: "Group01", order: null },
      { ...baseDefault, name: "entry 3", group: "Group01", order: null },
    ]);
  });
});
