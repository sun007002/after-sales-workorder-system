/**
 * Work order number generation utility.
 * Generates sequential 4-digit order numbers (0001, 0002, ...).
 */
import prisma from './prisma';

/**
 * Generates the next work order number by finding the current maximum
 * order_no across ALL work orders (including soft-deleted ones), converting
 * to integer, incrementing, and padding to 4 digits.
 *
 * The order_no column has a GLOBAL unique constraint that does not distinguish
 * soft-deleted rows. Filtering by isDeleted=false would cause P2002 collisions
 * when the max non-deleted number is lower than a soft-deleted one.
 * Numeric comparison is used (not string sort) to handle values >= 10000.
 *
 * @returns The next order number string (e.g., "0043").
 */
export async function generateOrderNo(): Promise<string> {
  const result = await prisma.$queryRaw<Array<{ maxNum: bigint | number | null }>>`
    SELECT MAX(CAST(order_no AS UNSIGNED)) AS maxNum FROM work_orders
  `;
  const maxNum = Number(result[0]?.maxNum ?? 0);
  return (maxNum + 1).toString().padStart(4, '0');
}
