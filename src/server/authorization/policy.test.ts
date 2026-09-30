import { describe, expect, it } from "vitest";

import {
  AuthorizationError,
  requireActive,
  requireAdmin,
  requireAuthenticated,
  requireOwner,
  requireVerified,
  type Principal,
} from "./policy";

const activeUser: Principal = {
  emailVerified: true,
  role: "USER",
  status: "ACTIVE",
  userId: "user-a",
};

describe("authorization policy", () => {
  it("rejects anonymous and unavailable accounts", () => {
    expect(() => requireAuthenticated(null)).toThrowError(
      new AuthorizationError("UNAUTHENTICATED"),
    );
    expect(() =>
      requireActive({ ...activeUser, status: "SUSPENDED" }),
    ).toThrowError(new AuthorizationError("ACCOUNT_UNAVAILABLE"));
  });

  it("requires verified email for protected capabilities", () => {
    expect(() =>
      requireVerified({ ...activeUser, emailVerified: false }),
    ).toThrowError(new AuthorizationError("EMAIL_UNVERIFIED"));
    expect(requireVerified(activeUser)).toEqual(activeUser);
  });

  it("does not trust an unrelated owner or non-admin", () => {
    expect(() => requireOwner(activeUser, "user-b")).toThrowError(
      new AuthorizationError("FORBIDDEN"),
    );
    expect(() => requireAdmin(activeUser)).toThrowError(
      new AuthorizationError("FORBIDDEN"),
    );
  });
});
