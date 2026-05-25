const VERSION_KEY = "tcd_dd_version";
const CHAMPS_KEY = "tcd_dd_champs";
const TTL = 86_400_000; // 24 hours

function localGet<T>(key: string): { data: T; timestamp: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function localSet(key: string, data: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // ignore quota errors
  }
}

export async function getLatestDDVersion(): Promise<string> {
  const cached = localGet<string>(VERSION_KEY);
  if (cached && Date.now() - cached.timestamp < TTL) return cached.data;

  const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
  const versions: string[] = await res.json();
  const latest = versions[0];
  localSet(VERSION_KEY, latest);
  return latest;
}

// Returns { champIdNumber: "ChampionKey" } e.g. { 266: "Aatrox" }
export async function getChampIdMap(): Promise<Record<number, string>> {
  const cached = localGet<Record<number, string>>(CHAMPS_KEY);
  if (cached && Date.now() - cached.timestamp < TTL) return cached.data;

  const version = await getLatestDDVersion();
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`
  );
  const json = await res.json();
  const map: Record<number, string> = {};
  for (const champ of Object.values(json.data) as any[]) {
    map[parseInt(champ.key, 10)] = champ.id; // "id" is the key used in icon URLs
  }
  localSet(CHAMPS_KEY, map);
  return map;
}

export function champIconUrl(version: string, champKey: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champKey}.png`;
}

export function profileIconUrl(version: string, profileIconId: number): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${profileIconId}.png`;
}
