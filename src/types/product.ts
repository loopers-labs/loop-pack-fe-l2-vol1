export type Product = {
  id: number;
  name: string;
  category: 'electronics' | 'fashion' | 'home' | 'beauty';
  price: number;
  originalPrice: number | null;
  stock: number;
  imageUrl: string;
  createdAt: string;
  rating: number;
  reviewCount: number;
  deliveryType: '샛별배송' | '판매자배송';
  freeShipping: boolean;
  description: string;
  sizes: { value: number; stock: number }[];
  options: { id: string; name: string; price: number; stock: number }[];
};
