import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import { Bell, BellOff, Camera, Check, ImagePlus, LogOut, LockKeyhole, MonitorSmartphone, Moon, Save, ShieldCheck, Sun, Trash2, UserPlus, X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useTheme } from "../context/ThemeContext";

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function getCroppedFile(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 640;
  const context = canvas.getContext("2d");
  context.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, 640, 640);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
}

function Avatar({ profile, size = "large" }) {
  const initials = `${profile?.prenom || ""} ${profile?.nom || ""}`.trim().charAt(0).toUpperCase() || "U";
  return profile?.photo_url ? <img className={`profile-avatar ${size}`} src={profile.photo_url} alt="Photo de profil" /> : <span className={`profile-avatar profile-avatar-fallback ${size}`}>{initials}</span>;
}

function CropModal({ imageSrc, onCancel, onSave, saving }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><div className="crop-modal" role="dialog" aria-modal="true" aria-label="Recadrer la photo de profil"><div className="crop-modal-header"><div><p className="section-kicker">Photo de profil</p><h2>Recadrer votre photo</h2></div><button className="icon-button" type="button" onClick={onCancel} aria-label="Fermer"><X size={17} /></button></div><div className="crop-area"><Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)} /></div><label className="zoom-control"><span>Zoom</span><input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label><div className="form-actions"><button className="btn-secondary" type="button" onClick={onCancel}>Annuler</button><button className="primary-button" type="button" disabled={!croppedAreaPixels || saving} onClick={() => onSave(croppedAreaPixels)}>{saving ? "Envoi..." : "Utiliser cette photo"}</button></div></div></div>;
}

function ConfirmDialog({ confirmation, onCancel }) {
  if (!confirmation) return null;
  return createPortal(<div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><div className="success-dialog confirm-dialog" role="dialog" aria-modal="true" aria-label="Confirmer l’action"><h2>{confirmation.title}</h2><p>{confirmation.description}</p><div className="form-actions"><button className="btn-secondary" type="button" onClick={onCancel}>Annuler</button><button className="primary-button" type="button" onClick={confirmation.action}>Confirmer</button></div></div></div>, document.body);
}

function AdminCreateUser({ onMessage }) {
  const [availableRoles, setAvailableRoles] = useState([]);
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", telephone: "", password: "", confirmation: "", roleCode: "CONSULTANT" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.from("roles").select("id, code, nom").order("nom").then(({ data }) => { if (active) setAvailableRoles(data || []); });
    return () => { active = false; };
  }, []);

  function updateField(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }

  async function createUser(event) {
    event.preventDefault();
    if (form.password !== form.confirmation) { onMessage({ type: "error", text: "Les deux mots de passe doivent correspondre." }); return; }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("admin-create-user", { body: form });
    setSaving(false);
    if (error || data?.error) { onMessage({ type: "error", text: data?.error || error.message }); return; }
    setForm({ prenom: "", nom: "", email: "", telephone: "", password: "", confirmation: "", roleCode: "CONSULTANT" });
    onMessage({ type: "success", text: `Compte créé pour ${data.user.email} avec le rôle ${data.role}.` });
  }

  return <section className="content-panel admin-create-user-panel"><div className="section-heading"><div><p className="section-kicker">Administration</p><h2>Créer un utilisateur</h2><p className="panel-description">Le compte pourra se connecter immédiatement avec l’adresse email et le mot de passe définis ici.</p></div><UserPlus size={19} className="section-icon" /></div><form className="settings-form" onSubmit={createUser}><label>Prénom<input name="prenom" value={form.prenom} onChange={updateField} required /></label><label>Nom<input name="nom" value={form.nom} onChange={updateField} required /></label><label>Adresse email<input type="email" name="email" value={form.email} onChange={updateField} required /></label><label>Téléphone<input name="telephone" value={form.telephone} onChange={updateField} /></label><label>Mot de passe<span className="field-hint">6 caractères minimum.</span><input type="password" name="password" minLength="6" value={form.password} onChange={updateField} required /></label><label>Confirmer le mot de passe<input type="password" name="confirmation" minLength="6" value={form.confirmation} onChange={updateField} required /></label><label>Rôle initial<select name="roleCode" value={form.roleCode} onChange={updateField} required>{availableRoles.map((role) => <option value={role.code} key={role.id}>{role.nom}</option>)}</select></label><button className="primary-button profile-save-button" type="submit" disabled={saving}><UserPlus size={15} />{saving ? "Création..." : "Créer le compte"}</button></form></section>;
}

export default function PersonalSettings({ profile, roles, onSaved, onSignOut }) {
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState({ nom: profile?.nom || "", prenom: profile?.prenom || "", telephone: profile?.telephone || "", adresse: profile?.adresse || "", ville: profile?.ville || "" });
  const [saving, setSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [devices, setDevices] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notifications_enabled !== false);
  const [passwordForm, setPasswordForm] = useState({ password: "", confirmation: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  function requestConfirmation(title, description, action) {
    setConfirmation({ title, description, action: async () => { setConfirmation(null); await action(); } });
  }

  useEffect(() => {
    if (!profile?.id) return undefined;
    let active = true;
    supabase.from("user_devices").select("id, device_key, label, user_agent, last_seen_at, created_at, revoked_at").eq("user_id", profile.id).order("last_seen_at", { ascending: false }).then(({ data }) => {
      if (active) setDevices(data || []);
    }).catch(() => {
      if (active) setDevices([]);
    });
    return () => { active = false; };
  }, [profile?.id]);

  if (!profile?.id) return <section className="content-panel profile-loading"><p className="empty">Chargement du profil...</p></section>;

  function updateField(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }

  async function saveProfile(event) {
    event.preventDefault(); setSaving(true); setMessage(null);
    const { data, error } = await supabase.from("profiles").update(form).eq("id", profile.id).select().single();
    setSaving(false);
    setMessage(error ? { type: "error", text: error.message } : { type: "success", text: "Informations personnelles mises à jour." });
    if (!error) onSaved?.(data);
  }

  function selectPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) { setMessage({ type: "error", text: "Choisissez une image de 8 Mo maximum." }); return; }
    setImageSrc(URL.createObjectURL(file));
    event.target.value = "";
  }

  async function savePhoto(croppedAreaPixels) {
    setPhotoSaving(true); setMessage(null);
    try {
      const blob = await getCroppedFile(imageSrc, croppedAreaPixels);
      const path = `${profile.id}/avatar.jpg`;
      const upload = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg", upsert: true, cacheControl: "3600" });
      if (upload.error) throw upload.error;
      const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);
      const photoUrl = `${publicData.publicUrl}?v=${Date.now()}`;
      const { data, error } = await supabase.from("profiles").update({ photo_url: photoUrl }).eq("id", profile.id).select().single();
      if (error) throw error;
      onSaved?.(data); setImageSrc(null); setMessage({ type: "success", text: "Photo de profil mise à jour." });
    } catch (error) { setMessage({ type: "error", text: error.message || "La photo n’a pas pu être enregistrée." }); }
    finally { setPhotoSaving(false); }
  }

  async function revokeDevice(device) {
    requestConfirmation("Révoquer cet appareil ?", "Ses notifications Push seront désactivées et sa session de confiance retirée.", async () => {
      const { error } = await supabase.from("user_devices").update({ revoked_at: new Date().toISOString() }).eq("id", device.id).eq("user_id", profile.id);
      if (error) setMessage({ type: "error", text: error.message });
      else setDevices((current) => current.map((item) => item.id === device.id ? { ...item, revoked_at: new Date().toISOString() } : item));
      await supabase.from("push_subscriptions").delete().eq("user_id", profile.id).eq("device_key", device.device_key);
    });
  }

  async function updateNotificationPreference(event) {
    const enabled = event.target.checked;
    if (enabled) {
      setNotificationsEnabled(true);
      const { data, error } = await supabase.from("profiles").update({ notifications_enabled: true }).eq("id", profile.id).select().single();
      if (error) { setNotificationsEnabled(false); setMessage({ type: "error", text: error.message }); return; }
      onSaved?.(data); setMessage({ type: "success", text: "Notifications activées." }); return;
    }
    requestConfirmation("Désactiver les notifications ?", "Vous ne recevrez plus les alertes temps réel ni les notifications Push tant que cette option restera désactivée.", async () => {
      setNotificationsEnabled(false);
      const { data, error } = await supabase.from("profiles").update({ notifications_enabled: false }).eq("id", profile.id).select().single();
      if (error) { setNotificationsEnabled(true); setMessage({ type: "error", text: error.message }); return; }
      onSaved?.(data); await supabase.from("push_subscriptions").delete().eq("user_id", profile.id); setMessage({ type: "success", text: "Notifications désactivées." });
    });
  }

  async function changePassword(event) {
    event.preventDefault();
    if (passwordForm.password.length < 6 || passwordForm.password !== passwordForm.confirmation) { setMessage({ type: "error", text: "Le mot de passe doit contenir 6 caractères et les deux valeurs doivent correspondre." }); return; }
    requestConfirmation("Mettre à jour le mot de passe ?", "Votre mot de passe actuel sera remplacé par le nouveau.", async () => {
      setPasswordSaving(true);
      const { error } = await supabase.auth.updateUser({ password: passwordForm.password });
      setPasswordSaving(false);
      if (error) setMessage({ type: "error", text: error.message });
      else { setPasswordForm({ password: "", confirmation: "" }); setMessage({ type: "success", text: "Mot de passe mis à jour." }); }
    });
  }

  return <div className="profile-page">
    <ConfirmDialog confirmation={confirmation} onCancel={() => setConfirmation(null)} />
    {imageSrc && <CropModal imageSrc={imageSrc} onCancel={() => setImageSrc(null)} onSave={savePhoto} saving={photoSaving} />}
    <section className="profile-hero content-panel"><div className="profile-identity"><div className="profile-avatar-wrap"><Avatar profile={profile} /><label className="avatar-edit" title="Changer la photo"><Camera size={15} /><input type="file" accept="image/*" onChange={selectPhoto} /></label></div><div><p className="section-kicker">Compte utilisateur</p><h2>{`${profile?.prenom || ""} ${profile?.nom || ""}`.trim() || "Votre profil"}</h2><p>{roles.map(({ nom }) => nom).join(" · ")}</p><span className="profile-status"><Check size={13} /> Compte actif</span></div></div><div className="profile-hero-actions"><label className="outline-button upload-button"><ImagePlus size={15} /> Modifier la photo<input type="file" accept="image/*" onChange={selectPhoto} /></label><button className="danger-button" type="button" onClick={() => requestConfirmation("Se déconnecter ?", "Votre session sera fermée sur cet appareil.", onSignOut)}><LogOut size={15} /> Se déconnecter</button><small>JPG ou PNG, 8 Mo maximum</small></div></section>
    {message && <p className={`message ${message.type}`}>{message.text}</p>}
    {roles.some(({ code }) => code === "ADMIN") && <AdminCreateUser onMessage={setMessage} />}
    <div className="settings-grid profile-settings-grid"><section className="content-panel"><div className="section-heading"><div><p className="section-kicker">Informations personnelles</p><h2>Coordonnées</h2><p className="panel-description">Ces informations sont utilisées pour personnaliser votre espace CIPRESA.</p></div><LockKeyhole size={19} className="section-icon" /></div><form className="settings-form" onSubmit={saveProfile}><label>Prénom <span className="field-hint">Votre prénom affiché.</span><input name="prenom" value={form.prenom} onChange={updateField} required /></label><label>Nom <span className="field-hint">Votre nom de famille.</span><input name="nom" value={form.nom} onChange={updateField} required /></label><label>Téléphone <span className="field-hint">Numéro de contact.</span><input name="telephone" value={form.telephone} onChange={updateField} /></label><label>Adresse <span className="field-hint">Adresse professionnelle ou personnelle.</span><input name="adresse" value={form.adresse} onChange={updateField} /></label><label>Ville <span className="field-hint">Ville d’activité.</span><input name="ville" value={form.ville} onChange={updateField} /></label><button className="primary-button profile-save-button" type="submit" disabled={saving}><Save size={15} />{saving ? "Enregistrement..." : "Enregistrer les changements"}</button></form></section><section className="content-panel profile-summary-panel"><div className="section-heading"><div><p className="section-kicker">Préférences</p><h2>Votre espace</h2></div><Sun size={18} className="section-icon" /></div><div className="theme-switcher" role="group" aria-label="Choisir le thème"><button className={theme === "light" ? "theme-option active" : "theme-option"} type="button" onClick={() => setTheme("light")}><Sun size={14} /> Clair</button><button className={theme === "dark" ? "theme-option active" : "theme-option"} type="button" onClick={() => setTheme("dark")}><Moon size={14} /> Sombre</button></div><h3 className="settings-subtitle">Vos rôles et droits</h3><div className="permission-list">{roles.map((role) => <span key={role.id}>{role.nom}</span>)}</div><p className="policy-note">Les droits d’accès sont chargés depuis Supabase. La photo et les coordonnées ne modifient jamais vos permissions.</p></section></div>
    <section className="content-panel security-panel"><div className="section-heading"><div><p className="section-kicker">Sécurité et notifications</p><h2>Contrôle du compte</h2><p className="panel-description">Gérez vos alertes, votre mot de passe et les appareils autorisés.</p></div><ShieldCheck size={19} className="section-icon" /></div><label className="notification-preference"><span className="preference-icon">{notificationsEnabled ? <Bell size={17} /> : <BellOff size={17} />}</span><span><strong>Recevoir les notifications</strong><small>Opérations comptables, ventes, factures, achats, rapports et changements d’accès.</small></span><input type="checkbox" checked={notificationsEnabled} onChange={updateNotificationPreference} /></label><form className="password-form" onSubmit={changePassword}><h3 className="settings-subtitle">Changer le mot de passe</h3><input type="password" minLength="6" placeholder="Nouveau mot de passe" value={passwordForm.password} onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))} required /><input type="password" minLength="6" placeholder="Confirmer le nouveau mot de passe" value={passwordForm.confirmation} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmation: event.target.value }))} required /><button className="primary-button" type="submit" disabled={passwordSaving}>{passwordSaving ? "Mise à jour..." : "Mettre à jour le mot de passe"}</button></form><h3 className="settings-subtitle device-heading">Appareils connectés</h3>{devices.length === 0 ? <p className="empty">Aucun appareil enregistré.</p> : <div className="device-list">{devices.map((device) => <article className={device.revoked_at ? "device-item is-revoked" : "device-item"} key={device.id}><MonitorSmartphone size={20} /><div><strong>{device.label}</strong><small>Dernière activité : {new Date(device.last_seen_at).toLocaleString("fr-FR")}</small></div><span>{device.revoked_at ? "Révoqué" : "Actif"}</span>{!device.revoked_at && <button className="icon-button" type="button" title="Révoquer cet appareil" onClick={() => revokeDevice(device)}><Trash2 size={15} /></button>}</article>)}</div>}</section>
  </div>;
}