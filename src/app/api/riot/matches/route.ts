import { NextRequest, NextResponse } from "next/server";
import { getRegionalHost } from "@/lib/riot/regions";
import type { Region } from "@/lib/riot/types";

const KEY = process.env.RIOT_API_KEY ?? "";

async function riotGet(url: string) {
  const res = await fetch(url, { headers: { "X-Riot-Token": KEY } });
  if (!res.ok) {
    const body = await res.text();
    throw Object.assign(new Error(`Riot ${res.status}`), { status: res.status, body });
  }
  return res.json();
}

// Returns an array of match IDs for a single queue and time range.
// Client is responsible for calling multiple times if needed.
export async function GET(req: NextRequest) {
  const sp        = new URL(req.url).searchParams;
  const puuid     = sp.get("puuid");
  const region    = (sp.get("region") ?? "NA1") as Region;
  const queue     = sp.get("queue");        // e.g. 420
  const start     = sp.get("start") ?? "0";
  const count     = sp.get("count") ?? "100";
  const startTime = sp.get("startTime");    // Unix seconds
  const endTime   = sp.get("endTime");

  if (!puuid) return NextResponse.json({ error: "puuid required" }, { status: 400 });
  if (!KEY)   return NextResponse.json({ error: "RIOT_API_KEY not configured" }, { status: 500 });

  try {
    const host = getRegionalHost(region);
    const params = new URLSearchParams({ start, count });
    if (queue)     params.set("queue",     queue);
    if (startTime) params.set("startTime", startTime);
    if (endTime)   params.set("endTime",   endTime);

    const data = await riotGet(
      `https://${host}/lol/match/v5/matches/by-puuid/${puuid}/ids?${params}`
    );
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
