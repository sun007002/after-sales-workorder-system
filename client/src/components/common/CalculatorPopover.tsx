/**
 * CalculatorPopover component.
 * A lightweight on-screen calculator shown in a popover. Uses basic
 * immediate-execution semantics (like a simple pocket calculator) and returns
 * the result as a string via onConfirm.
 */
import React, { useState } from 'react';
import { Popover, Box, Button, Typography, Divider } from '@mui/material';

/** Props for the CalculatorPopover component. */
export interface CalculatorPopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  /** Called with the confirmed numeric result (as a string) when the user taps 使用. */
  onConfirm: (value: string) => void;
}

type Operator = '+' | '-' | '×' | '÷';

/** Applies a binary operation. */
const applyOperator = (a: number, b: number, op: Operator): number => {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return b === 0 ? NaN : a / b;
    default:
      return b;
  }
};

/** Rounds to at most 2 decimal places (currency). */
const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * On-screen calculator rendered in a popover.
 */
const CalculatorPopover: React.FC<CalculatorPopoverProps> = ({
  anchorEl,
  open,
  onClose,
  onConfirm,
}) => {
  const [display, setDisplay] = useState('0');
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const reset = () => {
    setDisplay('0');
    setAccumulator(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clearAll = () => reset();

  const backspace = () => {
    if (waitingForOperand) return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
  };

  const chooseOperator = (nextOperator: Operator) => {
    const current = parseFloat(display) || 0;
    if (accumulator === null) {
      setAccumulator(current);
    } else if (operator && !waitingForOperand) {
      const result = applyOperator(accumulator, current, operator);
      setAccumulator(result);
      setDisplay(String(result));
    }
    setOperator(nextOperator);
    setWaitingForOperand(true);
  };

  /** Evaluates any pending operation and returns the current numeric value. */
  const evaluate = (): number => {
    const current = parseFloat(display) || 0;
    if (operator !== null && accumulator !== null && !waitingForOperand) {
      return applyOperator(accumulator, current, operator);
    }
    if (operator !== null && accumulator !== null && waitingForOperand) {
      return accumulator;
    }
    return current;
  };

  const equals = () => {
    const result = evaluate();
    setDisplay(String(Number.isFinite(result) ? result : 0));
    setAccumulator(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const handleConfirm = () => {
    const result = evaluate();
    const safe = Number.isFinite(result) ? Math.max(0, round2(result)) : 0;
    onConfirm(String(safe));
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const keypad: Array<{ label: string; onClick: () => void; color?: 'primary' | 'inherit' }> = [
    { label: 'C', onClick: clearAll, color: 'inherit' },
    { label: '⌫', onClick: backspace, color: 'inherit' },
    { label: '÷', onClick: () => chooseOperator('÷'), color: 'primary' },
    { label: '×', onClick: () => chooseOperator('×'), color: 'primary' },
    { label: '7', onClick: () => inputDigit('7') },
    { label: '8', onClick: () => inputDigit('8') },
    { label: '9', onClick: () => inputDigit('9') },
    { label: '-', onClick: () => chooseOperator('-'), color: 'primary' },
    { label: '4', onClick: () => inputDigit('4') },
    { label: '5', onClick: () => inputDigit('5') },
    { label: '6', onClick: () => inputDigit('6') },
    { label: '+', onClick: () => chooseOperator('+'), color: 'primary' },
    { label: '1', onClick: () => inputDigit('1') },
    { label: '2', onClick: () => inputDigit('2') },
    { label: '3', onClick: () => inputDigit('3') },
    { label: '=', onClick: equals, color: 'primary' },
    { label: '0', onClick: () => inputDigit('0') },
    { label: '.', onClick: inputDot },
  ];

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Box sx={{ p: 1.5, width: 240 }}>
        <Box
          sx={{
            mb: 1,
            px: 1.5,
            py: 1,
            borderRadius: 1,
            bgcolor: 'action.hover',
            textAlign: 'right',
            minHeight: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            overflow: 'hidden',
          }}
        >
          <Typography variant="h6" noWrap sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {display}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 0.5,
          }}
        >
          {keypad.map((key, index) => (
            <Button
              key={`${key.label}-${index}`}
              variant={key.color === 'primary' ? 'contained' : 'outlined'}
              color={key.color === 'primary' ? 'primary' : 'inherit'}
              onClick={key.onClick}
              sx={{
                minWidth: 0,
                py: 1,
                fontSize: '1rem',
                // "0" spans two columns.
                gridColumn: key.label === '0' ? 'span 2' : undefined,
              }}
            >
              {key.label}
            </Button>
          ))}
        </Box>

        <Divider sx={{ my: 1 }} />
        <Button fullWidth variant="contained" color="success" onClick={handleConfirm}>
          使用结果
        </Button>
      </Box>
    </Popover>
  );
};

export default CalculatorPopover;
