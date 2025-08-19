import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/feed");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Welcome to VIORA</h1>
      <p className="text-sm text-muted-foreground">
        Landing page. Signed-in users will be redirected to /feed.
      </p>
    </div>
  );
}
