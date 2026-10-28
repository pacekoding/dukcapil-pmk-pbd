export function canAccessInternalHref(href: string, role: string) {
  if (
    role === "superadmin" ||
    href === "/internal" ||
    href === "/internal/dashboard"
  ) {
    return true;
  }

  if (href.startsWith("/internal/otsus")) {
    return ["superadmin", "admin_sekretariat", "admin_dukcapil", "admin_pmk"].includes(role);
  }

  if (href.startsWith("/internal/dukcapil")) {
    return role === "admin_dukcapil";
  }

  if (href.startsWith("/internal/pmk")) {
    return role === "admin_pmk";
  }

  if (
    href.startsWith("/internal/pegawai") ||
    href.startsWith("/internal/arsip")
  ) {
    return role === "admin_sekretariat";
  }

  return false;
}
