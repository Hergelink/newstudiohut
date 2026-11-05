import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDirectory = path.join(root, "supabase", "migrations");
const manifestPath = path.join(root, "supabase", "migration-release.json");
const allowedStatuses = new Set(["verified_applied", "pending_rehearsal"]);

function fail(errors) {
  console.error("Migration integrity check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
}

const errors = [];
const files = (await readdir(migrationsDirectory))
  .filter((file) => file.endsWith(".sql"))
  .sort();
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const entries = Array.isArray(manifest.migrations) ? manifest.migrations : [];

if (!/^\d{4}-\d{2}-\d{2}$/.test(manifest.liveHistoryVerifiedAt ?? "")) {
  errors.push("manifest liveHistoryVerifiedAt must use YYYY-MM-DD");
}

if (entries.length !== files.length) {
  errors.push(
    `manifest has ${entries.length} entries but the migrations directory has ${files.length} SQL files`,
  );
}

const seenVersions = new Set();
let reachedPending = false;

for (const [index, file] of files.entries()) {
  const match = /^(\d{14})_([a-z0-9_]+)\.sql$/.exec(file);
  if (!match) {
    errors.push(`${file}: expected <14-digit-version>_<snake_case-name>.sql`);
    continue;
  }

  const [, version, name] = match;
  if (seenVersions.has(version)) errors.push(`${file}: duplicate version ${version}`);
  seenVersions.add(version);

  const sql = await readFile(path.join(migrationsDirectory, file), "utf8");
  if (!sql.trim()) errors.push(`${file}: migration is empty`);
  const sha256 = createHash("sha256").update(sql).digest("hex");

  const entry = entries[index];
  if (!entry) continue;
  if (entry.version !== version || entry.name !== name) {
    errors.push(
      `${file}: manifest position ${index + 1} is ${entry.version ?? "missing"}_${entry.name ?? "missing"}`,
    );
  }
  if (!/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")) {
    errors.push(`${file}: manifest sha256 is missing or invalid`);
  } else if (entry.sha256 !== sha256) {
    errors.push(`${file}: content differs from manifest sha256`);
  }
  if (!allowedStatuses.has(entry.status)) {
    errors.push(`${file}: unsupported manifest status ${entry.status ?? "missing"}`);
  }
  if (entry.status === "pending_rehearsal") reachedPending = true;
  if (entry.status === "verified_applied" && reachedPending) {
    errors.push(`${file}: an applied migration cannot follow a pending migration`);
  }
}

if (errors.length) {
  fail(errors);
} else {
  const applied = entries.filter((entry) => entry.status === "verified_applied");
  const pending = entries.filter((entry) => entry.status === "pending_rehearsal");
  console.log(
    `Migration integrity check passed: ${files.length} files, ${applied.length} last verified applied, ${pending.length} pending rehearsal.`,
  );
  if (pending.length) {
    console.log(`Pending order: ${pending.map((entry) => entry.version).join(" -> ")}`);
  }
}
