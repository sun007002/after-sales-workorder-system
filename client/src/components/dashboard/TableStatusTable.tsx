/**
 * TableStatusTable component.
 * Displays database table record counts in a striped MUI table.
 */
import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
} from '@mui/material';
import type { TableStatItem } from '../../types';

/** Props for TableStatusTable. */
export interface TableStatusTableProps {
  data: TableStatItem[];
}

/**
 * Database table status table with zebra striping.
 */
const TableStatusTable: React.FC<TableStatusTableProps> = ({ data }) => {
  return (
    <Paper sx={{ p: 2, height: 300, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        数据库表状态
      </Typography>
      <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 600 }}>表名</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>记录数</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} align="center">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow
                  key={item.tableName}
                  sx={{
                    bgcolor: index % 2 === 1 ? 'grey.50' : 'inherit',
                    '&:last-child td': { border: 0 },
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" component="span">
                        {item.displayName}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block' }}
                      >
                        {item.tableName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.recordCount.toLocaleString('zh-CN')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TableStatusTable;
