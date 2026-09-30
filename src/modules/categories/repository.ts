import { and, asc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type { AppLocale } from "@/i18n/config";
import { categories, categoryTranslations } from "@/server/db/schema";
import type * as schema from "@/server/db/schema";

export type PublicCategory = Readonly<{
  id: string;
  name: string;
  slug: string;
}>;

export async function selectActiveCategories(
  database: NodePgDatabase<typeof schema>,
  locale: AppLocale,
): Promise<PublicCategory[]> {
  return database
    .select({
      id: categories.id,
      name: categoryTranslations.name,
      slug: categories.slug,
    })
    .from(categories)
    .innerJoin(
      categoryTranslations,
      eq(categoryTranslations.categoryId, categories.id),
    )
    .where(
      and(eq(categories.active, true), eq(categoryTranslations.locale, locale)),
    )
    .orderBy(asc(categories.sortOrder));
}
