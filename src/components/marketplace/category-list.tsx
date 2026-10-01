import type { PublicCategory } from "@/modules/categories/queries";
import { Link } from "@/i18n/navigation";

export function CategoryList({
  categories,
}: {
  categories: readonly PublicCategory[];
}) {
  return (
    <ul className="category-list">
      {categories.map((category) => (
        <li key={category.id}>
          <Link href={`/explore?category=${encodeURIComponent(category.slug)}`}>
            <span className="category-dot" />
            <span>{category.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
