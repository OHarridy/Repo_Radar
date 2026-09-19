import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Link,
  Box,
  CircularProgress,
  Tooltip,
  Alert
} from '@mui/material';
import {
  StarOutlined as StarIcon,
  ErrorOutlined as IssueIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  DeleteOutlined as DeleteIcon,
} from '@mui/icons-material';

import type { RequestStatus } from '../types';

export interface RepoCardProps {
  id: number;
  fullName: string;
  description?: string | null;
  htmlUrl: string;
  stars?: number;
  openIssues?: number;
  
  // Tracked specific
  isTracked?: boolean;
  status?: RequestStatus;
  error?: string | null;
  lastUpdate?: string | null;
  
  onToggleTrack?: (id: number) => void;
  onRefresh?: (id: number) => void;
}

export function RepoCard({
  id,
  fullName,
  description,
  htmlUrl,
  stars,
  openIssues,
  isTracked = false,
  status = 'idle',
  error = null,
  lastUpdate = null,
  onToggleTrack,
  onRefresh,
}: RepoCardProps) {
  const isLoading = status === 'loading';

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="div" sx={{ wordBreak: 'break-word', fontSize: '1.1rem' }}>
            <Link href={htmlUrl} target="_blank" rel="noopener noreferrer" underline="hover">
              {fullName}
            </Link>
          </Typography>
          {onToggleTrack && (
            <Tooltip title={isTracked ? "Untrack repository" : "Track repository"}>
              <IconButton 
                onClick={() => onToggleTrack(id)} 
                aria-label={isTracked ? "untrack repository" : "track repository"}
                color={isTracked ? "error" : "primary"}
                size="small"
              >
                {isTracked ? <DeleteIcon /> : <AddIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Tooltip title="Stars">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <StarIcon fontSize="small" color="action" aria-hidden="true" />
              <Typography variant="body2" component="span" aria-label={`${stars ?? '-'} stars`}>
                {stars !== undefined ? stars.toLocaleString() : '-'}
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title="Open Issues & PRs">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IssueIcon fontSize="small" color="action" aria-hidden="true" />
              <Typography variant="body2" component="span" aria-label={`${openIssues ?? '-'} open issues and PRs`}>
                {openIssues !== undefined ? openIssues.toLocaleString() : '-'}
              </Typography>
            </Box>
          </Tooltip>
        </Box>

        {lastUpdate && (
           <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
             Updated: {new Date(lastUpdate).toLocaleDateString()}
           </Typography>
        )}
      </CardContent>

      {error && (
        <Box sx={{ px: 2, pb: 1 }} role="alert">
          <Alert severity="error" sx={{ py: 0, '& .MuiAlert-message': { py: 1 } }}>
            {error}
          </Alert>
        </Box>
      )}

      {isTracked && onRefresh && (
        <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
          <Tooltip title="Refresh stats">
            <span>
              <IconButton 
                onClick={() => onRefresh(id)} 
                disabled={isLoading}
                aria-label="refresh stats"
                size="small"
                role="status"
              >
                {isLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </CardActions>
      )}
    </Card>
  );
}
