import { describe, expect, it, vi, afterEach } from 'vitest';
import { minutesAgo, money, ORDER_STATUS, time } from './format';

/**
 * Lo que se prueba aquí es lo que, si se rompe, se rompe callado.
 *
 * Un botón que no pinta bien se ve al abrir la pantalla. Un precio con el
 * separador cambiado, una espera mal contada o una transición de estado que
 * salta un paso no se ven: se descubren cuando alguien cobra de menos o
 * cuando un café lleva media hora parado en la barra.
 */

describe('money', () => {
  it('siempre lleva dos decimales', () => {
    // 5 y 5.5 tienen que verse igual de anchos en una columna de precios.
    expect(money(5)).toMatch(/5[.,]00/);
    expect(money(5.5)).toMatch(/5[.,]50/);
  });

  it('un importe que falta se lee como cero, no como NaN', () => {
    // Pasa cuando un pedido viejo no tiene total. «$NaN» en la caja es peor
    // que un cero: nadie sabe si es un fallo o una venta de cero.
    expect(money(undefined as unknown as number)).toMatch(/0[.,]00/);
  });

  it('redondea a la moneda, no a lo que venga', () => {
    expect(money(3.456)).toMatch(/3[.,]46/);
  });
});

describe('minutesAgo', () => {
  afterEach(() => vi.useRealTimers());

  it('cuenta los minutos enteros que lleva esperando', () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-09-12T10:00:00'));
    expect(minutesAgo(new Date('2026-09-12T09:38:00'))).toBe(22);
  });

  it('nunca da negativo', () => {
    // Un pedido programado para dentro de diez minutos no lleva «-10
    // minutos esperando»: lleva cero.
    vi.useFakeTimers().setSystemTime(new Date('2026-09-12T10:00:00'));
    expect(minutesAgo(new Date('2026-09-12T10:10:00'))).toBe(0);
  });
});

describe('time', () => {
  it('usa reloj de 24 horas', () => {
    // En una barra, «07:30» y «7:30 PM» a media luz se confunden.
    expect(time(new Date('2026-09-12T19:05:00'))).toBe('19:05');
  });
});

describe('la máquina de estados de un pedido', () => {
  it('avanza un paso cada vez, sin saltarse ninguno', () => {
    // Saltar de PENDING a PREPARING deja un pedido sin confirmar en la
    // barra, y el backend lo rechaza. La cola tiene que proponer lo mismo.
    expect(ORDER_STATUS.PENDING.next).toBe('CONFIRMED');
    expect(ORDER_STATUS.CONFIRMED.next).toBe('PREPARING');
    expect(ORDER_STATUS.PREPARING.next).toBe('READY');
    expect(ORDER_STATUS.READY.next).toBe('COMPLETED');
  });

  it('los estados finales no proponen siguiente paso', () => {
    expect(ORDER_STATUS.COMPLETED.next).toBeUndefined();
    expect(ORDER_STATUS.CANCELLED.next).toBeUndefined();
  });

  it('cada estado tiene una etiqueta en español para la barra', () => {
    for (const [estado, v] of Object.entries(ORDER_STATUS)) {
      expect(v.label, `${estado} sin etiqueta`).toBeTruthy();
    }
  });
});
