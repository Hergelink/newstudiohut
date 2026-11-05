import "server-only";

import { createClient } from "@supabase/supabase-js";

import { assertSupabaseEnv } from "@/config/env";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseRecoveryClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } =
    assertSupabaseEnv();

  return createClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        flowType: "implicit",
        persistSession: false,
      },
    },
  );
}
