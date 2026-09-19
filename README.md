# Repo Radar

A dashboard for searching GitHub repositories, tracking your favorites, and monitoring their statistics (stars, open issues, and last commit dates) over time.

## Architecture & State Design Decisions

This application handles two distinct types of data, which are intentionally modeled differently using Redux Toolkit to optimize performance and reduce complexity:

### 1. Ephemeral, Server-Owned Data (Search Results)
*   **Mechanism**: Managed entirely by RTK Query (`services/github/api.ts`).
*   **Why?**: Search results are transient. If the user clears the search box or changes the query, the old results are no longer relevant. RTK Query automatically deduplicates requests, manages caching, tracks loading states, and cancels superseded requests, meaning we never have to copy ephemeral server data into our local state slices.

### 2. Persistent, Client-Owned Data (Tracked Repos)
*   **Mechanism**: Managed by a traditional normalized Redux slice (`features/tracked/trackedSlice.ts`), keyed by repository ID.
*   **Why?**: Tracked repositories are the user's "favorites" and must persist across sessions. Keying the state by `id` (normalization) guarantees that each repository can be refreshed, load, or fail completely independently of the others. 
*   **Trade-off**: Because we only persist the core identity of the repository (`id`, `fullName`, `htmlUrl`, etc.) and deliberately *do not* persist the `stats`, `status`, or `error` in localStorage, users might briefly see empty charts on a hard reload before the `refreshAllRepos` thunk fetches fresh data. This guarantees correctness—preventing stale data from being misinterpreted as fresh.

## Features

- **Debounced Search**: Queries only hit the GitHub API when the user pauses typing.
- **Tracked Repos**: Save repositories for long-term tracking. 
- **Analytics Charts**: Visualizations built with Recharts to compare stars and open issues across all tracked repositories, automatically scaling vertically for 50+ repos.
- **Robust Error Handling**: Individual repositories manage their own API rate-limits and network failures, preventing one error from breaking the entire dashboard.

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Environment Setup (Optional)**:
   By default, the GitHub API limits unauthenticated requests to 60 per hour. To increase this create a `.env` file in the root directory and add a GitHub personal access token:
   ```
   VITE_GITHUB_TOKEN=your_github_token_here
   ```
3. **Run the Development Server**:
   ```bash
   npm run dev
   ```
4. **Run Tests**:
   ```bash
   npm run test
   ```

## Assumptions & Limitations

- **Open Issues Count**: The GitHub API returns both open issues and pull requests under the `open_issues_count` field. The UI reflects this combined total.
- **Rate Limiting**: Without a `VITE_GITHUB_TOKEN`, heavy usage (especially "Refresh All" on a large list of tracked repositories) will hit the 60 requests/hour limit quickly. The app handles this gracefully by displaying rate-limit errors per repository without crashing.
- **Last Commit Date**: The `pushed_at` field on a repository updates whenever *any* branch is pushed to. To ensure we display the accurate last commit date of the default branch, the app fetches the latest commit explicitly, resulting in an additional API call per tracked repository during a refresh.
- **Refresh Concurrency**: To avoid overwhelming the browser and the GitHub API, "Refresh All" throttles requests in chunks of 5 concurrently.
