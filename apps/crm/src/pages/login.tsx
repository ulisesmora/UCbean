import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { isStaff, useSetSession, type StaffUser } from '@/stores/auth';

/**
 * La puerta.
 *
 * Un cliente con cuenta puede tener contraseña válida y no tener nada que
 * hacer aquí, así que además de autenticar se comprueba el rol y se cierra
 * la sesión si no toca. Decirlo claro evita que alguien piense que su
 * contraseña está mal.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useSetSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      const res = await api.post<{ accessToken: string; user: StaffUser }>('/auth/login', {
        email: email.trim(),
        password,
      });

      if (!isStaff(res.user)) {
        setError('That is a customer account. The counter is for staff only.');
        return;
      }

      setSession(res.accessToken, res.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="blueprint flex min-h-dvh items-center justify-center bg-white px-5 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex flex-col gap-1">
          <span className="inline-flex h-3 w-3 rounded-sm bg-olive-500 ring-2 ring-stone2-900" />
          <h1 className="text-4xl font-extrabold leading-none text-stone2-900">Counter</h1>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone2-400">
            Around the Bean
          </span>
        </div>

        <form onSubmit={entrar} className="card flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[12.5px] font-semibold text-stone2-600">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="tap-target rounded border border-stone2-200 px-3 py-2 text-[15px] outline-none focus:bg-white/60"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[12.5px] font-semibold text-stone2-600">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="tap-target rounded border border-stone2-200 px-3 py-2 text-[15px] outline-none focus:bg-white/60"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded border-2 border-bark-500 bg-bark-300 px-3 py-2 text-[13px] text-stone2-900"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="btn btn-olive tap-target w-full py-2.5 text-[15px]"
          >
            {enviando ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
