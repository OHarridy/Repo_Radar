import { useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { Refresh as RefreshIcon, DeleteSweep as DeleteSweepIcon } from '@mui/icons-material';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  selectAllTrackedRepos,
  selectIsRefreshingAll,
  untrackRepo,
  untrackAllRepos,
  refreshRepo,
  refreshAllRepos,
} from './index';
import { RepoCard } from '../../components';

export function TrackedList() {
  const dispatch = useAppDispatch();
  const trackedRepos = useAppSelector(selectAllTrackedRepos);
  const isRefreshingAll = useAppSelector(selectIsRefreshingAll);

  // Automatically refresh stats for all tracked repos when the app boots up
  useEffect(() => {
    void dispatch(refreshAllRepos());
  }, [dispatch]);

  const handleUntrack = (id: number) => {
    dispatch(untrackRepo(id));
  };

  const handleUntrackAll = () => {
    if (window.confirm('Are you sure you want to untrack all repositories?')) {
      dispatch(untrackAllRepos());
    }
  };

  const handleRefresh = (id: number) => {
    void dispatch(refreshRepo(id));
  };

  const handleRefreshAll = () => {
    void dispatch(refreshAllRepos());
  };

  if (trackedRepos.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center', backgroundColor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" color="text.secondary">
          No repositories tracked yet.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Search for repositories above to start tracking them.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Tracked Repositories
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={isRefreshingAll ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
            onClick={handleRefreshAll}
            disabled={isRefreshingAll}
          >
            {isRefreshingAll ? 'Refreshing...' : 'Refresh All'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={handleUntrackAll}
          >
            Remove All
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {trackedRepos.map((repo) => (
          <RepoCard
            key={repo.id}
            id={repo.id}
            fullName={repo.fullName}
            description={undefined}
            htmlUrl={repo.htmlUrl}
            stars={repo.stats?.stars}
            openIssues={repo.stats?.openIssues}
            lastUpdate={repo.stats?.lastCommitAt}
            isTracked={true}
            status={repo.status}
            error={repo.error}
            onToggleTrack={handleUntrack}
            onRefresh={handleRefresh}
          />
        ))}
      </Box>
    </Box>
  );
}
