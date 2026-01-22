export function extractVoiceRoomIdFromText(text: string): string | null {
  const s = String(text || '');
  const m = s.match(/\[\[VOICE_ROOM_ID:([0-9a-fA-F-]{36})\]\]/);
  return m?.[1] ?? null;
}

export function stripVoiceRoomMarkers(text: string): string {
  const s = String(text || '');
  return s
    .replace(/\n?\[\[VOICE_ROOM_ID:[0-9a-fA-F-]{36}\]\]\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildVoiceRoomRecapPostContent(input: {
  roomId: string;
  roomTitle: string;
  summary: string;
  highlights: string[];
}) {
  const title = (input.roomTitle || '').trim() || 'Voice Room';
  const summary = (input.summary || '').trim();
  const highlights = (input.highlights || []).map((x) => String(x || '').trim()).filter(Boolean).slice(0, 5);

  const parts: string[] = [];
  parts.push(`🎙️ Voice Room Recap: ${title}`);
  parts.push(summary || 'Recap posted from a voice room on Intera.');
  if (highlights.length) {
    parts.push(['Highlights:', ...highlights.map((h) => `- ${h}`)].join('\n'));
  }
  parts.push(`Open room: /voice-room/${input.roomId}`);
  parts.push(`Open recap: /voice-room-recap/${input.roomId}`);
  parts.push(`[[VOICE_ROOM_ID:${input.roomId}]]`);
  return parts.join('\n\n').trim();
}

