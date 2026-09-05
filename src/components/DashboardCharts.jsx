import React from "react";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#0e7490", "#d97706", "#be123c", "#64748b"];

export default function DashboardCharts({ invoices = [], sales = [] }) {
  const byMonth = [...invoices.map((invoice) => ({ date: invoice.date_facture, amount: invoice.montant_ttc })), ...sales.map((sale) => ({ date: sale.date_vente, amount: sale.total }))].reduce((result, item) => {
    const month = item.date?.slice(0, 7) || "Inconnu";
    result[month] = (result[month] || 0) + Number(item.amount || 0);
    return result;
  }, {});
  const evolution = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, total]) => ({ month, total }));
  const statuses = invoices.reduce((result, invoice) => {
    result[invoice.statut] = (result[invoice.statut] || 0) + 1;
    return result;
  }, {});
  const pieData = Object.entries(statuses).map(([name, value]) => ({ name, value }));

  return <div className="overview-grid">
    <section className="content-panel chart-panel"><div className="section-heading"><div><p className="section-kicker">Ventes et factures</p><h2>Activité financière sur six mois</h2></div></div><div className="chart-box"><ResponsiveContainer width="100%" height={240}><LineChart data={evolution}><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(value) => `${Number(value).toLocaleString("fr-FR")} XAF`} /><Line type="monotone" dataKey="total" stroke="#0e7490" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div></section>
    <section className="content-panel chart-panel"><div className="section-heading"><div><p className="section-kicker">Répartition</p><h2>Statut des factures</h2></div></div><div className="chart-box"><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={82} label>{pieData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></section>
  </div>;
}
