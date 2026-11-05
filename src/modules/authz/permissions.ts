import type { BusinessRole } from "@/lib/supabase/database.types";

export const businessPermissions = [
  "business.read",
  "business.update",
  "members.read",
  "members.manage",
  "listings.read",
  "listings.create",
  "listings.update",
  "listings.delete",
  "leads.read",
  "leads.update",
  "analytics.read",
] as const;

export type BusinessPermission = (typeof businessPermissions)[number];

const grants: Record<BusinessRole, ReadonlySet<BusinessPermission>> = {
  owner: new Set(businessPermissions),
  manager: new Set([
    "business.read",
    "business.update",
    "members.read",
    "listings.read",
    "listings.create",
    "listings.update",
    "listings.delete",
    "leads.read",
    "leads.update",
    "analytics.read",
  ]),
  editor: new Set([
    "business.read",
    "listings.read",
    "listings.create",
    "listings.update",
  ]),
};

export function hasBusinessPermission(role: BusinessRole, permission: BusinessPermission) {
  return grants[role].has(permission);
}
