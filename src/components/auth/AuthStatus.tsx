"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabaseBrowserClient } from "@/lib/supabase-client";
import { toast } from "sonner";

type SessionState = {
  userId: string | null;
};

export default function AuthStatus() {
  const router = useRouter();
  const [session, setSession] = useState<SessionState>({ userId: null });

  useEffect(() => {
    const supabase = supabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession({ userId: data.session?.user?.id ?? null });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession({ userId: currentSession?.user?.id ?? null });
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!session.userId) {
    return (
      <Link href="/sign-in" className="text-sm">
        Sign In
      </Link>
    );
  }

  const handleSignOut = async () => {
    const supabase = supabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
      return;
    }
    toast.success("Signed out");
    router.push("/");
  };

  return (
    <div className="flex items-center gap-3">
      <Link href="/profile" className="flex items-center gap-2">
        <Avatar>
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </Link>
      <Button size="sm" variant="outline" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  );
}


