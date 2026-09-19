import { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

import { useSearchReposQuery } from '../../services/github/api';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { trackRepo, untrackRepo } from '../tracked/trackedSlice';
import { selectTrackedIds } from '../tracked/selectors';
import { useDebouncedValue } from '../../utils/useDebouncedValue';
import { RepoCard, RepoCardSkeleton } from '../../components';

export function SearchUI() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 400);
  const trimmedQuery = debouncedQuery.trim();
  const isQueryLongEnough = trimmedQuery.length >= 2;

  const { data, error, isLoading, isFetching } = useSearchReposQuery(trimmedQuery, {
    skip: !isQueryLongEnough,
  });

  const dispatch = useAppDispatch();
  const trackedIds = useAppSelector(selectTrackedIds);

  const handleToggleTrack = (repoId: number) => {
    const isTracked = trackedIds.includes(repoId);
    if (isTracked) {
      dispatch(untrackRepo(repoId));
    } else {
      const repo = data?.find((r) => r.id === repoId);
      if (repo) {
        dispatch(trackRepo(repo));
      }
    }
  };

  let errorMessage: string | null = null;
  if (error) {
    if ('status' in error) {
      if (error.status === 403 || error.status === 429) {
        // Fallback generic rate limit message, note: full x-ratelimit-reset 
        // reading would require parsing from a custom fetchBaseQuery
        errorMessage = 'GitHub API rate limit exceeded. Please wait a few minutes before searching again.';
      } else {
        errorMessage = `An error occurred: ${error.status}`;
      }
    } else {
      errorMessage = 'A network or unknown error occurred.';
    }
  }

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <TextField
        fullWidth
        label="Search GitHub Repositories"
        variant="outlined"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. react, vite, typescript"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: isFetching && !isLoading ? (
              <InputAdornment position="end">
                <CircularProgress size={20} color="inherit" />
              </InputAdornment>
            ) : null,
          }
        }}
      />

      <Box sx={{ mt: 3 }}>
        {isLoading && isQueryLongEnough && (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <RepoCardSkeleton key={i} />
            ))}
          </Box>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>
        )}

        {!isLoading && isQueryLongEnough && data?.length === 0 && !error && (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            No repositories found for "{trimmedQuery}".
          </Typography>
        )}

        {!isLoading && data && data.length > 0 && !error && (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {data.map((repo) => (
              <RepoCard
                key={repo.id}
                id={repo.id}
                fullName={repo.fullName}
                description={repo.description}
                htmlUrl={repo.htmlUrl}
                stars={repo.stars}
                openIssues={repo.openIssues}
                lastUpdate={repo.pushedAt}
                isTracked={trackedIds.includes(repo.id)}
                onToggleTrack={handleToggleTrack}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
