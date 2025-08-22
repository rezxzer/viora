"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  creatorId: string;
  isSubscribed: boolean;
};

export default function SubscribeBar({ creatorId, isSubscribed }: Props) {
  const [subscribed, setSubscribed] = useState(isSubscribed);
  const [isPending, startTransition] = useTransition();

  const onSubscribe = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/monetization/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creatorId }),
        });
        if (!res.ok) throw new Error(await res.text());
        setSubscribed(true);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed";
        toast.error(msg);
      }
    });
  };

  const onUnsubscribe = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/monetization/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creatorId }),
        });
        if (!res.ok) throw new Error(await res.text());
        setSubscribed(false);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed";
        toast.error(msg);
      }
    });
  };

  return subscribed ? (
    <Button variant="secondary" disabled={isPending} onClick={onUnsubscribe}>
      Manage subscription
    </Button>
  ) : (
    <Button disabled={isPending} onClick={onSubscribe}>
      Subscribe
    </Button>
  );
}


