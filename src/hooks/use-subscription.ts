import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionPlan = "free" | "pro" | "premium";

interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: string;
  expires_at: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setSubscription(data as Subscription | null);
      setLoading(false);
    };

    fetch();
  }, [user]);

  const isPaid = subscription?.plan === "pro" || subscription?.plan === "premium";
  const plan: SubscriptionPlan = (subscription?.plan as SubscriptionPlan) || "free";

  return { subscription, loading, isPaid, plan };
};
