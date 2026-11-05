const required = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
  "RESEND_API_KEY",
  "LEAD_NOTIFICATION_FROM_EMAIL",
  "LEAD_ABUSE_SECRET",
  "CRON_SECRET",
  "ANALYTICS_HASH_SECRET",
];

const errors = [];
for (const name of required) {
  if (!process.env[name]?.trim()) errors.push(`${name}: missing`);
}

function secureUrl(name) {
  const value = process.env[name];
  if (!value) return;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") errors.push(`${name}: must use HTTPS`);
    if (["localhost", "127.0.0.1"].includes(url.hostname)) {
      errors.push(`${name}: must not use a local host`);
    }
  } catch {
    errors.push(`${name}: invalid URL`);
  }
}

secureUrl("NEXT_PUBLIC_SITE_URL");
secureUrl("NEXT_PUBLIC_SUPABASE_URL");

for (const name of ["LEAD_ABUSE_SECRET", "CRON_SECRET", "ANALYTICS_HASH_SECRET"]) {
  const value = process.env[name];
  if (value && value.length < 32) errors.push(`${name}: must contain at least 32 characters`);
}

const secrets = ["LEAD_ABUSE_SECRET", "CRON_SECRET", "ANALYTICS_HASH_SECRET"]
  .map((name) => process.env[name])
  .filter(Boolean);
if (new Set(secrets).size !== secrets.length) {
  errors.push("Server-only HMAC/cron secrets must be independent values");
}

if (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  errors.push("Supabase anon and service-role keys must not match");
}

if (
  process.env.LEAD_NOTIFICATION_FROM_EMAIL &&
  !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(process.env.LEAD_NOTIFICATION_FROM_EMAIL)
) {
  errors.push("LEAD_NOTIFICATION_FROM_EMAIL: invalid email address");
}

if (errors.length) {
  console.error("Production environment check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Production environment check passed.");
