-- Append only inside a transaction that ends with ROLLBACK. Never send email
-- from this SQL verification. Changes to a real pending row are rolled back.
do $verify$
declare target uuid; before_count integer; expected integer;
begin
  select id into strict target from public.listings where status = 'pending_review' order by updated_at limit 1;
  select count(*) into expected from public.platform_admins admin join auth.users recipient on recipient.id = admin.user_id where recipient.email is not null and recipient.email_confirmed_at is not null;
  if expected < 1 then raise exception 'A confirmed admin is required'; end if;
  select count(*) into before_count from public.review_notification_jobs where listing_id = target;
  perform set_config('studiohut.review_verification_listing', target::text, true);
  perform set_config('studiohut.review_verification_expected', expected::text, true);
  update public.listings set status = 'draft' where id = target;
  update public.listings set status = 'pending_review' where id = target;
  if (select count(*) from public.review_notification_jobs where listing_id = target) <> before_count + expected then raise exception 'Submission did not enqueue one job per admin'; end if;
  update public.listings set status = 'pending_review' where id = target;
  if (select count(*) from public.review_notification_jobs where listing_id = target) <> before_count + expected then raise exception 'No-op update enqueued duplicate notifications'; end if;
end;
$verify$;
set local role service_role;
do $verify$
declare claimed integer; expected integer := current_setting('studiohut.review_verification_expected')::integer; target uuid := current_setting('studiohut.review_verification_listing')::uuid;
begin
  select count(*) into claimed from public.claim_review_notification_jobs(100, target);
  if claimed <> expected then raise exception 'Claim count %, expected %', claimed, expected; end if;
  select count(*) into claimed from public.claim_review_notification_jobs(100, target);
  if claimed <> 0 then raise exception 'Processing jobs were claimed twice'; end if;
end;
$verify$;
reset role;
update public.listings set status = 'draft' where id = current_setting('studiohut.review_verification_listing')::uuid;
set local role service_role;
do $verify$
begin
  if exists(select 1 from public.claim_review_notification_jobs(100, current_setting('studiohut.review_verification_listing')::uuid)) then raise exception 'Withdrawn submission was claimed'; end if;
  if exists(select 1 from public.review_notification_jobs where listing_id = current_setting('studiohut.review_verification_listing')::uuid and status in ('pending','processing','failed')) then raise exception 'Stale jobs were not cancelled'; end if;
end;
$verify$;
reset role;
