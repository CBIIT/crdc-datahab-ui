import { DashboardContentOptions } from "amazon-quicksight-embedding-sdk";
import { addStudiesParameter, addDataCommonsParameter } from "./dashboardUtils";
import { Logger } from "./logger";

jest.mock("./logger", () => ({
  Logger: {
    error: jest.fn(),
  },
}));

describe("addStudiesParameter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an empty array if user has 'All' as the first study", () => {
    const user = {
      studies: [{ _id: "All" }, { _id: "AnotherStudy" }],
    } as unknown as User;

    const result = addStudiesParameter(user);
    expect(result).toEqual([]);
    expect(Logger.error).not.toHaveBeenCalled();
  });

  it("should return an array with studiesParameter if user has valid studies", () => {
    const user = {
      studies: [{ _id: "StudyA" }, { _id: "StudyB" }],
    } as unknown as User;

    const result = addStudiesParameter(user);
    expect(result).toEqual<DashboardContentOptions["parameters"]>([
      {
        Name: "studiesParameter",
        Values: ["StudyA", "StudyB"],
      },
    ]);
    expect(Logger.error).not.toHaveBeenCalled();
  });

  it("should return NO-CONTENT if user has an empty studies array", () => {
    const user = {
      studies: [],
    } as unknown as User;

    const result = addStudiesParameter(user);
    expect(result).toEqual<DashboardContentOptions["parameters"]>([
      {
        Name: "studiesParameter",
        Values: ["NO-CONTENT"],
      },
    ]);
    expect(Logger.error).toHaveBeenCalledTimes(1);
    expect(Logger.error).toHaveBeenCalledWith(
      "Federal Lead requires studies to be set but none or invalid values were found.",
      []
    );
  });

  it("should return NO-CONTENT if user studies is undefined or null", () => {
    const user = {
      studies: null,
    } as unknown as User;

    const result = addStudiesParameter(user);
    expect(result).toEqual<DashboardContentOptions["parameters"]>([
      {
        Name: "studiesParameter",
        Values: ["NO-CONTENT"],
      },
    ]);
    expect(Logger.error).toHaveBeenCalledTimes(1);
  });

  it("should handle a null user gracefully", () => {
    const user = null as unknown as User;
    const result = addStudiesParameter(user);
    expect(result).toEqual<DashboardContentOptions["parameters"]>([
      {
        Name: "studiesParameter",
        Values: ["NO-CONTENT"],
      },
    ]);
    expect(Logger.error).toHaveBeenCalledTimes(1);
  });

  it("should handle an undefined user gracefully", () => {
    const user = undefined as unknown as User;
    const result = addStudiesParameter(user);
    expect(result).toEqual<DashboardContentOptions["parameters"]>([
      {
        Name: "studiesParameter",
        Values: ["NO-CONTENT"],
      },
    ]);
    expect(Logger.error).toHaveBeenCalledTimes(1);
  });
});

describe("addDataCommonsParameter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an array with dataCommonsParameter if user has valid dataCommons", () => {
    const user = {
      dataCommons: ["CommonsA", "CommonsB"],
    } as unknown as User;

    const result = addDataCommonsParameter(user);
    expect(result).toEqual<DashboardContentOptions["parameters"]>([
      {
        Name: "dataCommonsParameter",
        Values: ["CommonsA", "CommonsB"],
      },
    ]);
    expect(Logger.error).not.toHaveBeenCalled();
  });

  it("should return NO-CONTENT if user dataCommons is an empty array", () => {
    const user = {
      dataCommons: [],
    } as unknown as User;

    const result = addDataCommonsParameter(user);
    expect(result).toEqual<DashboardContentOptions["parameters"]>([
      {
        Name: "dataCommonsParameter",
        Values: ["NO-CONTENT"],
      },
    ]);
    expect(Logger.error).toHaveBeenCalledTimes(1);
    expect(Logger.error).toHaveBeenCalledWith(
      "Data Commons Personnel requires dataCommons to be set but none were found.",
      []
    );
  });

  it("should return NO-CONTENT if user dataCommons is null or undefined", () => {
    const user = {
      dataCommons: null,
    } as unknown as User;

    const result = addDataCommonsParameter(user);
    expect(result).toEqual<DashboardContentOptions["parameters"]>([
      {
        Name: "dataCommonsParameter",
        Values: ["NO-CONTENT"],
      },
    ]);
    expect(Logger.error).toHaveBeenCalledTimes(1);
  });

  it("should handle a null user gracefully", () => {
    const user = null as unknown as User;
    const result = addDataCommonsParameter(user);
    expect(result).toEqual<DashboardContentOptions["parameters"]>([
      {
        Name: "dataCommonsParameter",
        Values: ["NO-CONTENT"],
      },
    ]);
    expect(Logger.error).toHaveBeenCalledTimes(1);
  });

  it("should handle an undefined user gracefully", () => {
    const user = undefined as unknown as User;
    const result = addDataCommonsParameter(user);
    expect(result).toEqual<DashboardContentOptions["parameters"]>([
      {
        Name: "dataCommonsParameter",
        Values: ["NO-CONTENT"],
      },
    ]);
    expect(Logger.error).toHaveBeenCalledTimes(1);
  });
});
