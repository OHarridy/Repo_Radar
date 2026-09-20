import { describe, it, expect } from 'vitest';
import reducer, { trackRepo, untrackRepo, hydrateTracked } from './trackedSlice';
import type { TrackedState } from './trackedSlice';

describe('trackedSlice reducers', () => {
    const initialState: TrackedState = {
    ids: [],
    entities: {},
    isRefreshingAll: false,
  };

  it('should return initial state on unknown action', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle trackRepo', () => {
    const mockRepo = {
      id: 123,
      nodeId: 'node1',
      fullName: 'owner/repo',
      owner: 'owner',
      name: 'repo',
      description: 'A test repo',
      htmlUrl: 'http://github.com/owner/repo',
      stars: 10,
      openIssues: 2,
      pushedAt: '2026-09-19T00:00:00Z',
    };

    const nextState = reducer(initialState, trackRepo(mockRepo));

    expect(nextState.ids).toContain(123);
    expect(nextState.entities[123]).toEqual({
      id: 123,
      fullName: 'owner/repo',
      owner: 'owner',
      name: 'repo',
      htmlUrl: 'http://github.com/owner/repo',
      stats: {
        stars: 10,
        openIssues: 2,
        lastCommitAt: null,
      },
      status: 'idle',
      error: null,
      lastFetchedAt: null,
    });
  });

  it('should ignore trackRepo if already tracked', () => {
    const mockRepo = {
      id: 123,
      nodeId: 'node1',
      fullName: 'owner/repo',
      owner: 'owner',
      name: 'repo',
      description: null,
      htmlUrl: 'http://github.com/owner/repo',
      stars: 10,
      openIssues: 2,
      pushedAt: '2026-09-19T00:00:00Z',
    };

    const stateWithRepo: TrackedState = {
      ids: [123],
      entities: {
        123: {
          id: 123,
          fullName: 'owner/repo',
          owner: 'owner',
          name: 'repo',
          htmlUrl: 'http://github.com/owner/repo',
          stats: null,
          status: 'idle',
          error: null,
          lastFetchedAt: null,
        },
      },
      isRefreshingAll: false,
    };

    const nextState = reducer(stateWithRepo, trackRepo(mockRepo));
    expect(nextState).toEqual(stateWithRepo);
  });

  it('should handle untrackRepo', () => {
    const stateWithRepo: TrackedState = {
      ids: [123, 456],
      entities: {
        123: {
          id: 123,
          fullName: 'owner/repo1',
          owner: 'owner',
          name: 'repo1',
          htmlUrl: '',
          stats: null,
          status: 'idle',
          error: null,
          lastFetchedAt: null,
        },
        456: {
          id: 456,
          fullName: 'owner/repo2',
          owner: 'owner',
          name: 'repo2',
          htmlUrl: '',
          stats: null,
          status: 'idle',
          error: null,
          lastFetchedAt: null,
        },
      },
      isRefreshingAll: false,
    };

    const nextState = reducer(stateWithRepo, untrackRepo(123));

    expect(nextState.ids).not.toContain(123);
    expect(nextState.ids).toContain(456);
    expect(nextState.entities[123]).toBeUndefined();
    expect(nextState.entities[456]).toBeDefined();
  });

  it('should handle hydrateTracked', () => {
    const hydratedState: TrackedState = {
      ids: [999],
      entities: {
        999: {
          id: 999,
          fullName: 'hydrated/repo',
          owner: 'hydrated',
          name: 'repo',
          htmlUrl: '',
          stats: null,
          status: 'idle',
          error: null,
          lastFetchedAt: null,
        },
      },
      isRefreshingAll: false,
    };

    const nextState = reducer(initialState, hydrateTracked(hydratedState));
    expect(nextState).toEqual(hydratedState);
  });
});
