import { timingSafeEqual } from "node:crypto";

export function isAuthorizedCronRequest(value: string | null, secret: string) {
  const expected = `Bearer ${secret}`;
  if (!value || value.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}
