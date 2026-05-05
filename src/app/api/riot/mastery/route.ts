import { NextRequest, NextResponse } from "next/server";
import { getPlatformHost } from "@/lib/riot/regions";
import type { Region } from "@/lib/riot/types";

const KEY = process.env.RIOT_API_KEY ?? "";

async function riotGet(url: string) {
  const res = await fetch(url, {
    headers: { "X-Riot-Token": KEY },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    const body = await res.text();
    throw Object.assign(new Error(`Riot ${res.status}`), { status: res.status, body });
  }
  return res.json();
}

export async function GET(req: NextRequest) {
  const sp    = new URL(req.url).searchParams;
  const puuid  = sp.get("puuid");
  const region = (sp.get("region") ?? "NA1") as Region;
  const count  = sp.get("count") ?? "10";

  if (!puuid) return NextResponse.json({ error: "puuid required" }, { status: 400 });
  if (!KEY)   return NextResponse.json({ error: "RIOT_API_KEY not configured" }, { status: 500 });

  try {
    const host = getPlatformHost(region);
    const data = await riotGet(
      `https://${host}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${count}`
    );
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
