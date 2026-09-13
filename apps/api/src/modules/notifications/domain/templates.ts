/**
 * What the notices say.
 *
 * Pure functions: a value goes in, a title and a body come out. That means
 * they can be tested without a database or a mail provider, which is where
 * wording mistakes and unfilled placeholders actually hide.
 *
 * Written in English because they reach customers, and the customer-facing
 * site is English. The counter app is in Spanish because staff use it.
 *
 * Tone: this is a family café, not a bank. Short sentences, no shouting.
 */

export interface Message {
  title: string;
  body: string;
}

const money = (n: number) => `$${n.toFixed(2)}`;

const clock = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export function verifyEmail(name: string, link: string): Message {
  return {
    title: 'Confirm your email',
    body:
      `Hi ${name}.\n\n` +
      `Confirm your email to finish setting up your account:\n${link}\n\n` +
      `The link works for 24 hours. If this wasn't you, ignore this message.`,
  };
}

export function resetPassword(name: string, link: string): Message {
  return {
    title: 'Change your password',
    body:
      `Hi ${name}.\n\n` +
      `Someone asked to change your password. If that was you:\n${link}\n\n` +
      `The link works for 1 hour and can only be used once. If it wasn't you, ` +
      `there is nothing you need to do.`,
  };
}

export function welcome(name: string, discountCode: string | null): Message {
  const gift = discountCode
    ? `\n\nHere is 10% off your first order with the code ${discountCode}.`
    : '';
  return {
    title: 'Welcome to Around the Bean',
    body: `Hi ${name}.\n\nYou can now order ahead and skip the line.${gift}`,
  };
}

export function orderPlaced(
  lines: string[],
  total: number,
  slotTime?: Date,
  code?: string,
): Message {
  const when = slotTime ? `\n\nIt will be ready at ${clock(slotTime)}.` : '';
  const ref = code ? `\nShow the code ${code} at the counter.` : '';
  return {
    title: 'Order received',
    body: `We have your order.\n\n${lines.join('\n')}\n\nTotal ${money(total)}.${when}${ref}`,
  };
}

/**
 * Tu café acaba de entrar en la barra.
 *
 * Lo que importa no es el estado sino qué hacer con él: por eso dice cuándo
 * salir y no «su pedido ha cambiado de estado».
 */
export function orderPreparing(): Message {
  return {
    title: 'We are making your coffee',
    body: 'It goes on the counter in a few minutes. Good time to head over.',
  };
}

/**
 * Un pago que no salió.
 *
 * Lo importante es decir que el pedido sigue en pie. Sin eso, quien lee
 * «payment failed» cree que perdió el café y vuelve a pedir otro.
 */
export function paymentFailed(reason: string | null): Message {
  return {
    title: 'Your payment did not go through',
    body: `${reason ? `${reason} ` : ''}Your order is still placed. Try another card, or pay at the counter when you pick it up.`,
  };
}

export function paymentRefunded(amount: number, full: boolean): Message {
  return {
    title: full ? 'Your refund is on its way' : 'Part of your payment is being refunded',
    body: `We refunded ${money(amount)}. It usually shows on your statement within 5 to 10 business days.`,
  };
}

export function orderReady(): Message {
  return {
    title: 'Your order is ready',
    body: 'It is waiting on the counter. Come by whenever you like.',
  };
}

export function orderCancelled(): Message {
  return {
    title: 'Order cancelled',
    body: 'We cancelled your order. If you paid, the refund goes out today.',
  };
}

export function tableBooked(partySize: number, scheduledAt: Date): Message {
  return {
    title: 'Table booked',
    body:
      `We are holding a table for ${partySize} ` +
      `on ${scheduledAt.toLocaleDateString('en-CA')} at ${clock(scheduledAt)}.`,
  };
}

export function pointsEarned(points: number, balance: number): Message {
  return {
    title: `You earned ${points} points`,
    body: `You now have ${balance} points. Trade them for a coffee whenever you like.`,
  };
}

export function birthday(name: string, code: string): Message {
  return {
    title: `Happy birthday, ${name}`,
    body: `Today the coffee is on us. Use the code ${code} before the month is out.`,
  };
}

export function rewardRedeemed(rewardName: string, code: string): Message {
  return {
    title: 'Reward ready',
    body: `You traded your points for ${rewardName}. Show the code ${code} at the counter.`,
  };
}

export function discountUsed(code: string, amount: number): Message {
  return {
    title: 'Discount applied',
    body: `You used the code ${code} and saved ${money(amount)}.`,
  };
}

/**
 * Fills the gaps in a campaign body.
 *
 * Two placeholders only, on purpose. A template with twenty variables is a
 * template someone will break with a mistyped brace, and the mistake only
 * shows up once the email has reached a thousand people. A placeholder that
 * isn't recognised is left visible rather than quietly disappearing.
 *
 * Both spellings work: {{name}} / {{points}}, and the older {{nombre}} /
 * {{puntos}}, so campaigns written before the counter app switched to
 * English still fill in instead of sending the raw braces.
 */
export function fillTemplate(body: string, vars: { nombre: string; puntos: number }): string {
  return body
    .replace(/\{\{\s*(?:name|nombre)\s*\}\}/gi, vars.nombre)
    .replace(/\{\{\s*(?:points|puntos)\s*\}\}/gi, String(vars.puntos));
}
