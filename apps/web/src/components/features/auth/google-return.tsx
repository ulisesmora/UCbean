'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const ERRORES: Record<string, string> = {
  google: 'Google did not finish signing you in. Please try again.',
  estado: 'That Google sign-in did not start here.',
};

/**
 * Recoge la sesión que vuelve de Google.
 *
 * El token llega en el fragmento de la URL y no en la parte de consulta: el
 * fragmento no se manda al servidor, así que no queda escrito en los
 * registros del proxy ni en el historial del servidor. Aquí se lee, se
 * canjea por el perfil y se borra de la barra de direcciones, para que no
 * se quede a la vista ni se comparta al copiar el enlace.
 */
export function GoogleReturn() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [estado, setEstado] = useState<'nada' | 'ok' | 'nuevo' | 'error'>('nada');
  const [mensaje, setMensaje] = useState('');
  const yaCorrio = useRef(false);

  useEffect(() => {
    if (yaCorrio.current) return;
    yaCorrio.current = true;

    const error = new URLSearchParams(window.location.search).get('error');
    if (error) {
      setEstado('error');
      setMensaje(ERRORES[error] ?? 'Could not sign in with Google.');
      limpiarUrl();
      return;
    }

    const frag = new URLSearchParams(window.location.hash.slice(1));
    const token = frag.get('token');
    if (!token) return;

    const esNuevo = frag.get('nuevo') === '1';
    limpiarUrl();

    authApi
      .me(token)
      .then((user) => {
        setAuth(user, token);
        setEstado(esNuevo ? 'nuevo' : 'ok');
      })
      .catch(() => {
        setEstado('error');
        setMensaje('Signed in with Google but could not read your profile.');
      });
  }, [setAuth]);

  if (estado === 'nada') return null;

  if (estado === 'error') {
    return (
      <div className="mb-5 flex items-start gap-2.5 rounded border-2 border-bark-500 bg-bark-300 px-4 py-3">
        <XCircle size={17} className="mt-0.5 shrink-0 text-bark-700" />
        <p className="text-[14px] text-stone2-900">{mensaje}</p>
      </div>
    );
  }

  return (
    <div className="mb-5 flex items-start gap-2.5 rounded border-2 border-forest-600 bg-forest-50 px-4 py-3">
      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-forest-700" />
      <p className="text-[14px] text-stone2-900">
        {estado === 'nuevo'
          ? 'Account created with Google. You get 50 welcome points and a code for your first order.'
          : 'Entraste con Google.'}
      </p>
    </div>
  );
}

/** Quita el token y el error de la barra de direcciones sin recargar. */
function limpiarUrl() {
  window.history.replaceState(null, '', window.location.pathname);
}
