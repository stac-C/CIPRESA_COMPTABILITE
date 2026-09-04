import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const EMPTY_ENTRY = { numero: "", exercice_id: "", journal_id: "", date_ecriture: new Date().toISOString().slice(0, 10), libelle: "", reference_piece: "" };
const EMPTY_BALANCE = { exercice_id: "", total_actif: "0", total_passif: "0", resultat: "0" };
const EMPTY_REPORT = { reference: "", nom: "", date_debut: "", date_fin: "", solde_initial: "0", total_entrees: "0", total_sorties: "0", solde_final: "0" };

function Feedback({ message }) {
  return message ? <p className={`message ${message.type}`}>{message.text}</p> : null;
}

function Field({ label, hint, children }) {
  return <label className="accounting-field"><span>{label}</span>{children}<small>{hint}</small></label>;
}

function WorkspaceHeader({ title, description, permission }) {
  return <div className="section-heading workspace-header"><div><p className="section-kicker">Espace comptable · {permission}</p><h2>{title}</h2><p className="panel-description">{description}</p></div><span className="role-code">COMPTABLE</span></div>;
}

export default function ComptabiliteWorkspace({ section, session, can }) {
  if (section === "bilans") return <BilansWorkspace can={can} />;
  if (section === "rapports") return <ReportsWorkspace can={can} />;
  return <EntriesWorkspace can={can} userId={session?.user?.id} />;
}

function EntriesWorkspace({ can, userId }) {
  const [entries, setEntries] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [journals, setJournals] = useState([]);
  const [form, setForm] = useState(EMPTY_ENTRY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function loadData() {
    setLoading(true);
    const [entriesResult, exercisesResult, journalsResult] = await Promise.all([
      supabase.from("ecritures_comptables").select("id, numero, exercice_id, journal_id, date_ecriture, libelle, reference_piece, statut").order("date_ecriture", { ascending: false }).limit(50),
      supabase.from("exercices_comptables").select("id, code, annee, statut").order("annee", { ascending: false }),
      supabase.from("journaux").select("id, code, libelle").order("code"),
    ]);
    setEntries(entriesResult.data || []);
    setExercises(exercisesResult.data || []);
    setJournals(journalsResult.data || []);
    setMessage(entriesResult.error || exercisesResult.error || journalsResult.error ? { type: "error", text: (entriesResult.error || exercisesResult.error || journalsResult.error).message } : null);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function update(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }

  async function createEntry(event) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.from("ecritures_comptables").insert({ ...form, created_by: userId, statut: "BROUILLON" });
    setSaving(false);
    if (error) { setMessage({ type: "error", text: error.message }); return; }
    setForm(EMPTY_ENTRY);
    setMessage({ type: "success", text: "Écriture créée en brouillon." });
    loadData();
  }

  async function validateEntry(id) {
    setMessage(null);
    const { error } = await supabase.from("ecritures_comptables").update({ statut: "VALIDEE", validated_by: userId, validated_at: new Date().toISOString() }).eq("id", id).eq("statut", "BROUILLON");
    if (error) setMessage({ type: "error", text: error.message });
    else { setMessage({ type: "success", text: "Écriture validée." }); loadData(); }
  }

  return <div className="accounting-workspace"><section className="content-panel"><WorkspaceHeader permission="COMPTA_CREATE / COMPTA_VALIDATE" title="Saisie d’une écriture comptable" description="Renseignez les éléments de la pièce. L’écriture sera créée en brouillon pour être contrôlée avant validation." /><Feedback message={message} />{can("COMPTA_CREATE") && <form className="accounting-form" onSubmit={createEntry}><Field label="Numéro de l’écriture" hint="Référence interne unique de l’opération."><input name="numero" value={form.numero} onChange={update} placeholder="Ex. EC-2026-001" required /></Field><Field label="Exercice comptable" hint="Sélectionnez l’exercice ouvert concerné."><select name="exercice_id" value={form.exercice_id} onChange={update} required><option value="">Choisir un exercice</option>{exercises.map((item) => <option value={item.id} key={item.id}>{item.code} · {item.annee} ({item.statut})</option>)}</select></Field><Field label="Journal" hint="Journal dans lequel l’opération doit être enregistrée."><select name="journal_id" value={form.journal_id} onChange={update} required><option value="">Choisir un journal</option>{journals.map((item) => <option value={item.id} key={item.id}>{item.code} · {item.libelle}</option>)}</select></Field><Field label="Date de l’écriture" hint="Date figurant sur la pièce comptable."><input type="date" name="date_ecriture" value={form.date_ecriture} onChange={update} required /></Field><Field label="Libellé de l’opération" hint="Décrivez clairement l’opération enregistrée."><input name="libelle" value={form.libelle} onChange={update} placeholder="Ex. Achat de fournitures" required /></Field><Field label="Référence de la pièce" hint="Facture, reçu ou justificatif associé (facultatif)."><input name="reference_piece" value={form.reference_piece} onChange={update} placeholder="Ex. FAC-2026-014" /></Field><button className="primary-button" type="submit" disabled={saving}>{saving ? "Création en cours..." : "Créer l’écriture en brouillon"}</button></form>}</section><section className="content-panel"><div className="section-heading"><div><p className="section-kicker">COMPTA_READ</p><h2>Journal des écritures</h2><p className="panel-description">Consultez les écritures récentes et validez les brouillons après contrôle.</p></div><span className="record-count">{entries.length} affichée{entries.length > 1 ? "s" : ""}</span></div>{loading ? <p className="empty">Chargement des écritures...</p> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Numéro</th><th>Date</th><th>Libellé</th><th>Statut</th><th>Action</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}><td>{entry.numero}</td><td>{entry.date_ecriture}</td><td>{entry.libelle}</td><td>{entry.statut}</td><td>{can("COMPTA_VALIDATE") && entry.statut === "BROUILLON" && <button className="link-button" type="button" onClick={() => validateEntry(entry.id)}>Valider l’écriture</button>}</td></tr>)}</tbody></table></div>}</section></div>;
}

function BilansWorkspace({ can }) {
  const [rows, setRows] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [form, setForm] = useState(EMPTY_BALANCE);
  const [message, setMessage] = useState(null);

  async function loadData() {
    const [rowsResult, exercisesResult] = await Promise.all([supabase.from("bilans").select("id, exercice_id, date_generation, total_actif, total_passif, resultat, statut").order("date_generation", { ascending: false }), supabase.from("exercices_comptables").select("id, code, annee").order("annee", { ascending: false })]);
    setRows(rowsResult.data || []); setExercises(exercisesResult.data || []);
    if (rowsResult.error || exercisesResult.error) setMessage({ type: "error", text: (rowsResult.error || exercisesResult.error).message });
  }
  useEffect(() => { loadData(); }, []);
  function update(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }
  async function generate(event) { event.preventDefault(); setMessage(null); const { error } = await supabase.from("bilans").insert({ ...form, date_generation: new Date().toISOString().slice(0, 10), statut: "GENERE" }); if (error) setMessage({ type: "error", text: error.message }); else { setMessage({ type: "success", text: "Bilan généré." }); setForm(EMPTY_BALANCE); loadData(); } }
  return <div className="accounting-workspace"><section className="content-panel"><WorkspaceHeader permission="BILAN_GENERATE" title="Génération d’un bilan" description="Sélectionnez l’exercice et renseignez les totaux issus de votre contrôle comptable avant de générer le bilan." /><Feedback message={message} />{can("BILAN_GENERATE") && <form className="accounting-form" onSubmit={generate}><Field label="Exercice comptable" hint="Période couverte par ce bilan."><select name="exercice_id" value={form.exercice_id} onChange={update} required><option value="">Choisir un exercice</option>{exercises.map((item) => <option value={item.id} key={item.id}>{item.code} · {item.annee}</option>)}</select></Field><Field label="Total de l’actif" hint="Montant total des biens et créances."><input type="number" name="total_actif" value={form.total_actif} onChange={update} min="0" step="0.01" placeholder="Ex. 1250000.00" required /></Field><Field label="Total du passif" hint="Montant total des dettes et ressources."><input type="number" name="total_passif" value={form.total_passif} onChange={update} min="0" step="0.01" placeholder="Ex. 980000.00" required /></Field><Field label="Résultat de l’exercice" hint="Bénéfice ou perte de la période."><input type="number" name="resultat" value={form.resultat} onChange={update} step="0.01" placeholder="Ex. 270000.00" required /></Field><button className="primary-button" type="submit">Générer le bilan</button></form>}</section><DataTable title="Bilans générés" description="Retrouvez les états déjà produits par exercice et par date." rows={rows} columns={["exercice_id", "date_generation", "total_actif", "total_passif", "resultat", "statut"]} /></div>;
}

function ReportsWorkspace({ can }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY_REPORT);
  const [message, setMessage] = useState(null);
  async function loadData() { const result = await supabase.from("rapports_financiers").select("id, reference, nom, date_debut, date_fin, solde_initial, total_entrees, total_sorties, solde_final, statut").order("created_at", { ascending: false }); setRows(result.data || []); if (result.error) setMessage({ type: "error", text: result.error.message }); }
  useEffect(() => { loadData(); }, []);
  function update(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }
  async function createReport(event) { event.preventDefault(); setMessage(null); const { error } = await supabase.from("rapports_financiers").insert({ ...form, statut: "BROUILLON" }); if (error) setMessage({ type: "error", text: error.message }); else { setMessage({ type: "success", text: "Rapport créé." }); setForm(EMPTY_REPORT); loadData(); } }
  return <div className="accounting-workspace"><section className="content-panel"><WorkspaceHeader permission="RAPPORT_CREATE" title="Création d’un rapport financier" description="Définissez la période, donnez un nom explicite au rapport et saisissez les soldes de suivi." /><Feedback message={message} />{can("RAPPORT_CREATE") && <form className="accounting-form" onSubmit={createReport}><Field label="Référence du rapport" hint="Identifiant unique pour retrouver le document."><input name="reference" value={form.reference} onChange={update} placeholder="Ex. RPT-2026-001" required /></Field><Field label="Nom du rapport" hint="Intitulé lisible dans la liste des rapports."><input name="nom" value={form.nom} onChange={update} placeholder="Ex. Suivi de trésorerie annuel" required /></Field><Field label="Date de début" hint="Premier jour de la période analysée."><input type="date" name="date_debut" value={form.date_debut} onChange={update} required /></Field><Field label="Date de fin" hint="Dernier jour de la période analysée."><input type="date" name="date_fin" value={form.date_fin} onChange={update} required /></Field><Field label="Solde initial" hint="Situation au début de la période."><input type="number" name="solde_initial" value={form.solde_initial} onChange={update} step="0.01" placeholder="Ex. 500000.00" /></Field><Field label="Total des entrées" hint="Somme des recettes de la période."><input type="number" name="total_entrees" value={form.total_entrees} onChange={update} min="0" step="0.01" placeholder="Ex. 850000.00" /></Field><Field label="Total des sorties" hint="Somme des dépenses de la période."><input type="number" name="total_sorties" value={form.total_sorties} onChange={update} min="0" step="0.01" placeholder="Ex. 320000.00" /></Field><Field label="Solde final" hint="Situation à la fin de la période."><input type="number" name="solde_final" value={form.solde_final} onChange={update} step="0.01" placeholder="Ex. 1030000.00" /></Field><button className="primary-button" type="submit">Créer le rapport en brouillon</button></form>}</section><DataTable title="Rapports enregistrés" description="Consultez les rapports par période et suivez leur statut." rows={rows} columns={["reference", "nom", "date_debut", "date_fin", "solde_final", "statut"]} /></div>;
}

function DataTable({ title = "Historique", description = "Données enregistrées dans Supabase.", rows, columns }) {
  const labels = { exercice_id: "Exercice", date_generation: "Date de génération", total_actif: "Total actif", total_passif: "Total passif", resultat: "Résultat", statut: "Statut", reference: "Référence", nom: "Nom du rapport", date_debut: "Début de période", date_fin: "Fin de période", solde_final: "Solde final" };
  return <section className="content-panel"><div className="section-heading"><div><p className="section-kicker">COMPTA_READ</p><h2>{title}</h2><p className="panel-description">{description}</p></div><span className="record-count">{rows.length} résultat{rows.length > 1 ? "s" : ""}</span></div>{rows.length === 0 ? <p className="empty">Aucune donnée disponible pour le moment.</p> : <div className="table-scroll"><table className="data-table"><thead><tr>{columns.map((column) => <th key={column}>{labels[column] || column}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{columns.map((column) => <td key={column}>{row[column] ?? "-"}</td>)}</tr>)}</tbody></table></div>}</section>;
}
