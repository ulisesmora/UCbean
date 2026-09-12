/**
 * Lo que dicen los avisos.
 *
 * Funciones puras: entra un dato, sale un título y un cuerpo. Así se
 * pueden probar sin base de datos ni proveedor de correo, que es donde
 * de verdad se cuelan los errores de redacción y los datos sin rellenar.
 *
 * Tono: la cafetería es familiar, no un banco. Frases cortas, sin
 * mayúsculas de más y sin signos de admiración.
 */

export interface Message {
  title: string;
  body: string;
}

const money = (n: number) => `$${n.toFixed(2)}`;

const hora = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export function verifyEmail(name: string, link: string): Message {
  return {
    title: 'Confirma tu correo',
    body:
      `Hola ${name}.\n\n` +
      `Confirma tu correo para terminar de crear tu cuenta:\n${link}\n\n` +
      `El enlace vence en 24 horas. Si no fuiste tú, ignora este mensaje.`,
  };
}

export function resetPassword(name: string, link: string): Message {
  return {
    title: 'Cambia tu contraseña',
    body:
      `Hola ${name}.\n\n` +
      `Alguien pidió cambiar la contraseña de tu cuenta. Si fuiste tú:\n${link}\n\n` +
      `El enlace vence en 1 hora y solo sirve una vez. Si no fuiste tú, ` +
      `no hace falta que hagas nada.`,
  };
}

export function welcome(name: string, discountCode: string | null): Message {
  const regalo = discountCode
    ? `\n\nTe dejamos un ${'10%'} en tu primer pedido con el código ${discountCode}.`
    : '';
  return {
    title: 'Bienvenido a Around the Bean',
    body: `Hola ${name}.\n\nYa puedes pedir desde la app y recoger sin hacer fila.${regalo}`,
  };
}

export function orderPlaced(
  lines: string[],
  total: number,
  slotTime?: Date,
  code?: string,
): Message {
  const cuando = slotTime ? `\n\nLo tienes listo a las ${hora(slotTime)}.` : '';
  const codigo = code ? `\nEnseña el código ${code} en el mostrador.` : '';
  return {
    title: 'Pedido confirmado',
    body: `Ya lo estamos preparando.\n\n${lines.join('\n')}\n\nTotal ${money(total)}.${cuando}${codigo}`,
  };
}

export function orderReady(): Message {
  return {
    title: 'Tu pedido está listo',
    body: 'Te lo dejamos en la barra. Pasa cuando quieras.',
  };
}

export function orderCancelled(): Message {
  return {
    title: 'Pedido cancelado',
    body: 'Cancelamos tu pedido. Si pagaste, el reembolso sale hoy mismo.',
  };
}

export function tableBooked(partySize: number, scheduledAt: Date): Message {
  return {
    title: 'Mesa reservada',
    body:
      `Te guardamos mesa para ${partySize} ` +
      `el ${scheduledAt.toLocaleDateString('es-MX')} a las ${hora(scheduledAt)}.`,
  };
}

export function pointsEarned(points: number, balance: number): Message {
  return {
    title: `Ganaste ${points} puntos`,
    body: `Llevas ${balance} puntos. Canjéalos por un café cuando quieras.`,
  };
}

export function birthday(name: string, code: string): Message {
  return {
    title: `Feliz cumpleaños, ${name}`,
    body: `Hoy el café va por nuestra cuenta. Usa el código ${code} antes de que acabe el mes.`,
  };
}

export function rewardRedeemed(rewardName: string, code: string): Message {
  return {
    title: 'Canje listo',
    body: `Cambiaste tus puntos por ${rewardName}. Enseña el código ${code} en el mostrador.`,
  };
}

export function discountUsed(code: string, amount: number): Message {
  return {
    title: 'Descuento aplicado',
    body: `Usaste el código ${code} y te ahorraste ${money(amount)}.`,
  };
}

/**
 * Sustituye los huecos de una campaña.
 *
 * Solo dos, a propósito. Una plantilla con veinte variables es una
 * plantilla que alguien va a romper escribiendo mal una llave, y el
 * error solo aparece cuando el correo ya salió a mil personas. Un
 * hueco que no se reconoce se queda tal cual, visible, en vez de
 * desaparecer sin que nadie lo note.
 */
export function fillTemplate(body: string, vars: { nombre: string; puntos: number }): string {
  return body
    .replace(/\{\{\s*nombre\s*\}\}/gi, vars.nombre)
    .replace(/\{\{\s*puntos\s*\}\}/gi, String(vars.puntos));
}
