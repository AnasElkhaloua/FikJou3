import type { PublicCategory } from "@/modules/categories/queries";

export function CategoryList({
  categories,
}: {
  categories: readonly PublicCategory[];
}) {
  return (
    <ul className="category-list">
      {categories.map((category) => (
        <li key={category.id}>
          <span className="category-dot" />
          <span>{category.name}</span>
        </li>
      ))}
    </ul>
  );
}
