import type { MetadataRoute } from 'next';
import { products } from '@/entities/product/api/commerce';

export default function sitemap(): MetadataRoute.Sitemap {
  const productEntries = products.map((product) => ({
    url: `https://aesthetic.example.com/products/${product.id}`,
    lastModified: new Date(product.createdAt),
  }));

  return [
    {
      url: 'https://aesthetic.example.com',
      lastModified: new Date(),
    },
    {
      url: 'https://aesthetic.example.com/products',
      lastModified: new Date(),
    },
    ...productEntries,
  ];
}
