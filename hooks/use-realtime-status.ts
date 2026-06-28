"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type { ShipmentStatus } from "@/lib/supabase/types";

interface UseRealtimeStatusOptions {
  shipmentId: string;
  initialStatus: ShipmentStatus;
}

/**
 * Realtime shipment status subscription.
 *
 * Uses Postgres Changes (not Broadcast) — Broadcast caused the June 24-25 2026 outage.
 * 30-second fallback polling is MANDATORY — never remove this.
 * If Realtime goes down again, users still see live data within 30s.
 */
export function useRealtimeStatus({
  shipmentId,
  initialStatus,
}: UseRealtimeStatusOptions) {
  const [status, setStatus] = useState<ShipmentStatus>(initialStatus);
  const [isConnected, setIsConnected] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supabase = createBrowserClient();

  const fetchCurrentStatus = useCallback(async () => {
    const { data } = await supabase
      .from("shipments")
      .select("status")
      .eq("id", shipmentId)
      .single();

    if (data?.status) {
      setStatus(data.status as ShipmentStatus);
    }
  }, [shipmentId, supabase]);

  useEffect(() => {
    // Realtime subscription — Postgres Changes, not Broadcast
    const channel = supabase
      .channel(`shipment-status-${shipmentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "shipments",
          filter: `id=eq.${shipmentId}`,
        },
        (payload) => {
          const newStatus = payload.new.status as ShipmentStatus;
          if (newStatus) {
            setStatus(newStatus);
          }
        }
      )
      .subscribe((channelStatus) => {
        setIsConnected(channelStatus === "SUBSCRIBED");
      });

    // 30-second fallback polling — MANDATORY.
    // If Realtime is down (like June 24-25 2026), this keeps data live.
    pollingRef.current = setInterval(fetchCurrentStatus, 30_000);

    return () => {
      supabase.removeChannel(channel);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [shipmentId, supabase, fetchCurrentStatus]);

  return { status, isConnected };
}
