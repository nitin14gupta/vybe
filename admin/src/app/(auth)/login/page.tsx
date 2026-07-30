'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock } from 'lucide-react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useToast } from '@/hooks/useToast'
import { SketchCard, SketchTape, SketchInput, SketchButton } from '@/components/ui/sketch/Sketch'

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
    <div className="bg-paper flex min-h-screen flex-1 items-center justify-center px-4 py-12">
      <SketchCard rotate className="w-full max-w-sm p-8 pt-10">
        <SketchTape />

        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center border-2 border-zinc-900 bg-amber-300 text-zinc-900"
            style={{ borderRadius: '50% 45% 55% 50% / 50% 55% 45% 50%' }}
          >
            <Lock className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="font-sketch text-3xl font-bold text-zinc-900 underline decoration-emerald-400 decoration-wavy decoration-2 underline-offset-4">
              Gorave Admin
            </h1>
            <p className="font-sketch mt-2 text-base text-zinc-500">Sign in to keep things running</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div>
            <label className="font-sketch mb-1.5 block text-base text-zinc-700">Email</label>
            <SketchInput
              type="email"
              autoComplete="email"
              placeholder="you@gorave.com"
              error={errors.email?.message}
              {...register('email')}
            />
            {errors.email && <p className="font-sketch mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="font-sketch mb-1.5 block text-base text-zinc-700">Password</label>
            <SketchInput
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            {errors.password && <p className="font-sketch mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>

          <SketchButton type="submit" loading={submitting} className="mt-2">
            Sign in
          </SketchButton>
        </form>
      </SketchCard>
    </div>
  )
}
