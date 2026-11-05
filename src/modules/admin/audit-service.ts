import type { AdminAuditRepository } from "@/modules/admin/audit-repository";

export class AdminAuditService {
  constructor(private readonly audit: AdminAuditRepository) {}

  listRecent(limit = 50) {
    return this.audit.listRecent(Math.min(Math.max(limit, 1), 100));
  }
}
