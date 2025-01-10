import { hasPermission } from "./AuthPermissions";

const baseApplication: Application = {
  _id: "",
  status: "New",
  createdAt: "",
  updatedAt: "",
  submittedDate: "",
  history: [],
  controlledAccess: false,
  openAccess: false,
  ORCID: "",
  PI: "",
  applicant: {
    applicantID: "owner-123",
    applicantName: "",
    applicantEmail: "",
  },
  questionnaireData: null,
  programName: "",
  studyAbbreviation: "",
  conditional: false,
  pendingConditions: [],
  programAbbreviation: "",
  programDescription: "",
};

const baseSubmission: Submission = {
  _id: "submission-1",
  dataCommons: "commons-1",
  studyID: "study-1",
  submitterID: "owner-123",
  collaborators: [],
  name: "",
  submitterName: "",
  organization: undefined,
  modelVersion: "",
  studyAbbreviation: "",
  dbGaPID: "",
  bucketName: "",
  rootPath: "",
  status: "New",
  metadataValidationStatus: "New",
  fileValidationStatus: "New",
  crossSubmissionStatus: "New",
  deletingData: false,
  archived: false,
  validationStarted: "",
  validationEnded: "",
  validationScope: "New",
  validationType: [],
  fileErrors: [],
  history: [],
  conciergeName: "",
  conciergeEmail: "",
  intention: "New/Update",
  dataType: "Metadata Only",
  otherSubmissions: "",
  nodeCount: 0,
  createdAt: "",
  updatedAt: "",
};

const createUser = (role: UserRole, permissions: AuthPermissions[] = []): User => ({
  role,
  permissions,
  notifications: [],
  _id: "user-1",
  firstName: "Alice",
  lastName: "Smith",
  email: "alice@example.com",
  dataCommons: [],
  studies: [],
  IDP: "nih",
  userStatus: "Active",
  updateAt: "",
  createdAt: "",
});

describe("Basic Permissions", () => {
  it.each<UserRole>([
    "Admin",
    "Data Commons Personnel",
    "Federal Lead",
    "Submitter",
    "User",
    "Invalid-role" as UserRole,
  ])(
    "should allow a user to view the dashboard if they have permission, regardless of '%s' role",
    (role) => {
      const user = createUser(role, ["dashboard:view"]);
      expect(hasPermission(user, "dashboard", "view")).toBe(true);
    }
  );

  it.each<UserRole>([
    "Admin",
    "Data Commons Personnel",
    "Federal Lead",
    "Submitter",
    "User",
    "Invalid-role" as UserRole,
  ])(
    "should deny a user to view the dashboard if they do not have permission, regardless of '%s' role",
    (role) => {
      const user = createUser(role, []);
      expect(hasPermission(user, "dashboard", "view")).toBe(false);
    }
  );

  it("should check only the permission key if the onlyKey param is set to true", () => {
    const user = createUser("Submitter", ["dashboard:view"]);
    expect(hasPermission(user, "dashboard", "view", null, true)).toBe(true);
    expect(hasPermission(user, "access", "request", null, true)).toBe(false);
  });
});

describe("Edge Cases", () => {
  it("should deny permission if the user role is invalid", () => {
    const user = createUser("InvalidRole" as UserRole);
    expect(hasPermission(user, "dashboard", "view")).toBe(false);
  });

  it("should deny permission if the user role is null or undefined", () => {
    const user = createUser(undefined);
    expect(hasPermission(user, "dashboard", "view")).toBe(false);
  });

  it("should deny permission if the action is invalid", () => {
    const user = createUser("Admin");
    expect(hasPermission(user, "dashboard", "invalid_action" as never)).toBe(false);
  });

  it("should deny permission if the resource is invalid", () => {
    const user = createUser("Admin");
    expect(hasPermission(user, "invalid_resource" as never, "view" as never)).toBe(false);
  });
});

describe("submission_request:submit Permission", () => {
  const validStatuses: ApplicationStatus[] = ["In Progress", "Inquired"];
  const invalidStatuses: ApplicationStatus[] = [
    "Approved",
    "In Review",
    "New",
    "Rejected",
    "Submitted",
  ];

  it.each(validStatuses)(
    "should allow the form owner to submit if the status is '%s' without the permission",
    (status) => {
      const user = createUser("Submitter", []);

      const application: Application = {
        ...baseApplication,
        status,
        applicant: {
          ...baseApplication.applicant,
          applicantID: "user-1",
        },
      };

      expect(hasPermission(user, "submission_request", "submit", application)).toBe(true);
    }
  );

  it.each(validStatuses)(
    "should allow a user with 'submission_request:submit' permission key if the status is '%s', even if not owner",
    (status) => {
      const user = createUser("Submitter", ["submission_request:submit"]);
      const application: Application = { ...baseApplication, status };

      expect(hasPermission(user, "submission_request", "submit", application)).toBe(true);
    }
  );

  it("should deny submission if the user is not the owner AND lacks the 'submission_request:submit' permission key", () => {
    const user = createUser("Submitter", []);
    const application: Application = { ...baseApplication, status: "In Progress" };

    expect(hasPermission(user, "submission_request", "submit", application)).toBe(false);
  });

  it.each(invalidStatuses)("should deny submission if the application status is '%s'", (status) => {
    const user = createUser("Submitter", ["submission_request:submit"]);
    const application: Application = { ...baseApplication, status };

    expect(hasPermission(user, "submission_request", "submit", application)).toBe(false);
  });

  it("should return false if application is missing or undefined", () => {
    const user = createUser("Submitter", ["submission_request:submit"]);

    expect(hasPermission(user, "submission_request", "submit", undefined)).toBe(false);
    expect(hasPermission(user, "submission_request", "submit", null)).toBe(false);
  });
});

describe("data_submission:create Permission", () => {
  const createSubmission = {
    ...baseSubmission,
    _id: "submission-1",
    studyID: "study-1",
    dataCommons: "commons-1",
  };

  it("should allow a collaborator (no permission key needed)", () => {
    const user = createUser("User", []);
    const submission: Submission = {
      ...createSubmission,
      collaborators: [
        {
          collaboratorID: user._id,
          collaboratorName: "",
          permission: null,
        },
      ],
    };
    expect(hasPermission(user, "data_submission", "create", submission)).toBe(true);
  });

  it("should allow a submitter who is the submission owner WITH 'data_submission:create' key", () => {
    const user = createUser("Submitter", ["data_submission:create"]);
    user._id = "owner-123";
    expect(hasPermission(user, "data_submission", "create", createSubmission)).toBe(true);
  });

  it("should allow a 'Federal Lead' who is the submission owner WITH 'data_submission:create' key", () => {
    const user = createUser("Federal Lead", ["data_submission:create"]);
    user._id = "owner-123";
    expect(hasPermission(user, "data_submission", "create", createSubmission)).toBe(true);
  });

  it("should allow a 'Data Commons Personnel' who is the submission owner WITH 'data_submission:create' key", () => {
    const user = createUser("Data Commons Personnel", ["data_submission:create"]);
    user._id = "owner-123";
    expect(hasPermission(user, "data_submission", "create", createSubmission)).toBe(true);
  });

  it("should allow 'Admin' who is the submission owner WITH 'data_submission:create' key", () => {
    const user = createUser("Admin", ["data_submission:create"]);
    user._id = "owner-123";
    expect(hasPermission(user, "data_submission", "create", createSubmission)).toBe(true);
  });

  it("should deny if user doesn't meet any condition", () => {
    const user = createUser("User", []);
    expect(hasPermission(user, "data_submission", "create", createSubmission)).toBe(false);
  });

  it("should return false if submission is missing or undefined", () => {
    const user = createUser("Admin", ["data_submission:create"]);
    expect(hasPermission(user, "data_submission", "create", undefined)).toBe(false);
    expect(hasPermission(user, "data_submission", "create", null)).toBe(false);
  });
});

describe("data_submission:review Permission", () => {
  const reviewSubmission = {
    ...baseSubmission,
    _id: "submission-3",
    studyID: "study-3",
    dataCommons: "commons-3",
  };

  it("should allow a 'Federal Lead' with 'data_submission:review' key if they have the matching study", () => {
    const user = createUser("Federal Lead", ["data_submission:review"]);
    user.studies = [{ _id: "study-3" }];
    expect(hasPermission(user, "data_submission", "review", reviewSubmission)).toBe(true);
  });

  it("should allow a 'Federal Lead' with 'data_submission:review' key if they have the 'All' study", () => {
    const user = createUser("Federal Lead", ["data_submission:review"]);
    user.studies = [{ _id: "All" }];
    expect(hasPermission(user, "data_submission", "review", reviewSubmission)).toBe(true);
  });

  it("should allow 'Data Commons Personnel' with 'data_submission:review' key if they have the matching dataCommons", () => {
    const user = createUser("Data Commons Personnel", ["data_submission:review"]);
    user.dataCommons = ["commons-3"];
    expect(hasPermission(user, "data_submission", "review", reviewSubmission)).toBe(true);
  });

  it("should allow 'Admin' with 'data_submission:review' key", () => {
    const user = createUser("Admin", ["data_submission:review"]);
    expect(hasPermission(user, "data_submission", "review", reviewSubmission)).toBe(true);
  });

  it("should deny if user doesn't meet any condition", () => {
    const user = createUser("Submitter", ["data_submission:review"]);
    expect(hasPermission(user, "data_submission", "review", reviewSubmission)).toBe(false);
  });

  it("should return false if submission is missing or undefined", () => {
    const user = createUser("Admin", ["data_submission:review"]);
    expect(hasPermission(user, "data_submission", "review", undefined)).toBe(false);
    expect(hasPermission(user, "data_submission", "review", null)).toBe(false);
  });
});

describe("data_submission:admin_submit Permission", () => {
  const adminSubmitSubmission = {
    ...baseSubmission,
    _id: "submission-4",
    studyID: "study-4",
    dataCommons: "commons-4",
  };

  it("should allow a 'Federal Lead' with 'data_submission:admin_submit' key if they have the matching study", () => {
    const user = createUser("Federal Lead", ["data_submission:admin_submit"]);
    user.studies = [{ _id: "study-4" }];
    expect(hasPermission(user, "data_submission", "admin_submit", adminSubmitSubmission)).toBe(
      true
    );
  });

  it("should allow a 'Federal Lead' with 'data_submission:admin_submit' key if they have the 'All' study", () => {
    const user = createUser("Federal Lead", ["data_submission:admin_submit"]);
    user.studies = [{ _id: "All" }];
    expect(hasPermission(user, "data_submission", "admin_submit", adminSubmitSubmission)).toBe(
      true
    );
  });

  it("should allow 'Data Commons Personnel' with 'data_submission:admin_submit' key if they have the matching dataCommons", () => {
    const user = createUser("Data Commons Personnel", ["data_submission:admin_submit"]);
    user.dataCommons = ["commons-4"];
    expect(hasPermission(user, "data_submission", "admin_submit", adminSubmitSubmission)).toBe(
      true
    );
  });

  it("should allow 'Admin' with 'data_submission:admin_submit' key", () => {
    const user = createUser("Admin", ["data_submission:admin_submit"]);
    expect(hasPermission(user, "data_submission", "admin_submit", adminSubmitSubmission)).toBe(
      true
    );
  });

  it("should deny if user doesn't meet any condition", () => {
    const user = createUser("User", []);
    expect(hasPermission(user, "data_submission", "admin_submit", adminSubmitSubmission)).toBe(
      false
    );
  });

  it("should return false if submission is missing or undefined", () => {
    const user = createUser("Admin", ["data_submission:admin_submit"]);
    expect(hasPermission(user, "data_submission", "admin_submit", undefined)).toBe(false);
    expect(hasPermission(user, "data_submission", "admin_submit", null)).toBe(false);
  });
});

describe("data_submission:confirm Permission", () => {
  const confirmSubmission = {
    ...baseSubmission,
    _id: "submission-5",
    studyID: "study-5",
    dataCommons: "commons-5",
  };

  it("should allow a 'Federal Lead' with 'data_submission:confirm' key if they have the matching study", () => {
    const user = createUser("Federal Lead", ["data_submission:confirm"]);
    user.studies = [{ _id: "study-5" }];
    expect(hasPermission(user, "data_submission", "confirm", confirmSubmission)).toBe(true);
  });

  it("should allow a 'Federal Lead' with 'data_submission:confirm' key if they have the 'All' study", () => {
    const user = createUser("Federal Lead", ["data_submission:confirm"]);
    user.studies = [{ _id: "All" }];
    expect(hasPermission(user, "data_submission", "confirm", confirmSubmission)).toBe(true);
  });

  it("should allow 'Data Commons Personnel' with 'data_submission:confirm' key if they have the matching dataCommons", () => {
    const user = createUser("Data Commons Personnel", ["data_submission:confirm"]);
    user.dataCommons = ["commons-5"];
    expect(hasPermission(user, "data_submission", "confirm", confirmSubmission)).toBe(true);
  });

  it("should allow 'Admin' with 'data_submission:confirm' key", () => {
    const user = createUser("Admin", ["data_submission:confirm"]);
    expect(hasPermission(user, "data_submission", "confirm", confirmSubmission)).toBe(true);
  });

  it("should deny if user doesn't meet any condition", () => {
    const user = createUser("Submitter", ["data_submission:confirm"]);
    expect(hasPermission(user, "data_submission", "confirm", confirmSubmission)).toBe(false);
  });

  it("should return false if submission is missing or undefined", () => {
    const user = createUser("Admin", ["data_submission:confirm"]);
    expect(hasPermission(user, "data_submission", "confirm", undefined)).toBe(false);
    expect(hasPermission(user, "data_submission", "confirm", null)).toBe(false);
  });
});
