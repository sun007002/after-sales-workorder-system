/**
 * CustomerRankingChart component.
 * Horizontal bar chart showing top 10 customers by total work order amount.
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
  Cell,
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { formatCurrency } from '../../utils/format';
import type { CustomerRankingItem } from '../../types';

/** Props for CustomerRankingChart. */
export interface CustomerRankingChartProps {
  data: CustomerRankingItem[];
}

/** Custom tooltip for the customer ranking chart. */
const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ payload: CustomerRankingItem }>;
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
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {item.customerName}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        合计金额：{formatCurrency(item.totalAmount)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        工单数：{item.orderCount}
      </Typography>
    </Box>
  );
};

/**
 * Customer ranking horizontal bar chart (Top 10 by total amount).
 */
const CustomerRankingChart: React.FC<CustomerRankingChartProps> = ({ data }) => {
  const hasData = data.length > 0;

  // Truncate long customer names for Y-axis labels.
  const formatLabel = (name: string): string => {
    if (name.length > 8) return `${name.substring(0, 7)}…`;
    return name;
  };

  return (
    <Paper sx={{ p: 2, height: 300 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        客户金额排行（Top 10）
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
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={(value: number) =>
                value >= 10000 ? `${(value / 10000).toFixed(0)}万` : String(value)
              }
            />
            <YAxis
              type="category"
              dataKey="customerName"
              tick={{ fontSize: 11 }}
              width={80}
              tickFormatter={formatLabel}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(25, 118, 210, 0.08)' }} />
            <Bar dataKey="totalAmount" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#1565C0' : '#1976D2'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
};

export default CustomerRankingChart;
