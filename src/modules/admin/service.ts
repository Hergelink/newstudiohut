import type { PlatformAdminRepository } from "@/modules/admin/repository";

export class PlatformAdminService {
  constructor(private readonly admins: PlatformAdminRepository) {}

  canAccess() {
    return this.admins.isCurrentUserPlatformAdmin();
  }
}
