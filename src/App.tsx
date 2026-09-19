import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline, Container, Typography, Box } from '@mui/material';

import { store } from './app/store';
import { theme } from './theme';
import { SearchUI } from './features/search/SearchUI';
import { TrackedList } from './features/tracked';
import { StatsChart } from './features/charts';
import { useAppSelector } from './app/hooks';
import { selectCombinedChartData } from './features/tracked/selectors';

// This sub-component connects the chart to Redux without mixing presentational 
// and container concerns in the chart itself.
function DashboardChart() {
  const chartData = useAppSelector(selectCombinedChartData);
  
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Statistics Overview
      </Typography>
      <StatsChart data={chartData} />
    </Box>
  );
}

export function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
            Repo Radar
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 6 }}>
            Search, track, and monitor your favorite GitHub repositories
          </Typography>
          
          <SearchUI />
          <DashboardChart />
          <TrackedList />
        </Container>
      </ThemeProvider>
    </Provider>
  );
}
