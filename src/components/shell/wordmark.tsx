import { Link } from "@/i18n/navigation";

export function Wordmark() {
  return (
    <Link aria-label="Fik Jou3?" className="wordmark" href="/">
      <span>Fik Jou3</span>
      <span aria-hidden="true" className="wordmark-mark">
        ?
      </span>
    </Link>
  );
}
