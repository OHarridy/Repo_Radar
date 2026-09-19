import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import type { GitHubRepoSummary, RepoStats } from '../../types';

// Raw GitHub API response shapes (snake_case). Never used outside this file.
interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: Array<{
    id: number;
    node_id: string;
    full_name: string;
    owner: { login: string };
    name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    open_issues_count: number;
    pushed_at: string;
  }>;
}

interface GitHubRepoResponse {
  stargazers_count: number;
  open_issues_count: number;
}

interface GitHubCommitResponse {
  commit: {
    committer: {
      date: string;
    } | null;
  };
}

export const githubApi = createApi({
  reducerPath: 'githubApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.github.com',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/vnd.github+json');
      headers.set('X-GitHub-Api-Version', '2022-11-28');

      const token: unknown = import.meta.env['VITE_GITHUB_TOKEN'];
      if (typeof token === 'string' && token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      return headers;
    },
  }),
  endpoints: (builder) => ({
    searchRepos: builder.query<GitHubRepoSummary[], string>({
      query: (q) => `/search/repositories?q=${encodeURIComponent(q)}&per_page=20`,
      transformResponse: (response: GitHubSearchResponse): GitHubRepoSummary[] =>
        response.items.map((item) => ({
          id: item.id,
          nodeId: item.node_id,
          fullName: item.full_name,
          owner: item.owner.login,
          name: item.name,
          description: item.description,
          htmlUrl: item.html_url,
          stars: item.stargazers_count,
          openIssues: item.open_issues_count,
          pushedAt: item.pushed_at,
        })),
    }),

    getRepoStats: builder.query<
      Pick<RepoStats, 'stars' | 'openIssues'>,
      { owner: string; repo: string }
    >({
      query: ({ owner, repo }) => `/repos/${owner}/${repo}`,
      transformResponse: (response: GitHubRepoResponse) => ({
        stars: response.stargazers_count,
        openIssues: response.open_issues_count,
      }),
    }),

    getLastCommit: builder.query<
      string | null,
      { owner: string; repo: string }
    >({
      query: ({ owner, repo }) => `/repos/${owner}/${repo}/commits?per_page=1`,
      transformResponse: (response: GitHubCommitResponse[]): string | null =>
        response[0]?.commit.committer?.date ?? null,
    }),
  }),
});

export const {
  useSearchReposQuery,
  useGetRepoStatsQuery,
  useGetLastCommitQuery,
} = githubApi;
