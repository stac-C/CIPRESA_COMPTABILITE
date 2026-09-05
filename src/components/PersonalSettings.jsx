import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useTheme } from "../context/ThemeContext";

export default function PersonalSettings({ profile, roles, onSaved }) {
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState({ nom: profile?.nom || "", prenom: profile?.prenom || "", telephone: profile?.telephone || "", adresse: profile?.adresse || "", ville: profile?.ville || "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const { data, error } = await supabase.from("profiles").update(form).eq("id", profile.id).select().single();
    setSaving(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({ type: "success", text: "Informations personnelles mises à jour." });
    onSaved?.(data);
  }

  return (
    <div className="settings-grid">
      <section className="content-panel">
        <div className="section-heading"><div><p className="section-kicker">Compte utilisateur</p><h2>Mes informations personnelles</h2><p className="panel-description">Mettez à jour vos coordonnées utilisées dans votre espace CIPRESA.</p></div><span className="role-badge">{roles.map(({ nom }) => nom).join(" · ")}</span></div>
        {message && <p className={`message ${message.type}`}>{message.text}</p>}
        <form className="settings-form" onSubmit={saveProfile}>
          <label>Prénom <span className="field-hint">Votre prénom affiché dans l’application.</span><input name="prenom" value={form.prenom} onChange={updateField} required /></label>
          <label>Nom <span className="field-hint">Votre nom de famille.</span><input name="nom" value={form.nom} onChange={updateField} required /></label>
          <label>Téléphone <span className="field-hint">Numéro utilisé pour vous contacter.</span><input name="telephone" value={form.telephone} onChange={updateField} /></label>
          <label>Adresse <span className="field-hint">Adresse professionnelle ou personnelle.</span><input name="adresse" value={form.adresse} onChange={updateField} /></label>
          <label>Ville <span className="field-hint">Ville de résidence ou d’activité.</span><input name="ville" value={form.ville} onChange={updateField} /></label>
          <button className="primary-button" type="submit" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer les changements"}</button>
        </form>
      </section>
      <section className="content-panel profile-summary-panel"><p className="section-kicker">Préférences et accès</p><h2>Votre espace</h2><div className="theme-switcher" role="group" aria-label="Choisir le thème"><button className={theme === "light" ? "theme-option active" : "theme-option"} type="button" onClick={() => setTheme("light")}>☼ Clair</button><button className={theme === "dark" ? "theme-option active" : "theme-option"} type="button" onClick={() => setTheme("dark")}>◐ Sombre</button></div><h3 className="settings-subtitle">Vos rôles et droits</h3><div className="permission-list">{roles.map((role) => <span key={role.id}>{role.nom}</span>)}</div><p className="policy-note">Les droits d’accès sont chargés depuis Supabase. Une modification d’information personnelle ne modifie jamais votre rôle.</p></section>
    </div>
  );
}
