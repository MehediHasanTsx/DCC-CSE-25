'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  value: number | string;
  duration?: number; // in ms, default 1000ms
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Parses numeric value, prefix, suffix, and decimal precision from input.
 * Handles strings like "68.42%", "3.75", "৳15,000", "0 Classes", etc.
 */
function parseValue(val: number | string, customDecimals?: number, customPrefix?: string, customSuffix?: string) {
  if (typeof val === 'number') {
    return {
      target: val,
      prefix: customPrefix ?? '',
      suffix: customSuffix ?? '',
      decimals: customDecimals ?? (val % 1 !== 0 ? (val.toString().split('.')[1] || '').length : 0),
    };
  }

  const str = String(val).trim();

  // Match optional prefix, number (with commas/decimals), and optional suffix
  const match = str.match(/^([^\d\-+.]*?)([+-]?[\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) {
    return {
      target: 0,
      prefix: customPrefix ?? '',
      suffix: customSuffix ?? str,
      decimals: 0,
      isText: true,
      rawText: str,
    };
  }

  const rawPrefix = customPrefix ?? match[1];
  const numStr = match[2].replace(/,/g, '');
  const rawSuffix = customSuffix ?? match[3];
  const target = parseFloat(numStr) || 0;

  const detectedDecimals = numStr.includes('.') ? (numStr.split('.')[1] || '').length : 0;
  const decimals = customDecimals ?? detectedDecimals;

  return {
    target,
    prefix: rawPrefix,
    suffix: rawSuffix,
    decimals,
    isText: false,
    rawText: str,
  };
}

export function CountUp({
  value,
  duration = 1000,
  decimals,
  prefix,
  suffix,
  className = '',
}: CountUpProps) {
  const parsed = parseValue(value, decimals, prefix, suffix);
  const [displayValue, setDisplayValue] = useState<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevTargetRef = useRef<number>(0);

  useEffect(() => {
    // If it's pure non-numeric text, no counting animation
    if (parsed.isText) return;

    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(parsed.target);
      return;
    }

    const startVal = prevTargetRef.current;
    const targetVal = parsed.target;
    prevTargetRef.current = targetVal;

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth easeOutCubic curve: 1 - (1 - t)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (targetVal - startVal) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetVal);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [parsed.target, parsed.isText, duration]);

  if (parsed.isText) {
    return <span className={className}>{parsed.rawText}</span>;
  }

  const formattedNum = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: parsed.decimals,
    maximumFractionDigits: parsed.decimals,
  });

  return (
    <span className={className}>
      {parsed.prefix}
      {formattedNum}
      {parsed.suffix}
    </span>
  );
}
