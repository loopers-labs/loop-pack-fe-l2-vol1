export const formatPrice = (price: number) => `${price.toLocaleString()}원`;

export const escapeRegExp = (s: string) =>
  s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
