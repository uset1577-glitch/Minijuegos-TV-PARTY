const STORAGE_KEY = 'mj_ai_history_v1';
const TOPIC_KEY = 'mj_ai_last_topic_v1';

const memoryHistory = new Map<string, string[]>();
const memoryLastTopic = new Map<string, string>();

export function normalizeAiText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readAllHistory(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

function writeAllHistory(store: Record<string, string[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore storage quota errors
  }
}

export function getRecentAiItems(key: string): string[] {
  const fromMem = memoryHistory.get(key);
  if (fromMem && fromMem.length > 0) return [...fromMem];
  const all = readAllHistory();
  const list = Array.isArray(all[key])
    ? all[key].filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  memoryHistory.set(key, list);
  return [...list];
}

export function recordAiItems(key: string, items: string[], max = 45): void {
  const cleaned = items.map((s) => s.trim()).filter((s) => s.length > 0);
  if (cleaned.length === 0) return;

  const existing = getRecentAiItems(key);
  const seenNorm = new Set(existing.map(normalizeAiText));
  const merged = [...existing];

  for (const item of cleaned) {
    const norm = normalizeAiText(item);
    if (!norm || seenNorm.has(norm)) continue;
    seenNorm.add(norm);
    merged.push(item);
  }

  const trimmed = merged.slice(-max);
  memoryHistory.set(key, trimmed);

  const all = readAllHistory();
  all[key] = trimmed;
  writeAllHistory(all);
}

export function filterFreshAiItems<T>(
  key: string,
  items: T[],
  extractText: (item: T) => string,
  max = 45,
): T[] {
  if (items.length === 0) return [];
  const recent = getRecentAiItems(key);
  const seen = new Set(recent.map(normalizeAiText));

  const fresh: T[] = [];
  const localSeen = new Set<string>();

  for (const item of items) {
    const text = extractText(item).trim();
    const norm = normalizeAiText(text);
    if (!norm || seen.has(norm) || localSeen.has(norm)) continue;
    localSeen.add(norm);
    fresh.push(item);
  }

  const chosen = fresh.length > 0 ? fresh : items;
  recordAiItems(
    key,
    chosen.map((item) => extractText(item)),
    max,
  );
  return chosen;
}

export function pickFreshTopic(key: string, pool: readonly string[]): string {
  if (pool.length === 0) return '';
  if (pool.length === 1) return pool[0];

  let last = memoryLastTopic.get(key) ?? '';
  if (!last) {
    try {
      const raw = localStorage.getItem(TOPIC_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string>;
        if (typeof parsed[key] === 'string') last = parsed[key];
      }
    } catch {
      // ignore
    }
  }

  const candidates = pool.filter((t) => t !== last);
  const picked = candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];
  memoryLastTopic.set(key, picked);

  try {
    const raw = localStorage.getItem(TOPIC_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    parsed[key] = picked;
    localStorage.setItem(TOPIC_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }

  return picked;
}
