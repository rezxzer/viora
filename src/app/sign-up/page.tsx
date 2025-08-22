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

const schema = z
  .object({
    email: z.string().email({ message: 'Please enter a valid email' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export default function SignUpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setLoading(true)
    const supabase = supabaseBrowserClient()

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    })
    if (error) {
      setLoading(false)
      toast.error(error.message)
      return
    }
    // Try to create profile row (idempotent via upsert)
    // Since email confirmations are disabled, the user/session should be available immediately.
    // Fallback to signUpData.user if getUser is not yet populated.
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id ?? signUpData.user?.id ?? null
    if (userId) {
      await supabase.from('profiles').upsert(
        {
          id: userId,
          full_name: '',
          username: null,
          bio: null,
          avatar_url: null,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      )
    }
    setLoading(false)
    toast.success('Account created')
    router.push('/feed')
  }

  return (
    <div className="mx-auto max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
        </CardHeader>
        <CardContent>
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
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>
          </Form>
          <div className="mt-3 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link className="underline" href="/sign-in">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
