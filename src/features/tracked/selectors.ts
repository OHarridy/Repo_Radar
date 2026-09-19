import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '../../app/store';
import type { TrackedRepo } from '../../types';

// Base selectors

export const selectTrackedIds = (state: RootState) => state.tracked.ids;
export const selectTrackedEntities = (state: RootState) => state.tracked.entities;

export const selectTrackedRepoById = (state: RootState, id: number) =>
  state.tracked.entities[id];

export const selectAllTrackedRepos = createSelector(
  [selectTrackedIds, selectTrackedEntities],
  (ids, entities): TrackedRepo[] =>
    ids.flatMap((id) => {
      const entity = entities[id];
      return entity ? [entity] : [];
    }),
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

export const selectIsAnyRefreshing = createSelector(
  [selectAllTrackedRepos],
  (repos) => repos.some((r) => r.status === 'loading'),
);
