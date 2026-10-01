import { ChevronLeft, ChevronRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { DiscoveryInput } from "@/modules/discovery/params";
import { serializeDiscoveryParams } from "@/modules/discovery/params";

export function DiscoveryPagination({
  input,
  labels,
  pageCount,
}: Readonly<{
  input: DiscoveryInput;
  labels: { label: string; next: string; page: string; previous: string };
  pageCount: number;
}>) {
  if (pageCount <= 1) return null;
  const href = (page: number) =>
    `/explore?${serializeDiscoveryParams({ ...input, page }).toString()}`;
  return (
    <nav aria-label={labels.label} className="discovery-pagination">
      {input.page > 1 ? (
        <Link href={href(input.page - 1)} rel="prev">
          <ChevronLeft aria-hidden="true" size={18} />
          {labels.previous}
        </Link>
      ) : (
        <span aria-disabled="true">
          <ChevronLeft aria-hidden="true" size={18} />
          {labels.previous}
        </span>
      )}
      <span>{labels.page}</span>
      {input.page < pageCount ? (
        <Link href={href(input.page + 1)} rel="next">
          {labels.next}
          <ChevronRight aria-hidden="true" size={18} />
        </Link>
      ) : (
        <span aria-disabled="true">
          {labels.next}
          <ChevronRight aria-hidden="true" size={18} />
        </span>
      )}
    </nav>
  );
}
