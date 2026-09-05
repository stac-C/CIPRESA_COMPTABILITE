import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

function displayValue(value) {
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function titleForColumn(column) {
  return column.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function emptyForm(fields) {
  return Object.fromEntries(fields.map(({ name, defaultValue = "" }) => [name, defaultValue]));
}

function generatedNumber(prefix) {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `${prefix}-${stamp}`;
}

export default function ResourceWorkspace({ resource, can }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(() => emptyForm(resource.fields));
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [relationOptions, setRelationOptions] = useState({});

  const canCreate = can(resource.createPermission);
  const canUpdate = can(resource.updatePermission);
  const canDelete = can(resource.deletePermission);

  async function loadRows() {
    setLoading(true);
    const { data, error: requestError } = await supabase
      .from(resource.table)
      .select(resource.columns.join(", "))
      .order(resource.orderBy || "created_at", { ascending: false })
      .limit(100);
    setRows(data || []);
    setError(requestError?.message || null);
    setLoading(false);
  }

  useEffect(() => {
    loadRows();
    const relations = resource.fields.filter((field) => field.relation);
    Promise.all(relations.map(async (field) => {
      const { data } = await supabase.from(field.relation.table).select(field.relation.columns.join(", ")).order(field.relation.label);
      return [field.name, data || []];
    })).then((entries) => setRelationOptions(Object.fromEntries(entries)));
  }, [resource]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function startEdit(row) {
    setEditingId(row.id);
    setForm(resource.fields.reduce((values, field) => ({ ...values, [field.name]: row[field.name] ?? field.defaultValue ?? "" }), {}));
    setMessage(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm(resource.fields));
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    const payload = { ...form };
    if (!editingId && resource.generatedNumber) payload[resource.generatedNumber.field] = generatedNumber(resource.generatedNumber.prefix);
    const request = editingId
      ? supabase.from(resource.table).update(payload).eq("id", editingId)
      : supabase.from(resource.table).insert(payload);
    const { error: requestError } = await request;
    setSaving(false);
    if (requestError) {
      setError(requestError.message);
      return;
    }
    setMessage({ type: "success", text: editingId ? `${resource.title} modifié.` : `${resource.title} créé.` });
    cancelEdit();
    loadRows();
  }

  async function remove(row) {
    if (!window.confirm(`Supprimer ${row[resource.nameField] || resource.title.toLowerCase()} ?`)) return;
    setError(null);
    const { error: requestError } = await supabase.from(resource.table).delete().eq("id", row.id);
    if (requestError) setError(requestError.message);
    else {
      setMessage({ type: "success", text: `${resource.title} supprimé.` });
      loadRows();
    }
  }

  return (
    <div className="resource-workspace">
      {(canCreate || (editingId && canUpdate)) && (
        <section className="content-panel">
          <div className="section-heading">
            <div><p className="section-kicker">Opérations Supabase · {editingId ? resource.updatePermission : resource.createPermission}</p><h2>{editingId ? `Modifier ${resource.title.toLowerCase()}` : `Nouveau ${resource.title.toLowerCase()}`}</h2><p className="panel-description">Les contrôles d’accès sont lus depuis les permissions du rôle. RLS Supabase reste la protection finale.</p></div>
          </div>
          <form className="accounting-form" onSubmit={save}>
            {resource.fields.map((field) => (
              <label className="accounting-field" key={field.name}>
                <span>{field.label}</span>
                {field.relation ? <select name={field.name} value={form[field.name]} onChange={updateField} required={field.required}><option value="">Choisir</option>{(relationOptions[field.name] || []).map((option) => <option value={option[field.relation.value]} key={option[field.relation.value]}>{option[field.relation.label]}</option>)}</select> : field.type === "textarea" ? <textarea name={field.name} value={form[field.name]} onChange={updateField} required={field.required} /> : <input type={field.type || "text"} name={field.name} value={field.type === "checkbox" ? undefined : form[field.name]} checked={field.type === "checkbox" ? Boolean(form[field.name]) : undefined} onChange={updateField} required={field.required} min={field.min} step={field.step} />}
              </label>
            ))}
            <div className="form-actions"><button className="primary-button" type="submit" disabled={saving}>{saving ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Créer"}</button>{editingId && <button className="btn-secondary" type="button" onClick={cancelEdit}>Annuler</button>}</div>
          </form>
        </section>
      )}
      <section className="content-panel">
        <div className="section-heading"><div><p className="section-kicker">Données Supabase · {resource.readPermission}</p><h2>{resource.title}</h2><p className="panel-description">{resource.description}</p></div><span className="record-count">{rows.length} affiché{rows.length > 1 ? "s" : ""}</span></div>
        {message && <p className={`message ${message.type}`}>{message.text}</p>}
        {error && <p className="message error">Erreur Supabase : {error}</p>}
        {loading ? <p className="empty">Chargement...</p> : rows.length === 0 ? <p className="empty">Aucune donnée accessible pour ce rôle.</p> : <div className="table-scroll"><table className="data-table"><thead><tr>{resource.columns.filter((column) => column !== "id").map((column) => <th key={column}>{titleForColumn(column)}</th>)}{resource.derivedColumns?.map((column) => <th key={column.name}>{column.label}</th>)}{(canUpdate || canDelete) && <th>Opérations</th>}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{resource.columns.filter((column) => column !== "id").map((column) => <td key={column}>{displayValue(row[column])}</td>)}{resource.derivedColumns?.map((column) => <td key={column.name}>{displayValue(column.getValue(row))}</td>)}{(canUpdate || canDelete) && <td className="table-actions">{canUpdate && <button className="link-button" type="button" onClick={() => startEdit(row)}>Modifier</button>}{canDelete && <button className="link-button danger" type="button" onClick={() => remove(row)}>Supprimer</button>}</td>}</tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}
