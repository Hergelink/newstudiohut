import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");
const migration = read(
  "supabase/migrations/20261119000100_hourly_rates_and_facilities.sql",
);
async function fixture() {
  const db = new PGlite();
  await db.exec(`create schema auth; create schema extensions; create table auth.users(id uuid primary key);
 create function extensions.gen_random_uuid() returns uuid language sql as 'select gen_random_uuid()';`);
  const types = read(
    "supabase/migrations/20261027000100_extensions_and_types.sql",
  ).replace(/create extension[^;]*;/, " ");
  await db.exec(types);
  await db.exec(read("supabase/migrations/20261027000200_schema.sql"));
  let catalog = read("supabase/catalog/studio_catalog.sql").split(
    "-- Add structured options",
  )[0];
  catalog = catalog
    .replace("'Lighting setup', 'multi_select'", "'Lighting setup', 'select'")
    .replace('["daylight","artificial"]', '["daylight","artificial","both"]');
  await db.exec(catalog);
  const functions = read(
    "supabase/migrations/20261027000300_functions_and_triggers.sql",
  );
  await db.exec(
    functions.slice(
      functions.indexOf(
        "create or replace function public.validate_listing_feature_value(",
      ),
      functions.indexOf(
        "create or replace function public.enforce_listing_review_transition()",
      ),
    ),
  );
  await db.exec(`insert into auth.users values ('11111111-1111-4111-8111-111111111111');
 insert into public.businesses (name,slug,created_by) values ('Studio tests','studio-tests','11111111-1111-4111-8111-111111111111');
 insert into public.listings (business_id,category_id,name,slug,address_line,district,price_amount,status,published_at)
 select b.id,c.id,'Studio '||lighting,lighting,'Moda Caddesi 10','Kadıköy',10000,'published',now()
 from public.businesses b cross join public.categories c cross join unnest(array['both','daylight','artificial']) lighting where c.slug='fotograf-studyosu';
 insert into public.listing_feature_values(listing_id,feature_definition_id,value_text)
 select l.id,f.id,l.slug from public.listings l cross join public.feature_definitions f where f.key='lighting_setup';
 insert into public.listing_feature_values(listing_id,feature_definition_id,value_text)
 select l.id,f.id,'Existing camera models and access notes' from public.listings l cross join public.feature_definitions f where f.key in ('photo_equipment','access_information');`);
  return db;
}
describe("hourly rate / facilities SQL migration", () => {
  it("executes against the original schema and validation trigger without losing lighting or free text", async () => {
    const db = await fixture();
    try {
      await db.exec("begin;");
      await db.exec(migration);
      const result = await db.query<{
        slug: string;
        minimum_booking_hours: number;
        price_amount: string;
        value_json: string[];
        value_text: string | null;
      }>(
        `select l.slug,l.minimum_booking_hours,l.price_amount,v.value_json,v.value_text from public.listings l join public.listing_feature_values v on v.listing_id=l.id join public.feature_definitions f on f.id=v.feature_definition_id where f.key='lighting_setup' order by l.slug`,
      );
      expect(result.rows).toHaveLength(3);
      expect(
        result.rows.find((row) => row.slug === "both")?.value_json,
      ).toEqual(["daylight", "artificial"]);
      expect(
        result.rows.every(
          (row) =>
            row.minimum_booking_hours === 1 &&
            Number(row.price_amount) === 10000 &&
            row.value_text === null,
        ),
      ).toBe(true);
      expect(
        (
          await db.query(
            "select * from public.listing_feature_values where value_text='Existing camera models and access notes'",
          )
        ).rows,
      ).toHaveLength(6);
      expect(
        (
          await db.query(
            "select * from public.feature_definitions where key='access_facilities' and feature_type='multi_select'",
          )
        ).rows,
      ).toHaveLength(1);
      expect(
        (
          await db.query(
            "select cf.* from public.category_features cf join public.feature_definitions f on f.id=cf.feature_definition_id where f.key='access_facilities' and cf.is_filterable",
          )
        ).rows,
      ).toHaveLength(2);
      for (const invalid of [0, -1, 169]) {
        await db.exec("savepoint invalid_duration;");
        await expect(
          db.exec(
            `update public.listings set minimum_booking_hours=${invalid}`,
          ),
        ).rejects.toThrow();
        await db.exec("rollback to invalid_duration;");
      }
      await db.exec(read("supabase/catalog/studio_facilities.sql"));
      expect(
        (
          await db.query(
            "select * from public.feature_definitions where key='access_facilities'",
          )
        ).rows,
      ).toHaveLength(1);
      await db.exec("rollback;");
      expect(
        (
          await db.query(
            "select * from information_schema.columns where table_name='listings' and column_name='minimum_booking_hours'",
          )
        ).rows,
      ).toHaveLength(0);
    } finally {
      await db.close();
    }
  }, 20000);
});
