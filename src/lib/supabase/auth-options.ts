export const supabaseAuthOptions = {
  auth: {
    experimental: {
      appendPkceFlowIdToRedirects: true,
    },
  },
} as const;
