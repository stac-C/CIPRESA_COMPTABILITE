import React from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#0e7490", "#d97706", "#be123c", "#64748b"];
const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

function monthKey(date) {
  return date ? date.slice(0, 7) : null;
}

function lastSixMonths() {
  const today = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return { key, label: `${MONTHS[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}` };
  });
}

export default function DashboardCharts({ invoices = [], sales = [] }) {
  const monthBuckets = lastSixMonths().reduce((result, month) => {
    result[month.key] = { month: month.label, ventes: 0, factures: 0, ventesVolume: 0, facturesVolume: 0 };
    return result;
  }, {});
  sales.forEach((sale) => {
    const key = monthKey(sale.date_vente);
    if (monthBuckets[key]) {
      monthBuckets[key].ventes += Number(sale.total || 0);
      monthBuckets[key].ventesVolume += 1;
    }
  });
  invoices.forEach((invoice) => {
    const key = monthKey(invoice.date_facture);
    if (monthBuckets[key]) {
      monthBuckets[key].factures += Number(invoice.montant_ttc || 0);
      monthBuckets[key].facturesVolume += 1;
    }
  });
  const evolution = Object.values(monthBuckets);
  const volumeData = evolution.map(({ month, ventesVolume, facturesVolume }) => ({ month, ventes: ventesVolume, factures: facturesVolume }));
  const statuses = invoices.reduce((result, invoice) => {
    const status = invoice.statut || "NON RENSEIGNÉ";
    if (!result[status]) result[status] = { name: status, value: 0, montant: 0 };
    result[status].value += 1;
    result[status].montant += Number(invoice.montant_ttc || 0);
    return result;
  }, {});
  const pieData = Object.values(statuses);
  const hasFinancialData = sales.length > 0 || invoices.length > 0;

  return <div className="overview-grid">
    <section className="content-panel chart-panel"><div className="section-heading"><div><p className="section-kicker">Ventes et factures</p><h2>Activité financière sur six mois</h2></div></div><div className="chart-box">{hasFinancialData ? <ResponsiveContainer width="100%" height={240}><LineChart data={evolution}><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(value) => `${Number(value).toLocaleString("fr-FR")} XAF`} /><Legend /><Line type="monotone" dataKey="ventes" name="Ventes" stroke="#0e7490" strokeWidth={3} dot={{ r: 4 }} /><Line type="monotone" dataKey="factures" name="Factures" stroke="#d97706" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer> : <p className="empty chart-empty">Aucune vente ou facture disponible dans les données autorisées.</p>}</div></section>
    <section className="content-panel chart-panel"><div className="section-heading"><div><p className="section-kicker">Répartition</p><h2>Statut des factures</h2></div></div><div className="chart-box">{pieData.length > 0 ? <ResponsiveContainer width="100%" height={240}><PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={82} label>{pieData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value, name, item) => name === "value" ? [`${value} facture(s)`, "Volume"] : [`${Number(item?.payload?.montant || 0).toLocaleString("fr-FR")} XAF`, "Montant"]} /></PieChart></ResponsiveContainer> : <p className="empty chart-empty">Aucune facture disponible dans les données autorisées.</p>}</div></section>
    <section className="content-panel chart-panel chart-panel-wide"><div className="section-heading"><div><p className="section-kicker">Volumes observés</p><h2>Ventes et factures par mois</h2></div></div><div className="chart-box">{hasFinancialData ? <ResponsiveContainer width="100%" height={220}><BarChart data={volumeData} barGap={8}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip formatter={(value) => `${value} document(s)`} /><Legend /><Bar dataKey="ventes" name="Ventes" fill="#0e7490" radius={[4, 4, 0, 0]} /><Bar dataKey="factures" name="Factures" fill="#d97706" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="empty chart-empty">Aucune activité disponible dans les données autorisées.</p>}</div></section>
  </div>;
}
