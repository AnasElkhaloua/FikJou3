export type MarketplaceErrorCode =
  | "CONFLICT"
  | "FORBIDDEN"
  | "INVALID_STATE"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "UNAVAILABLE"
  | "VALIDATION";

export class MarketplaceError extends Error {
  constructor(public readonly code: MarketplaceErrorCode) {
    super(code);
    this.name = "MarketplaceError";
  }
}
