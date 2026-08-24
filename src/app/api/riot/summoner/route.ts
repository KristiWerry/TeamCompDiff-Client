import { NextRequest, NextResponse } from "next/server";
import { getPlatformHost, getRegionalHost } from "@/lib/riot/regions";
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
  const sp = new URL(req.url).searchParams;
  const gameName = sp.get("gameName");
  const tagLine  = sp.get("tagLine");
  const region   = (sp.get("region") ?? "NA1") as Region;

  if (!gameName || !tagLine) {
    return NextResponse.json({ error: "gameName and tagLine required" }, { status: 400 });
  }
  if (!KEY) {
    return NextResponse.json({ error: "RIOT_API_KEY not configured" }, { status: 500 });
  }

  try {
    const regionalHost = getRegionalHost(region);
    const account = await riotGet(
      `https://${regionalHost}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
    );

    const platformHost = getPlatformHost(region);
    const summoner = await riotGet(
      `https://${platformHost}/lol/summoner/v4/summoners/by-puuid/${account.puuid}`
    );

    return NextResponse.json({ ...account, ...summoner });
  } catch (err: any) {
    const status = err.status ?? 500;
    return NextResponse.json({ error: err.message, detail: err.body }, { status });
  }
}
