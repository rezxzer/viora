// src/components/post/PostEditDialog.tsx
"use client";

import { useRef, useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabaseBrowserClient } from "@/lib/supabase-client";
import { toast } from "sonner";

type Props = {
	postId: string;
	open: boolean;
	onOpenChange: (v: boolean) => void;
	initialContent: string | null;
	initialImageUrl: string | null;
	userId: string;
	onSaved?: () => void;
};

export default function PostEditDialog({ postId, open, onOpenChange, initialContent, initialImageUrl, userId, onSaved }: Props) {
	const supabase = supabaseBrowserClient();
	const [value, setValue] = useState<string>(initialContent ?? "");
	const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl ?? null);
	const [file, setFile] = useState<File | null>(null);
	const [isPending, startTransition] = useTransition();
	const fileRef = useRef<HTMLInputElement>(null);

	const onPick = () => fileRef.current?.click();

	const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0];
		if (!f) return;
		if (!f.type.startsWith("image/")) {
			toast.error("Only images are supported for now");
			return;
		}
		if (f.size > 10 * 1024 * 1024) {
			toast.error("Max 10MB");
			return;
		}
		setFile(f);
		try {
			setImageUrl(URL.createObjectURL(f));
		} catch {}
	};

	const onSave = () => {
		startTransition(async () => {
			try {
				let newUrl: string | null = imageUrl ?? null;
				if (file) {
					const ext = file.name.split(".").pop() || "jpg";
					const path = `${userId}/${postId}-edit-${Date.now()}.${ext}`;
					const { error: upErr } = await supabase.storage.from("post-media").upload(path, file, { upsert: false, contentType: file.type });
					if (upErr) throw upErr;
					const { data: pub } = supabase.storage.from("post-media").getPublicUrl(path);
					newUrl = pub.publicUrl;
				}
				const { error } = await supabase
					.from("posts")
					.update({ content: value || null, image_url: newUrl })
					.eq("id", postId)
					.eq("author_id", userId);
				if (error) throw error;
				toast.success("Post updated");
				onSaved?.();
				onOpenChange(false);
			} catch (e) {
				toast.error(e instanceof Error ? e.message : "Failed to save");
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-xl">
				<DialogHeader>
					<DialogTitle>Edit post</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<Textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Write something…" className="min-h-24" />
					<div>
						<input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
						<Button variant="outline" onClick={onPick}>Replace image</Button>
						{imageUrl ? (
							<div className="mt-2 overflow-hidden rounded border">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={imageUrl} alt="preview" className="max-h-64 w-full object-cover" />
							</div>
						) : (
							<p className="mt-2 text-xs text-muted-foreground">No image</p>
						)}
					</div>
				</div>
				<DialogFooter>
					<Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
					<Button onClick={onSave} disabled={isPending}>{isPending ? "Saving…" : "Save"}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
