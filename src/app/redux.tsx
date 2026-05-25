"use client";

import { useRef } from "react";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  TypedUseSelectorHook,
  useDispatch,
  useSelector,
  Provider,
} from "react-redux";
import globalReducer from "../state";
import teamReducer, { TeamState } from "../state/teamSlice";
import { api } from "../state/api";
import { setupListeners } from "@reduxjs/toolkit/query";

import {
  persistStore,
  persistReducer,
  createTransform,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";

const createNoopStorage = () => ({
  getItem(_key: any)         { return Promise.resolve(null); },
  setItem(_key: any, val: any) { return Promise.resolve(val); },
  removeItem(_key: any)      { return Promise.resolve(); },
});

const storage =
  typeof window === "undefined" ? createNoopStorage() : createWebStorage("local");

// Strip runtime-only fields from team state so we don't persist large match data
const teamTransform = createTransform<TeamState, Omit<TeamState, "matches" | "champIdToName" | "ddVersion">>(
  (inbound) => {
    const { matches: _m, champIdToName: _c, ddVersion: _d, ...rest } = inbound;
    return rest;
  },
  (outbound) => ({ ...outbound, matches: {}, champIdToName: {}, ddVersion: "" }),
  { whitelist: ["team"] }
);

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["global", "team"],
  transforms: [teamTransform],
};

const rootReducer = combineReducers({
  global: globalReducer,
  team:   teamReducer,
  [api.reducerPath]: api.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer as any);

export const makeStore = () =>
  configureStore({
    reducer: persistedReducer,
    middleware: (getDefault) =>
      getDefault({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(api.middleware),
  });

export type AppStore    = ReturnType<typeof makeStore>;
export type RootState   = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
    setupListeners(storeRef.current.dispatch);
  }
  const persistor = persistStore(storeRef.current);

  return (
    <Provider store={storeRef.current}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
