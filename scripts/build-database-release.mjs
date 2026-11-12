import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

// Prepare an inspectable SQL release; this script never connects to the database.
const root = process.cwd();
const manifest = JSON.parse(
  await readFile(path.join(root, "supabase/migration-release.json"), "utf8"),
);
const pending = manifest.migrations.filter(
  (item) => item.status === "pending_rehearsal",
);
if (!pending.length) throw new Error("No pending migrations");
const applied = manifest.migrations
  .filter((item) => item.status === "verified_applied")
  .map((item) => item.version);
const quote = (value) => `'${value.replaceAll("'", "''")}'`;
const folder = path.join(
  root,
  "tmp/database-release",
  pending.map((item) => item.version).join("-"),
);
await mkdir(folder, { recursive: true });
const guard = `do $guard$ begin
  if (select array_agg(version order by version) from supabase_migrations.schema_migrations)
    is distinct from array[${applied.map(quote).join(",")}]::text[] then
    raise exception 'Migration history changed; recheck before applying';
  end if;
end; $guard$;`;
const migrations = [];
for (const entry of pending) {
  const sql = await readFile(
    path.join(
      root,
      "supabase/migrations",
      `${entry.version}_${entry.name}.sql`,
    ),
    "utf8",
  );
  if (createHash("sha256").update(sql).digest("hex") !== entry.sha256)
    throw new Error(`Checksum mismatch: ${entry.version}`);
  migrations.push(
    `-- ${entry.version}_${entry.name}\n${sql}\ninsert into supabase_migrations.schema_migrations (version, name, statements) values (${quote(entry.version)},${quote(entry.name)},array[${quote(sql)}]);`,
  );
}
const content = `begin;\nset local lock_timeout = '5s';\nset local statement_timeout = '90s';\n${guard}\n${migrations.join("\n\n")}\nnotify pgrst, 'reload schema';\n`;
await writeFile(
  path.join(folder, "apply.sql"),
  `${content}commit;\nselect 'Applied ${pending.length} migrations atomically' as result;\n`,
);
const verificationPath = path.resolve(
  root,
  process.argv[2] ?? "supabase/releases/verify_workflows.sql",
);
if (
  !verificationPath.startsWith(path.join(root, "supabase/releases/")) ||
  !verificationPath.endsWith(".sql")
)
  throw new Error("Verification must be a SQL file in supabase/releases");
const verification = await readFile(verificationPath, "utf8");
await writeFile(
  path.join(folder, "rehearse.sql"),
  `${content}\n${verification}\nrollback;\nselect 'Migration and workflow rehearsal passed; all changes rolled back' as result;\n`,
);
console.log(
  `Prepared ${pending.length} migrations in ${folder}; no database changes made.`,
);
