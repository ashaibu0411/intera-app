-- Storage bucket (public) for group images, albums, and files
insert into storage.buckets (id, name, public)
values ('group-media', 'group-media', true)
on conflict (id) do update set public = excluded.public;

-- Public read + authenticated write for group-media bucket
do $$
begin
  begin
    create policy "group_media_bucket_public_read"
    on storage.objects
    for select
    using (bucket_id = 'group-media');
  exception when duplicate_object then
    null;
  end;

  begin
    create policy "group_media_bucket_auth_write"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'group-media' and auth.uid() = owner);
  exception when duplicate_object then
    null;
  end;

  begin
    create policy "group_media_bucket_auth_update_own"
    on storage.objects
    for update
    to authenticated
    using (bucket_id = 'group-media' and auth.uid() = owner)
    with check (bucket_id = 'group-media' and auth.uid() = owner);
  exception when duplicate_object then
    null;
  end;

  begin
    create policy "group_media_bucket_auth_delete_own"
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'group-media' and auth.uid() = owner);
  exception when duplicate_object then
    null;
  end;
end $$;

