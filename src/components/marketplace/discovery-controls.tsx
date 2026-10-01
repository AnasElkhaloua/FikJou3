import { SlidersHorizontal } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { PublicCategory } from "@/modules/categories/queries";
import type { DiscoveryInput } from "@/modules/discovery/params";
import { withDiscoveryChanges } from "@/modules/discovery/params";
import type { LocationOption } from "@/modules/locations/repository";

type Labels = Readonly<{
  allAreas: string;
  allCategories: string;
  allCities: string;
  apply: string;
  area: string;
  category: string;
  city: string;
  clearAll: string;
  delivery: string;
  filters: string;
  maxPrice: string;
  minPrice: string;
  pickup: string;
  query: string;
  queryPlaceholder: string;
  search: string;
  sort: string;
  sortNewest: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
}>;

type Props = Readonly<{
  action: string;
  areas: readonly LocationOption[];
  categories: readonly PublicCategory[];
  cities: readonly LocationOption[];
  input: DiscoveryInput;
  labels: Labels;
}>;

function Fields({ areas, categories, cities, input, labels }: Props) {
  const selectedCity = cities.find((city) => city.slug === input.city);
  const visibleAreas = selectedCity
    ? areas.filter((area) => selectedCity.id === area.parentId)
    : areas;
  return (
    <>
      <label className="discovery-field discovery-query">
        <span>{labels.query}</span>
        <input
          defaultValue={input.query}
          maxLength={80}
          name="q"
          placeholder={labels.queryPlaceholder}
          type="search"
        />
      </label>
      <label className="discovery-field">
        <span>{labels.city}</span>
        <select defaultValue={input.city ?? ""} name="city">
          <option value="">{labels.allCities}</option>
          {cities.map((city) => (
            <option key={city.id} value={city.slug}>
              {city.name}
            </option>
          ))}
        </select>
      </label>
      <label className="discovery-field">
        <span>{labels.area}</span>
        <select defaultValue={input.area ?? ""} name="area">
          <option value="">{labels.allAreas}</option>
          {visibleAreas.map((area) => (
            <option key={area.id} value={area.slug}>
              {selectedCity
                ? area.name
                : `${cities.find((city) => city.id === area.parentId)?.name ?? ""} — ${area.name}`}
            </option>
          ))}
        </select>
      </label>
      <label className="discovery-field">
        <span>{labels.category}</span>
        <select defaultValue={input.category ?? ""} name="category">
          <option value="">{labels.allCategories}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="discovery-field discovery-price">
        <span>{labels.minPrice}</span>
        <input
          defaultValue={input.minPrice ?? ""}
          inputMode="decimal"
          name="min"
          placeholder="MAD"
        />
      </label>
      <label className="discovery-field discovery-price">
        <span>{labels.maxPrice}</span>
        <input
          defaultValue={input.maxPrice ?? ""}
          inputMode="decimal"
          name="max"
          placeholder="MAD"
        />
      </label>
      <label className="discovery-check">
        <input
          defaultChecked={input.pickup}
          name="pickup"
          type="checkbox"
          value="1"
        />
        <span>{labels.pickup}</span>
      </label>
      <label className="discovery-check">
        <input
          defaultChecked={input.delivery}
          name="delivery"
          type="checkbox"
          value="1"
        />
        <span>{labels.delivery}</span>
      </label>
      <label className="discovery-field">
        <span>{labels.sort}</span>
        <select defaultValue={input.sort} name="sort">
          <option value="newest">{labels.sortNewest}</option>
          <option value="price-asc">{labels.sortPriceAsc}</option>
          <option value="price-desc">{labels.sortPriceDesc}</option>
        </select>
      </label>
    </>
  );
}

export function DiscoveryControls(props: Props) {
  return (
    <section aria-label={props.labels.filters} className="discovery-controls">
      <form
        action={props.action}
        className="discovery-form discovery-form-desktop"
        method="get"
      >
        <Fields {...props} />
        <button className="primary-button discovery-apply" type="submit">
          {props.labels.search}
        </button>
      </form>
      <details className="discovery-mobile-filters">
        <summary>
          <SlidersHorizontal aria-hidden="true" size={19} />
          {props.labels.filters}
        </summary>
        <form action={props.action} className="discovery-form" method="get">
          <Fields {...props} />
          <div className="discovery-mobile-actions">
            <Link className="secondary-link" href="/explore">
              {props.labels.clearAll}
            </Link>
            <button className="primary-button" type="submit">
              {props.labels.apply}
            </button>
          </div>
        </form>
      </details>
    </section>
  );
}

export function ActiveFilters({
  areas,
  categories,
  cities,
  input,
  labels,
}: Props) {
  const city = cities.find((item) => item.slug === input.city);
  const area = areas.find(
    (item) => item.slug === input.area && item.parentId === city?.id,
  );
  const category = categories.find((item) => item.slug === input.category);
  const chips = [
    input.query ? { label: `“${input.query}”`, changes: { query: "" } } : null,
    city ? { label: city.name, changes: { area: null, city: null } } : null,
    area ? { label: area.name, changes: { area: null } } : null,
    category ? { label: category.name, changes: { category: null } } : null,
    input.minPrice
      ? {
          label: `${labels.minPrice}: ${input.minPrice} MAD`,
          changes: { minPrice: null },
        }
      : null,
    input.maxPrice
      ? {
          label: `${labels.maxPrice}: ${input.maxPrice} MAD`,
          changes: { maxPrice: null },
        }
      : null,
    input.pickup ? { label: labels.pickup, changes: { pickup: false } } : null,
    input.delivery
      ? { label: labels.delivery, changes: { delivery: false } }
      : null,
  ].filter(Boolean) as { label: string; changes: Partial<DiscoveryInput> }[];
  if (!chips.length) return null;
  return (
    <div className="active-filters" aria-label={labels.filters}>
      {chips.map((chip) => {
        const query = withDiscoveryChanges(input, chip.changes);
        return (
          <Link
            key={chip.label}
            href={query ? `/explore?${query}` : "/explore"}
          >
            {chip.label}
            <span aria-hidden="true">×</span>
          </Link>
        );
      })}
      <Link className="clear-filters" href="/explore">
        {labels.clearAll}
      </Link>
    </div>
  );
}
