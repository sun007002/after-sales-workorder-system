/**
 * MonthlyTrendChart component.
 * Bar chart showing monthly work order amount trend for the last 12 months.
 */
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { formatCurrency } from '../../utils/format';
import type { MonthlyTrendItem } from '../../types';

/** Props for MonthlyTrendChart. */
export interface MonthlyTrendChartProps {
  data: MonthlyTrendItem[];
}

/** Custom tooltip for the monthly trend bar chart. */
const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ payload: MonthlyTrendItem }>;
}> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 1,
        boxShadow: 2,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {item.month}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        金额：{formatCurrency(item.amount)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        工单数：{item.count}
      </Typography>
    </Box>
  );
};

/**
 * Monthly trend bar chart with 12-month lookback.
 */
const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ data }) => {
  const hasData = data.some((item) => item.amount > 0);

  return (
    <Paper sx={{ p: 2, height: 300 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        月度工单金额趋势
      </Typography>
      {!hasData ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 240,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            暂无数据
          </Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(value: number) =>
                value >= 10000 ? `${(value / 10000).toFixed(0)}万` : String(value)
              }
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(25, 118, 210, 0.08)' }} />
            <Bar
              dataKey="amount"
              fill="#1976D2"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
};

export default MonthlyTrendChart;
