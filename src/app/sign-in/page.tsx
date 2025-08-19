import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import SignInForm from "./signin-form.tsx";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/feed");
  }

  const sp = await searchParams;
  const message = typeof sp?.message === "string" ? sp.message : undefined;
  return <SignInForm message={message} />;
}


