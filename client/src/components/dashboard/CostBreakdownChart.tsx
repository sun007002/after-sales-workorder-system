/**
 * CostBreakdownChart component.
 * Doughnut chart showing the cost breakdown (labor / material / travel).
 *
 * NOTE: Recharts Pie tooltip payload contains the original data item
 * ({name, value}), NOT a `percent` field. Percentage is computed from
 * value/total manually to avoid undefined access (QA P0-1 fix).
 */
import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { formatCurrency } from '../../utils/format';
import type { CostBreakdown } from '../../types';

/** Props for CostBreakdownChart. */
export interface CostBreakdownChartProps {
  data: CostBreakdown;
}

/** Color palette for cost categories. */
const COLORS = {
  labor: '#1976D2',
  material: '#FF9800',
  travel: '#4CAF50',
};

/**
 * Cost breakdown doughnut chart with center total and legend.
 */
const CostBreakdownChart: React.FC<CostBreakdownChartProps> = ({ data }) => {
  const chartData = [
    { name: '人工费', value: data.laborCost, color: COLORS.labor },
    { name: '材料费', value: data.materialCost, color: COLORS.material },
    { name: '交通差旅费', value: data.travelCost, color: COLORS.travel },
  ];

  const totalCost = data.totalCost || (data.laborCost + data.materialCost + data.travelCost);
  const hasData = totalCost > 0;

  /** Custom tooltip computing percentage from value/total (QA P0-1). */
  const CustomTooltip: React.FC<{
    active?: boolean;
    payload?: Array<{ name: string; value: number }>;
  }> = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const item = payload[0];
    const pct = totalCost > 0 ? (item.value / totalCost) * 100 : 0;
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
          {item.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          金额：{formatCurrency(item.value)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          占比：{pct.toFixed(1)}%
        </Typography>
      </Box>
    );
  };

  /** Custom legend rendering item + amount + percentage. */
  const renderLegend = (value: string, entry: { color?: string; payload?: { value?: number } }) => {
    const itemValue = entry.payload?.value ?? 0;
    const pct = totalCost > 0 ? ((itemValue / totalCost) * 100).toFixed(1) : '0.0';
    return (
      <span style={{ fontSize: 12, color: '#666' }}>
        {value}：{formatCurrency(itemValue)}（{pct}%）
      </span>
    );
  };

  return (
    <Paper sx={{ p: 2, height: 300 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        费用构成
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
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={renderLegend}
              wrapperStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
};

export default CostBreakdownChart;
