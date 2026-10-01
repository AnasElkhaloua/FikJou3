import { z } from "zod";

import { normalizeOptionalPositiveMoney } from "./money";

const optionalUuid = z
  .union([z.literal(""), z.uuid()])
  .transform((value) => value || null);

export const listingInputSchema = z
  .object({
    areaId: optionalUuid,
    categoryId: z.uuid(),
    cityId: z.uuid(),
    deliveryAvailable: z.boolean(),
    description: z.string().trim().max(2000),
    intent: z.enum(["draft", "publish"]),
    pickupAvailable: z.boolean(),
    priceAmount: z.string().transform((value, context) => {
      try {
        return normalizeOptionalPositiveMoney(value);
      } catch {
        context.addIssue({ code: "custom", message: "price" });
        return z.NEVER;
      }
    }),
    title: z.string().trim().min(1).max(120),
  })
  .superRefine((value, context) => {
    if (value.intent === "publish") {
      if (!value.priceAmount)
        context.addIssue({
          code: "custom",
          path: ["priceAmount"],
          message: "price",
        });
      if (!value.areaId)
        context.addIssue({ code: "custom", path: ["areaId"], message: "area" });
      if (!value.pickupAvailable && !value.deliveryAvailable) {
        context.addIssue({
          code: "custom",
          path: ["pickupAvailable"],
          message: "fulfillment",
        });
      }
    }
  });

export type ListingInput = z.infer<typeof listingInputSchema>;

export function listingInputFromFormData(formData: FormData) {
  return listingInputSchema.safeParse({
    areaId: String(formData.get("areaId") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    cityId: String(formData.get("cityId") ?? ""),
    deliveryAvailable: formData.get("deliveryAvailable") === "on",
    description: String(formData.get("description") ?? ""),
    intent: String(formData.get("intent") ?? "draft"),
    pickupAvailable: formData.get("pickupAvailable") === "on",
    priceAmount: String(formData.get("priceAmount") ?? ""),
    title: String(formData.get("title") ?? ""),
  });
}
