/**
 * Copy + helpers for "social layers on real life" — post intents, starters, audience labels.
 */

export const POST_INTENT_CHIPS = [
  { id: 'ask', label: 'Ask', prefix: '🙋 Ask: ' },
  { id: 'iso', label: 'Looking for', prefix: '🔎 Looking for: ' },
  { id: 'meetup', label: 'Meet up', prefix: '☕ Meet up: ' },
  { id: 'travel', label: 'Travel', prefix: '✈️ Travel: ' },
  { id: 'nearby', label: 'Nearby', prefix: '👋 Nearby: ' },
  { id: 'event', label: 'Event', prefix: '📣 Event: ' },
  { id: 'tip', label: 'Tip', prefix: '💡 Tip: ' },
  { id: 'safety', label: 'Safety', prefix: '⚠️ Safety: ' },
] as const;

export type PostIntentId = (typeof POST_INTENT_CHIPS)[number]['id'];

export function getIntentPrefix(intentId: string | null): string {
  if (!intentId) return '';
  const chip = POST_INTENT_CHIPS.find((c) => c.id === intentId);
  return chip?.prefix ?? '';
}

/** Prepends intent prefix once (avoids double-prefix if user already typed it). */
export function applyIntentPrefix(intentId: string | null, text: string): string {
  const p = getIntentPrefix(intentId);
  const t = text.trim();
  if (!p) return t;
  if (t.startsWith(p.trim())) return t;
  return `${p}${t}`;
}

/** Short idea starters — tap inserts into composer (user edits before post). */
export const STARTER_PROMPTS_FOR_POSTS: string[] = [
  'Anyone else here bored / on a layover? Down to grab coffee.',
  'Best study spot or café near me?',
  'Running or walking group today?',
  'New in town — what should I do this weekend?',
  'ISO: people to try this restaurant with tonight.',
  'Quick question about transit / directions here…',
  'Hosting a low-key hang — DM if you want the spot (public place only).',
  "What's underrated in this neighborhood?",
];

export type FeedFilterScope = 'global' | 'city' | 'neighborhood';

export function getPostingAudienceLabel(
  feedFilter: FeedFilterScope,
  selectedLocation: {
    city?: string | null;
    neighborhood?: string | null;
    state?: string | null;
    country?: string | null;
  } | null,
  fallbackCity: string
): string {
  if (feedFilter === 'global') return 'Everyone (global feed)';
  const city = (selectedLocation?.city || fallbackCity || 'your area').trim();
  const neighborhood = selectedLocation?.neighborhood?.trim();
  if (feedFilter === 'neighborhood' && neighborhood) {
    return `Neighborhood · ${neighborhood}, ${city}`;
  }
  return `City · ${city}`;
}

/** Vibes for Open to connect screen (MVP local UI; server sync later). */
export const OPEN_CONNECT_VIBES = [
  { id: 'chat', label: 'Light chat', emoji: '💬' },
  { id: 'food', label: 'Grab food', emoji: '🍽️' },
  { id: 'walk', label: 'Walk / explore', emoji: '🚶' },
  { id: 'study', label: 'Study / work', emoji: '📚' },
  { id: 'game', label: 'Quick game', emoji: '🎲' },
  { id: 'quiet', label: 'Quiet company', emoji: '🤝' },
] as const;

export const OPEN_CONNECT_CONTEXTS = [
  { id: 'student', label: 'Study / campus' },
  { id: 'travel', label: 'Travel / transit' },
  { id: 'convention', label: 'Event / convention' },
  { id: 'nightlife', label: 'City / going out' },
  { id: 'remote', label: 'Same city, online first' },
  { id: 'general', label: 'General' },
] as const;

/** Max length for lobby nickname (any language / script). */
export const CONNECT_DISPLAY_ALIAS_MAX = 24;
export const CONNECT_SESSION_INTRO_MAX = 120;

export function sanitizeConnectDisplayAlias(raw: string): string {
  return raw.replace(/[\n\r\t]/g, ' ').trim().slice(0, CONNECT_DISPLAY_ALIAS_MAX);
}

export function sanitizeConnectSessionIntro(raw: string): string {
  return raw.replace(/[\n\r]/g, ' ').trim().slice(0, CONNECT_SESSION_INTRO_MAX);
}

/** Stable friendly handle when user leaves nickname blank (client-side preview). */
export function fallbackConnectHandle(userId: string): string {
  const compact = userId.replace(/-/g, '');
  const slice = (compact.slice(0, 4) || '????').toUpperCase();
  return `Friend·${slice}`;
}

export const OPEN_CONNECT_DURATIONS = [
  { id: 30, label: '30 min' },
  { id: 60, label: '1 hour' },
  { id: 90, label: '90 min' },
] as const;

/** Short icebreakers — global framing; user edits before posting. */
export const CONNECT_ICEBREAKERS: { id: string; text: string }[] = [
  {
    id: 'layover',
    text: 'Stuck between flights — anyone fancy tea or coffee somewhere inside the terminal? Public area only.',
  },
  {
    id: 'transit',
    text: 'Long wait at the station / transit hub — happy to chat or find a snack together.',
  },
  {
    id: 'campus',
    text: 'On campus today — looking for a low-key study break or coffee between classes.',
  },
  {
    id: 'new_here',
    text: 'New here this week — what’s one local thing I shouldn’t miss?',
  },
  {
    id: 'event',
    text: 'In town for an event — anyone want to grab food before things kick off?',
  },
  {
    id: 'walk',
    text: 'Lovely evening — anyone up for a short walk nearby?',
  },
  {
    id: 'remote_first',
    text: 'Same city — happy to say hi in chat first, meet in public only if we both want to.',
  },
];

export function openConnectContextLabel(id: string): string {
  const c = OPEN_CONNECT_CONTEXTS.find((x) => x.id === id);
  return c?.label ?? id;
}

export function openConnectVibeLabel(id: string): string {
  const v = OPEN_CONNECT_VIBES.find((x) => x.id === id);
  return v ? `${v.emoji} ${v.label}` : id;
}
