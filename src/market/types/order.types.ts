export type OrderStatus = 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export type PastOrder = {
  id: string;
  summary: string;
  status: OrderStatus;
  amount: number;
};
