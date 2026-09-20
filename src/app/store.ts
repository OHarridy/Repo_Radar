import { configureStore } from '@reduxjs/toolkit';

import trackedReducer, { type TrackedState } from '../features/tracked/trackedSlice';
import { githubApi } from '../services/github';
import { listenerMiddleware, STORAGE_KEY } from './listeners';

// Hydrate tracked repos from localStorage. Only restores identity fields;
// stats/status/error always start fresh.
function loadTrackedState(): TrackedState | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;

    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('v' in parsed) ||
      !('repos' in parsed)
    ) return undefined;

    const obj = parsed as Record<string, unknown>;
    if (obj['v'] !== 1 || !Array.isArray(obj['repos'])) return undefined;
    const repos = obj['repos'] as unknown[];

    const state: TrackedState = { ids: [], entities: {}, isRefreshingAll: false };

    for (const entry of repos) {
      if (typeof entry !== 'object' || entry === null) continue;

      const id = (entry as Record<string, unknown>)['id'];
      const fullName = (entry as Record<string, unknown>)['fullName'];
      const owner = (entry as Record<string, unknown>)['owner'];
      const name = (entry as Record<string, unknown>)['name'];
      const htmlUrl = (entry as Record<string, unknown>)['htmlUrl'];

      if (
        typeof id !== 'number' ||
        typeof fullName !== 'string' ||
        typeof owner !== 'string' ||
        typeof name !== 'string' ||
        typeof htmlUrl !== 'string'
      ) continue;

      state.ids.push(id);
      state.entities[id] = {
        id,
        fullName,
        owner,
        name,
        htmlUrl,
        stats: null,
        status: 'idle',
        error: null,
        lastFetchedAt: null,
      };
    }

    return state;
  } catch {
    return undefined;
  }
}

const preloaded = loadTrackedState();

export const store = configureStore({
  reducer: {
    tracked: trackedReducer,
    [githubApi.reducerPath]: githubApi.reducer,
  },
  ...(preloaded ? { preloadedState: { tracked: preloaded } } : {}),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(githubApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
