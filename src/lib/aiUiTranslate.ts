import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiLanguageBridge } from '@/lib/aiLanguageBridge';

export type UiTranslation = {
  translation: string;
  from: string | null;
  to: string;
  createdAt: string;
};

function keyFor(input: { text: string; to: string; from?: string | null; scope: string }) {
  const t = input.text.trim().slice(0, 500);
  // cheap hash to keep key short-ish
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
  return `ui_translate:${input.scope}:${input.from || 'auto'}:${input.to}:${h}`;
}

export async function translateForUi(input: {
  text: string;
  to: string;
  from?: string | null;
  scope: string; // e.g. "post:<id>", "comment:<id>", "clip:<id>"
  context?: string;
}): Promise<UiTranslation> {
  const text = String(input.text || '').trim();
  const to = String(input.to || '').trim();
  const from = input.from ? String(input.from).trim() : null;
  if (!text) throw new Error('translateForUi: text is required');
  if (!to) throw new Error('translateForUi: to is required');

  const cacheKey = keyFor({ text, to, from, scope: input.scope });
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached) as UiTranslation;
  } catch {
    // ignore cache errors
  }

  const res = await aiLanguageBridge({
    text,
    sourceLang: from || undefined,
    targetLang: to,
    context: input.context,
  });

  const out: UiTranslation = {
    translation: res.translation,
    from: from || null,
    to,
    createdAt: new Date().toISOString(),
  };

  AsyncStorage.setItem(cacheKey, JSON.stringify(out)).catch(() => {});
  return out;
}

