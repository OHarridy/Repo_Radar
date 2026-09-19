import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState, AppDispatch } from '../../app/store';
import type { GitHubRepoSummary, RepoStats, TrackedRepo } from '../../types';

// State 

export interface TrackedState {
  ids: number[];
  entities: Record<number, TrackedRepo>;
}

const initialState: TrackedState = {
  ids: [],
  entities: {},
};

// Helpers

const GITHUB_BASE = 'https://api.github.com';
const MAX_CONCURRENT = 5;

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const token = import.meta.env['VITE_GITHUB_TOKEN'] as string | undefined;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function normalizeError(error: unknown, status?: number): string {
  if (status === 404) return 'Repository not found — it may have been deleted or renamed.';
  if (status === 403 || status === 429) return 'Rate limit exceeded — try again later.';
  if (error instanceof TypeError) return 'Network error — check your connection.';
  return 'Something went wrong.';
}

async function fetchRepoStats(owner: string, repo: string): Promise<RepoStats> {
  const headers = githubHeaders();

  const [statsRes, commitsRes] = await Promise.all([
    fetch(`${GITHUB_BASE}/repos/${owner}/${repo}`, { headers }),
    fetch(`${GITHUB_BASE}/repos/${owner}/${repo}/commits?per_page=1`, { headers }),
  ]);

  if (!statsRes.ok) throw { status: statsRes.status };
  if (!commitsRes.ok) throw { status: commitsRes.status };

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

// Thunks

export const refreshRepo = createAsyncThunk<
  { id: number; stats: RepoStats },
  number,
  { state: RootState; rejectValue: string }
>(
  'tracked/refreshRepo',
  async (id, { getState, rejectWithValue }) => {
    const entity = getState().tracked.entities[id];
    if (!entity) return rejectWithValue('Repo not tracked.');

    try {
      const stats = await fetchRepoStats(entity.owner, entity.name);
      return { id, stats };
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      return rejectWithValue(normalizeError(err, status));
    }
  },
  {
    // Skip if this repo is already refreshing.
    condition: (id, { getState }) => {
      const entity = getState().tracked.entities[id];
      return entity?.status !== 'loading';
    },
  },
);

export const refreshAllRepos = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch }
>(
  'tracked/refreshAllRepos',
  async (_, { getState, dispatch }) => {
    const ids = [...getState().tracked.ids];

    // Process in chunks of MAX_CONCURRENT.
    for (let i = 0; i < ids.length; i += MAX_CONCURRENT) {
      const chunk = ids.slice(i, i + MAX_CONCURRENT);
      await Promise.allSettled(
        chunk.map((id) => dispatch(refreshRepo(id))),
      );
    }
  },
);

// Slice 

const trackedSlice = createSlice({
  name: 'tracked',
  initialState,
  reducers: {
    trackRepo(state, action: PayloadAction<GitHubRepoSummary>) {
      const repo = action.payload;
      if (state.entities[repo.id]) return; // already tracked

      state.ids.push(repo.id);
      state.entities[repo.id] = {
        id: repo.id,
        fullName: repo.fullName,
        owner: repo.owner,
        name: repo.name,
        htmlUrl: repo.htmlUrl,
        stats: null,
        status: 'idle',
        error: null,
        lastFetchedAt: null,
      };
    },
    untrackRepo(state, action: PayloadAction<number>) {
      const id = action.payload;
      delete state.entities[id];
      state.ids = state.ids.filter((i) => i !== id);
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
      });
  },
});

export const { trackRepo, untrackRepo, hydrateTracked } = trackedSlice.actions;
export default trackedSlice.reducer;
