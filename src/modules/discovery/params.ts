export const DISCOVERY_PAGE_SIZE = 12;
export const MAX_DISCOVERY_PAGE = 100;
export const MAX_SEARCH_LENGTH = 80;

export const discoverySorts = ["newest", "price-asc", "price-desc"] as const;
export type DiscoverySort = (typeof discoverySorts)[number];

export type DiscoveryIssue =
  | "area-without-city"
  | "invalid-area"
  | "invalid-category"
  | "invalid-city"
  | "invalid-page"
  | "invalid-price"
  | "invalid-price-range"
  | "invalid-query"
  | "invalid-sort";

export type DiscoveryInput = Readonly<{
  area: string | null;
  category: string | null;
  city: string | null;
  delivery: boolean;
  maxPrice: string | null;
  minPrice: string | null;
  page: number;
  pickup: boolean;
  query: string;
  sort: DiscoverySort;
}>;

export type RawDiscoveryParams = Record<
  string,
  string | readonly string[] | undefined
>;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const decimalPattern = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/u;

function firstValue(value: string | readonly string[] | undefined) {
  return typeof value === "string" ? value : value?.[0];
}

function parseSlug(
  value: string | undefined,
  issue: DiscoveryIssue,
  issues: DiscoveryIssue[],
) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized.length > 80 || !slugPattern.test(normalized)) {
    issues.push(issue);
    return null;
  }
  return normalized;
}

function parsePrice(value: string | undefined, issues: DiscoveryIssue[]) {
  if (!value) return null;
  const normalized = value.trim();
  if (
    !decimalPattern.test(normalized) ||
    /^0(?:\.0{1,2})?$/u.test(normalized)
  ) {
    issues.push("invalid-price");
    return null;
  }
  return normalized.includes(".")
    ? normalized.replace(/\.?0+$/u, "")
    : normalized;
}

function decimalCents(value: string) {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, "0"));
}

export function normalizeSearchQuery(value: string | undefined) {
  return (value ?? "").normalize("NFKC").replace(/\s+/gu, " ").trim();
}

export function parseDiscoveryParams(raw: RawDiscoveryParams): {
  input: DiscoveryInput;
  issues: DiscoveryIssue[];
} {
  const issues: DiscoveryIssue[] = [];
  let query = normalizeSearchQuery(firstValue(raw.q));
  if (query.length > MAX_SEARCH_LENGTH) {
    query = "";
    issues.push("invalid-query");
  }

  const city = parseSlug(firstValue(raw.city), "invalid-city", issues);
  let area = parseSlug(firstValue(raw.area), "invalid-area", issues);
  if (area && !city) {
    area = null;
    issues.push("area-without-city");
  }
  const category = parseSlug(
    firstValue(raw.category),
    "invalid-category",
    issues,
  );
  const minPrice = parsePrice(firstValue(raw.min), issues);
  const maxPrice = parsePrice(firstValue(raw.max), issues);

  let safeMin = minPrice;
  let safeMax = maxPrice;
  if (safeMin && safeMax && decimalCents(safeMin) > decimalCents(safeMax)) {
    safeMin = null;
    safeMax = null;
    issues.push("invalid-price-range");
  }

  const rawSort = firstValue(raw.sort);
  const sort = discoverySorts.includes(rawSort as DiscoverySort)
    ? (rawSort as DiscoverySort)
    : "newest";
  if (rawSort && sort === "newest" && rawSort !== "newest") {
    issues.push("invalid-sort");
  }

  const rawPage = firstValue(raw.page);
  const parsedPage = rawPage ? Number(rawPage) : 1;
  const page =
    Number.isSafeInteger(parsedPage) &&
    parsedPage >= 1 &&
    parsedPage <= MAX_DISCOVERY_PAGE
      ? parsedPage
      : 1;
  if (rawPage && page === 1 && rawPage !== "1") issues.push("invalid-page");

  return {
    input: {
      area,
      category,
      city,
      delivery: firstValue(raw.delivery) === "1",
      maxPrice: safeMax,
      minPrice: safeMin,
      page,
      pickup: firstValue(raw.pickup) === "1",
      query,
      sort,
    },
    issues: [...new Set(issues)],
  };
}

export function serializeDiscoveryParams(input: DiscoveryInput) {
  const params = new URLSearchParams();
  if (input.query) params.set("q", input.query);
  if (input.city) params.set("city", input.city);
  if (input.area) params.set("area", input.area);
  if (input.category) params.set("category", input.category);
  if (input.minPrice) params.set("min", input.minPrice);
  if (input.maxPrice) params.set("max", input.maxPrice);
  if (input.pickup) params.set("pickup", "1");
  if (input.delivery) params.set("delivery", "1");
  if (input.sort !== "newest") params.set("sort", input.sort);
  if (input.page > 1) params.set("page", String(input.page));
  return params;
}

export function withDiscoveryChanges(
  input: DiscoveryInput,
  changes: Partial<DiscoveryInput>,
) {
  return serializeDiscoveryParams({ ...input, page: 1, ...changes }).toString();
}
