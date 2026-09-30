export type Principal = Readonly<{
  emailVerified: boolean;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
  userId: string;
}>;

export type AuthorizationErrorCode =
  "UNAUTHENTICATED" | "FORBIDDEN" | "ACCOUNT_UNAVAILABLE" | "EMAIL_UNVERIFIED";

export class AuthorizationError extends Error {
  constructor(public readonly code: AuthorizationErrorCode) {
    super(code);
    this.name = "AuthorizationError";
  }
}

export function requireAuthenticated(
  principal: Principal | null | undefined,
): Principal {
  if (!principal) {
    throw new AuthorizationError("UNAUTHENTICATED");
  }

  return principal;
}

export function requireActive(principal: Principal | null | undefined) {
  const authenticated = requireAuthenticated(principal);
  if (authenticated.status !== "ACTIVE") {
    throw new AuthorizationError("ACCOUNT_UNAVAILABLE");
  }
  return authenticated;
}

export function requireVerified(principal: Principal | null | undefined) {
  const active = requireActive(principal);
  if (!active.emailVerified) {
    throw new AuthorizationError("EMAIL_UNVERIFIED");
  }
  return active;
}

export function requireAdmin(principal: Principal | null | undefined) {
  const active = requireActive(principal);
  if (active.role !== "ADMIN") {
    throw new AuthorizationError("FORBIDDEN");
  }
  return active;
}

export function requireOwner(
  principal: Principal | null | undefined,
  ownerUserId: string,
) {
  const active = requireActive(principal);
  if (active.userId !== ownerUserId) {
    throw new AuthorizationError("FORBIDDEN");
  }
  return active;
}
