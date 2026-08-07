/**
 * Formatting utilities for currency, dates, and other display formats.
 */
import dayjs from 'dayjs';

/** Date format string. */
export const DATE_FORMAT = 'YYYY-MM-DD';

/** DateTime format string. */
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm';

/**
 * Formats a number as currency (e.g., ¥1,234.56).
 * @param value - The numeric value to format.
 * @returns Formatted currency string.
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '¥0.00';
  }
  return `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats a number with thousand separators (e.g., 1,234.56).
 * @param value - The numeric value to format.
 * @returns Formatted number string.
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00';
  }
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats an ISO date string to YYYY-MM-DD.
 * @param dateStr - ISO date string.
 * @returns Formatted date string.
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return dayjs(dateStr).format(DATE_FORMAT);
}

/**
 * Formats an ISO date string to YYYY-MM-DD HH:mm.
 * @param dateStr - ISO date string.
 * @returns Formatted datetime string.
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return dayjs(dateStr).format(DATETIME_FORMAT);
}

/**
 * Pads an order number to 4 digits (e.g., 42 → "0042").
 * @param num - The number to pad.
 * @returns 4-digit zero-padded string.
 */
export function padOrderNo(num: number | string): string {
  return num.toString().padStart(4, '0');
}

/**
 * Splits staff names string by the separator.
 * @param staffNames - Staff names string (e.g., "张伟、李娜").
 * @returns Array of staff name strings.
 */
export function splitStaffNames(staffNames: string): string[] {
  if (!staffNames) return [];
  return staffNames.split('、').filter((s) => s.trim().length > 0);
}

/**
 * Joins staff names array with the separator.
 * @param names - Array of staff names.
 * @returns Joined string (e.g., "张伟、李娜").
 */
export function joinStaffNames(names: string[]): string {
  return names.join('、');
}

/**
 * Calculates and formats the duration between two ISO datetime strings.
 * Returns a human-readable string like "3小时" or "2天5小时".
 * @param startTime - ISO start time string.
 * @param endTime - ISO end time string.
 * @returns Formatted duration string, or '-' if either value is null/invalid.
 */
export function formatDuration(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): string {
  if (!startTime || !endTime) return '-';
  const start = dayjs(startTime);
  const end = dayjs(endTime);
  if (!start.isValid() || !end.isValid()) return '-';
  if (end.isBefore(start)) return '-';

  const diffMs = end.diff(start);
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);

  if (days > 0 && hours > 0) {
    return `${days}天${hours}小时`;
  } else if (days > 0) {
    return `${days}天`;
  } else if (hours > 0) {
    return `${hours}小时`;
  } else {
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${minutes}分钟` : '0小时';
  }
}
