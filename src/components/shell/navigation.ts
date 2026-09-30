export type ShellDestination =
  "home" | "explore" | "favorites" | "sell" | "messages" | "profile";

export type ShellNavigationItem = Readonly<{
  destination: ShellDestination;
  href: "/" | "/explore" | null;
}>;

export const desktopNavigation: readonly ShellNavigationItem[] = [
  { destination: "explore", href: "/explore" },
  { destination: "favorites", href: null },
  { destination: "messages", href: null },
  { destination: "sell", href: null },
];

export const mobileNavigation: readonly ShellNavigationItem[] = [
  { destination: "home", href: "/" },
  { destination: "explore", href: "/explore" },
  { destination: "sell", href: null },
  { destination: "messages", href: null },
  { destination: "profile", href: null },
];

export function isNavigationCurrent(
  pathname: string,
  href: ShellNavigationItem["href"],
): boolean {
  if (!href) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
