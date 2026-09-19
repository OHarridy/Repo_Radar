import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';

import trackedReducer, { trackRepo, refreshRepo } from './trackedSlice';

describe('Tracked Repo Integration: Track -> Refresh -> Error -> Retry', () => {
  let store: ReturnType<typeof setupStore>;

  const setupStore = () =>
    configureStore({
      reducer: { tracked: trackedReducer },
    });

  beforeEach(() => {
    store = setupStore();
  });

  it('handles the full lifecycle', async () => {
    const mockRepo = {
      id: 123,
      nodeId: 'node1',
      fullName: 'owner/repo',
      owner: 'owner',
      name: 'repo',
      description: null,
      htmlUrl: 'http://github.com/owner/repo',
      stars: 0,
      openIssues: 0,
      pushedAt: '2026-09-19T00:00:00Z',
    };

    // 1. Track
    store.dispatch(trackRepo(mockRepo));
    let state = store.getState().tracked.entities[123];
    expect(state).toBeDefined();
    expect(state?.status).toBe('idle');
    expect(state?.stats).toBeNull();

    // 2. Refresh (Success)
    // Server is already set to return 100 stars and 5 issues by default in setup
    await store.dispatch(refreshRepo(123));
    
    state = store.getState().tracked.entities[123];
    expect(state?.status).toBe('success');
    expect(state?.stats?.stars).toBe(100);
    expect(state?.stats?.openIssues).toBe(5);
    expect(state?.error).toBeNull();

    // 3. Error
    // Override MSW to return a 403 Rate Limit
    server.use(
      http.get('https://api.github.com/repos/:owner/:repo', () => {
        return new HttpResponse(null, { status: 403 });
      })
    );

    await store.dispatch(refreshRepo(123));
    
    state = store.getState().tracked.entities[123];
    expect(state?.status).toBe('error');
    expect(state?.error).toMatch(/rate limit/i);
    // Previous stats are still kept during an error!
    expect(state?.stats?.stars).toBe(100);

    // 4. Retry
    // Reset handlers to default success
    server.resetHandlers();

    await store.dispatch(refreshRepo(123));
    
    state = store.getState().tracked.entities[123];
    expect(state?.status).toBe('success');
    expect(state?.stats?.stars).toBe(100);
    expect(state?.error).toBeNull();
  });
});
