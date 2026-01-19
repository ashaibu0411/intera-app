-- ============================================
-- GROUPS SYSTEM TABLES
-- ============================================

-- Main groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  cover_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('church', 'mosque', 'temple', 'synagogue', 'community', 'association', 'other')),
  faith_type TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  country TEXT NOT NULL,
  admin_area TEXT,
  city TEXT NOT NULL,
  neighborhood TEXT,
  location_label TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  website TEXT,
  member_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Group posts table
CREATE TABLE IF NOT EXISTS public.group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  is_notice BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group post comments table
CREATE TABLE IF NOT EXISTS public.group_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group post likes table
CREATE TABLE IF NOT EXISTS public.group_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Group events table
CREATE TABLE IF NOT EXISTS public.group_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  end_time TIME,
  location TEXT,
  address TEXT,
  image TEXT,
  attendees_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group event RSVPs table
CREATE TABLE IF NOT EXISTS public.group_event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.group_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('interested', 'going')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Group albums table
CREATE TABLE IF NOT EXISTS public.group_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  photo_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group photos table
CREATE TABLE IF NOT EXISTS public.group_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.group_albums(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group files table
CREATE TABLE IF NOT EXISTS public.group_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group settings table
CREATE TABLE IF NOT EXISTS public.group_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE UNIQUE,
  events_creation TEXT NOT NULL DEFAULT 'admin_only' CHECK (events_creation IN ('admin_only', 'members')),
  media_upload TEXT NOT NULL DEFAULT 'members' CHECK (media_upload IN ('admin_only', 'members')),
  join_mode TEXT NOT NULL DEFAULT 'open' CHECK (join_mode IN ('open', 'request', 'invite_only')),
  posts_creation TEXT NOT NULL DEFAULT 'members' CHECK (posts_creation IN ('admin_only', 'members')),
  posts_media_allowed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group join requests table
CREATE TABLE IF NOT EXISTS public.group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Group invites table
CREATE TABLE IF NOT EXISTS public.group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_groups_category ON public.groups(category);
CREATE INDEX IF NOT EXISTS idx_groups_city ON public.groups(city);
CREATE INDEX IF NOT EXISTS idx_groups_creator ON public.groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_groups_member_count ON public.groups(member_count DESC);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);

CREATE INDEX IF NOT EXISTS idx_group_posts_group ON public.group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_author ON public.group_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_pinned ON public.group_posts(is_pinned);

CREATE INDEX IF NOT EXISTS idx_group_events_group ON public.group_events(group_id);
CREATE INDEX IF NOT EXISTS idx_group_events_date ON public.group_events(date);

CREATE INDEX IF NOT EXISTS idx_group_albums_group ON public.group_albums(group_id);
CREATE INDEX IF NOT EXISTS idx_group_photos_album ON public.group_photos(album_id);
CREATE INDEX IF NOT EXISTS idx_group_files_group ON public.group_files(group_id);

-- ============================================
-- RPC FUNCTIONS FOR COUNTING
-- ============================================

-- Increment group member count
CREATE OR REPLACE FUNCTION increment_group_member_count(group_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.groups
  SET member_count = member_count + 1, updated_at = NOW()
  WHERE id = group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement group member count
CREATE OR REPLACE FUNCTION decrement_group_member_count(group_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.groups
  SET member_count = GREATEST(0, member_count - 1), updated_at = NOW()
  WHERE id = group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment group post likes
CREATE OR REPLACE FUNCTION increment_group_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.group_posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement group post likes
CREATE OR REPLACE FUNCTION decrement_group_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.group_posts
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment group post comments
CREATE OR REPLACE FUNCTION increment_group_post_comments(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.group_posts
  SET comments_count = comments_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement group post comments
CREATE OR REPLACE FUNCTION decrement_group_post_comments(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.group_posts
  SET comments_count = GREATEST(0, comments_count - 1)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment album photo count
CREATE OR REPLACE FUNCTION increment_album_photo_count(album_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.group_albums
  SET photo_count = photo_count + 1, updated_at = NOW()
  WHERE id = album_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement album photo count
CREATE OR REPLACE FUNCTION decrement_album_photo_count(album_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.group_albums
  SET photo_count = GREATEST(0, photo_count - 1), updated_at = NOW()
  WHERE id = album_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- Groups: Anyone can read public groups, members can read private
CREATE POLICY "groups_select" ON public.groups FOR SELECT
  USING (visibility = 'public' OR EXISTS (
    SELECT 1 FROM public.group_members gm WHERE gm.group_id = id AND gm.user_id = auth.uid()
  ));

-- Groups: Authenticated users can create
CREATE POLICY "groups_insert" ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Groups: Only admins can update
CREATE POLICY "groups_update" ON public.groups FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = id AND gm.user_id = auth.uid() AND gm.role = 'admin'
  ));

-- Groups: Only creator can delete
CREATE POLICY "groups_delete" ON public.groups FOR DELETE
  USING (auth.uid() = creator_id);

-- Members: Anyone can read
CREATE POLICY "group_members_select" ON public.group_members FOR SELECT
  USING (true);

-- Members: Authenticated users can join open groups, admins can add anyone
CREATE POLICY "group_members_insert" ON public.group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

-- Members: Users can leave, admins can remove
CREATE POLICY "group_members_delete" ON public.group_members FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

-- Members: Admins can update roles
CREATE POLICY "group_members_update" ON public.group_members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
  ));

-- Posts: Members can read
CREATE POLICY "group_posts_select" ON public.group_posts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.visibility = 'public'
  ));

-- Posts: Members can create
CREATE POLICY "group_posts_insert" ON public.group_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id AND EXISTS (
    SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
  ));

-- Posts: Authors and admins can update
CREATE POLICY "group_posts_update" ON public.group_posts FOR UPDATE
  USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role IN ('admin', 'moderator')
    )
  );

-- Posts: Authors and admins can delete
CREATE POLICY "group_posts_delete" ON public.group_posts FOR DELETE
  USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role IN ('admin', 'moderator')
    )
  );

-- Comments: Members can read
CREATE POLICY "group_post_comments_select" ON public.group_post_comments FOR SELECT
  USING (true);

-- Comments: Members can create
CREATE POLICY "group_post_comments_insert" ON public.group_post_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Comments: Authors can delete
CREATE POLICY "group_post_comments_delete" ON public.group_post_comments FOR DELETE
  USING (auth.uid() = author_id);

-- Likes: Anyone can read
CREATE POLICY "group_post_likes_select" ON public.group_post_likes FOR SELECT
  USING (true);

-- Likes: Users can like
CREATE POLICY "group_post_likes_insert" ON public.group_post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Likes: Users can unlike
CREATE POLICY "group_post_likes_delete" ON public.group_post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Events: Public groups can be viewed by anyone, private by members
CREATE POLICY "group_events_select" ON public.group_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.visibility = 'public'
  ) OR EXISTS (
    SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
  ));

-- Events: Admins/moderators can create
CREATE POLICY "group_events_insert" ON public.group_events FOR INSERT
  WITH CHECK (auth.uid() = creator_id AND EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role IN ('admin', 'moderator')
  ));

-- Events: Creator and admins can update
CREATE POLICY "group_events_update" ON public.group_events FOR UPDATE
  USING (
    auth.uid() = creator_id OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

-- Events: Creator and admins can delete
CREATE POLICY "group_events_delete" ON public.group_events FOR DELETE
  USING (
    auth.uid() = creator_id OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

-- RSVPs: Anyone can read
CREATE POLICY "group_event_rsvps_select" ON public.group_event_rsvps FOR SELECT
  USING (true);

-- RSVPs: Users can RSVP
CREATE POLICY "group_event_rsvps_insert" ON public.group_event_rsvps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RSVPs: Users can update their RSVP
CREATE POLICY "group_event_rsvps_update" ON public.group_event_rsvps FOR UPDATE
  USING (auth.uid() = user_id);

-- RSVPs: Users can cancel their RSVP
CREATE POLICY "group_event_rsvps_delete" ON public.group_event_rsvps FOR DELETE
  USING (auth.uid() = user_id);

-- Albums: Members can read
CREATE POLICY "group_albums_select" ON public.group_albums FOR SELECT
  USING (true);

-- Albums: Admins can create
CREATE POLICY "group_albums_insert" ON public.group_albums FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Albums: Creator and admins can update
CREATE POLICY "group_albums_update" ON public.group_albums FOR UPDATE
  USING (
    auth.uid() = creator_id OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

-- Albums: Creator and admins can delete
CREATE POLICY "group_albums_delete" ON public.group_albums FOR DELETE
  USING (
    auth.uid() = creator_id OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

-- Photos: Anyone can read
CREATE POLICY "group_photos_select" ON public.group_photos FOR SELECT
  USING (true);

-- Photos: Members can upload
CREATE POLICY "group_photos_insert" ON public.group_photos FOR INSERT
  WITH CHECK (auth.uid() = uploader_id);

-- Photos: Uploader and admins can delete
CREATE POLICY "group_photos_delete" ON public.group_photos FOR DELETE
  USING (auth.uid() = uploader_id);

-- Files: Members can read
CREATE POLICY "group_files_select" ON public.group_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
  ));

-- Files: Members can upload
CREATE POLICY "group_files_insert" ON public.group_files FOR INSERT
  WITH CHECK (auth.uid() = uploader_id AND EXISTS (
    SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
  ));

-- Files: Uploader and admins can delete
CREATE POLICY "group_files_delete" ON public.group_files FOR DELETE
  USING (
    auth.uid() = uploader_id OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

-- Settings: Admins can read and update
CREATE POLICY "group_settings_select" ON public.group_settings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
  ));

CREATE POLICY "group_settings_insert" ON public.group_settings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
  ));

CREATE POLICY "group_settings_update" ON public.group_settings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
  ));

-- Join requests: User can see their own, admins can see all for group
CREATE POLICY "group_join_requests_select" ON public.group_join_requests FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

CREATE POLICY "group_join_requests_insert" ON public.group_join_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "group_join_requests_update" ON public.group_join_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
  ));

-- Invites: Inviter and invitee can see, admins can manage
CREATE POLICY "group_invites_select" ON public.group_invites FOR SELECT
  USING (
    auth.uid() = inviter_id OR
    auth.uid() = invitee_id OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

CREATE POLICY "group_invites_insert" ON public.group_invites FOR INSERT
  WITH CHECK (auth.uid() = inviter_id AND EXISTS (
    SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
  ));

CREATE POLICY "group_invites_update" ON public.group_invites FOR UPDATE
  USING (auth.uid() = invitee_id);

CREATE POLICY "group_invites_delete" ON public.group_invites FOR DELETE
  USING (
    auth.uid() = inviter_id OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );
