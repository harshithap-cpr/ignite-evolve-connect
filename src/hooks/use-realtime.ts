import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface UseRealtimeOptions {
  table: string;
  event?: RealtimeEvent;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
}

export function useRealtime({
  table,
  event = "*",
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
}: UseRealtimeOptions) {
  useEffect(() => {
    const channelConfig: any = {
      event,
      schema: "public",
      table,
    };
    if (filter) channelConfig.filter = filter;

    const channel = supabase
      .channel(`realtime-${table}-${filter || "all"}`)
      .on("postgres_changes", channelConfig, (payload: RealtimePostgresChangesPayload<any>) => {
        onChange?.(payload);
        if (payload.eventType === "INSERT") onInsert?.(payload.new);
        if (payload.eventType === "UPDATE") onUpdate?.(payload.new);
        if (payload.eventType === "DELETE") onDelete?.(payload.old);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, filter]);
}
