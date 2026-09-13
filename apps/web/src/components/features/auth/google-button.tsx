'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (o: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
        };
      };
    };
  }
}

/**
 * Entrar con Google sin salir de la página.
 *
 * Antes esto cambiaba la dirección entera: te llevaba a Google y volvías a
 * otra pantalla. Funciona, pero pierdes lo que estabas haciendo —el
 * carrito a medio llenar, la hora de recogida elegida— y la vuelta parece
 * otra web.
 *
 * Ahora Google abre su propia ventanita, devuelve un `credential` aquí
 * mismo, y el servidor lo comprueba contra Google antes de creérselo. La
 * página nunca se descarga.
 *
 * El botón lo dibuja Google, no nosotros: su marca tiene reglas de uso y
 * un botón propio pintado «parecido» es justo lo que no admiten.
 */
export function GoogleButton({ onDone }: { onDone?: () => void }) {
  const caja = useRef<HTMLDivElement>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [entrando, setEntrando] = useState(false);
  const [falló, setFalló] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID || !caja.current) return;

    let cancelado = false;

    function pintar() {
      if (cancelado || !window.google || !caja.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async ({ credential }: { credential: string }) => {
          setEntrando(true);
          try {
            const res = await authApi.googleToken(credential);
            setAuth(res.user, res.accessToken);
            toast.success(`Welcome, ${res.user.name.split(' ')[0]}`);
            onDone?.();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Google sign-in did not work');
          } finally {
            setEntrando(false);
          }
        },
      });
      window.google.accounts.id.renderButton(caja.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
        shape: 'rectangular',
      });
    }

    if (window.google) {
      pintar();
      return;
    }

    // El script se carga una sola vez para toda la pestaña, y si ya está
    // puesto se espera a que termine en vez de meter otro.
    const existente = document.querySelector<HTMLScriptElement>('script[data-google-gsi]');
    if (existente) {
      existente.addEventListener('load', pintar);
      return () => existente.removeEventListener('load', pintar);
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = 'true';
    script.onload = pintar;
    script.onerror = () => setFalló(true);
    document.head.appendChild(script);

    return () => {
      cancelado = true;
    };
  }, [setAuth, onDone]);

  if (!CLIENT_ID) return null;

  // Si el script de Google no carga —una red que lo bloquea, una extensión—
  // queda el camino de siempre en vez de un hueco donde había un botón.
  if (falló) {
    return (
      <a href={authApi.googleUrl()} className="btn tap-target w-full py-3 text-[15px]">
        Continue with Google
      </a>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={caja} className="flex min-h-[44px] w-full justify-center" />
      {entrando && (
        <span className="flex items-center gap-1.5 text-[13px] text-stone2-600">
          <Loader2 size={13} className="animate-spin" />
          Signing you in…
        </span>
      )}
    </div>
  );
}
