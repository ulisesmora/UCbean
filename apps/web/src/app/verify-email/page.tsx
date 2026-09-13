'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { authApi } from '@/lib/api';

/**
 * Where the link from the verification email lands.
 *
 * One thing to do and no decision to make, so the token is redeemed as the
 * page loads. A "confirm" button here would add a step for someone who
 * already confirmed by clicking in their inbox.
 */
function Verify() {
  const params = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<'loading' | 'done' | 'failed'>('loading');
  const [message, setMessage] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    // The token is spent on use, so React's strict-mode double mount would
    // burn it and the second call would report it as already used. This
    // guard is what prevents that false error.
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setState('failed');
      setMessage('The link has no code in it. Copy the whole address from the email.');
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => setState('done'))
      .catch((e: unknown) => {
        setState('failed');
        setMessage(e instanceof Error ? e.message : 'We could not verify it');
      });
  }, [token]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      {state === 'loading' && (
        <>
          <Loader2 size={30} className="animate-spin text-stone2-400" />
          <p className="text-stone2-600">Confirming your email…</p>
        </>
      )}

      {state === 'done' && (
        <>
          <CheckCircle2 size={44} className="text-forest-700" strokeWidth={1.5} />
          <h1 className="text-3xl font-extrabold text-stone2-900">Email confirmed</h1>
          <p className="text-[15px] text-stone2-600">
            Your account is ready. Order ahead and skip the line.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Link href="/menu" className="btn btn-acid px-6 py-2.5 text-[15px]">
              See the menu
            </Link>
            <Link href="/profile" className="btn px-6 py-2.5 text-[15px]">
              My account
            </Link>
          </div>
        </>
      )}

      {state === 'failed' && (
        <>
          <XCircle size={44} className="text-bark-700" strokeWidth={1.5} />
          <h1 className="text-3xl font-extrabold text-stone2-900">That did not work</h1>
          <p className="text-[15px] text-stone2-600">{message}</p>
          <p className="text-[13px] text-stone2-400">
            You can ask for a fresh link from your account.
          </p>
          <Link href="/profile" className="btn mt-2 px-6 py-2.5 text-[15px]">
            Go to my account
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  // `useSearchParams` requires a Suspense boundary in the App Router.
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 size={26} className="animate-spin text-stone2-400" />
        </div>
      }
    >
      <Verify />
    </Suspense>
  );
}
