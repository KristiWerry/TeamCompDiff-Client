import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ChampionMastery, MatchData, RankEntry } from "@/lib/riot/types";
import type { Role } from "@/lib/riot/types";
import type { ChampionData, PlayerInput } from "@/state/api";

export type { QueueFilter } from "@/lib/riot/types";

export interface SummonerSlot {
  slotIndex: number;
  // Riot identity (riotId = `${gameName}#${tagLine}`)
  gameName: string;
  tagLine: string;
  // Algorithm inputs
  primaryRole?: Role;
  secondaryRole?: Role;
  slotChampPool: string[]; // champion names for the algorithm
  // Legacy Riot API data — kept but not actively fetched
  puuid?: string;
  summonerId?: string;
  profileIconId?: number;
  summonerLevel?: number;
  rankInfo?: RankEntry[];
  championPool?: ChampionMastery[];
  customChampPool?: ChampionMastery[];
  previousSeasonRank?: string;
  matchIds: string[];
  matchesLoaded: number;
  matchesTotal: number;
  matchesLoading: boolean;
  prevSeasonLoaded: boolean;
  loaded: boolean;
  error?: string;
}

export interface TeamState {
  slots: SummonerSlot[];
  myRiotId: string | null; // logged-in user's linked Riot ID ("name#tag")
  // Champion data from backend GET /champions — NOT persisted
  champions: Record<string, ChampionData>;
  // Legacy match data — NOT persisted
  matches: Record<string, MatchData>;
  // Filters
  queueFilter: "all" | "ranked" | "draft" | "clash";
  numTeammates: number;
}

const EMPTY_SLOT = (slotIndex: number): SummonerSlot => ({
  slotIndex,
  gameName: "",
  tagLine: "",
  slotChampPool: [],
  matchIds: [],
  matchesLoaded: 0,
  matchesTotal: 0,
  matchesLoading: false,
  prevSeasonLoaded: false,
  loaded: false,
});

const initialState: TeamState = {
  slots: Array.from({ length: 5 }, (_, i) => EMPTY_SLOT(i)),
  myRiotId: null,
  champions: {},
  matches: {},
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

    setSlotRole(state, action: PayloadAction<{ slotIndex: number; role: Role | undefined }>) {
      state.slots[action.payload.slotIndex].primaryRole = action.payload.role;
    },

    setSlotSecondaryRole(
      state,
      action: PayloadAction<{ slotIndex: number; role: Role | undefined }>
    ) {
      state.slots[action.payload.slotIndex].secondaryRole = action.payload.role;
    },

    setSlotChampPool(
      state,
      action: PayloadAction<{ slotIndex: number; pool: string[] }>
    ) {
      state.slots[action.payload.slotIndex].slotChampPool = action.payload.pool;
    },

    setMyRiotId(state, action: PayloadAction<string | null>) {
      state.myRiotId = action.payload;
    },

    // Restore saved query players into slots
    loadQueryPlayers(state, action: PayloadAction<PlayerInput[]>) {
      action.payload.forEach((player, i) => {
        if (i >= 5) return;
        const [gameName, tagLine] = (player.riotId ?? "#").split("#");
        state.slots[i] = {
          ...EMPTY_SLOT(i),
          gameName: gameName ?? "",
          tagLine: tagLine ?? "",
          primaryRole: player.primaryRole,
          secondaryRole: player.secondaryRole,
          slotChampPool: player.champPool ?? [],
        };
      });
    },

    // Legacy actions — kept for old Riot API flow
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

    // Champions from backend GET /champions (not persisted)
    setChampions(state, action: PayloadAction<Record<string, ChampionData>>) {
      state.champions = action.payload;
    },

    initMatchesFromCache(state, action: PayloadAction<Record<string, MatchData>>) {
      state.matches = action.payload;
    },
  },
});

export const {
  setSummonerData,
  clearSlot,
  setSlotRole,
  setSlotSecondaryRole,
  setSlotChampPool,
  setMyRiotId,
  loadQueryPlayers,
  addMatchIds,
  addMatches,
  setMatchesLoaded,
  setMatchesLoading,
  setCustomChampPool,
  setPreviousSeasonRank,
  setQueueFilter,
  setNumTeammates,
  setChampions,
  initMatchesFromCache,
} = teamSlice.actions;

export default teamSlice.reducer;
