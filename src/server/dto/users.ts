import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";

import {
  ownPrivateUserSelection,
  publicUserSelection,
} from "./user-projections";

export async function findPublicUser(userId: string) {
  const [user] = await db
    .select(publicUserSelection)
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

export async function findOwnPrivateUser(userId: string) {
  const [user] = await db
    .select(ownPrivateUserSelection)
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}
