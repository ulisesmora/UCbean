import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';

/**
 * Lo que se prueba aquí es el sobre, no la carta.
 *
 * Un fallo en cómo se arma la petición no se ve en pantalla: sale como un
 * error de validación del servidor y parece que el formulario manda mal los
 * datos. Costó dos rondas de depuración averiguar que el cuerpo iba bien y
 * lo que faltaba era una cabecera.
 */

function fingeRespuesta(body: unknown, status = 200) {
  const fetchSpy = vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal('fetch', fetchSpy);
  return fetchSpy;
}

afterEach(() => vi.unstubAllGlobals());

describe('cómo se arma la petición', () => {
  it('manda Content-Type aunque quien llama pase sus propias cabeceras', async () => {
    // La regresión: `{ headers: { Authorization } }` pisaba el objeto de
    // cabeceras entero, se perdía el Content-Type, Fastify no parseaba el
    // cuerpo y el DTO recibía {} — «type must be one of the following
    // values» en un pedido perfectamente formado.
    const f = fingeRespuesta({ data: { id: 'ord-1' } });

    await api.post('/orders', { type: 'PICKUP' }, { headers: { Authorization: 'Bearer x' } });

    const [, opciones] = f.mock.calls[0];
    expect(opciones.headers['Content-Type']).toBe('application/json');
    expect(opciones.headers.Authorization).toBe('Bearer x');
  });

  it('conserva el método y el cuerpo', async () => {
    const f = fingeRespuesta({ data: {} });
    await api.post('/orders', { type: 'PICKUP' }, { headers: { Authorization: 'Bearer x' } });

    const [, opciones] = f.mock.calls[0];
    expect(opciones.method).toBe('POST');
    expect(JSON.parse(opciones.body)).toEqual({ type: 'PICKUP' });
  });

  it('manda la cookie de sesión en todas', async () => {
    // Sin esto el refresco no funciona: la cookie es httpOnly y solo viaja
    // si la petición la pide explícitamente.
    const f = fingeRespuesta({ data: [] });
    await api.get('/products');
    expect(f.mock.calls[0][1].credentials).toBe('include');
  });

  it('desenvuelve el { data } del servidor', async () => {
    fingeRespuesta({ data: { id: 'p1' } });
    await expect(api.get('/products/p1')).resolves.toEqual({ id: 'p1' });
  });

  it('un error del servidor llega con su mensaje, no con el código', async () => {
    fingeRespuesta({ error: { message: 'Pick a collection time' } }, 400);
    await expect(api.post('/orders', {})).rejects.toThrow('Pick a collection time');
  });
});
