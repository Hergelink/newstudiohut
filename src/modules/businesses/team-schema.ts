import { z } from "zod";

export const businessInvitationSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  role: z.enum(["owner", "manager", "editor"]),
});

export const businessMemberRoleSchema = z.enum(["owner", "manager", "editor"]);

export const invitationTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export type BusinessInvitationInput = z.infer<typeof businessInvitationSchema>;
