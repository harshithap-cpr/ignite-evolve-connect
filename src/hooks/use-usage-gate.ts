import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";

const FREE_LIMIT = 1;

export const useUsageGate = (feature: string) => {
  const { user } = useAuth();
  const { isPaid } = useSubscription();
  const [usageCount, setUsageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchUsage = async () => {
      const { count } = await supabase
        .from("usage_tracking")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("feature", feature);
      setUsageCount(count || 0);
      setLoading(false);
    };
    fetchUsage();
  }, [user, feature]);

  const canUse = isPaid || usageCount < FREE_LIMIT;
  const remainingFree = Math.max(0, FREE_LIMIT - usageCount);

  const recordUsage = useCallback(async () => {
    if (!user) return;
    await supabase.from("usage_tracking").insert({ user_id: user.id, feature });
    setUsageCount((prev) => prev + 1);
  }, [user, feature]);

  return { canUse, remainingFree, usageCount, isPaid, loading, recordUsage };
};
