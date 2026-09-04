import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "../lib/supabaseClient";

export default function useRealtimeNotifications(enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;

    const channel = supabase
      .channel("cipresa-factures-paiements")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "factures" }, () => {
        toast.success("Nouvelle facture émise");
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "factures" }, (payload) => {
        if (payload.new?.statut === "PAYEE") toast.success("Facture payée");
        else toast.info("Facture mise à jour");
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "paiements" }, () => {
        toast.success("Paiement reçu");
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "paiements" }, () => {
        toast.info("Paiement mis à jour");
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled]);
}
