import type { BusinessMembershipRepository } from "@/modules/businesses/repository";

export class BusinessAccessService {
  constructor(private readonly memberships: BusinessMembershipRepository) {}

  listForUser(userId: string) {
    return this.memberships.findForUser(userId);
  }

  async getForUser(userId: string, businessId: string) {
    return (
      (await this.memberships.findForUser(userId)).find(
        (membership) => membership.businessId === businessId,
      ) ?? null
    );
  }

  createWithOwner(name: string, slug: string) {
    return this.memberships.createWithOwner(name, slug);
  }
}
