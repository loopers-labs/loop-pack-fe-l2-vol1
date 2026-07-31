import type { ProductCatalog } from "../_types/product";

export const selectDemoCatalog: ProductCatalog = {
  bundles: [
    {
      id: "bagel-55",
      name: "[최대할인] 베이글 5+5개",
      price: 21000,
      unitCount: 10,
      freeShipping: true,
    },
    {
      id: "bagel-1",
      name: "베이글 1개",
      price: 4200,
      unitCount: 1,
      freeShipping: false,
    },
  ],
  sneakers: {
    id: "sneakers-daily",
    name: "데일리 스니커즈",
    sizes: [
      { value: 24, stock: 3 },
      { value: 25, stock: 5 },
      { value: 26, stock: 12 },
      { value: 27, stock: 2 },
      { value: 28, stock: 0 },
    ],
  },
  ampoules: [
    {
      id: "ampoule-100",
      name: "그로우턴 앰플 100ml기획(+100ml)",
      price: 38800,
      originalPrice: 39600,
      image: "/globe.svg",
      todayDelivery: true,
    },
    {
      id: "ampoule-130",
      name: "그로우턴 앰플 130ml기획(+30ml)",
      price: 33800,
      originalPrice: 34500,
      image: "/window.svg",
      todayDelivery: true,
    },
  ],
};
