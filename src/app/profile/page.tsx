import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  const [{ data: sessionData }, { data: profileData }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from("profiles").select("id, full_name, username, bio, avatar_url").maybeSingle(),
  ]);

  const session = sessionData.session;
  if (!session) {
    redirect("/sign-in?message=Please sign in to continue.");
  }

  const currentUserId = session.user.id;
  let profile = profileData;
  if (!profile || profile.id !== currentUserId) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, username, bio, avatar_url")
      .eq("id", currentUserId)
      .single();
    profile = data ?? null;
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold mb-4">My Profile</h1>
      <ProfileForm initialProfile={profile ?? { id: currentUserId, full_name: "", username: null, bio: null, avatar_url: null }} />
    </div>
  );
}


