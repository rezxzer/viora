import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const sample = [
    { content: "Hello VIORA!", image_url: null },
    { content: "My first post with image", image_url: null },
    { content: "Another day, another post", image_url: null },
  ];

  const rows = sample.map((s) => ({ author_id: userId, content: s.content, image_url: s.image_url, is_public: true }));
  const { error } = await supabase.from("posts").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}


