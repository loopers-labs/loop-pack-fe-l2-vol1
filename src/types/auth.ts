export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthScenario = "invalid" | "expired" | "error" | "slow";

export type AuthErrorResponse = {
  message: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SessionResponse = {
  user: AuthUser;
};

export type OrderItem = {
  productId: string;
  quantity: number;
};

export type Order = {
  id: string;
  createdAt: string;
  items: OrderItem[];
};

export type OrderCreateRequest = {
  items: OrderItem[];
};

export type OrderCreateResponse = {
  order: Order;
};

export type OrderListResponse = {
  orders: Order[];
};
