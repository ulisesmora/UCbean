'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin, useRegister } from '@/hooks/use-auth';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'At least 6 characters'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'At least 6 characters'),
  phone: z.string().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(data: LoginValues) {
    login.mutate(data, {
      onSuccess: () => {
        toast.success('Welcome back!');
        onSuccess();
      },
      onError: (e) => toast.error(e.message),
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="login-email" className="text-stone2-700">
          Email
        </Label>
        <Input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          className="border-birch-200 focus-visible:ring-forest-700"
          {...register('email')}
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password" className="text-stone2-700">
          Password
        </Label>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          className="border-birch-200 focus-visible:ring-forest-700"
          {...register('password')}
        />
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>
      <Button
        type="submit"
        disabled={login.isPending}
        className="w-full bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl h-11"
      >
        {login.isPending ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const register_ = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  function onSubmit(data: RegisterValues) {
    register_.mutate(data, {
      onSuccess: () => {
        toast.success('Account created — welcome!');
        onSuccess();
      },
      onError: (e) => toast.error(e.message),
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="reg-name" className="text-stone2-700">
          Name
        </Label>
        <Input
          id="reg-name"
          placeholder="Your name"
          className="border-birch-200 focus-visible:ring-forest-700"
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-email" className="text-stone2-700">
          Email
        </Label>
        <Input
          id="reg-email"
          type="email"
          placeholder="you@example.com"
          className="border-birch-200 focus-visible:ring-forest-700"
          {...register('email')}
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-password" className="text-stone2-700">
          Password
        </Label>
        <Input
          id="reg-password"
          type="password"
          placeholder="••••••••"
          className="border-birch-200 focus-visible:ring-forest-700"
          {...register('password')}
        />
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>
      <Button
        type="submit"
        disabled={register_.isPending}
        className="w-full bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl h-11"
      >
        {register_.isPending ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}

export function AuthModal({ open, onOpenChange }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-birch-50 border-birch-200">
        <DialogHeader>
          <DialogTitle className="font-body font-bold text-stone2-900">
            {tab === 'login' ? 'Welcome back' : 'Join Around the Bean'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'register')}>
          <TabsList className="w-full bg-birch-100">
            <TabsTrigger
              value="login"
              className="flex-1 data-[state=active]:bg-white data-[state=active]:text-forest-700"
            >
              Sign in
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="flex-1 data-[state=active]:bg-white data-[state=active]:text-forest-700"
            >
              Create account
            </TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm onSuccess={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm onSuccess={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
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
        className="hidden md:inline-flex items-center px-4 py-1.5 rounded-full border border-forest-700 text-forest-700 text-xs font-semibold hover:bg-forest-50 transition-colors"
      >
        Sign in
      </button>
      <AuthModal open={open} onOpenChange={setOpen} />
    </>
  );
}
