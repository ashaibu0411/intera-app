import { supabase } from './supabase';

export type ImpactOrgType = 'school' | 'nonprofit';
export type ImpactStoryStatus = 'draft' | 'pending_review' | 'published' | 'paused';

export type ImpactNeed = 'donations' | 'grants' | 'sponsorships';

export interface ImpactStory {
  id: string;
  owner_id: string;

  org_type: ImpactOrgType;
  org_name: string;
  website: string | null;

  country: string;
  admin_area: string | null;
  city: string | null;
  neighborhood: string | null;
  location_label: string | null;

  mission: string;
  story: string;
  needs: ImpactNeed[];

  funding_goal_amount: number | null;
  funding_goal_currency: string | null;
  donation_url: string | null;
  grant_url: string | null;
  sponsorship_email: string | null;
  sponsorship_phone: string | null;

  cover_image_url: string | null;
  gallery_urls: string[];
  video_url: string | null;

  status: ImpactStoryStatus;
  review_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function listImpactStories(opts?: {
  q?: string;
  orgType?: ImpactOrgType | 'all';
  country?: string;
  limit?: number;
}) {
  const q = (opts?.q || '').trim();
  const orgType = opts?.orgType || 'all';
  const country = (opts?.country || '').trim();
  const limit = typeof opts?.limit === 'number' ? opts!.limit : 30;

  let query = supabase
    .from('impact_stories')
    .select(
      'id, org_type, org_name, country, city, mission, needs, cover_image_url, video_url, donation_url, grant_url, sponsorship_email, sponsorship_phone, funding_goal_amount, funding_goal_currency, status, created_at'
    )
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (orgType !== 'all') query = query.eq('org_type', orgType);
  if (country) query = query.ilike('country', country);
  if (q) {
    const like = `%${q}%`;
    query = query.or(`org_name.ilike.${like},mission.ilike.${like},story.ilike.${like}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Array<Pick<
    ImpactStory,
    | 'id'
    | 'org_type'
    | 'org_name'
    | 'country'
    | 'city'
    | 'mission'
    | 'needs'
    | 'cover_image_url'
    | 'video_url'
    | 'donation_url'
    | 'grant_url'
    | 'sponsorship_email'
    | 'sponsorship_phone'
    | 'funding_goal_amount'
    | 'funding_goal_currency'
    | 'status'
    | 'created_at'
  >>;
}

export async function getImpactStoryById(id: string) {
  const { data, error } = await supabase
    .from('impact_stories')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as ImpactStory;
}

export async function createImpactStory(payload: Omit<ImpactStory, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('impact_stories')
    .insert(payload)
    .select('id')
    .single();
  if (error) throw error;
  return data as { id: string };
}

export async function updateImpactStory(id: string, patch: Partial<Omit<ImpactStory, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>) {
  const { error } = await supabase.from('impact_stories').update(patch).eq('id', id);
  if (error) throw error;
}

