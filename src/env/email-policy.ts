import { z } from "zod";

const emailAddressSchema = z.email();

const emailFromSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .refine((value) => !value.includes("\r") && !value.includes("\n"), {
    message: "EMAIL_FROM must not contain line breaks.",
  })
  .refine((value) => {
    const bracketedAddress = value.match(/<([^<>]+)>$/u)?.[1];
    return emailAddressSchema.safeParse(bracketedAddress ?? value).success;
  }, "EMAIL_FROM must be an email address or a name followed by <email>.");

const providerConfigurationSchema = z.object({
  apiKey: z.string().trim().startsWith("re_").min(4),
  from: emailFromSchema,
});

type EmailPolicyInput = Readonly<{
  apiKey?: string | undefined;
  from?: string | undefined;
  mode: "development" | "provider";
  productionBuild: boolean;
  runtime: "development" | "test" | "production";
}>;

export type EmailProviderConfiguration = Readonly<{
  apiKey: string;
  from: string;
}>;

export function validateEmailDeliveryPolicy(
  input: EmailPolicyInput,
): EmailProviderConfiguration | null {
  if (
    input.runtime === "production" &&
    !input.productionBuild &&
    input.mode !== "provider"
  ) {
    throw new Error(
      "EMAIL_DELIVERY_MODE=provider is required in the production runtime.",
    );
  }

  if (input.mode === "development") return null;

  return providerConfigurationSchema.parse({
    apiKey: input.apiKey,
    from: input.from,
  });
}
