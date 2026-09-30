import { users } from "@/server/db/schema";

export const publicUserSelection = {
  createdAt: users.createdAt,
  id: users.id,
  image: users.image,
  name: users.name,
} as const;

export const ownPrivateUserSelection = {
  createdAt: users.createdAt,
  email: users.email,
  emailVerified: users.emailVerified,
  id: users.id,
  name: users.name,
  phoneNumber: users.phoneNumber,
  phoneVerifiedAt: users.phoneVerifiedAt,
  preferredLocale: users.preferredLocale,
  status: users.status,
} as const;
