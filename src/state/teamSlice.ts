import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ChampionMastery, MatchData, RankEntry, Region } from "@/lib/riot/types";

export type { QueueFilter } from "@/lib/riot/types";

export interface SummonerSlot {
  slotIndex: number;
  gameName: string;
  tagLine: string;
  region: Region;
  // Data from Riot API
  puuid?: string;
  summonerId?: string;
  profileIconId?: number;
  summonerLevel?: number;
  rankInfo?: RankEntry[];
  championPool?: ChampionMastery[];    // from mastery API, enriched with champion names
  // User editable
  customChampPool?: ChampionMastery[]; // manually curated pool
  previousSeasonRank?: string;         // manual input; not available from Riot API
  // Match loading state
  matchIds: string[];
  matchesLoaded: number;
  matchesTotal: number;
  matchesLoading: boolean;
  prevSeasonLoaded: boolean;           // whether previous season matches have been fetched
  loaded: boolean;
  error?: string;
}

export interface TeamState {
  slots: SummonerSlot[];
  // Match data — NOT persisted (lives in localStorage, loaded on mount)
  matches: Record<string, MatchData>;
  // DDragon data — NOT persisted, fetched fresh
  champIdToName: Record<number, string>; // { 266: "Aatrox" }
  ddVersion: string;
  // Filters
  queueFilter: "all" | "ranked" | "draft" | "clash";
  numTeammates: number; // 1–5
}

const EMPTY_SLOT = (slotIndex: number): SummonerSlot => ({
  slotIndex,
  gameName: "",
  tagLine: "",
  region: "NA1",
  matchIds: [],
  matchesLoaded: 0,
  matchesTotal: 0,
  matchesLoading: false,
  prevSeasonLoaded: false,
  loaded: false,
});

const initialState: TeamState = {
  slots: Array.from({ length: 5 }, (_, i) => EMPTY_SLOT(i)),
  matches: {},
  champIdToName: {},
  ddVersion: "",
  queueFilter: "all",
  numTeammates: 1,
};

const teamSlice = createSlice({
  name: "team",
  initialState,
  reducers: {
    setSummonerData(
      state,
      action: PayloadAction<{ slotIndex: number; data: Partial<SummonerSlot> }>
    ) {
      const { slotIndex, data } = action.payload;
      state.slots[slotIndex] = { ...state.slots[slotIndex], ...data };
    },

    clearSlot(state, action: PayloadAction<number>) {
      state.slots[action.payload] = EMPTY_SLOT(action.payload);
    },

    addMatchIds(
      state,
      action: PayloadAction<{ slotIndex: number; matchIds: string[] }>
    ) {
      const { slotIndex, matchIds } = action.payload;
      const existing = new Set(state.slots[slotIndex].matchIds);
      for (const id of matchIds) existing.add(id);
      state.slots[slotIndex].matchIds = Array.from(existing);
      state.slots[slotIndex].matchesTotal = existing.size;
    },

    addMatches(state, action: PayloadAction<MatchData[]>) {
      for (const m of action.payload) {
        state.matches[m.matchId] = m;
      }
    },

    setMatchesLoaded(
      state,
      action: PayloadAction<{ slotIndex: number; count: number }>
    ) {
      state.slots[action.payload.slotIndex].matchesLoaded = action.payload.count;
    },

    setMatchesLoading(
      state,
      action: PayloadAction<{ slotIndex: number; loading: boolean }>
    ) {
      state.slots[action.payload.slotIndex].matchesLoading = action.payload.loading;
    },

    setCustomChampPool(
      state,
      action: PayloadAction<{ slotIndex: number; pool: ChampionMastery[] }>
    ) {
      state.slots[action.payload.slotIndex].customChampPool = action.payload.pool;
    },

    setPreviousSeasonRank(
      state,
      action: PayloadAction<{ slotIndex: number; rank: string }>
    ) {
      state.slots[action.payload.slotIndex].previousSeasonRank = action.payload.rank;
    },

    setQueueFilter(state, action: PayloadAction<TeamState["queueFilter"]>) {
      state.queueFilter = action.payload;
    },

    setNumTeammates(state, action: PayloadAction<number>) {
      state.numTeammates = Math.max(1, Math.min(5, action.payload));
    },

    setChampData(
      state,
      action: PayloadAction<{ champIdToName: Record<number, string>; ddVersion: string }>
    ) {
      state.champIdToName = action.payload.champIdToName;
      state.ddVersion = action.payload.ddVersion;
    },

    // Called on page mount to hydrate matches from localStorage
    initMatchesFromCache(state, action: PayloadAction<Record<string, MatchData>>) {
      state.matches = action.payload;
    },
  },
});

export const {
  setSummonerData,
  clearSlot,
  addMatchIds,
  addMatches,
  setMatchesLoaded,
  setMatchesLoading,
  setCustomChampPool,
  setPreviousSeasonRank,
  setQueueFilter,
  setNumTeammates,
  setChampData,
  initMatchesFromCache,
} = teamSlice.actions;

export default teamSlice.reducer;
