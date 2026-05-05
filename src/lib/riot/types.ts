export type Region =
  | "NA1" | "EUW1" | "EUN1" | "KR" | "BR1"
  | "JP1" | "OC1" | "TR1" | "RU" | "LA1" | "LA2"
  | "PH2" | "SG2" | "TH2" | "TW2" | "VN2";

export type QueueFilter = "all" | "ranked" | "draft" | "clash";

// Season timestamps (Unix seconds)
export const SEASON_2025_START = 1736380800; // Jan 9 2025 00:00 UTC
export const SEASON_2024_START = 1704844800; // Jan 10 2024 00:00 UTC
export const SEASON_2024_END = 1736380800;

export const QUEUE_IDS: Record<QueueFilter, number[]> = {
  all: [420, 440, 400, 700],
  ranked: [420, 440],
  draft: [400],
  clash: [700],
};

// ---------- Riot API response shapes ----------

export interface RiotAccountSummoner {
  puuid: string;
  gameName: string;
  tagLine: string;
  id: string; // encrypted summonerId
  accountId: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface ChampionMastery {
  championId: number;
  championName?: string; // resolved client-side via DDragon
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
}

export interface RankEntry {
  leagueId: string;
  queueType: string; // RANKED_SOLO_5x5 | RANKED_FLEX_SR
  tier: string;      // IRON … CHALLENGER
  rank: string;      // I II III IV
  leaguePoints: number;
  wins: number;
  losses: number;
}

export interface MatchParticipant {
  puuid: string;
  summonerName: string;
  riotIdGameName: string;
  riotIdTagline: string;
  championId: number;
  championName: string;
  win: boolean;
  teamId: number; // 100=blue 200=red
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  visionScore: number;
  teamPosition: string; // TOP JUNGLE MIDDLE BOTTOM UTILITY
  individualPosition: string;
  totalDamageDealtToChampions: number;
  goldEarned: number;
}

export interface MatchBan {
  championId: number;
  pickTurn: number;
}

export interface MatchTeam {
  teamId: number;
  win: boolean;
  bans: MatchBan[];
}

export interface MatchData {
  matchId: string;
  queueId: number;
  gameStartTimestamp: number;
  gameDuration: number; // seconds
  gameVersion: string;
  participants: MatchParticipant[];
  teams: MatchTeam[];
}
