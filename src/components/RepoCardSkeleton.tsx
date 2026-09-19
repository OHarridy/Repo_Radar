import { Card, CardContent, Box, Skeleton, CardActions } from '@mui/material';

export function RepoCardSkeleton() {
  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Skeleton variant="text" width="60%" height={28} />
          <Skeleton variant="circular" width={30} height={30} />
        </Box>
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="80%" sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
          <Skeleton variant="text" width={40} />
          <Skeleton variant="text" width={40} />
        </Box>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
        <Skeleton variant="circular" width={30} height={30} />
      </CardActions>
    </Card>
  );
}
