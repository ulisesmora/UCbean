import { audienceFilter, canSend, INACTIVE_DAYS } from '../audience';

const HOY = new Date('2026-09-12T10:00:00');

describe('audienceFilter', () => {
  it('no filtra nada cuando es para todos', () => {
    expect(audienceFilter('ALL', HOY)).toEqual({});
  });

  it('pide saldo positivo para los que juntan puntos', () => {
    expect(audienceFilter('WITH_POINTS', HOY)).toEqual({ hasPoints: true });
  });

  it('usa el mes en curso para los cumpleanos, contando desde uno', () => {
    // getMonth() devuelve 8 para septiembre. Un error de uno aqui manda
    // la campana de septiembre a los de agosto.
    expect(audienceFilter('BIRTHDAY_MONTH', HOY)).toEqual({ birthdayMonth: 9 });
  });

  it('mide la inactividad desde hace exactamente el plazo acordado', () => {
    const { noOrdersSince } = audienceFilter('INACTIVE', HOY);
    const dias = (HOY.getTime() - noOrdersSince!.getTime()) / (24 * 3600_000);
    expect(dias).toBeCloseTo(INACTIVE_DAYS, 5);
  });
});

describe('canSend', () => {
  it('deja mandar un borrador a mano', () => {
    expect(canSend('DRAFT', null, HOY)).toBe(true);
  });

  it('nunca repite una campana ya enviada', () => {
    // El error mas caro de este modulo es el segundo correo a la misma
    // lista. Esta es la linea que lo impide.
    expect(canSend('SENT', null, HOY)).toBe(false);
  });

  it('no arranca una que ya esta saliendo', () => {
    expect(canSend('SENDING', null, HOY)).toBe(false);
  });

  it('espera a la hora de una programada', () => {
    const enUnaHora = new Date(HOY.getTime() + 3600_000);
    const haceUnaHora = new Date(HOY.getTime() - 3600_000);
    expect(canSend('SCHEDULED', enUnaHora, HOY)).toBe(false);
    expect(canSend('SCHEDULED', haceUnaHora, HOY)).toBe(true);
  });

  it('no manda una programada sin hora', () => {
    expect(canSend('SCHEDULED', null, HOY)).toBe(false);
  });

  it('deja reintentar una que fallo', () => {
    expect(canSend('FAILED', null, HOY)).toBe(true);
  });
});
