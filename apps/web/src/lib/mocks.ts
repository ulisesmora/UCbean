import type {
  AuthResponse,
  Category,
  Order,
  Product,
  SlotAvailability,
  TableReservation,
  User,
} from '@/types/api.types';

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-hot', name: 'Hot Drinks', slug: 'hot-drinks' },
  { id: 'cat-iced', name: 'Iced Drinks', slug: 'iced-drinks' },
  { id: 'cat-filter', name: 'Filter Coffee', slug: 'filter-coffee' },
  { id: 'cat-beans', name: 'Whole Beans', slug: 'whole-beans' },
];

export const MOCK_PRODUCTS: Product[] = [
  // Hot
  {
    id: 'p1',
    name: 'Cortado',
    description: 'Espresso cut with a small amount of warm milk.',
    price: 4.5,
    imageUrl: null,
    isAvailable: true,
    categoryId: 'cat-hot',
  },
  {
    id: 'p2',
    name: 'Flat White',
    description: 'Double ristretto with microfoam. Our house favourite.',
    price: 5.0,
    imageUrl: null,
    isAvailable: true,
    categoryId: 'cat-hot',
  },
  {
    id: 'p3',
    name: 'Americano',
    description: 'Two shots over hot water, clean and bold.',
    price: 4.0,
    imageUrl: null,
    isAvailable: true,
    categoryId: 'cat-hot',
  },
  {
    id: 'p4',
    name: 'Hojicha Latte',
    description: 'Roasted Japanese green tea with oat milk.',
    price: 5.5,
    imageUrl: null,
    isAvailable: true,
    categoryId: 'cat-hot',
  },
  {
    id: 'p5',
    name: 'Chai Latte',
    description: 'Spiced masala chai blend, steamed with whole milk.',
    price: 5.0,
    imageUrl: null,
    isAvailable: true,
    categoryId: 'cat-hot',
  },
  // Iced
  {
    id: 'p6',
    name: 'Iced Yuzu Latte',
    description: 'Espresso, yuzu citrus, oat milk over ice.',
    price: 6.5,
    imageUrl: null,
    isAvailable: true,
    categoryId: 'cat-iced',
  },
  {
    id: 'p7',
    name: 'Cold Brew',
    description: '20-hour steep, served over ice. Smooth, never bitter.',
    price: 5.5,
    imageUrl: null,
    isAvailable: true,
    categoryId: 'cat-iced',
  },
  {
    id: 'p8',
    name: 'Iced Matcha Latte',
    description: 'Ceremonial-grade matcha with oat milk.',
    price: 6.0,
    imageUrl: null,
    isAvailable: true,
    categoryId: 'cat-iced',
  },
  {
    id: 'p9',
    name: 'Iced Black Sesame Latte',
    description: 'Toasted sesame paste, espresso, oat milk.',
    price: 6.5,
    imageUrl: null,
    isAvailable: true,
    categoryId: 'cat-iced',
  },
  {
    id: 'p10',
    name: 'Sparkling Espresso Tonic',
    description: 'Single origin espresso over tonic water.',
    price: 5.5,
    imageUrl: null,
    isAvailable: true,
    categoryId: 'cat-iced',
  },
  // Filter
  {
    id: 'p11',
    name: 'V60 Pour-Over',
    description: "Single origin, brewed to order. Ask about today's bean.",
    price: 5.0,
    imageUrl: null,
    isAvailable: true,
    categoryId: 'cat-filter',
  },
  {
    id: 'p12',
    name: 'Batch Brew',
    description: 'Fresh every 45 minutes. Our rotating single origin.',
    price: 3.5,
    imageUrl: null,
    isAvailable: true,
    categoryId: 'cat-filter',
  },
  {
    id: 'p13',
    name: 'AeroPress',
    description: 'Intense and clean. Brewed with precision.',
    price: 5.0,
    imageUrl: null,
    isAvailable: true,
    categoryId: 'cat-filter',
  },
  // Whole Beans
  {
    id: 'p14',
    name: 'Ethiopia Yirgacheffe — 250g',
    description: 'Blueberry, jasmine, citrus. Light roast.',
    price: 18.0,
    imageUrl: null,
    isAvailable: true,
    categoryId: 'cat-beans',
  },
  {
    id: 'p15',
    name: 'Colombia Huila — 250g',
    description: 'Caramel, red apple, milk chocolate. Medium roast.',
    price: 17.0,
    imageUrl: null,
    isAvailable: true,
    categoryId: 'cat-beans',
  },
  {
    id: 'p16',
    name: 'Sumatra Mandheling — 250g',
    description: 'Dark chocolate, cedar, full body. Dark roast.',
    price: 16.0,
    imageUrl: null,
    isAvailable: true,
    categoryId: 'cat-beans',
  },
];

function makeSlots(date: string): SlotAvailability {
  const times = [
    '8:00',
    '8:30',
    '9:00',
    '9:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
  ];
  const availability = [8, 5, 8, 3, 8, 8, 0, 6, 8, 4, 8, 8, 2, 8, 7];
  return {
    date,
    slots: times.map((t, i) => ({
      time: t,
      available: availability[i],
      booked: 8 - availability[i],
    })),
  };
}

const MOCK_USER: User = {
  id: 'mock-user-1',
  name: 'Alex Chen',
  email: 'alex@ubc.ca',
  phone: null,
  role: 'CUSTOMER',
};
const MOCK_AUTH: AuthResponse = { accessToken: 'mock-token-abc123', user: MOCK_USER };

export const mockProductsApi = {
  list: (categoryId?: string): Promise<Product[]> =>
    delay(categoryId ? MOCK_PRODUCTS.filter((p) => p.categoryId === categoryId) : MOCK_PRODUCTS),
  categories: (): Promise<Category[]> => delay(MOCK_CATEGORIES),
};

export const mockReservationsApi = {
  pickupSlots: (date: string): Promise<SlotAvailability> => delay(makeSlots(date)),
  bookTable: (_body: unknown, _token: string): Promise<TableReservation> =>
    delay({
      id: 'res-mock-1',
      userId: 'mock-user-1',
      tableId: 'table-1',
      partySize: 2,
      scheduledAt: new Date().toISOString(),
      status: 'PENDING',
      notes: null,
    }),
  myTableReservations: (_token: string): Promise<TableReservation[]> => delay([]),
};

export const mockOrdersApi = {
  myOrders: (_token: string): Promise<Order[]> => delay([]),
};

export const mockAuthApi = {
  register: (_body: unknown): Promise<AuthResponse> => delay(MOCK_AUTH),
  login: (_body: unknown): Promise<AuthResponse> => delay(MOCK_AUTH),
  logout: (): Promise<void> => delay(undefined as void),
  me: (_token: string): Promise<User> => delay(MOCK_USER),
};

function delay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((res) => setTimeout(() => res(data), ms));
}
