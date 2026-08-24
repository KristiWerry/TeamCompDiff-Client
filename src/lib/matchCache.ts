import type { MatchData } from "./riot/types";

const CACHE_KEY = "tcd_matches_v1";
const CACHE_VERSION = 1;

interface PersistedCache {
  version: number;
  matches: Record<string, MatchData>;
}

function readCache(): PersistedCache {
  if (typeof window === "undefined") return { version: CACHE_VERSION, matches: {} };
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { version: CACHE_VERSION, matches: {} };
    const parsed = JSON.parse(raw) as PersistedCache;
    if (parsed.version !== CACHE_VERSION) return { version: CACHE_VERSION, matches: {} };
    return parsed;
  } catch {
    return { version: CACHE_VERSION, matches: {} };
  }
}

function writeCache(cache: PersistedCache): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // Storage quota exceeded — silently skip
    console.warn("Match cache write failed (quota?):", e);
  }
}

export function getCachedMatches(): Record<string, MatchData> {
  return readCache().matches;
}

export function saveMatches(matches: MatchData[]): void {
  const cache = readCache();
  for (const m of matches) {
    cache.matches[m.matchId] = m;
  }
  writeCache(cache);
}

export function getUncachedIds(matchIds: string[]): string[] {
  const cached = readCache().matches;
  return matchIds.filter((id) => !(id in cached));
}

export function clearMatchCache(): void {
  if (typeof window !== "undefined") localStorage.removeItem(CACHE_KEY);
}
