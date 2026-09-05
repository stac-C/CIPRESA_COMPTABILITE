import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { money } from "../lib/money";
import { subMonths } from "date-fns";

async function fetchDashboardData(isAccountingUser) {
  if (isAccountingUser) {
    const [entries, balances, reports] = await Promise.all([
      supabase.from("ecritures_comptables").select("*", { count: "exact", head: true }),
      supabase.from("bilans").select("*", { count: "exact", head: true }),
      supabase.from("rapports_financiers").select("*", { count: "exact", head: true }),
    ]);
    return {
      stats: { clients: 0, fournisseurs: 0, projets: 0, ventes: 0, achats: 0, produits: 0, factures: 0, chiffreAffaires: 0, resteAPayer: 0, comptes: 0, ecritures: entries.count || 0, bilans: balances.count || 0, rapports: reports.count || 0 },
      factures: [],
      ventes: [],
      metricErrors: [entries, balances, reports].filter(({ error }) => error).map(({ error }) => error.message),
    };
  }

  const sixMonthsAgo = subMonths(new Date(), 6).toISOString().slice(0, 10);
  const [clients, fournisseurs, projets, ventesCount, ventes, achats, produits, facturesCount, factures, comptes] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("fournisseurs").select("*", { count: "exact", head: true }),
    supabase.from("projets").select("*", { count: "exact", head: true }),
    supabase.from("ventes").select("*", { count: "exact", head: true }),
    supabase.from("ventes").select("id, total, statut, date_vente").order("date_vente", { ascending: true }).limit(500),
    supabase.from("achats").select("*", { count: "exact", head: true }),
    supabase.from("produits").select("*", { count: "exact", head: true }),
    supabase.from("factures").select("*", { count: "exact", head: true }),
    supabase.from("factures").select("id, numero, date_facture, montant_ttc, reste_a_payer, statut").gte("date_facture", sixMonthsAgo).order("date_facture", { ascending: false }).limit(100),
    supabase.from("comptes").select("*", { count: "exact", head: true }),
  ]);
  const error = clients.error || fournisseurs.error || projets.error || ventesCount.error || ventes.error || achats.error || produits.error || facturesCount.error || factures.error || comptes.error;
  if (error) throw error;
  const resteAPayer = (factures.data || []).reduce((sum, invoice) => sum.add(invoice.reste_a_payer || 0), money(0));
  const chiffreAffaires = (ventes.data || []).reduce((sum, sale) => sum.add(sale.total || 0), money(0));
  return {
    stats: { clients: clients.count || 0, fournisseurs: fournisseurs.count || 0, projets: projets.count || 0, ventes: ventesCount.count || 0, achats: achats.count || 0, produits: produits.count || 0, factures: facturesCount.count || 0, chiffreAffaires: chiffreAffaires.toNumber(), resteAPayer: resteAPayer.toNumber(), comptes: comptes.count || 0, ecritures: 0, bilans: 0, rapports: 0 },
    factures: factures.data || [],
    ventes: ventes.data || [],
  };
}

export function useDashboardData(isAccountingUser) {
  return useQuery({
    queryKey: ["dashboard", isAccountingUser ? "comptabilite" : "operations"],
    queryFn: () => fetchDashboardData(isAccountingUser),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
