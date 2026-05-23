import { describe, expect, it } from "vitest";
import { parseFieldErrors } from "./api";

describe("parseFieldErrors", () => {
  it("maps field: message strings to a record", () => {
    expect(parseFieldErrors(["email: Invalid email", "password: Too short"])).toEqual({
      email: "Invalid email",
      password: "Too short",
    });
  });

  it("ignores errors without a field prefix", () => {
    expect(parseFieldErrors(["Something went wrong"])).toEqual({});
  });
});
