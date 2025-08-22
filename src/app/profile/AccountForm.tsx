"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabaseBrowserClient } from "@/lib/supabase-client";
import { toast } from "sonner";

const emailSchema = z.object({ email: z.string().email() });
const passwordSchema = z
  .object({ password: z.string().min(6), confirm: z.string().min(6) })
  .refine((v) => v.password === v.confirm, { message: "Passwords do not match", path: ["confirm"] });

export default function AccountForm() {
  const supabase = supabaseBrowserClient();
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const onEmailSave = async (values: z.infer<typeof emailSchema>) => {
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: values.email });
    setSavingEmail(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.info("If email confirmation is required, check your inbox.");
  };

  const onPasswordSave = async (values: z.infer<typeof passwordSchema>) => {
    setSavingPass(true);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    setSavingPass(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-base font-medium">Change Email</h3>
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(onEmailSave)} className="flex gap-2">
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={savingEmail}>
              {savingEmail ? "Saving..." : "Save"}
            </Button>
          </form>
        </Form>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-medium">Change Password</h3>
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSave)} className="grid gap-2 md:grid-cols-3">
            <FormField
              control={passwordForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="confirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-end">
              <Button type="submit" disabled={savingPass}>
                {savingPass ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}


