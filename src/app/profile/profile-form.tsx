"use client";

import { z } from "zod";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabaseBrowserClient } from "@/lib/supabase-client";

const schema = z.object({
  full_name: z.string().max(100).default(""),
  username: z
    .string()
    .regex(/^[a-z0-9_]{3,20}$/i, { message: "Username must be 3-20 chars, lowercase letters, numbers or _" })
    .transform((v) => v.toLowerCase()),
  bio: z.string().max(280).nullable().optional(),
});

type ProfileFormProps = {
  initialProfile: {
    id: string;
    full_name: string | null;
    username: string | null;
    bio: string | null;
    avatar_url: string | null;
  };
};

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
  type ProfileFormValues = z.infer<typeof schema>;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<ProfileFormValues>,
    defaultValues: {
      full_name: initialProfile.full_name ?? "",
      username: initialProfile.username ?? "",
      bio: initialProfile.bio ?? "",
    },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    const supabase = supabaseBrowserClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: values.full_name ?? "",
        username: values.username,
        bio: values.bio ?? null,
      })
      .eq("id", initialProfile.id);

    if (error) {
      if (error.code === "23505") {
        toast.error("Username already taken");
        return;
      }
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <p className="text-xs text-muted-foreground">Use 3-20 lowercase letters, numbers or underscore.</p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell something about you" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save profile</Button>
      </form>
    </Form>
  );
}


