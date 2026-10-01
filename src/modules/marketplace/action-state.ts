export type MarketplaceActionState = Readonly<{
  message: string;
  status: "idle" | "error" | "success";
}>;

export const initialMarketplaceActionState: MarketplaceActionState = {
  message: "",
  status: "idle",
};
