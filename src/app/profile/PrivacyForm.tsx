"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabaseBrowserClient } from "@/lib/supabase-client";
import { toast } from "sonner";
import type { ProfileData } from "./types";
import { useEffect } from "react";

type Props = {
  userId: string;
  initial: ProfileData;
};

export default function PrivacyForm({ userId, initial }: Props) {
  const supabase = supabaseBrowserClient();
  const [privacy, setPrivacy] = useState<string>("public");
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [blocked, setBlocked] = useState<Array<{ blocked_id: string; expires_at: string | null }>>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  const onSavePrivacy = async () => {
    const { error } = await supabase.from("profiles").update({ privacy_level: privacy }).eq("id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Privacy updated");
  };

  const onDownload = async () => {
    try {
      setDownloading(true);
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
      setDownloading(false);
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "viora-profile.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setDownloading(false);
      const msg = e instanceof Error ? e.message : "Failed to download data";
      toast.error(msg);
    }
  };

  const onDelete = async () => {
    try {
      setDeleting(true);
      const res = await fetch("/api/account/delete", { method: "POST" });
      setDeleting(false);
      if (!res.ok) {
        const msg = await res.text();
        toast.error(msg || "Delete failed");
        return;
      }
      toast.success("Account deleted");
      window.location.href = "/";
    } catch (e: unknown) {
      setDeleting(false);
      const msg = e instanceof Error ? e.message : "Delete failed";
      toast.error(msg);
    }
  };

  // Load blocked users list for this author
  useEffect(() => {
    const supabase = supabaseBrowserClient();
    const load = async () => {
      setLoadingBlocks(true);
      const { data } = await supabase
        .from("user_blocks")
        .select("blocked_id, expires_at")
        .eq("blocker_id", userId)
        .order("created_at", { ascending: false });
      setBlocked((data as Array<{ blocked_id: string; expires_at: string | null }>) || []);
      setLoadingBlocks(false);
    };
    void load();
  }, [userId]);

  const onUnblock = async (blockedId: string) => {
    const supabase = supabaseBrowserClient();
    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", userId)
      .eq("blocked_id", blockedId);
    if (error) return toast.error(error.message);
    setBlocked((prev) => prev.filter((b) => b.blocked_id !== blockedId));
    toast.success("Unblocked");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-surface p-4 shadow-soft space-y-2">
        <div className="font-medium">Profile visibility</div>
        <select
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value)}
          className="h-10 w-full rounded-2xl border border-input bg-surface px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="public">Public</option>
          <option value="followers_only">Followers only</option>
          <option value="verified_only">Verified users only</option>
        </select>
        <Button onClick={onSavePrivacy}>Save privacy</Button>
      </div>

      <div className="space-y-3">
        <div className="font-medium">Download my data</div>
        <Button variant="outline" onClick={onDownload} disabled={downloading}>
          {downloading ? "Preparing..." : "Download JSON"}
        </Button>
      </div>

      <div className="space-y-2 rounded-2xl border bg-surface p-4 shadow-soft">
        <div className="font-medium">Blocked users</div>
        {loadingBlocks ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : blocked.length === 0 ? (
          <div className="text-sm text-muted-foreground">No blocked users</div>
        ) : (
          <ul className="space-y-2">
            {blocked.map((b) => (
              <li key={b.blocked_id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="text-sm break-all">{b.blocked_id}{b.expires_at ? ` · until ${new Date(b.expires_at).toLocaleString()}` : " · permanent"}</span>
                <Button size="sm" variant="outline" onClick={() => onUnblock(b.blocked_id)}>Unblock</Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2 rounded-2xl border bg-surface p-4 shadow-soft">
        <div className="font-semibold text-red-600">Danger Zone</div>
        <p className="text-sm text-muted-foreground">Delete your account and data. This action cannot be undone.</p>
        <Button variant="destructive" onClick={onDelete} disabled={deleting} aria-label="Delete account">
          {deleting ? "Deleting..." : "Delete account"}
        </Button>
      </div>
    </div>
  );
}


