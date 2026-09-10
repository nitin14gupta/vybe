'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock } from 'lucide-react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useToast } from '@/hooks/useToast'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAdminAuth()
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginForm) => {
    setSubmitting(true)
    try {
      await login(values.email, values.password)
      router.replace('/')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-sm p-8 pt-10">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-ink-on-accent glow-shadow-brand">
            <Lock className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-ink-primary">Gorave Admin</h1>
            <p className="mt-2 font-sans text-sm text-ink-secondary">Sign in to keep things running</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div>
            <label className="mb-1.5 block font-sans text-xs font-semibold uppercase tracking-wide text-ink-secondary">
              Email
            </label>
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@gorave.in"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block font-sans text-xs font-semibold uppercase tracking-wide text-ink-secondary">
              Password
            </label>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full">
            Sign in
          </Button>
        </form>
      </Card>
    </div>
  )
}
