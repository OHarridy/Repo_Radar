import { createSelector } from '@reduxjs/toolkit';

import type { TrackedRepo } from '../../types';
import type { TrackedState } from './trackedSlice';

// Selectors use a minimal state shape to avoid circular deps with the store.
interface WithTracked {
  tracked: TrackedState;
}

// Base selectors 

export const selectTrackedIds = (state: WithTracked) => state.tracked.ids;
export const selectTrackedEntities = (state: WithTracked) => state.tracked.entities;

export const selectTrackedRepoById = (state: WithTracked, id: number) =>
  state.tracked.entities[id];

export const selectAllTrackedRepos = createSelector(
  [selectTrackedIds, selectTrackedEntities],
  (ids, entities): TrackedRepo[] =>
    ids.reduce<TrackedRepo[]>((acc, id) => {
      const entity = entities[id];
      if (entity) acc.push(entity);
      return acc;
    }, []),
);

export const selectTrackedCount = createSelector(
  [selectTrackedIds],
  (ids) => ids.length,
);

// Chart-data derivations 

export const selectStarDistribution = createSelector(
  [selectAllTrackedRepos],
  (repos) =>
    repos
      .filter((r): r is TrackedRepo & { stats: NonNullable<TrackedRepo['stats']> } => r.stats !== null)
      .map((r) => ({ name: r.fullName, stars: r.stats.stars })),
);

export const selectIssueDistribution = createSelector(
  [selectAllTrackedRepos],
  (repos) =>
    repos
      .filter((r): r is TrackedRepo & { stats: NonNullable<TrackedRepo['stats']> } => r.stats !== null)
      .map((r) => ({ name: r.fullName, openIssues: r.stats.openIssues })),
);

export const selectCombinedChartData = createSelector(
  [selectAllTrackedRepos],
  (repos) =>
    repos
      .filter((r): r is TrackedRepo & { stats: NonNullable<TrackedRepo['stats']> } => r.stats !== null)
      .map((r) => ({
        name: r.name, // using just name rather than fullName to save space
        stars: r.stats.stars,
        openIssues: r.stats.openIssues,
      })),
);

export const selectIsAnyRefreshing = createSelector(
  [selectAllTrackedRepos],
  (repos) => repos.some((r) => r.status === 'loading'),
);

export const selectIsRefreshingAll = (state: WithTracked) => state.tracked.isRefreshingAll;
