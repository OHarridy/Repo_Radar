/** Narrowed GitHub search result the fields the app only uses. */
export interface GitHubRepoSummary {
  id: number;
  nodeId: string;
  fullName: string; // "owner name"
  owner: string;
  name: string;
  description: string | null;
  htmlUrl: string;
  stars: number;
  openIssues: number;
  /** Repo-level push timestamp (ISO 8601), NOT the latest commit date. */
  pushedAt: string;
}

/** Per-repo stats we refresh for tracked repos. */
export interface RepoStats {
  stars: number;
  openIssues: number;
  /** ISO 8601 date from the latest commit on the default branch. */
  lastCommitAt: string | null;
}

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

/** Single entry in the tracked map. Status/error are per-repo, never global. */
export interface TrackedRepo {
  id: number;
  fullName: string;
  owner: string;
  name: string;
  htmlUrl: string;
  stats: RepoStats | null;
  status: RequestStatus;
  error: string | null;
  lastFetchedAt: number | null;
}
