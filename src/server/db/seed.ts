import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  areas,
  areaTranslations,
  categories,
  categoryTranslations,
  cities,
  cityTranslations,
  countries,
  countryTranslations,
} from "./schema";
import { areaSeeds, categorySeeds, citySeeds, MOROCCO_ID } from "./seed-data";
import type * as schema from "./schema";

export async function seedReferenceData(
  database: NodePgDatabase<typeof schema>,
): Promise<void> {
  await database.transaction(async (transaction) => {
    await transaction
      .insert(countries)
      .values({
        active: true,
        code: "MA",
        currencyCode: "MAD",
        id: MOROCCO_ID,
        slug: "morocco",
      })
      .onConflictDoUpdate({
        set: { active: true, currencyCode: "MAD", slug: "morocco" },
        target: countries.id,
      });

    for (const [locale, name] of [
      ["en", "Morocco"],
      ["fr", "Maroc"],
    ] as const) {
      await transaction
        .insert(countryTranslations)
        .values({ countryId: MOROCCO_ID, locale, name })
        .onConflictDoUpdate({
          set: { name },
          target: [countryTranslations.countryId, countryTranslations.locale],
        });
    }

    for (const city of citySeeds) {
      await transaction
        .insert(cities)
        .values({
          active: true,
          countryId: MOROCCO_ID,
          id: city.id,
          latitude: city.latitude,
          longitude: city.longitude,
          slug: city.slug,
        })
        .onConflictDoUpdate({
          set: {
            active: true,
            countryId: MOROCCO_ID,
            latitude: city.latitude,
            longitude: city.longitude,
            slug: city.slug,
          },
          target: cities.id,
        });

      for (const [locale, name] of [
        ["en", city.en],
        ["fr", city.fr],
      ] as const) {
        await transaction
          .insert(cityTranslations)
          .values({ cityId: city.id, locale, name })
          .onConflictDoUpdate({
            set: { name },
            target: [cityTranslations.cityId, cityTranslations.locale],
          });
      }
    }

    for (const [
      id,
      cityIndex,
      slug,
      latitude,
      longitude,
      en,
      fr,
    ] of areaSeeds) {
      const cityId = citySeeds[cityIndex].id;
      await transaction
        .insert(areas)
        .values({ active: true, cityId, id, latitude, longitude, slug })
        .onConflictDoUpdate({
          set: { active: true, cityId, latitude, longitude, slug },
          target: areas.id,
        });

      for (const [locale, name] of [
        ["en", en],
        ["fr", fr],
      ] as const) {
        await transaction
          .insert(areaTranslations)
          .values({ areaId: id, locale, name })
          .onConflictDoUpdate({
            set: { name },
            target: [areaTranslations.areaId, areaTranslations.locale],
          });
      }
    }

    for (const [sortOrder, [id, slug, en, fr]] of categorySeeds.entries()) {
      await transaction
        .insert(categories)
        .values({ active: true, id, slug, sortOrder })
        .onConflictDoUpdate({
          set: { active: true, slug, sortOrder },
          target: categories.id,
        });

      for (const [locale, name] of [
        ["en", en],
        ["fr", fr],
      ] as const) {
        await transaction
          .insert(categoryTranslations)
          .values({ categoryId: id, locale, name })
          .onConflictDoUpdate({
            set: { name, updatedAt: new Date() },
            target: [
              categoryTranslations.categoryId,
              categoryTranslations.locale,
            ],
          });
      }
    }
  });
}
