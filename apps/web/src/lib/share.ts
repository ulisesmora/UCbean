import { DEFAULT_BUILD, type Build } from '@/lib/builder';

/**
 * Una bebida, dentro de un enlace.
 *
 * La fórmula va codificada en la propia dirección en vez de guardarse en el
 * servidor. Eso evita una tabla, un endpoint y un permiso, pero sobre todo
 * evita un problema: un enlace que apunta a una fila tuya deja rastro de
 * quién bebe qué. Aquí lo único que viaja es la receta. Quien la abre no
 * sabe de quién era, y nosotros tampoco registramos que la abrió.
 *
 * El nombre viaja aparte porque es lo que le da gracia: «el jueves de
 * Ulises» dice más que una lista de ingredientes.
 */

/** Base64 apto para URL: sin +, sin / y sin relleno. */
function toUrl64(texto: string): string {
  return btoa(unescape(encodeURIComponent(texto)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromUrl64(dato: string): string {
  const base = dato.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(base)));
}

/** Los campos de una fórmula, en orden fijo, para que el enlace sea corto. */
const CAMPOS = [
  'beans',
  'size',
  'base',
  'serve',
  'milk',
  'foam',
  'art',
  'vessel',
  'sleeve',
] as const;

export function encodeBuild(build: Build): string {
  // Una lista posicional en vez de un objeto: quita las claves repetidas y
  // deja el enlace en algo que cabe en un mensaje sin ocupar tres líneas.
  const partes = [...CAMPOS.map((c) => build[c]), build.extras.join('+')];
  return toUrl64(partes.join('|'));
}

export function decodeBuild(dato: string): Build | null {
  try {
    const partes = fromUrl64(dato).split('|');
    if (partes.length !== CAMPOS.length + 1) return null;

    // Se parte del build por defecto para que un enlace de una versión vieja
    // —con un campo menos— siga abriendo algo válido en vez de romperse.
    const build = { ...DEFAULT_BUILD } as Record<string, unknown>;
    CAMPOS.forEach((campo, i) => {
      if (partes[i]) build[campo] = partes[i];
    });
    build.extras = partes[CAMPOS.length] ? partes[CAMPOS.length].split('+') : [];
    return build as unknown as Build;
  } catch {
    return null;
  }
}

/** La dirección completa que se copia o se comparte. */
export function shareUrl(build: Build, name: string): string {
  const base = typeof window === 'undefined' ? '' : window.location.origin;
  return `${base}/build?d=${encodeBuild(build)}&n=${encodeURIComponent(name)}`;
}

/**
 * Comparte con lo que tenga el aparato: hoja nativa en el móvil,
 * portapapeles en el escritorio.
 *
 * Devuelve cómo acabó para que quien llama diga la frase correcta. Cancelar
 * la hoja nativa no es un fallo y por eso tiene su propio valor.
 */
export async function shareDrink(
  build: Build,
  name: string,
): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  const url = shareUrl(build, name);

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: name, text: `Try my ${name}`, url });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      // Cualquier otro fallo cae al portapapeles en vez de dejar al usuario
      // sin nada: compartir es opcional, copiar siempre se puede.
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
