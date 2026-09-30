export type PreviewMode = "populated" | "empty";

export function canLoadMarketplacePreview(
  nodeEnvironment: string,
  mode: PreviewMode,
): boolean {
  return nodeEnvironment === "development" && mode === "populated";
}
