import { MapPin, Search } from "lucide-react";

type SearchShellProps = Readonly<{
  action: string;
  cities?: readonly { id: string; name: string; slug: string }[];
  labels: {
    location: string;
    locationPlaceholder: string;
    query: string;
    queryPlaceholder: string;
    submit: string;
  };
}>;

export function SearchShell({ action, cities = [], labels }: SearchShellProps) {
  return (
    <form action={action} className="search-shell" method="get" role="search">
      <label className="search-field">
        <Search aria-hidden="true" size={20} strokeWidth={1.8} />
        <span className="sr-only">{labels.query}</span>
        <input name="q" placeholder={labels.queryPlaceholder} type="search" />
      </label>
      <span aria-hidden="true" className="search-divider" />
      <label className="search-field search-location">
        <MapPin aria-hidden="true" size={20} strokeWidth={1.8} />
        <span className="sr-only">{labels.location}</span>
        <select aria-label={labels.location} defaultValue="" name="city">
          <option value="">{labels.locationPlaceholder}</option>
          {cities.map((city) => (
            <option key={city.id} value={city.slug}>
              {city.name}
            </option>
          ))}
        </select>
      </label>
      <button type="submit">
        <Search aria-hidden="true" size={18} />
        <span>{labels.submit}</span>
      </button>
    </form>
  );
}
