-- Storage bucket (public) for profile avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

-- Public read + authenticated write for avatars bucket
do $$
begin
  begin
    create policy "avatars_bucket_public_read"
    on storage.objects
    for select
    using (bucket_id = 'avatars');
  exception when duplicate_object then
    null;
  end;

  begin
    create policy "avatars_bucket_auth_write"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'avatars' and auth.uid() = owner);
  exception when duplicate_object then
    null;
  end;

  begin
    create policy "avatars_bucket_auth_update_own"
    on storage.objects
    for update
    to authenticated
    using (bucket_id = 'avatars' and auth.uid() = owner)
    with check (bucket_id = 'avatars' and auth.uid() = owner);
  exception when duplicate_object then
    null;
  end;

  begin
    create policy "avatars_bucket_auth_delete_own"
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'avatars' and auth.uid() = owner);
  exception when duplicate_object then
    null;
  end;
end $$;

