import type { Activity, Order, Product, User } from "./types";

export const MOCK_USER: User = {
  name: "Adittya Amin",
  email: "adittyaamin@gmail.com",
  business: "Aditi Fashion House",
  phone: "+8801711-000000",
  avatarColor: "#3362FF"
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "p_001",
    name: "Soft Cotton Kurti — Rose",
    price: 1290,
    stock: 24,
    category: "Women",
    status: "active",
    imageHue: 340,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: "p_002",
    name: "Embroidered Panjabi — Cream",
    price: 1850,
    stock: 12,
    category: "Men",
    status: "active",
    imageHue: 45,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: "p_003",
    name: "Kids Casual Set — Sky",
    price: 950,
    stock: 0,
    category: "Kids",
    status: "out_of_stock",
    imageHue: 200,
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString()
  },
  {
    id: "p_004",
    name: "Hand-stitched Saree — Maroon",
    price: 3490,
    stock: 7,
    category: "Women",
    status: "active",
    imageHue: 0,
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString()
  },
  {
    id: "p_005",
    name: "Leather Wallet — Brown",
    price: 690,
    stock: 38,
    category: "Accessories",
    status: "draft",
    imageHue: 28,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: "p_006",
    name: "Silk Hijab — Olive",
    price: 450,
    stock: 60,
    category: "Women",
    status: "active",
    imageHue: 90,
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString()
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-1042",
    customer: "Tasnim Ahmed",
    phone: "01711-234567",
    product: "Soft Cotton Kurti — Rose",
    amount: 1290,
    status: "pending",
    courier: "—",
    createdAt: new Date(Date.now() - 30 * 60000).toISOString()
  },
  {
    id: "ORD-1041",
    customer: "Rakib Hasan",
    phone: "01511-987654",
    product: "Embroidered Panjabi — Cream",
    amount: 1850,
    status: "confirmed",
    courier: "Steadfast",
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString()
  },
  {
    id: "ORD-1040",
    customer: "Mim Akter",
    phone: "01911-112233",
    product: "Hand-stitched Saree — Maroon",
    amount: 3490,
    status: "shipped",
    courier: "Pathao",
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString()
  },
  {
    id: "ORD-1039",
    customer: "Sajid Khan",
    phone: "01811-445566",
    product: "Leather Wallet — Brown",
    amount: 690,
    status: "delivered",
    courier: "Steadfast",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: "ORD-1038",
    customer: "Nusrat Jahan",
    phone: "01611-778899",
    product: "Silk Hijab — Olive",
    amount: 450,
    status: "delivered",
    courier: "Pathao",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: "ORD-1037",
    customer: "Imran Hossain",
    phone: "01311-001122",
    product: "Kids Casual Set — Sky",
    amount: 950,
    status: "cancelled",
    courier: "—",
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  }
];

export const MOCK_ACTIVITY: Activity[] = [
  {
    id: "a1",
    type: "order",
    text: "New order ORD-1042 from Tasnim Ahmed",
    time: new Date(Date.now() - 30 * 60000).toISOString()
  },
  {
    id: "a2",
    type: "ai",
    text: "Generated AI post for “Embroidered Panjabi — Cream”",
    time: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: "a3",
    type: "sms",
    text: "Sent promo SMS to 28 customers",
    time: new Date(Date.now() - 5 * 3600000).toISOString()
  },
  {
    id: "a4",
    type: "product",
    text: "Added new product “Silk Hijab — Olive”",
    time: new Date(Date.now() - 24 * 3600000).toISOString()
  },
  {
    id: "a5",
    type: "system",
    text: "Steadfast delivery integration synced",
    time: new Date(Date.now() - 48 * 3600000).toISOString()
  }
];

export const SAMPLE_CAPTIONS: string[] = [
  "✨ New arrival alert! Step into elegance with our latest piece — soft, comfy, and made for your day-to-day glow. Order now via inbox 💬",
  "Style meets comfort 💫 Perfect for everyday wear or special moments. Limited stock — DM us to grab yours before they’re gone!",
  "Crafted with love, made for you ❤️ Premium fabric, beautiful detailing, and a fit you’ll fall for. Inbox to order today!",
  "Treat yourself to something beautiful 🌸 Our customers can’t stop raving — and we think you’ll love it too. Order now!"
];

export const SAMPLE_HASHTAGS: string[] = [
  "#FcommerceBD",
  "#FashionBangladesh",
  "#OnlineShoppingBD",
  "#NewArrival",
  "#StyleDaily",
  "#DhakaFashion"
];
