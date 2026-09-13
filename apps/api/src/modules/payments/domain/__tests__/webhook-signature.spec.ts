import {
  parseSignatureHeader,
  signPayload,
  TOLERANCE_SECONDS,
  verifyStripeSignature,
} from '../webhook-signature';

const SECRET = 'whsec_pruebaquenoesreal';
const AHORA = 1789175520;
const CUERPO = JSON.stringify({
  type: 'payment_intent.succeeded',
  data: { object: { id: 'pi_123', metadata: { orderId: 'ord-1' } } },
});

describe('parseSignatureHeader', () => {
  it('saca la marca de tiempo y la firma', () => {
    const parsed = parseSignatureHeader('t=1789175520,v1=abc123');
    expect(parsed).toEqual({ timestamp: 1789175520, signatures: ['abc123'] });
  });

  it('acepta varias firmas, que es lo que pasa al rotar el secreto', () => {
    // Durante una rotación Stripe firma con el secreto viejo y el nuevo.
    // Quedarse solo con la primera perdería avisos a mitad del cambio.
    const parsed = parseSignatureHeader('t=1789175520,v1=aaa,v1=bbb');
    expect(parsed?.signatures).toEqual(['aaa', 'bbb']);
  });

  it('ignora esquemas que no conocemos', () => {
    const parsed = parseSignatureHeader('t=1789175520,v0=viejo,v1=bueno');
    expect(parsed?.signatures).toEqual(['bueno']);
  });

  it('devuelve null cuando no hay marca de tiempo', () => {
    expect(parseSignatureHeader('v1=abc')).toBeNull();
    expect(parseSignatureHeader('t=noesunnumero,v1=abc')).toBeNull();
    expect(parseSignatureHeader('')).toBeNull();
  });
});

describe('verifyStripeSignature', () => {
  const firmado = (cuerpo = CUERPO, cuando = AHORA) => signPayload(cuerpo, SECRET, cuando);

  it('acepta un aviso legítimo', () => {
    expect(verifyStripeSignature(CUERPO, firmado(), SECRET, AHORA)).toBeNull();
  });

  it('rechaza un cuerpo manipulado', () => {
    // Este es el ataque que importa: alguien copia una firma válida y
    // cambia el orderId para dar por pagado otro pedido.
    const header = firmado();
    const manipulado = CUERPO.replace('ord-1', 'ord-999');
    expect(verifyStripeSignature(manipulado, header, SECRET, AHORA)).toBe('MISMATCH');
  });

  it('rechaza una firma hecha con otro secreto', () => {
    const header = signPayload(CUERPO, 'whsec_otro', AHORA);
    expect(verifyStripeSignature(CUERPO, header, SECRET, AHORA)).toBe('MISMATCH');
  });

  it('rechaza un aviso viejo reenviado', () => {
    // Sin la ventana de tiempo, capturar un aviso válido permitiría
    // reenviarlo semanas después y volvería a colar.
    const viejo = AHORA - TOLERANCE_SECONDS - 1;
    expect(verifyStripeSignature(CUERPO, firmado(CUERPO, viejo), SECRET, AHORA)).toBe(
      'TIMESTAMP_TOO_OLD',
    );
  });

  it('acepta justo dentro de la ventana', () => {
    const alLimite = AHORA - TOLERANCE_SECONDS;
    expect(verifyStripeSignature(CUERPO, firmado(CUERPO, alLimite), SECRET, AHORA)).toBeNull();
  });

  it('rechaza un reloj adelantado más allá de la tolerancia', () => {
    const futuro = AHORA + TOLERANCE_SECONDS + 1;
    expect(verifyStripeSignature(CUERPO, firmado(CUERPO, futuro), SECRET, AHORA)).toBe(
      'TIMESTAMP_TOO_OLD',
    );
  });

  it('rechaza una cabecera vacía o mal formada', () => {
    expect(verifyStripeSignature(CUERPO, '', SECRET, AHORA)).toBe('MALFORMED_HEADER');
    expect(verifyStripeSignature(CUERPO, 'basura', SECRET, AHORA)).toBe('MALFORMED_HEADER');
  });

  it('rechaza una cabecera con tiempo pero sin firma', () => {
    expect(verifyStripeSignature(CUERPO, `t=${AHORA}`, SECRET, AHORA)).toBe('NO_SIGNATURES');
  });

  it('rechaza una firma que no es hexadecimal, sin reventar', () => {
    const header = `t=${AHORA},v1=zzzz-no-es-hex`;
    expect(verifyStripeSignature(CUERPO, header, SECRET, AHORA)).toBe('MISMATCH');
  });

  it('acepta si cualquiera de las firmas cuadra', () => {
    const buena = signPayload(CUERPO, SECRET, AHORA).split('v1=')[1];
    const header = `t=${AHORA},v1=${'0'.repeat(buena.length)},v1=${buena}`;
    expect(verifyStripeSignature(CUERPO, header, SECRET, AHORA)).toBeNull();
  });

  it('depende de los bytes exactos, no del JSON equivalente', () => {
    // Por esto el controlador guarda el cuerpo crudo. Volver a serializar
    // el JSON cambia espacios y la firma deja de cuadrar.
    const header = firmado();
    const reserializado = JSON.stringify(JSON.parse(CUERPO), null, 2);
    expect(verifyStripeSignature(reserializado, header, SECRET, AHORA)).toBe('MISMATCH');
  });
});
