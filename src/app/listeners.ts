import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import {
  trackRepo,
  untrackRepo,
  untrackAllRepos,
  hydrateTracked,
  type TrackedState,
} from '../features/tracked/trackedSlice';

export const STORAGE_KEY = 'repo-radar:tracked:v1';

const listenerMiddleware = createListenerMiddleware();

// Persist durable identity fields on every track/untrack mutation.
listenerMiddleware.startListening({
  matcher: isAnyOf(trackRepo, untrackRepo, untrackAllRepos, hydrateTracked),
  effect: (_action, listenerApi) => {
    // Cast needed because listener middleware is untyped (avoids circular dep with store).
    const { ids, entities } = (listenerApi.getState() as { tracked: TrackedState }).tracked;

    const durable = ids.reduce<
      Array<{ id: number; fullName: string; owner: string; name: string; htmlUrl: string; stats: TrackedState['entities'][number]['stats'] }>
    >((acc, id) => {
      const e = entities[id];
      if (e) {
        acc.push({
          id: e.id,
          fullName: e.fullName,
          owner: e.owner,
          name: e.name,
          htmlUrl: e.htmlUrl,
          stats: e.stats,
        });
      }
      return acc;
    }, []);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, repos: durable }));
    } catch {
      // Storage full or unavailable — silently degrade.
    }
  },
});

export { listenerMiddleware };
