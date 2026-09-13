import * as t from '../templates';

describe('plantillas de aviso', () => {
  it('pone el enlace de validacion en el cuerpo, no solo el titulo', () => {
    const m = t.verifyEmail('Ulises', 'https://aroundthebean.ca/verify?t=abc');
    expect(m.body).toContain('https://aroundthebean.ca/verify?t=abc');
    expect(m.body).toContain('Ulises');
  });

  it('dice cuanto dura el enlace de contrasena', () => {
    // Sin el plazo, quien abre el correo al dia siguiente no entiende
    // por que no funciona y vuelve a pedir otro.
    expect(t.resetPassword('Ana', 'https://x/y').body).toContain('1 hour');
  });

  it('mete la hora de recogida y el codigo cuando el pedido es para llevar', () => {
    const alas = new Date('2026-09-12T07:30:00');
    const m = t.orderPlaced(['1 x Latte'], 6.2, alas, 'ABC234');
    expect(m.body).toContain('07:30');
    expect(m.body).toContain('ABC234');
    expect(m.body).toContain('$6.20');
  });

  it('omite hora y codigo cuando el pedido es para tomar en mesa', () => {
    const m = t.orderPlaced(['1 x Cortado'], 4.25);
    expect(m.body).not.toContain('undefined');
    expect(m.body).not.toContain('ready at');
    expect(m.body).toContain('$4.25');
  });

  it('nunca deja un hueco sin rellenar visible en el correo', () => {
    // Un «undefined» o un «NaN» en un correo a mil personas es el tipo de
    // error que no se puede deshacer.
    const todos = [
      t.welcome('Ana', 'HOLA123'),
      t.welcome('Ana', null),
      t.orderReady(),
      t.orderCancelled(),
      t.tableBooked(2, new Date('2026-09-12T19:00:00')),
      t.pointsEarned(5, 55),
      t.birthday('Ana', 'CUMPLE9X'),
      t.rewardRedeemed('Free coffee', 'ZZ12QR'),
      t.discountUsed('HOLA123', 1.25),
    ];
    for (const m of todos) {
      expect(`${m.title} ${m.body}`).not.toMatch(/undefined|NaN|\[object/);
      expect(m.title.length).toBeGreaterThan(0);
      expect(m.body.length).toBeGreaterThan(0);
    }
  });

  it('el saldo y lo ganado son numeros distintos en el aviso de puntos', () => {
    const m = t.pointsEarned(5, 55);
    expect(m.title).toContain('5 points');
    expect(m.body).toContain('55 points');
  });
});

describe('fillTemplate', () => {
  it('sustituye nombre y puntos', () => {
    const out = t.fillTemplate('Hola {{nombre}}, llevas {{puntos}} puntos.', {
      nombre: 'Ulises',
      puntos: 140,
    });
    expect(out).toBe('Hola Ulises, llevas 140 puntos.');
  });

  it('aguanta espacios y mayusculas dentro de las llaves', () => {
    // El dueno escribe estas plantillas a mano en el CRM.
    const out = t.fillTemplate('{{ Nombre }} y {{PUNTOS}}', { nombre: 'Ana', puntos: 3 });
    expect(out).toBe('Ana y 3');
  });

  it('sustituye todas las apariciones, no solo la primera', () => {
    const out = t.fillTemplate('{{nombre}}, {{nombre}}', { nombre: 'Ana', puntos: 0 });
    expect(out).toBe('Ana, Ana');
  });

  it('deja visible un hueco que no reconoce, en vez de borrarlo', () => {
    // Si desapareciera en silencio, el error solo se notaria despues del
    // envio. Asi el dueno lo ve en la vista previa.
    const out = t.fillTemplate('Hola {{apellido}}', { nombre: 'Ana', puntos: 0 });
    expect(out).toBe('Hola {{apellido}}');
  });

  it('fillTemplate entiende {{name}} y {{points}} además de los nombres viejos', () => {
    // El CRM pasó a inglés. Una campaña nueva usa {{name}}; una escrita antes
    // usa {{nombre}}. Las dos tienen que llegar rellenas.
    expect(
      t.fillTemplate('Hi {{name}}, you have {{ POINTS }} points.', { nombre: 'Ana', puntos: 7 }),
    ).toBe('Hi Ana, you have 7 points.');
    expect(t.fillTemplate('Hola {{nombre}}, {{puntos}}', { nombre: 'Ana', puntos: 7 })).toBe(
      'Hola Ana, 7',
    );
  });
});
