"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabaseBrowserClient } from "@/lib/supabase-client";
import { toast } from "sonner";
import type { ProfileData } from "./types";

const schema = z.object({
  full_name: z.string().max(80).optional().default(""),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_]+$/)
    .transform((v) => v.toLowerCase()),
  bio: z.string().max(300).optional().default(""),
  location: z.string().max(80).optional().default(""),
  website: z
    .string()
    .optional()
    .default("")
    .refine((v) => v === "" || /^https?:\/\//i.test(v), { message: "Invalid URL" }),
  birthday: z.string().optional().default(""),
  pronouns: z.string().max(40).optional().default(""),
  links: z.record(z.string(), z.string().url()).optional().default({}),
});

type Props = {
  userId: string;
  initial: ProfileData;
};

export default function ProfileForm({ userId, initial }: Props) {
  const [saving, setSaving] = useState(false);
  type ProfileFormValues = z.infer<typeof schema>;
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<ProfileFormValues>,
    defaultValues: {
      full_name: initial.full_name ?? "",
      username: initial.username ?? "",
      bio: initial.bio ?? "",
      location: initial.location ?? "",
      website: initial.website ?? "",
      birthday: initial.birthday ?? "",
      pronouns: initial.pronouns ?? "",
      links: (initial.links as Record<string, string> | null) ?? {},
    },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setSaving(true);
    const supabase = supabaseBrowserClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: values.full_name,
        username: values.username,
        bio: values.bio || null,
        location: values.location || null,
        website: values.website || null,
        birthday: values.birthday || null,
        pronouns: values.pronouns || null,
        links: values.links && Object.keys(values.links).length ? values.links : null,
      })
      .eq("id", userId);

    setSaving(false);

    if (error) {
      if (error.code === "23505") {
        toast.error("Username already taken");
      } else {
        toast.error(error.message);
      }
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
                <Input placeholder="Your full name" {...field} />
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
              <p className="text-xs text-muted-foreground">Lowercase letters, numbers, underscore. 3–20.</p>
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
                <Textarea placeholder="Tell something about you" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="City, Country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <FormField
            control={form.control}
            name="birthday"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Birthday</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pronouns"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pronouns</FormLabel>
                <FormControl>
                  <Input placeholder="they/them" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Links simple JSON editor: key/value pairs */}
        {/* For brevity, keep a textarea for raw JSON; can be replaced with key/value UI later */}
        <FormField
          control={form.control}
          name="links"
          render={() => (
            <FormItem>
              <FormLabel>Links (JSON map of label→URL)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='{"twitter":"https://twitter.com/me"}'
                  defaultValue={JSON.stringify(form.getValues("links") || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value || "{}");
                      form.setValue("links", parsed);
                    } catch {
                      /* ignore parse while typing */
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </Button>
      </form>
    </Form>
  );
}


