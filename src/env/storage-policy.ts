type StoragePolicyInput = Readonly<{
  apiKey: string | undefined;
  apiSecret: string | undefined;
  cloudName: string | undefined;
  driver: "cloudinary" | "local";
  productionBuild: boolean;
  runtime: "development" | "production" | "test";
}>;

export function assertStoragePolicy(input: StoragePolicyInput): void {
  if (
    input.runtime === "production" &&
    !input.productionBuild &&
    input.driver === "local"
  ) {
    throw new Error("Local listing image storage is forbidden in production.");
  }
  if (
    input.driver === "cloudinary" &&
    !input.productionBuild &&
    (!input.cloudName || !input.apiKey || !input.apiSecret)
  ) {
    throw new Error("Cloudinary storage configuration is incomplete.");
  }
}
