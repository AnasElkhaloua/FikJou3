import { and, asc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type { AppLocale } from "@/i18n/config";
import {
  areas,
  areaTranslations,
  cities,
  cityTranslations,
} from "@/server/db/schema";
import type * as schema from "@/server/db/schema";

export type LocationOption = Readonly<{
  id: string;
  name: string;
  parentId?: string;
}>;

export async function selectActiveLocationOptions(
  database: NodePgDatabase<typeof schema>,
  locale: AppLocale,
) {
  const [cityRows, areaRows] = await Promise.all([
    database
      .select({ id: cities.id, name: cityTranslations.name })
      .from(cities)
      .innerJoin(cityTranslations, eq(cityTranslations.cityId, cities.id))
      .where(and(eq(cities.active, true), eq(cityTranslations.locale, locale)))
      .orderBy(asc(cityTranslations.name)),
    database
      .select({
        id: areas.id,
        name: areaTranslations.name,
        parentId: areas.cityId,
      })
      .from(areas)
      .innerJoin(areaTranslations, eq(areaTranslations.areaId, areas.id))
      .where(and(eq(areas.active, true), eq(areaTranslations.locale, locale)))
      .orderBy(asc(areaTranslations.name)),
  ]);
  return { areas: areaRows, cities: cityRows };
}
