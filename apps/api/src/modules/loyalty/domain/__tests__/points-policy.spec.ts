import { canAfford, pointsForOrder, SIGNUP_POINTS } from '../points-policy';

describe('pointsForOrder', () => {
  it('da un punto por cada dolar completo', () => {
    expect(pointsForOrder(5)).toBe(5);
    expect(pointsForOrder(12)).toBe(12);
  });

  it('redondea hacia abajo, nunca a favor de la casa por accidente', () => {
    // Prometer «un punto por dolar» y dar 5 por un cafe de 5.75 es lo
    // que la gente espera. Dar 6 regala dinero en cada pedido.
    expect(pointsForOrder(5.75)).toBe(5);
    expect(pointsForOrder(0.99)).toBe(0);
  });

  it('no da nada por un pedido gratis o raro', () => {
    // Un pedido totalmente descontado llega aqui con total cero.
    expect(pointsForOrder(0)).toBe(0);
    expect(pointsForOrder(-3)).toBe(0);
    expect(pointsForOrder(Number.NaN)).toBe(0);
  });
});

describe('canAfford', () => {
  it('deja canjear cuando alcanza justo', () => {
    expect(canAfford(120, 120)).toBe(true);
  });

  it('no deja canjear cuando falta un punto', () => {
    expect(canAfford(119, 120)).toBe(false);
  });

  it('no deja canjear un premio que no cuesta nada', () => {
    // Un premio a coste cero seria canjeable infinitas veces.
    expect(canAfford(0, 0)).toBe(false);
  });

  it('no deja canjear con saldo negativo', () => {
    expect(canAfford(-10, 5)).toBe(false);
  });
});

describe('regalo de bienvenida', () => {
  it('vale menos que el premio mas barato que pensamos poner', () => {
    // Si la bienvenida alcanzara para un cafe gratis, cualquiera abriria
    // cuentas nuevas en vez de volver. Esta prueba es la que avisa si
    // alguien sube SIGNUP_POINTS sin pensarlo.
    expect(SIGNUP_POINTS).toBeLessThan(120);
  });
});
