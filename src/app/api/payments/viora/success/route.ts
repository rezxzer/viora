import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const commentId = url.searchParams.get("commentId");
    if (!commentId) return NextResponse.redirect(new URL("/feed", url));

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return NextResponse.redirect(new URL("/feed?e=config", url));

    const amountCents = 100; // fallback if webhook not used
    const buyerId = "";

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    await admin.from("post_comment_paid_reactions").insert({
      comment_id: commentId,
      buyer_id: buyerId || crypto.randomUUID(),
      reaction_code: "VIORA",
      amount_cents: amountCents,
    });

    return NextResponse.redirect(new URL("/feed?paid=1", url));
  } catch {
    return NextResponse.redirect(new URL("/feed?paid=0", new URL(req.url)));
  }
}


