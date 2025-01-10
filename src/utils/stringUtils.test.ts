import * as utils from "./stringUtils";

describe("filterAlphaNumeric utility function", () => {
  it("should filter out non-alphanumeric characters", () => {
    const input = "abc-123!@#";
    const result = utils.filterAlphaNumeric(input);

    expect(result).toEqual("abc123");
  });

  it("should allow additional characters", () => {
    const input = "Hello World-123!@#";
    const extraChars = "- ";
    const result = utils.filterAlphaNumeric(input, extraChars);

    expect(result).toEqual("Hello World-123");
  });

  it("should handle special characters that have meaning in regex", () => {
    const input = "abc.123[def]456{ghi}789";
    const extraChars = ".[]{}";
    const result = utils.filterAlphaNumeric(input, extraChars);

    expect(result).toEqual("abc.123[def]456{ghi}789");
  });

  it("should return empty string if no value is passed", () => {
    const result = utils.filterAlphaNumeric(undefined);

    expect(result).toEqual("");
  });

  it("should return empty string if null value is passed", () => {
    const result = utils.filterAlphaNumeric(null);

    expect(result).toEqual("");
  });
});

describe("filterPositiveIntegerString utility function", () => {
  it("should filter out non-integer values and only contain integers", () => {
    const input = "1.1";
    const result = utils.filterPositiveIntegerString(input);
    expect(result).toEqual("11");
  });

  it("should filter out negative integer values and only contain integers", () => {
    const input = "-5";
    const result = utils.filterPositiveIntegerString(input);
    expect(result).toEqual("5");
  });

  it("should allow positive integer values", () => {
    const input = "5";
    const result = utils.filterPositiveIntegerString(input);
    expect(result).toEqual("5");
  });

  it("should return an empty string for non-numeric characters", () => {
    const input = "abc";
    const result = utils.filterPositiveIntegerString(input);
    expect(result).toEqual("");
  });

  it("should extract only the integers for a mixed string with non-integer numbers", () => {
    const input = "3.5abc";
    const result = utils.filterPositiveIntegerString(input);
    expect(result).toEqual("35");
  });

  it("should return an empty string if input string is empty", () => {
    const input = "";
    const result = utils.filterPositiveIntegerString(input);
    expect(result).toEqual("");
  });

  it("should remove leading zeros", () => {
    const input = "00123";
    const result = utils.filterPositiveIntegerString(input);
    expect(result).toEqual("123");
  });

  it("should return an empty string for input with whitespace", () => {
    const input = " 123 ";
    const result = utils.filterPositiveIntegerString(input);
    expect(result).toEqual("123");
  });

  it("should handle very long numbers", () => {
    const input = "1".repeat(10000);
    const result = utils.filterPositiveIntegerString(input);
    expect(result).toEqual(input);
  });

  it("should return an empty string for null string", () => {
    const input = "null";
    const result = utils.filterPositiveIntegerString(input);
    expect(result).toEqual("");
  });

  it("should return an empty string for null value", () => {
    const input = null;
    const result = utils.filterPositiveIntegerString(input);
    expect(result).toEqual("");
  });

  it("should return an empty string for undefined string", () => {
    const input = "undefined";
    const result = utils.filterPositiveIntegerString(input);
    expect(result).toEqual("");
  });

  it("should return an empty string for undefined value", () => {
    const input = undefined;
    const result = utils.filterPositiveIntegerString(input);
    expect(result).toEqual("");
  });

  it("should not allow periods to be in string", () => {
    const input = "1.";
    const result = utils.filterPositiveIntegerString(input);
    expect(result).toEqual("1");
  });
});

describe("titleCase", () => {
  it("should capitalize the first letter of each word", () => {
    expect(utils.titleCase("data file")).toBe("Data File");
  });

  it("should handle single word strings", () => {
    expect(utils.titleCase("participant")).toBe("Participant");
  });

  it("should handle empty strings", () => {
    expect(utils.titleCase("")).toBe("");
  });

  it("should safely handle null values", () => {
    expect(utils.titleCase(null)).toBe("");
  });

  it("should safely handle undefined values", () => {
    expect(utils.titleCase(undefined)).toBe("");
  });

  it("should safely handle non-string values", () => {
    expect(utils.titleCase(["this isnt a string"] as unknown as string)).toBe("");
  });

  it("should handle strings with multiple spaces", () => {
    expect(utils.titleCase("data   file")).toBe("Data   File");
  });

  it("should handle strings with mixed case", () => {
    expect(utils.titleCase("dATa fiLE")).toBe("Data File");
  });
});
describe("compareStrings utility function", () => {
  it("should correctly sort two non-empty strings", () => {
    expect(utils.compareStrings("apple", "banana")).toBeLessThan(0);
    expect(utils.compareStrings("banana", "apple")).toBeGreaterThan(0);
  });

  it("should place empty strings at the beginning of the sort order", () => {
    expect(utils.compareStrings("banana", "")).toBeGreaterThan(0);
    expect(utils.compareStrings("", "apple")).toBeLessThan(0);
  });

  it("should place null values at the beginning of the sort order", () => {
    expect(utils.compareStrings("banana", null)).toBeGreaterThan(0);
    expect(utils.compareStrings(null, "apple")).toBeLessThan(0);
  });

  it("should place spaces values before alphabetical characters in the sort order", () => {
    expect(utils.compareStrings(" ", "banana")).toBeLessThan(0);
    expect(utils.compareStrings("apple", " ")).toBeGreaterThan(0);
  });

  it("should place number values before alphabetical characters in the sort order", () => {
    expect(utils.compareStrings("1", "banana")).toBeLessThan(0);
    expect(utils.compareStrings("apple", "20")).toBeGreaterThan(0);
  });

  it("should place special characters values before numerical characters in the sort order", () => {
    expect(utils.compareStrings("-", "1")).toBeLessThan(0);
    expect(utils.compareStrings("1", "----")).toBeGreaterThan(0);
  });

  it("should treat two empty strings as equal", () => {
    expect(utils.compareStrings("", "")).toBe(0);
  });

  it("should treat two null values as equal", () => {
    expect(utils.compareStrings(null, null)).toBe(0);
  });

  it("should return zero when both strings are identical and non-empty", () => {
    expect(utils.compareStrings("apple", "apple")).toBe(0);
  });

  it("should handle case-sensitive comparisons appropriately", () => {
    expect(utils.compareStrings("apple", "Apple")).toBeLessThan(0);
    expect(utils.compareStrings("Apple", "apple")).toBeGreaterThan(0);
  });
});

describe("moveToFrontOfArray utility function", () => {
  test("moves key element to the front if it exists and is not at the front", () => {
    const originalArray = ["a", "b", "c", "d"];
    const keyElement = "c";
    const expectedArray = ["c", "a", "b", "d"];
    expect(utils.moveToFrontOfArray(originalArray, keyElement)).toEqual(expectedArray);
  });

  test("returns the same array if the key element is already at the front", () => {
    const originalArray = ["c", "a", "b", "d"];
    const keyElement = "c";
    expect(utils.moveToFrontOfArray(originalArray, keyElement)).toEqual(originalArray);
  });

  test("returns the same array if the key element does not exist", () => {
    const originalArray = ["a", "b", "c", "d"];
    const keyElement = "e";
    expect(utils.moveToFrontOfArray(originalArray, keyElement)).toEqual(originalArray);
  });

  test("returns an empty array if the input array is empty", () => {
    const originalArray: string[] = [];
    const keyElement = "a";
    expect(utils.moveToFrontOfArray(originalArray, keyElement)).toEqual([]);
  });

  test("returns the original array if the key element is undefined or empty", () => {
    const originalArray = ["a", "b", "c", "d"];
    const keyElement = "";
    expect(utils.moveToFrontOfArray(originalArray, keyElement)).toEqual(originalArray);
  });

  test("returns the original array if no key element is specified", () => {
    const originalArray = ["a", "b", "c", "d"];
    expect(utils.moveToFrontOfArray(originalArray, undefined as unknown as string)).toEqual(
      originalArray
    );
  });

  test("returns an empty array if both array and key are undefined", () => {
    expect(
      utils.moveToFrontOfArray(undefined as unknown as string[], undefined as unknown as string)
    ).toEqual([]);
  });
});

describe("rearrangeKeys utility function", () => {
  it("should rearrange keys based on keyOrder and append remaining keys", () => {
    const keysArray = ["id", "name", "age", "gender"];
    const keyOrder = ["name", "age"];
    const result = utils.rearrangeKeys(keysArray, keyOrder);
    expect(result).toEqual(["name", "age", "id", "gender"]);
  });

  it("should handle when keyOrder is empty", () => {
    const keysArray = ["id", "name", "age", "gender"];
    const keyOrder: string[] = [];
    const result = utils.rearrangeKeys(keysArray, keyOrder);
    expect(result).toEqual(["id", "name", "age", "gender"]);
  });

  it("should handle when keysArray is empty", () => {
    const keysArray: string[] = [];
    const keyOrder = ["name", "age"];
    const result = utils.rearrangeKeys(keysArray, keyOrder);
    expect(result).toEqual([]);
  });

  it("should handle when keyOrder has keys not in keysArray", () => {
    const keysArray = ["id", "name", "age", "gender"];
    const keyOrder = ["name", "age", "notInArray"];
    const result = utils.rearrangeKeys(keysArray, keyOrder);
    expect(result).toEqual(["name", "age", "id", "gender"]);
  });

  it("should keep the order of keys not in keyOrder as they appear in keysArray", () => {
    const keysArray = ["id", "name", "age", "gender", "email"];
    const keyOrder = ["name", "age"];
    const result = utils.rearrangeKeys(keysArray, keyOrder);
    expect(result).toEqual(["name", "age", "id", "gender", "email"]);
  });

  it("should return keysArray if keyOrder is null or undefined", () => {
    const keysArray = ["id", "name", "age", "gender"];
    expect(utils.rearrangeKeys(keysArray, null as unknown as string[])).toEqual(keysArray);
    expect(utils.rearrangeKeys(keysArray, undefined as unknown as string[])).toEqual(keysArray);
  });

  it("should return empty array if keysArray is null or undefined", () => {
    const keyOrder = ["name", "age"];
    expect(utils.rearrangeKeys(null as unknown as string[], keyOrder)).toEqual([]);
    expect(utils.rearrangeKeys(undefined as unknown as string[], keyOrder)).toEqual([]);
  });

  it("should maintain order of keys not specified in keyOrder", () => {
    const keysArray = ["id", "name", "age", "gender", "email"];
    const keyOrder = ["gender", "name"];
    const result = utils.rearrangeKeys(keysArray, keyOrder);
    expect(result).toEqual(["gender", "name", "id", "age", "email"]);
  });
});

describe("isStringLengthBetween utility function", () => {
  it("should return true when string length is strictly between minLength and maxLength", () => {
    const str = "hello";
    const minLength = 2;
    const maxLength = 10;
    const result = utils.isStringLengthBetween(str, minLength, maxLength);
    expect(result).toBe(true);
  });

  it("should return false when string length is equal to minLength", () => {
    const str = "hi";
    const minLength = 2;
    const maxLength = 5;
    const result = utils.isStringLengthBetween(str, minLength, maxLength);
    expect(result).toBe(false);
  });

  it("should return false when string length is equal to maxLength", () => {
    const str = "hello";
    const minLength = 2;
    const maxLength = 5;
    const result = utils.isStringLengthBetween(str, minLength, maxLength);
    expect(result).toBe(false);
  });

  it("should return false when string length is less than minLength", () => {
    const str = "a";
    const minLength = 2;
    const maxLength = 5;
    const result = utils.isStringLengthBetween(str, minLength, maxLength);
    expect(result).toBe(false);
  });

  it("should return false when string length is greater than maxLength", () => {
    const str = "hello world";
    const minLength = 2;
    const maxLength = 5;
    const result = utils.isStringLengthBetween(str, minLength, maxLength);
    expect(result).toBe(false);
  });

  it("should return false when str is null", () => {
    const str = null;
    const minLength = 1;
    const maxLength = 5;
    const result = utils.isStringLengthBetween(str, minLength, maxLength);
    expect(result).toBe(false);
  });

  it("should return false when str is undefined", () => {
    const str = undefined;
    const minLength = 1;
    const maxLength = 5;
    const result = utils.isStringLengthBetween(str, minLength, maxLength);
    expect(result).toBe(false);
  });

  it("should handle empty string correctly when length is within range", () => {
    const str = "";
    const minLength = -1;
    const maxLength = 1;
    const result = utils.isStringLengthBetween(str, minLength, maxLength);
    expect(result).toBe(true);
  });

  it("should return false when minLength is greater than maxLength", () => {
    const str = "test";
    const minLength = 5;
    const maxLength = 2;
    const result = utils.isStringLengthBetween(str, minLength, maxLength);
    expect(result).toBe(false);
  });

  it("should return false when minLength and maxLength are equal to string length", () => {
    const str = "test";
    const minLength = 4;
    const maxLength = 4;
    const result = utils.isStringLengthBetween(str, minLength, maxLength);
    expect(result).toBe(false);
  });

  it("should return false when minLength and maxLength are negative", () => {
    const str = "test";
    const minLength = -5;
    const maxLength = -1;
    const result = utils.isStringLengthBetween(str, minLength, maxLength);
    expect(result).toBe(false);
  });

  it("should return true when minLength is negative and string length is within range", () => {
    const str = "test";
    const minLength = -1;
    const maxLength = 10;
    const result = utils.isStringLengthBetween(str, minLength, maxLength);
    expect(result).toBe(true);
  });

  it("should return false when minLength and maxLength are zero and string is empty", () => {
    const str = "";
    const minLength = 0;
    const maxLength = 0;
    const result = utils.isStringLengthBetween(str, minLength, maxLength);
    expect(result).toBe(false);
  });

  it("should return false when str is not a string type", () => {
    const str = 12345 as unknown as string;
    const minLength = 2;
    const maxLength = 6;
    const result = utils.isStringLengthBetween(str, minLength, maxLength);
    expect(result).toBe(false);
  });
});
