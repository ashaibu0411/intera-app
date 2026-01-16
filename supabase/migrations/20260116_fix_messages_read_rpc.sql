-- Fix message unread counts not clearing by providing safe RPC functions
-- for marking messages as read without requiring broad UPDATE policies.
--
-- Run this in Supabase SQL editor (safe to re-run).

-- Mark all unread messages in a single conversation as read for the current user.
create or replace function public.mark_conversation_messages_read(p_conversation_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer := 0;
begin
  -- Must be a participant in the conversation
  if not exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = auth.uid()
  ) then
    return 0;
  end if;

  update public.messages m
  set read = true
  where m.conversation_id = p_conversation_id
    and m.sender_id <> auth.uid()
    and m.read = false;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- Mark all unread messages across all conversations for the current user.
create or replace function public.mark_all_messages_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer := 0;
begin
  update public.messages m
  set read = true
  where m.read = false
    and m.sender_id <> auth.uid()
    and exists (
      select 1
      from public.conversation_participants cp
      where cp.conversation_id = m.conversation_id
        and cp.user_id = auth.uid()
    );

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- Allow app users to call these RPCs.
grant execute on function public.mark_conversation_messages_read(uuid) to authenticated;
grant execute on function public.mark_all_messages_read() to authenticated;

