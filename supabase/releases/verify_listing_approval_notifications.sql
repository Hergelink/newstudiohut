-- Run only inside a rollback transaction. Real approval/status changes and
-- audit/outbox entries in this verification MUST NOT be committed.
select set_config('request.jwt.claim.sub',(select user_id::text from public.platform_admins order by created_at limit 1),true);
set local role authenticated;
do $verify$
declare target public.listings%rowtype; missing text[]; before_count integer; expected integer;
begin
  select listing.* into strict target from public.listings listing where exists(select 1 from public.business_members member where member.business_id=listing.business_id and member.user_id=auth.uid() and member.role='owner') order by (listing.status='pending_review') desc, listing.created_at limit 1;
  perform set_config('studiohut.approval_verification_listing',target.id::text,true);
  perform set_config('studiohut.approval_verification_business',target.business_id::text,true);
  if target.status in ('published','pending_review') then perform public.reopen_listing_for_editing(target.business_id,target.id); end if;
  missing:=public.submit_listing_for_review(target.business_id,target.id);
  if cardinality(missing)>0 then raise exception 'Verification studio is incomplete'; end if;
  perform public.review_listing(target.id,'publish',null);
end;
$verify$;
reset role;
do $verify$
declare expected integer; before_count integer; target uuid:=current_setting('studiohut.approval_verification_listing')::uuid;
begin
  select count(*) into expected from public.business_members member join auth.users recipient on recipient.id=member.user_id where member.business_id=current_setting('studiohut.approval_verification_business')::uuid and member.role='owner' and recipient.email is not null and recipient.email_confirmed_at is not null;
  if expected<1 then raise exception 'A verified owner is required'; end if;
  perform set_config('studiohut.approval_verification_expected',expected::text,true);
  select count(*) into before_count from public.listing_approval_notification_jobs where listing_id=target;
  if before_count<>expected then raise exception 'Approval did not queue exactly one job per owner'; end if;
  update public.listings set status='published' where id=target;
  if (select count(*) from public.listing_approval_notification_jobs where listing_id=target)<>before_count then raise exception 'No-op update queued a duplicate'; end if;
  if exists(select 1 from public.listing_approval_notification_jobs job where job.listing_id=target and not exists(select 1 from public.business_members member where member.business_id=current_setting('studiohut.approval_verification_business')::uuid and member.user_id=job.owner_user_id and member.role='owner')) then raise exception 'Non-owner recipient was queued'; end if;
end;
$verify$;
set local role service_role;
do $verify$
declare claimed integer; target uuid:=current_setting('studiohut.approval_verification_listing')::uuid;
begin
  select count(*) into claimed from public.claim_listing_approval_notification_jobs(100,target);
  if claimed<>current_setting('studiohut.approval_verification_expected')::integer then raise exception 'Wrong owner claim count'; end if;
  if exists(select 1 from public.claim_listing_approval_notification_jobs(100,target)) then raise exception 'Processing jobs were claimed twice'; end if;
end;
$verify$;
reset role;
set local role authenticated;
select public.reopen_listing_for_editing(current_setting('studiohut.approval_verification_business')::uuid,current_setting('studiohut.approval_verification_listing')::uuid);
select public.submit_listing_for_review(current_setting('studiohut.approval_verification_business')::uuid,current_setting('studiohut.approval_verification_listing')::uuid);
select public.review_listing(current_setting('studiohut.approval_verification_listing')::uuid,'reject','Rollback-only notification verification');
reset role;
do $verify$
begin
  if (select count(*) from public.listing_approval_notification_jobs where listing_id=current_setting('studiohut.approval_verification_listing')::uuid)<>current_setting('studiohut.approval_verification_expected')::integer then raise exception 'Rejection queued an approval email'; end if;
end;
$verify$;
set local role service_role;
do $verify$
begin
  if exists(select 1 from public.claim_listing_approval_notification_jobs(100,current_setting('studiohut.approval_verification_listing')::uuid)) then raise exception 'Rejected listing was claimed'; end if;
  if exists(select 1 from public.listing_approval_notification_jobs where listing_id=current_setting('studiohut.approval_verification_listing')::uuid and status in ('pending','processing','failed')) then raise exception 'Unpublished approval was not cancelled'; end if;
end;
$verify$;
reset role;
