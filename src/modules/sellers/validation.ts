import { z } from "zod";

const optionalUuid = z
  .union([z.literal(""), z.uuid()])
  .transform((value) => value || null);
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ]{8,20}$/u)
  .or(z.literal(""))
  .transform((value) => value || null);

export const sellerInputSchema = z
  .object({
    allowPhone: z.boolean(),
    allowPlatformMessages: z.boolean(),
    allowWhatsApp: z.boolean(),
    areaId: optionalUuid,
    bio: z.string().trim().max(800),
    cityId: z.uuid(),
    contactPhone: phone,
    displayName: z.string().trim().min(2).max(80),
  })
  .superRefine((value, context) => {
    if ((value.allowPhone || value.allowWhatsApp) && !value.contactPhone) {
      context.addIssue({
        code: "custom",
        path: ["contactPhone"],
        message: "phone",
      });
    }
  });

export type SellerInput = z.infer<typeof sellerInputSchema>;

export function sellerInputFromFormData(formData: FormData) {
  return sellerInputSchema.safeParse({
    allowPhone: formData.get("allowPhone") === "on",
    allowPlatformMessages: formData.get("allowPlatformMessages") === "on",
    allowWhatsApp: formData.get("allowWhatsApp") === "on",
    areaId: String(formData.get("areaId") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    cityId: String(formData.get("cityId") ?? ""),
    contactPhone: String(formData.get("contactPhone") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
  });
}
