import { checkDiscount, discountAmount, reasonText, type DiscountRule } from '../discount-policy';

const AYER = new Date('2026-09-11T10:00:00Z');
const HOY = new Date('2026-09-12T10:00:00Z');
const MANANA = new Date('2026-09-13T10:00:00Z');

const rule = (over: Partial<DiscountRule> = {}): DiscountRule => ({
  kind: 'PERCENT',
  value: 10,
  minOrderTotal: null,
  maxRedemptions: null,
  perUserLimit: 1,
  startsAt: null,
  endsAt: null,
  isActive: true,
  userId: null,
  ...over,
});

const ctx = (over: Partial<Parameters<typeof checkDiscount>[1]> = {}) => ({
  userId: 'u1',
  orderTotal: 20,
  globalUses: 0,
  userUses: 0,
  now: HOY,
  ...over,
});

describe('checkDiscount', () => {
  it('acepta un codigo vigente y sin usar', () => {
    expect(checkDiscount(rule(), ctx())).toBeNull();
  });

  it('rechaza uno apagado', () => {
    expect(checkDiscount(rule({ isActive: false }), ctx())).toBe('INACTIVE');
  });

  it('rechaza el cupon personal de otra persona', () => {
    // Sin esto, el codigo de cumpleanos de alguien circularia por el chat
    // del campus y lo usaria media universidad.
    expect(checkDiscount(rule({ userId: 'otra' }), ctx())).toBe('NOT_YOURS');
  });

  it('deja usar el cupon personal a su dueno', () => {
    expect(checkDiscount(rule({ userId: 'u1' }), ctx())).toBeNull();
  });

  it('respeta la ventana de fechas por los dos lados', () => {
    expect(checkDiscount(rule({ startsAt: MANANA }), ctx())).toBe('NOT_STARTED');
    expect(checkDiscount(rule({ endsAt: AYER }), ctx())).toBe('EXPIRED');
  });

  it('rechaza cuando se agoto el tope global', () => {
    expect(checkDiscount(rule({ maxRedemptions: 100 }), ctx({ globalUses: 100 }))).toBe(
      'EXHAUSTED',
    );
  });

  it('rechaza el segundo uso de la misma persona', () => {
    expect(checkDiscount(rule({ perUserLimit: 1 }), ctx({ userUses: 1 }))).toBe('ALREADY_USED');
  });

  it('deja varios usos cuando el limite por persona lo permite', () => {
    expect(checkDiscount(rule({ perUserLimit: 3 }), ctx({ userUses: 2 }))).toBeNull();
  });

  it('avisa del minimo al final, que es lo unico que el cliente puede arreglar', () => {
    // El orden importa: si el codigo ya vencio, decirle a alguien que
    // anada mas a la cesta le hace perder el tiempo dos veces.
    const vencidoYPequeno = rule({ endsAt: AYER, minOrderTotal: 50 });
    expect(checkDiscount(vencidoYPequeno, ctx({ orderTotal: 5 }))).toBe('EXPIRED');
    expect(checkDiscount(rule({ minOrderTotal: 50 }), ctx({ orderTotal: 5 }))).toBe(
      'BELOW_MINIMUM',
    );
  });

  it('cada motivo tiene un texto que explica que paso', () => {
    expect(reasonText('ALREADY_USED')).toContain('Ya usaste');
    expect(reasonText('NOT_YOURS')).toContain('otra cuenta');
  });
});

describe('discountAmount', () => {
  it('calcula un porcentaje', () => {
    expect(discountAmount(rule({ kind: 'PERCENT', value: 10 }), 20)).toBe(2);
  });

  it('calcula una cantidad fija', () => {
    expect(discountAmount(rule({ kind: 'AMOUNT', value: 3 }), 20)).toBe(3);
  });

  it('nunca descuenta mas que el total', () => {
    // Un cupon de 10 sobre un cafe de 4 deja el pedido en cero, no en
    // menos seis, que seria pagarle a alguien por comprar barato.
    expect(discountAmount(rule({ kind: 'AMOUNT', value: 10 }), 4)).toBe(4);
  });

  it('aguanta valores fuera de rango sin devolver disparates', () => {
    expect(discountAmount(rule({ kind: 'PERCENT', value: 500 }), 20)).toBe(20);
    expect(discountAmount(rule({ kind: 'PERCENT', value: -30 }), 20)).toBe(0);
    expect(discountAmount(rule({ kind: 'AMOUNT', value: -5 }), 20)).toBe(0);
  });

  it('no descuenta nada de un pedido vacio', () => {
    expect(discountAmount(rule(), 0)).toBe(0);
  });

  it('redondea a centavos', () => {
    // 33% de 10.10 son 3.333, y eso va a una columna Decimal(10,2).
    const monto = discountAmount(rule({ kind: 'PERCENT', value: 33 }), 10.1);
    expect(monto).toBe(3.33);
    expect(Math.round(monto * 100) / 100).toBe(monto);
  });
});
