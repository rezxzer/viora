"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowserClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

type AvatarUploaderProps = {
  userId: string;
  initialUrl: string | null;
};

/**
 * AvatarUploader
 * - Accepts image files up to 5MB
 * - Uploads to: avatars/${userId}/avatar-${Date.now()}.${ext}
 * - Updates profiles.avatar_url with a public URL
 * - Emits a global event 'viora:avatar-updated' to update header instantly
 */
export default function AvatarUploader({ userId, initialUrl }: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  // Create object URL preview when a new File is selected
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max file size is 5MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  };

  // Fake progress while uploading (Supabase fetch upload doesn't expose progress)
  useEffect(() => {
    let timer: number | undefined;
    if (uploading) {
      setProgress(10);
      timer = window.setInterval(() => {
        setProgress((p) => (p < 90 ? p + 10 : p));
      }, 200);
    } else {
      setProgress(0);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [uploading]);

  const handleUpload = async () => {
    const input = fileInputRef.current;
    const file = input?.files?.[0];
    if (!file) {
      toast.error("Choose an image first");
      return;
    }
    setUploading(true);
    const supabase = supabaseBrowserClient();

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    // Path inside the bucket must start with the userId to satisfy RLS
    const filePath = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setUploading(false);
      toast.error(uploadError.message);
      return;
    }

    // Obtain public URL
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = pub.publicUrl;

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    setUploading(false);
    setProgress(100);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    toast.success("Avatar updated");
    setPreview(publicUrl);
    // Notify header to refresh avatar without full reload
    window.dispatchEvent(new CustomEvent("viora:avatar-updated", { detail: { url: publicUrl } }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Avatar className="size-16">
          {preview ? (
            <AvatarImage src={preview} alt="Avatar preview" />
          ) : (
            <AvatarFallback>U</AvatarFallback>
          )}
        </Avatar>
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            id="avatar"
            type="file"
            accept="image/*"
            aria-label="Choose avatar image"
            onChange={onFileChange}
          />
          <div className="flex gap-2">
            <Button onClick={handleUpload} disabled={uploading} aria-label="Upload avatar">
              {uploading ? "Uploading..." : "Upload"}
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} aria-label="Select image">
              Select image
            </Button>
          </div>
        </div>
      </div>
      {uploading ? (
        <div className="h-2 w-full overflow-hidden rounded bg-elev">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </div>
  );
}


