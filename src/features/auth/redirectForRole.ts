// Single source of truth for where a signed-in user lands, based on role + status.
export function redirectPathForRole(role?: string | null, status?: string | null): string {
  if (status === "PENDING") return "/pending-approval";
  switch (role) {
    case "PRODUCER":      return "/producer";
    case "VILLAGE_ADMIN": return "/village-admin";
    case "OPERATOR":      return "/operator";
    default:              return "/";
  }
}
