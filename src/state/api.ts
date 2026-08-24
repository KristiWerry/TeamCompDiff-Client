import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import type { Role } from "@/lib/riot/types";

// ── Champion data ──────────────────────────────────────────────────────────

export interface ChampionData {
  name: string;    // display name e.g. "Wukong" (key in data is the DDragon id e.g. "MonkeyKing")
  roles: string[]; // backend may return "bot" — map to "adc" on use
  tags: string[];
  powerSpike: string;
  [key: string]: unknown;
}

// ── Profile ────────────────────────────────────────────────────────────────

export interface UserProfile {
  champPool: string[];
  preferredRole: Role | null;
  preferredSecondaryRole: Role | null;
  displayName: string | null;
}

// ── Players ────────────────────────────────────────────────────────────────

export interface LinkedRiotAccount {
  riotId: string;
  puuid: string;
  summonerId: string;
  linkedAt: string;
}

export interface RefreshCacheResult {
  refreshed: { riotId: string; champsTracked: number }[];
}

// ── Team Comp algorithm ────────────────────────────────────────────────────

export interface PlayerInput {
  primaryRole: Role;
  secondaryRole?: Role;
  champPool?: string[];
  riotId?: string;
}

export interface CompSuggestion {
  champion: string;
  score: number;
  winRate: string | null;
  masteryLevel: number | null;
  impactNote: string;
}

export interface CompPick {
  role: string;
  player: string | null;
  suggestions: CompSuggestion[];
}

export interface SynergyPair {
  roles: string[];
  champions: string[];
  score: number;
}

export interface CompAnalysis {
  difficulty: number;
  winConditions: string[];
  powerSpike: "early" | "mid" | "late" | "mixed";
  synergies: { overall: number; pairs: SynergyPair[] };
  suggestedPlaystyle: string;
  engage: "Low" | "Medium" | "High" | "Very High";
}

export interface GeneratedComp {
  archetype: string;
  description: string;
  roleAssignment: Record<string, string>;
  picks: CompPick[];
  analysis: CompAnalysis;
  cacheAgesAt: Record<string, string>;
}

export interface TeamCompResponse {
  comps: GeneratedComp[];
  lastRunAt?: string;
}

// ── Saved comps ────────────────────────────────────────────────────────────

export interface SavedComp {
  username: string;
  compId: string;
  compName: string;
  comp: GeneratedComp;
  savedAt: string;
  queryId?: string;
}

// ── Saved queries ──────────────────────────────────────────────────────────

export interface SavedQuery {
  username: string;
  queryId: string;
  queryName: string;
  players: PlayerInput[];
  createdAt: string;
  lastRunAt: string | null;
  lastResult: TeamCompResponse | null;
}

// ── API ────────────────────────────────────────────────────────────────────

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: async (headers) => {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Profile", "Comps", "Queries"],
  endpoints: (build) => ({

    // Auth user (Cognito identity only)
    getAuthUser: build.query<{ user: any; userSub: string | null }, void>({
      queryFn: async () => {
        try {
          const user = await getCurrentUser();
          const session = await fetchAuthSession();
          return { data: { user, userSub: session.userSub ?? null } };
        } catch (error: any) {
          return { error: error.message || "Could not fetch user" };
        }
      },
    }),

    // Champions (public — no auth required)
    getChampions: build.query<{ data: Record<string, ChampionData> }, void>({
      query: () => "/champions",
    }),

    // Profile
    getProfile: build.query<UserProfile, void>({
      query: () => "/profile",
      providesTags: ["Profile"],
    }),
    updateProfile: build.mutation<UserProfile, Partial<UserProfile>>({
      query: (body) => ({ url: "/profile", method: "PUT", body }),
      invalidatesTags: ["Profile"],
    }),

    // Players
    linkRiotAccount: build.mutation<LinkedRiotAccount, { riotId: string }>({
      query: (body) => ({ url: "/players/link-riot", method: "POST", body }),
    }),
    refreshCache: build.mutation<RefreshCacheResult, void>({
      query: () => ({ url: "/players/refresh-cache", method: "POST" }),
    }),

    // Team Comp algorithm
    runTeamComp: build.mutation<TeamCompResponse, { players: PlayerInput[] }>({
      query: (body) => ({ url: "/team-comp", method: "POST", body }),
    }),

    // Comps
    getComps: build.query<{ comps: SavedComp[] }, void>({
      query: () => "/comps",
      providesTags: ["Comps"],
    }),
    saveComp: build.mutation<SavedComp, { compName: string; comp: GeneratedComp; queryId?: string }>({
      query: (body) => ({ url: "/comps", method: "POST", body }),
      invalidatesTags: ["Comps"],
    }),
    deleteComp: build.mutation<{ deleted: boolean; compId: string }, string>({
      query: (compId) => ({ url: `/comps/${compId}`, method: "DELETE" }),
      invalidatesTags: ["Comps"],
    }),

    // Queries
    getQueries: build.query<{ queries: SavedQuery[] }, void>({
      query: () => "/queries",
      providesTags: ["Queries"],
    }),
    createQuery: build.mutation<SavedQuery, { queryName: string; players: PlayerInput[] }>({
      query: (body) => ({ url: "/queries", method: "POST", body }),
      invalidatesTags: ["Queries"],
    }),
    updateQuery: build.mutation<SavedQuery, { queryId: string; queryName?: string; players?: PlayerInput[] }>({
      query: ({ queryId, ...body }) => ({ url: `/queries/${queryId}`, method: "PUT", body }),
      invalidatesTags: ["Queries"],
    }),
    deleteQuery: build.mutation<{ deleted: boolean; queryId: string }, string>({
      query: (queryId) => ({ url: `/queries/${queryId}`, method: "DELETE" }),
      invalidatesTags: ["Queries"],
    }),
    runQuery: build.mutation<TeamCompResponse & { lastRunAt: string }, string>({
      query: (queryId) => ({ url: `/queries/${queryId}/run`, method: "POST" }),
      invalidatesTags: ["Queries"],
    }),
  }),
});

export const {
  useGetAuthUserQuery,
  useGetChampionsQuery,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useLinkRiotAccountMutation,
  useRefreshCacheMutation,
  useRunTeamCompMutation,
  useGetCompsQuery,
  useSaveCompMutation,
  useDeleteCompMutation,
  useGetQueriesQuery,
  useCreateQueryMutation,
  useUpdateQueryMutation,
  useDeleteQueryMutation,
  useRunQueryMutation,
} = api;
