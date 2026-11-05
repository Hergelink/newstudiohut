export type AuthActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string; fields?: Record<string, string[]> };
