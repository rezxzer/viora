import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PostCardSkeleton from "@/components/post/PostCardSkeleton";

export default function FeedPage() {
  return (
    <div className="mx-auto w-full max-w-[720px] space-y-4">
      {/* Composer placeholder */}
      <Card aria-label="Composer">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div aria-hidden className="size-10 shrink-0 rounded-full bg-elev border" />
            <div className="flex-1">
              <label htmlFor="composer" className="sr-only">What’s happening?</label>
              <Textarea id="composer" className="min-h-16 resize-none" placeholder="What’s happening?" disabled />
              <div className="mt-3 flex items-center justify-end gap-2">
                <Button variant="outline" disabled aria-label="Upload image (disabled)">Upload image</Button>
                <Button disabled aria-label="Post (disabled)">Post</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder posts */}
      <div className="space-y-4">
        <PostCardSkeleton withImage />
        <PostCardSkeleton />
        <PostCardSkeleton withImage />
        <PostCardSkeleton />
      </div>
    </div>
  );
}


