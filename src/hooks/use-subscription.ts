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

const FREE_TRIAL_DAYS = 3;

const LIFETIME_FREE_EMAILS = ["harshitha.p@jkkn.ac.in"];

const isWithinTrial = (user: { created_at?: string } | null): boolean => {
  if (!user?.created_at) return false;
  const created = new Date(user.created_at);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= FREE_TRIAL_DAYS;
};

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const inTrial = isWithinTrial(user);
  const isLifetimeFree = LIFETIME_FREE_EMAILS.includes(user?.email?.toLowerCase() || "");
  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const fetchSub = async () => {
      const { data: active } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (active) {
        setSubscription(active as Subscription);
        setLoading(false);
        return;
      }

      const { data: pending } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setSubscription(pending as Subscription | null);
      setLoading(false);
    };

    fetchSub();
  }, [user]);

  const hasActiveSub = (subscription?.plan === "pro" || subscription?.plan === "premium") && 
    (subscription?.status === "active" || subscription?.status === "pending");
  const isPaid = hasActiveSub || inTrial || isLifetimeFree;
  const plan: SubscriptionPlan = hasActiveSub
    ? (subscription?.plan as SubscriptionPlan)
    : (inTrial || isLifetimeFree) ? "premium" : "free";
  const isPending = subscription?.status === "pending";
  const isTrial = (inTrial && !hasActiveSub && !isLifetimeFree);

  const trialDaysLeft = user?.created_at
    ? Math.max(0, Math.ceil(FREE_TRIAL_DAYS - (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return { subscription, loading, isPaid, isPending, plan, isTrial, trialDaysLeft };
};
