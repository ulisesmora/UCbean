'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, LogIn, Mail, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useLogin, useRegister } from '@/hooks/use-auth';
import { authApi } from '@/lib/api';
import { GoogleButton } from './google-button';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('That does not look like an email'),
  password: z.string().min(6, 'At least 6 characters'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Your name is a bit short'),
  email: z.string().email('That does not look like an email'),
  password: z.string().min(8, 'At least 8 characters'),
  phone: z.string().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Where the modal is. Two separate doors, then one form behind whichever. */
type Step = 'choose' | 'login' | 'register' | 'forgot';

/**
 * One input for every field here.
 *
 * Label above, error below, same glass surface. A placeholder standing in
 * for a label disappears the moment someone starts typing, which is exactly
 * when they look up to check what the field was.
 */
function Field({
  id,
  label,
  error,
  hint,
  ...rest
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-stone2-900">
        {label}
      </label>
      <input
        id={id}
        {...rest}
        aria-invalid={Boolean(error)}
        className="tap-target rounded border-2 border-stone2-900 bg-white/70 px-3 py-2 text-[15px] outline-none transition-colors focus:bg-white"
      />
      {error ? (
        <span className="text-[12px] font-medium text-bark-700">{error}</span>
      ) : (
        hint && <span className="text-[12px] text-stone2-400">{hint}</span>
      )}
    </div>
  );
}

/**
 * The two doors.
 *
 * Tabs made signing in and signing up look like the same thing with a
 * different label. They are not: one is two seconds and one is a minute.
 * Two buttons of different weight say which is which before you read them.
 */
function Choose({ onPick, onSignedIn }: { onPick: (s: Step) => void; onSignedIn: () => void }) {
  return (
    <div className="flex flex-col gap-3 pt-1">
      <button
        type="button"
        onClick={() => onPick('login')}
        className="btn btn-acid tap-target w-full justify-between px-5 py-3.5 text-[15px]"
      >
        <span className="flex items-center gap-2.5">
          <LogIn size={17} />
          Sign in
        </span>
        <span className="text-[12px] font-normal opacity-70">I have an account</span>
      </button>

      <button
        type="button"
        onClick={() => onPick('register')}
        className="btn tap-target w-full justify-between px-5 py-3.5 text-[15px]"
      >
        <span className="flex items-center gap-2.5">
          <UserPlus size={17} />
          Create account
        </span>
        <span className="text-[12px] font-normal text-stone2-400">Takes a minute</span>
      </button>

      <Divider />
      <GoogleButton onDone={onSignedIn} />
      <p className="text-center text-[11.5px] leading-snug text-stone2-400">
        Already have an account with that email? You land in the same one.
      </p>
    </div>
  );
}

function Divider() {
  return (
    <div className="relative py-1 text-center" aria-hidden="true">
      <span className="absolute inset-x-0 top-1/2 border-t border-stone2-900/15" />
      <span className="relative px-3 text-[12px] text-stone2-400">or</span>
    </div>
  );
}

/**
 * Sign in with Google.
 *
 * Not a fetch: the browser has to go to Google and come back, so the whole
 * page navigates. It returns to /profile with the token in the URL fragment.
 */
function LoginForm({ onSuccess, onForgot }: { onSuccess: () => void; onForgot: () => void }) {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  return (
    <form
      onSubmit={handleSubmit((data) =>
        login.mutate(data, {
          onSuccess: () => {
            toast.success('Welcome back');
            onSuccess();
          },
          onError: (e) => toast.error(e.message),
        }),
      )}
      className="flex flex-col gap-4 pt-1"
    >
      <Field
        id="login-email"
        label="Email"
        type="email"
        autoComplete="username"
        error={errors.email?.message}
        {...register('email')}
      />
      <Field
        id="login-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <button
        type="submit"
        disabled={login.isPending}
        className="btn btn-acid tap-target w-full py-3 text-[15px] disabled:opacity-50"
      >
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </button>

      {/* Under the button, not beside the password field: it is the way out
          of a dead end, not a second thing to decide before trying. */}
      <button
        type="button"
        onClick={onForgot}
        className="self-center text-[13px] text-forest-700 underline underline-offset-4"
      >
        I forgot my password
      </button>
    </form>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const signUp = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  return (
    <form
      onSubmit={handleSubmit((data) =>
        signUp.mutate(data, {
          onSuccess: () => {
            toast.success('Account created. Check your email to confirm it.');
            onSuccess();
          },
          onError: (e) => toast.error(e.message),
        }),
      )}
      className="flex flex-col gap-4 pt-1"
    >
      <Field
        id="reg-name"
        label="Name"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
      <Field
        id="reg-email"
        label="Email"
        type="email"
        autoComplete="username"
        hint="Your order confirmations come here"
        error={errors.email?.message}
        {...register('email')}
      />
      <Field
        id="reg-password"
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters"
        error={errors.password?.message}
        {...register('password')}
      />
      <Field
        id="reg-phone"
        label="Phone"
        type="tel"
        autoComplete="tel"
        hint="Optional. Only used for delivery."
        error={errors.phone?.message}
        {...register('phone')}
      />

      <button
        type="submit"
        disabled={signUp.isPending}
        className="btn btn-acid tap-target w-full py-3 text-[15px] disabled:opacity-50"
      >
        {signUp.isPending ? 'Creating…' : 'Create account'}
      </button>

      <p className="text-center text-[12px] leading-snug text-stone2-400">
        You start with 50 points and 10% off your first order.
      </p>
    </form>
  );
}

function ForgotForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Mail size={32} className="text-forest-700" strokeWidth={1.5} />
        <p className="text-[15px] font-semibold text-stone2-900">Check your inbox</p>
        {/* Deliberately does not say whether that email has an account: this
            screen would otherwise be a way to find out who does. */}
        <p className="max-w-[280px] text-[13.5px] text-stone2-600">
          If that email has an account, the link is on its way. It works for one hour.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSending(true);
        try {
          await authApi.forgotPassword(email);
          setSent(true);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Could not send it');
        } finally {
          setSending(false);
        }
      }}
      className="flex flex-col gap-4 pt-1"
    >
      <Field
        id="forgot-email"
        label="Email"
        type="email"
        autoComplete="username"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        type="submit"
        disabled={sending}
        className="btn btn-acid tap-target w-full py-3 text-[15px] disabled:opacity-50"
      >
        {sending ? 'Sending…' : 'Send me a link'}
      </button>
    </form>
  );
}

const TITLES: Record<Step, string> = {
  choose: 'Around the Bean',
  login: 'Welcome back',
  register: 'Create your account',
  forgot: 'Reset your password',
};

export function AuthModal({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<Step>('choose');

  // Back to the doors whenever the modal closes, so reopening never lands
  // mid-form with a half-typed email still on screen.
  function close(next: boolean) {
    if (!next) setStep('choose');
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="glass-panel glass-edge border-2 border-stone2-900 sm:max-w-[400px]">
        <div className="flex items-center gap-2 pb-1">
          {step !== 'choose' && (
            <button
              type="button"
              onClick={() => setStep(step === 'forgot' ? 'login' : 'choose')}
              aria-label="Back"
              className="tap-target -ml-2 flex h-9 w-9 items-center justify-center rounded text-stone2-600 transition-colors hover:bg-stone2-900/5"
            >
              <ArrowLeft size={17} />
            </button>
          )}
          <DialogTitle className="text-[20px] font-extrabold tracking-[-0.02em] text-stone2-900">
            {TITLES[step]}
          </DialogTitle>
        </div>

        {step === 'choose' && <Choose onPick={setStep} onSignedIn={() => close(false)} />}
        {step === 'login' && (
          <LoginForm onSuccess={() => close(false)} onForgot={() => setStep('forgot')} />
        )}
        {step === 'register' && <RegisterForm onSuccess={() => close(false)} />}
        {step === 'forgot' && <ForgotForm />}
      </DialogContent>
    </Dialog>
  );
}

export function AuthButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn hidden px-4 py-2 text-[13px] md:inline-flex"
      >
        Sign in
      </button>
      <AuthModal open={open} onOpenChange={setOpen} />
    </>
  );
}
