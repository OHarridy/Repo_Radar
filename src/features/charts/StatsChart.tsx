import { Box, Typography, useTheme } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface ChartDataPoint {
  name: string;
  stars: number;
  openIssues: number;
}

export interface StatsChartProps {
  data: ChartDataPoint[];
}

export function StatsChart({ data }: StatsChartProps) {
  const theme = useTheme();

  if (data.length === 0) {
    return (
      <Box
        sx={{
          height: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.paper',
          borderRadius: 2,
          p: 3,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Track repositories to see their statistics here.
        </Typography>
      </Box>
    );
  }

  // Calculate dynamic height to ensure bars stay readable even with 50+ items
  // Minimum height is 368px (400px container height - 32px padding), otherwise 60px per bar
  const chartHeight = Math.max(368, data.length * 60);

  return (
    <Box
      sx={{
        width: '100%',
        height: 400,
        overflowY: 'auto', 
        overflowX: 'hidden',
        backgroundColor: 'background.paper',
        borderRadius: 2,
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis type="number" tick={{ fill: theme.palette.text.secondary }} />
            <YAxis
              dataKey="name"
              type="category"
              width={150}
              tick={{ fill: theme.palette.text.secondary }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
              }}
              itemStyle={{ color: theme.palette.text.primary }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar
              dataKey="stars"
              name="Stars"
              fill={theme.palette.primary.main}
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="openIssues"
              name="Open Issues"
              fill={theme.palette.secondary.main}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
