import type { Build as DrinkBuild } from '@/lib/builder';

export type { DrinkBuild };

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
  /** The formula, when the drink was built rather than picked off the menu. */
  build?: DrinkBuild | null;
  recipeId?: string | null;
  name?: string | null;
  ticket?: string | null;
}

/** What the shop promises about when an order will be on the counter. */
export interface PickupReservation {
  id: string;
  orderId: string;
  slotTime: string;
  confirmationCode: string;
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
  pickup?: PickupReservation | null;
}

export interface SlotAvailability {
  date: string;
  /** Open times as HH:MM. The API only lists slots that still have room. */
  slots: string[];
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
