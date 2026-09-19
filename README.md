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
