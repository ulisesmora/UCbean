'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';

/** The same minimum the API enforces. Said here before you press send. */
const MIN = 8;

/**
 * Where the password reset link lands.
 *
 * The password is asked for twice because the field is masked, and a typo
 * here locks someone out of their account with a link already spent.
 */
function ResetPassword() {
  const params = useSearchParams();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN) {
      setError(`Your password needs at least ${MIN} characters.`);
      return;
    }
    if (password !== again) {
      setError('The two passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await authApi.resetPassword(token!, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not change it');
    } finally {
      setSaving(false);
    }
  }

  if (!token) {
    return (
      <Middle>
        <h1 className="text-3xl font-extrabold text-stone2-900">Incomplete link</h1>
        <p className="text-[15px] text-stone2-600">
          The code is missing. Copy the whole address from the email.
        </p>
      </Middle>
    );
  }

  if (done) {
    return (
      <Middle>
        <CheckCircle2 size={44} className="text-forest-700" strokeWidth={1.5} />
        <h1 className="text-3xl font-extrabold text-stone2-900">Password changed</h1>
        <p className="text-[15px] text-stone2-600">
          We signed out any open sessions. Sign in again with the new one.
        </p>
        <Link href="/profile" className="btn btn-acid mt-2 px-6 py-2.5 text-[15px]">
          Sign in
        </Link>
      </Middle>
    );
  }

  return (
    <Middle>
      <div className="glass glass-edge w-full rounded-lg p-6 text-left">
        <h1 className="mb-2 text-3xl font-extrabold text-stone2-900">New password</h1>
        <p className="mb-6 text-[15px] text-stone2-600">Pick one you do not use anywhere else.</p>

        <form onSubmit={save} className="flex flex-col gap-4">
          <Field
            id="password"
            label="New password"
            value={password}
            onChange={setPassword}
            hint={`At least ${MIN} characters`}
          />
          <Field id="again" label="Type it again" value={again} onChange={setAgain} />

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
            disabled={saving}
            className="btn btn-acid tap-target w-full py-2.5 text-[15px] disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save password'}
          </button>
        </form>
      </div>
    </Middle>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-stone2-600">
        {label}
      </label>
      <input
        id={id}
        type="password"
        autoComplete="new-password"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="tap-target rounded border-2 border-stone2-900 bg-white/70 px-3 py-2 text-[15px] outline-none focus:bg-white"
      />
      {hint && <span className="text-[12px] text-stone2-400">{hint}</span>}
    </div>
  );
}

function Middle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      {children}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 size={26} className="animate-spin text-stone2-400" />
        </div>
      }
    >
      <ResetPassword />
    </Suspense>
  );
}
