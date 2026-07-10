export async function getProducts() {
  const result = await fetch('/api/products');
  if (!result.ok) throw new Error(`API 호출 실패 `);
  return result.json();
}
