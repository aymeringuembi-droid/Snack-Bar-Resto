export type Category = {
  id: string;
  name: string;
  position: number;
  created_at: string;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  created_at: string;
};

export type Ingredient = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
};

export type RestaurantTable = {
  id: string;
  label: string;
  seats: number;
  status: "libre" | "occupee" | "reservee";
  created_at: string;
};

export type Reservation = {
  id: string;
  table_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  party_size: number;
  reservation_time: string;
  status: "confirmee" | "annulee" | "terminee";
  notes: string | null;
  created_at: string;
};

export type OrderStatus = "en_cours" | "pret" | "servi" | "annulee";

export type Order = {
  id: string;
  table_id: string | null;
  status: OrderStatus;
  total: number;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  created_at: string;
};

export type Payment = {
  id: string;
  order_id: string;
  amount: number;
  method: "especes" | "carte" | "mobile";
  paid_at: string;
};
