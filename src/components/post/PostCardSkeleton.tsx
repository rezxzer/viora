import { Card, CardContent } from '@/components/ui/card'

type Props = {
  withImage?: boolean
}

/**
 * PostCardSkeleton: visual placeholder for a post card.
 */
export default function PostCardSkeleton({ withImage }: Props) {
  return (
    <Card aria-busy aria-label="Loading post">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-full bg-elev animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded bg-elev animate-pulse" />
            <div className="h-3 w-24 rounded bg-elev animate-pulse" />
          </div>
          <div className="h-4 w-6 rounded bg-elev animate-pulse" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-elev animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-elev animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-elev animate-pulse" />
        </div>
        {withImage ? (
          <div className="mt-4 aspect-[4/3] w-full rounded-2xl bg-elev animate-pulse" />
        ) : null}
      </CardContent>
    </Card>
  )
}
