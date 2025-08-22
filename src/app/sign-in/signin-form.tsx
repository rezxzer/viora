'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { supabaseBrowserClient } from '@/lib/supabase-client'
import Link from 'next/link'

const schema = z.object({
  email: z.string().email({ message: 'Please enter a valid email' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
})

export default function SignInForm({ message }: { message?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setLoading(true)
    const supabase = supabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      const msg = (error.message || '').toLowerCase()
      if (msg.includes('confirm') && msg.includes('email')) {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          setLoading(false)
          toast.success('Signed in')
          router.replace('/feed')
          router.refresh()
          return
        }
        setLoading(false)
        toast.error('Invalid email or password')
        return
      }

      setLoading(false)
      if (msg.includes('invalid')) {
        toast.error('Invalid email or password')
      } else {
        toast.error(error.message)
      }
      return
    }

    setLoading(false)
    toast.success('Signed in')
    router.replace('/feed')
    router.refresh()
    // Fallback hard navigation if router did not transition yet
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.location.pathname !== '/feed') {
        window.location.href = '/feed'
      }
    }, 200)
  }

  return (
    <div className="mx-auto max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          {message ? <div className="mb-3 text-sm text-muted-foreground">{message}</div> : null}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </Form>
          <div className="mt-3 text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link className="underline" href="/sign-up">
              Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
