export type EventReach = 'city' | 'nearby' | 'global';

const REACH_RE = /\[\[scope:(city|nearby|global)\]\]\s*/gi;
const FLYER_RE = /\[\[flyer:([^\]]+)\]\]\s*/gi;

export function parseEventMetadata(description: string): {
  reach: EventReach;
  flyerUrl?: string;
  cleanDescription: string;
} {
  const raw = description || '';

  let reach: EventReach = 'city';
  let flyerUrl: string | undefined;

  // Extract reach (last one wins)
  for (const match of raw.matchAll(/\[\[scope:(city|nearby|global)\]\]/gi)) {
    const val = (match[1] || '').toLowerCase() as EventReach;
    if (val === 'city' || val === 'nearby' || val === 'global') reach = val;
  }

  // Extract flyer (last one wins)
  for (const match of raw.matchAll(/\[\[flyer:([^\]]+)\]\]/gi)) {
    const val = (match[1] || '').trim();
    if (val) flyerUrl = val;
  }

  const cleanDescription = raw.replace(REACH_RE, '').replace(FLYER_RE, '').trim();

  return { reach, flyerUrl, cleanDescription };
}

export function encodeEventMetadata(
  description: string,
  meta: { reach?: EventReach; flyerUrl?: string }
): string {
  const base = (description || '').trim();
  const reach = meta.reach || 'city';
  const flyerUrl = meta.flyerUrl?.trim();

  const lines: string[] = [base];
  lines.push(`[[scope:${reach}]]`);
  if (flyerUrl) lines.push(`[[flyer:${flyerUrl}]]`);

  return lines.filter(Boolean).join('\n\n');
}

