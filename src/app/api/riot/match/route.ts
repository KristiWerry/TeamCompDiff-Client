import { NextRequest, NextResponse } from "next/server";
import { getRegionalHost } from "@/lib/riot/regions";
import type { Region, MatchData } from "@/lib/riot/types";

const KEY = process.env.RIOT_API_KEY ?? "";

async function riotGet(url: string) {
  const res = await fetch(url, { headers: { "X-Riot-Token": KEY } });
  if (!res.ok) {
    const body = await res.text();
    throw Object.assign(new Error(`Riot ${res.status}`), { status: res.status, body });
  }
  return res.json();
}

function extractMatchData(raw: any): MatchData {
  const info = raw.metadata ?? {};
  const game = raw.info ?? {};

  return {
    matchId:            raw.metadata?.matchId ?? "",
    queueId:            game.queueId ?? 0,
    gameStartTimestamp: game.gameStartTimestamp ?? 0,
    gameDuration:       game.gameDuration ?? 0,
    gameVersion:        game.gameVersion ?? "",
    participants: (game.participants ?? []).map((p: any) => ({
      puuid:                          p.puuid ?? "",
      summonerName:                   p.summonerName ?? "",
      riotIdGameName:                 p.riotIdGameName ?? "",
      riotIdTagline:                  p.riotIdTagline ?? "",
      championId:                     p.championId ?? 0,
      championName:                   p.championName ?? "",
      win:                            p.win ?? false,
      teamId:                         p.teamId ?? 100,
      kills:                          p.kills ?? 0,
      deaths:                         p.deaths ?? 0,
      assists:                        p.assists ?? 0,
      totalMinionsKilled:             p.totalMinionsKilled ?? 0,
      neutralMinionsKilled:           p.neutralMinionsKilled ?? 0,
      visionScore:                    p.visionScore ?? 0,
      teamPosition:                   p.teamPosition ?? "",
      individualPosition:             p.individualPosition ?? "",
      totalDamageDealtToChampions:    p.totalDamageDealtToChampions ?? 0,
      goldEarned:                     p.goldEarned ?? 0,
    })),
    teams: (game.teams ?? []).map((t: any) => ({
      teamId: t.teamId ?? 100,
      win:    t.win ?? false,
      bans:   (t.bans ?? []).map((b: any) => ({ championId: b.championId, pickTurn: b.pickTurn })),
    })),
  };
}

export async function GET(req: NextRequest) {
  const sp      = new URL(req.url).searchParams;
  const matchId = sp.get("matchId");
  const region  = (sp.get("region") ?? "NA1") as Region;

  if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 });
  if (!KEY)     return NextResponse.json({ error: "RIOT_API_KEY not configured" }, { status: 500 });

  try {
    const host = getRegionalHost(region);
    const raw  = await riotGet(`https://${host}/lol/match/v5/matches/${matchId}`);
    return NextResponse.json(extractMatchData(raw));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
