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
  /** La foto del catálogo, para que el historial no sea una lista de texto. */
  imageUrl?: string | null;
  /** Extras on a menu item, so it can be repeated exactly. */
  extras?: string[];
  /** For here or to go, on a menu item. */
  vessel?: 'here' | 'togo' | null;
}

/** Una bebida que alguien guardó para no volver a configurarla. */
export interface FavoriteDrink {
  id: string;
  name: string;
  build: DrinkBuild;
  recipeId: string | null;
  productId: string | null;
  timesOrdered: number;
  createdAt: string;
  /** Calculado en el servidor al leer, nunca guardado. */
  price: number;
  ticket: string;
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

export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  isActive: boolean;
}

export interface PointsEntry {
  id: string;
  delta: number;
  reason: string;
  note: string | null;
  createdAt: string;
}

export interface LoyaltyCard {
  points: number;
  stamps: number;
  movements: PointsEntry[];
  pendingRedemptions: { id: string; code: string; reward: { name: string } }[];
}

export interface Discount {
  id: string;
  code: string;
  description: string;
  kind: 'PERCENT' | 'AMOUNT';
  value: string | number;
  endsAt: string | null;
  trigger: string | null;
}

/** Una receta tal como la devuelve la API, con precio y ticket ya calculados. */
export interface ApiRecipe {
  id: string;
  slug: string;
  name: string;
  accent: string | null;
  kind: 'SIGNATURE' | 'SEASONAL';
  note: string;
  season: string | null;
  price: number;
  ticket: string;
  build: DrinkBuild;
}
