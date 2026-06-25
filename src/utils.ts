export function getPriceText(price?: number, endAdornment?: string) {
  return `${(price ?? 0).toLocaleString()}${endAdornment || '원'}`;
}
