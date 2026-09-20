import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

import type { GitHubRepoSummary, RepoStats, TrackedRepo } from '../../types';

// State 

export interface TrackedState {
  ids: number[];
  entities: Record<number, TrackedRepo>;
  isRefreshingAll: boolean;
}

const initialState: TrackedState = {
  ids: [],
  entities: {},
  isRefreshingAll: false,
};

// Helpers 

const GITHUB_BASE = 'https://api.github.com';
const MAX_CONCURRENT = 5;

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const token: unknown = import.meta.env['VITE_GITHUB_TOKEN'];
  if (typeof token === 'string' && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

class FetchError extends Error {
  readonly status: number;
  readonly resetTime: string | null;
  constructor(status: number, resetTime: string | null = null) {
    super(`HTTP ${status}`);
    this.name = 'FetchError';
    this.status = status;
    this.resetTime = resetTime;
  }
}

function normalizeError(error: unknown): string {
  if (error instanceof FetchError) {
    if (error.status === 404) return 'Repository not found — it may have been deleted or renamed.';
    if (error.status === 403 || error.status === 429) {
      if (error.resetTime) {
        const date = new Date(parseInt(error.resetTime, 10) * 1000);
        return `Rate limit exceeded. Resets at ${date.toLocaleTimeString()}.`;
      }
      return 'Rate limit exceeded — try again later.';
    }
  }
  if (error instanceof TypeError) return 'Network error — check your connection.';
  return 'Something went wrong.';
}

async function fetchRepoStats(owner: string, repo: string): Promise<RepoStats> {
  const headers = githubHeaders();

  const [statsRes, commitsRes] = await Promise.all([
    fetch(`${GITHUB_BASE}/repos/${owner}/${repo}`, { headers }),
    fetch(`${GITHUB_BASE}/repos/${owner}/${repo}/commits?per_page=1`, { headers }),
  ]);

  if (!statsRes.ok) throw new FetchError(statsRes.status, statsRes.headers.get('x-ratelimit-reset'));
  if (!commitsRes.ok) throw new FetchError(commitsRes.status, commitsRes.headers.get('x-ratelimit-reset'));

  const statsJson = (await statsRes.json()) as {
    stargazers_count: number;
    open_issues_count: number;
  };
  const commitsJson = (await commitsRes.json()) as Array<{
    commit: { committer: { date: string } | null };
  }>;

  return {
    stars: statsJson.stargazers_count,
    openIssues: statsJson.open_issues_count,
    lastCommitAt: commitsJson[0]?.commit.committer?.date ?? null,
  };
}

// Minimal state shape so thunks don't import from store (avoids circular dep).
interface ThunkState {
  tracked: TrackedState;
}

// Thunks 

export const refreshRepo = createAsyncThunk<
  { id: number; stats: RepoStats },
  number,
  { state: ThunkState; rejectValue: string }
>(
  'tracked/refreshRepo',
  async (id, { getState, rejectWithValue }) => {
    const entity = getState().tracked.entities[id];
    if (!entity) return rejectWithValue('Repo not tracked.');

    try {
      const stats = await fetchRepoStats(entity.owner, entity.name);
      return { id, stats };
    } catch (err: unknown) {
      return rejectWithValue(normalizeError(err));
    }
  },
  {
    condition: (id, { getState }) => {
      const entity = getState().tracked.entities[id];
      return entity?.status !== 'loading';
    },
  },
);

export const refreshAllRepos = createAsyncThunk<
  undefined,
  undefined,
  { state: ThunkState }
>(
  'tracked/refreshAllRepos',
  async (_, { getState, dispatch }) => {
    const ids = [...getState().tracked.ids];

    for (let i = 0; i < ids.length; i += MAX_CONCURRENT) {
      const chunk = ids.slice(i, i + MAX_CONCURRENT);
      await Promise.allSettled(
        chunk.map((id) => dispatch(refreshRepo(id))),
      );
    }

    return undefined;
  },
);

// Slice 

const trackedSlice = createSlice({
  name: 'tracked',
  initialState,
  reducers: {
    trackRepo(state, action: PayloadAction<GitHubRepoSummary>) {
      const repo = action.payload;
      if (state.entities[repo.id]) return;

      state.ids.push(repo.id);
      state.entities[repo.id] = {
        id: repo.id,
        fullName: repo.fullName,
        owner: repo.owner,
        name: repo.name,
        htmlUrl: repo.htmlUrl,
        stats: {
          stars: repo.stars,
          openIssues: repo.openIssues,
          lastCommitAt: repo.pushedAt,
        },
        status: 'idle',
        error: null,
        lastFetchedAt: null,
      };
    },
    untrackRepo(state, action: PayloadAction<number>) {
      const id = action.payload;
      state.ids = state.ids.filter((i) => i !== id);
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- normalized entity removal
      delete state.entities[id];
    },
    // Used by localStorage hydration.
    hydrateTracked(_state, action: PayloadAction<TrackedState>) {
      return action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshRepo.pending, (state, action) => {
        const entity = state.entities[action.meta.arg];
        if (entity) {
          entity.status = 'loading';
          entity.error = null;
        }
      })
      .addCase(refreshRepo.fulfilled, (state, action) => {
        const entity = state.entities[action.payload.id];
        if (entity) {
          entity.stats = action.payload.stats;
          entity.status = 'success';
          entity.error = null;
          entity.lastFetchedAt = Date.now();
        }
      })
      .addCase(refreshRepo.rejected, (state, action) => {
        const entity = state.entities[action.meta.arg];
        if (entity) {
          entity.status = 'error';
          entity.error = action.payload ?? 'Something went wrong.';
        }
      })
      .addCase(refreshAllRepos.pending, (state) => {
        state.isRefreshingAll = true;
      })
      .addCase(refreshAllRepos.fulfilled, (state) => {
        state.isRefreshingAll = false;
      })
      .addCase(refreshAllRepos.rejected, (state) => {
        state.isRefreshingAll = false;
      });
  },
});

export const { trackRepo, untrackRepo, hydrateTracked } = trackedSlice.actions;
export default trackedSlice.reducer;
