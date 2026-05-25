import type { Region } from "./types";

export type Regional = "americas" | "europe" | "asia" | "sea";

const REGIONAL_MAP: Record<Region, Regional> = {
  NA1: "americas", BR1: "americas", LA1: "americas", LA2: "americas",
  EUW1: "europe",  EUN1: "europe",  TR1: "europe",   RU: "europe",
  KR: "asia",      JP1: "asia",
  OC1: "sea",      PH2: "sea",      SG2: "sea",      TH2: "sea",
  TW2: "sea",      VN2: "sea",
};

export function getRegional(region: Region): Regional {
  return REGIONAL_MAP[region];
}

export function getPlatformHost(region: Region): string {
  return `${region.toLowerCase()}.api.riotgames.com`;
}

export function getRegionalHost(region: Region): string {
  return `${getRegional(region)}.api.riotgames.com`;
}

export const REGIONS: { value: Region; label: string }[] = [
  { value: "NA1",  label: "NA"   },
  { value: "EUW1", label: "EUW"  },
  { value: "EUN1", label: "EUNE" },
  { value: "KR",   label: "KR"   },
  { value: "BR1",  label: "BR"   },
  { value: "JP1",  label: "JP"   },
  { value: "OC1",  label: "OCE"  },
  { value: "TR1",  label: "TR"   },
  { value: "RU",   label: "RU"   },
  { value: "LA1",  label: "LAN"  },
  { value: "LA2",  label: "LAS"  },
  { value: "PH2",  label: "PH"   },
  { value: "SG2",  label: "SG"   },
  { value: "TH2",  label: "TH"   },
  { value: "TW2",  label: "TW"   },
  { value: "VN2",  label: "VN"   },
];
