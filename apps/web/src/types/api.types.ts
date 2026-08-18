export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryId: string;
  category?: Category;
}

export interface OrderItem {
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  type: 'PICKUP' | 'DELIVERY' | 'TABLE';
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  total: number;
  notes: string | null;
  items: OrderItem[];
  createdAt: string;
}

export interface SlotAvailability {
  date: string;
  slots: Array<{ time: string; available: number; booked: number }>;
}

export interface TableReservation {
  id: string;
  userId: string;
  tableId: string;
  partySize: number;
  scheduledAt: string;
  status: string;
  notes: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'CUSTOMER' | 'OWNER' | 'STAFF';
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
