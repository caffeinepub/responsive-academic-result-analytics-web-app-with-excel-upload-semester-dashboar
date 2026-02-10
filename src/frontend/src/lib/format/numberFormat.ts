export function formatNumber(value: number): string {
  if (!isFinite(value) || isNaN(value)) {
    return '0';
  }
  return Math.round(value).toLocaleString();
}

export function formatPercentage(value: number): string {
  if (!isFinite(value) || isNaN(value)) {
    return '0%';
  }
  return `${value.toFixed(1)}%`;
}

export function formatDecimal(value: number, decimals: number = 2): string {
  if (!isFinite(value) || isNaN(value)) {
    return '0';
  }
  return value.toFixed(decimals);
}
