import { track } from "./logger";

type ProductListViewProperties = {
  q: string;
  category: string;
  sort: string;
  page: number;
};

type ProductQuantityItem = {
  productId: string;
  quantity: number;
};

type OrderProperties = {
  items: ProductQuantityItem[];
  itemCount: number;
  totalQuantity: number;
};

export function trackProductListView(properties: ProductListViewProperties): void {
  track("product_list_view", properties);
}

export function trackCategoryFilterChange(properties: { category: string }): void {
  track("category_filter_change", properties);
}

export function trackSortChange(properties: { sort: string }): void {
  track("sort_change", properties);
}

export function trackPageChange(properties: { page: number }): void {
  track("page_change", properties);
}

export function trackCartAdd(properties: ProductQuantityItem): void {
  track("cart_add", properties);
}

export function trackWishlistAdd(properties: { productId: string }): void {
  track("wishlist_add", properties);
}

export function trackLoginStart(properties: { redirectTo: string }): void {
  track("login_start", properties);
}

export function trackLoginSuccess(properties: { redirectTo: string }): void {
  track("login_success", properties);
}

export function trackLoginFail(properties: { reason: string }): void {
  track("login_fail", properties);
}

export function trackOrderStart(properties: OrderProperties): void {
  track("order_start", properties);
}

export function trackOrderComplete(properties: OrderProperties & { orderId: string }): void {
  track("order_complete", properties);
}
