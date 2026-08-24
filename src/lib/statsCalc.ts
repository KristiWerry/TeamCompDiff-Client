import type { MatchData, QueueFilter } from "./riot/types";
import { QUEUE_IDS } from "./riot/types";

export interface ChampComboStat {
  champions: string[];
  wins: number;
  total: number;
  winRate: number;
}

export interface EnemyMatchupStat {
  championName: string;
  teamWins: number;
  teamGames: number;
  teamWinRate: number;
}

export interface StatsResult {
  champCombos: ChampComboStat[];
  enemyMatchups: EnemyMatchupStat[];
  totalGames: number;
  teamWins: number;
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 1) return arr.map((x) => [x]);
  const result: T[][] = [];
  for (let i = 0; i <= arr.length - k; i++) {
    for (const tail of combinations(arr.slice(i + 1), k - 1)) {
      result.push([arr[i], ...tail]);
    }
  }
  return result;
}

export function calculateStats(
  puuids: string[],
  matches: Record<string, MatchData>,
  numTeammates: number,
  queueFilter: QueueFilter
): StatsResult {
  const queueIds = QUEUE_IDS[queueFilter];
  const puuidSet = new Set(puuids.filter(Boolean));

  if (puuidSet.size === 0) {
    return { champCombos: [], enemyMatchups: [], totalGames: 0, teamWins: 0 };
  }

  const comboCounts: Record<string, { wins: number; total: number; champions: string[] }> = {};
  const enemyCounts: Record<string, { teamWins: number; teamGames: number }> = {};
  let totalGames = 0;
  let teamWins = 0;

  for (const match of Object.values(matches)) {
    if (!queueIds.includes(match.queueId)) continue;

    const teamInMatch = match.participants.filter((p) => puuidSet.has(p.puuid));
    if (teamInMatch.length < numTeammates) continue;

    totalGames++;
    const teamWon = teamInMatch[0]?.win ?? false;
    if (teamWon) teamWins++;

    const ourTeamId = teamInMatch[0]?.teamId;
    const teamChamps = teamInMatch.map((p) => p.championName).filter(Boolean);

    // Combos of size 2 up to how many team members are in this match
    for (let size = 2; size <= Math.min(teamChamps.length, 5); size++) {
      for (const combo of combinations(teamChamps, size)) {
        const key = [...combo].sort().join("|");
        if (!comboCounts[key]) {
          comboCounts[key] = { wins: 0, total: 0, champions: [...combo].sort() };
        }
        comboCounts[key].total++;
        if (teamWon) comboCounts[key].wins++;
      }
    }

    // Enemy champions (opposite team, not our own players)
    if (ourTeamId !== undefined) {
      for (const p of match.participants) {
        if (p.teamId === ourTeamId || puuidSet.has(p.puuid)) continue;
        if (!p.championName) continue;
        if (!enemyCounts[p.championName]) {
          enemyCounts[p.championName] = { teamWins: 0, teamGames: 0 };
        }
        enemyCounts[p.championName].teamGames++;
        if (teamWon) enemyCounts[p.championName].teamWins++;
      }
    }
  }

  const MIN_GAMES = 3;

  const champCombos = Object.values(comboCounts)
    .filter((c) => c.total >= MIN_GAMES)
    .map((c) => ({ champions: c.champions, wins: c.wins, total: c.total, winRate: c.wins / c.total }))
    .sort((a, b) => b.winRate - a.winRate || b.total - a.total)
    .slice(0, 20);

  const enemyMatchups = Object.entries(enemyCounts)
    .filter(([, v]) => v.teamGames >= MIN_GAMES)
    .map(([championName, v]) => ({
      championName,
      teamWins: v.teamWins,
      teamGames: v.teamGames,
      teamWinRate: v.teamWins / v.teamGames,
    }))
    .sort((a, b) => a.teamWinRate - b.teamWinRate) // worst matchups first
    .slice(0, 20);

  return { champCombos, enemyMatchups, totalGames, teamWins };
}
