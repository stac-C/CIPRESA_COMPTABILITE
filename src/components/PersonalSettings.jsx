import React, { useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { Camera, Check, ImagePlus, LockKeyhole, MonitorSmartphone, Moon, Save, ShieldCheck, Sun, Trash2, X } from "lucide-react";
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
  return <div className="modal-backdrop" role="presentation"><div className="crop-modal" role="dialog" aria-modal="true" aria-label="Recadrer la photo de profil"><div className="crop-modal-header"><div><p className="section-kicker">Photo de profil</p><h2>Recadrer votre photo</h2></div><button className="icon-button" type="button" onClick={onCancel} aria-label="Fermer"><X size={17} /></button></div><div className="crop-area"><Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)} /></div><label className="zoom-control"><span>Zoom</span><input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label><div className="form-actions"><button className="btn-secondary" type="button" onClick={onCancel}>Annuler</button><button className="primary-button" type="button" disabled={!croppedAreaPixels || saving} onClick={() => onSave(croppedAreaPixels)}>{saving ? "Envoi..." : "Utiliser cette photo"}</button></div></div></div>;
}

export default function PersonalSettings({ profile, roles, onSaved }) {
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState({ nom: profile?.nom || "", prenom: profile?.prenom || "", telephone: profile?.telephone || "", adresse: profile?.adresse || "", ville: profile?.ville || "" });
  const [saving, setSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    supabase.from("user_devices").select("id, device_key, label, user_agent, last_seen_at, created_at, revoked_at").eq("user_id", profile.id).order("last_seen_at", { ascending: false }).then(({ data }) => setDevices(data || []));
  }, [profile.id]);

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
    const { error } = await supabase.from("user_devices").update({ revoked_at: new Date().toISOString() }).eq("id", device.id).eq("user_id", profile.id);
    if (error) setMessage({ type: "error", text: error.message });
    else setDevices((current) => current.map((item) => item.id === device.id ? { ...item, revoked_at: new Date().toISOString() } : item));
    await supabase.from("push_subscriptions").delete().eq("user_id", profile.id).eq("device_key", device.device_key);
  }

  return <div className="profile-page">
    {imageSrc && <CropModal imageSrc={imageSrc} onCancel={() => setImageSrc(null)} onSave={savePhoto} saving={photoSaving} />}
    <section className="profile-hero content-panel"><div className="profile-identity"><div className="profile-avatar-wrap"><Avatar profile={profile} /><label className="avatar-edit" title="Changer la photo"><Camera size={15} /><input type="file" accept="image/*" onChange={selectPhoto} /></label></div><div><p className="section-kicker">Compte utilisateur</p><h2>{`${profile?.prenom || ""} ${profile?.nom || ""}`.trim() || "Votre profil"}</h2><p>{roles.map(({ nom }) => nom).join(" · ")}</p><span className="profile-status"><Check size={13} /> Compte actif</span></div></div><div className="profile-hero-actions"><label className="outline-button upload-button"><ImagePlus size={15} /> Modifier la photo<input type="file" accept="image/*" onChange={selectPhoto} /></label><small>JPG ou PNG, 8 Mo maximum</small></div></section>
    {message && <p className={`message ${message.type}`}>{message.text}</p>}
    <div className="settings-grid profile-settings-grid"><section className="content-panel"><div className="section-heading"><div><p className="section-kicker">Informations personnelles</p><h2>Coordonnées</h2><p className="panel-description">Ces informations sont utilisées pour personnaliser votre espace CIPRESA.</p></div><LockKeyhole size={19} className="section-icon" /></div><form className="settings-form" onSubmit={saveProfile}><label>Prénom <span className="field-hint">Votre prénom affiché.</span><input name="prenom" value={form.prenom} onChange={updateField} required /></label><label>Nom <span className="field-hint">Votre nom de famille.</span><input name="nom" value={form.nom} onChange={updateField} required /></label><label>Téléphone <span className="field-hint">Numéro de contact.</span><input name="telephone" value={form.telephone} onChange={updateField} /></label><label>Adresse <span className="field-hint">Adresse professionnelle ou personnelle.</span><input name="adresse" value={form.adresse} onChange={updateField} /></label><label>Ville <span className="field-hint">Ville d’activité.</span><input name="ville" value={form.ville} onChange={updateField} /></label><button className="primary-button profile-save-button" type="submit" disabled={saving}><Save size={15} />{saving ? "Enregistrement..." : "Enregistrer les changements"}</button></form></section><section className="content-panel profile-summary-panel"><div className="section-heading"><div><p className="section-kicker">Préférences</p><h2>Votre espace</h2></div><Sun size={18} className="section-icon" /></div><div className="theme-switcher" role="group" aria-label="Choisir le thème"><button className={theme === "light" ? "theme-option active" : "theme-option"} type="button" onClick={() => setTheme("light")}><Sun size={14} /> Clair</button><button className={theme === "dark" ? "theme-option active" : "theme-option"} type="button" onClick={() => setTheme("dark")}><Moon size={14} /> Sombre</button></div><h3 className="settings-subtitle">Vos rôles et droits</h3><div className="permission-list">{roles.map((role) => <span key={role.id}>{role.nom}</span>)}</div><p className="policy-note">Les droits d’accès sont chargés depuis Supabase. La photo et les coordonnées ne modifient jamais vos permissions.</p></section></div>
    <section className="content-panel security-panel"><div className="section-heading"><div><p className="section-kicker">Sécurité du compte</p><h2>Appareils connectés</h2><p className="panel-description">Révoquez un appareil pour arrêter ses notifications Push et retirer sa confiance.</p></div><ShieldCheck size={19} className="section-icon" /></div>{devices.length === 0 ? <p className="empty">Aucun appareil enregistré. Activez les notifications sur votre navigateur pour l’ajouter.</p> : <div className="device-list">{devices.map((device) => <article className={device.revoked_at ? "device-item is-revoked" : "device-item"} key={device.id}><MonitorSmartphone size={20} /><div><strong>{device.label}</strong><small>Dernière activité : {new Date(device.last_seen_at).toLocaleString("fr-FR")}</small></div><span>{device.revoked_at ? "Révoqué" : "Actif"}</span>{!device.revoked_at && <button className="icon-button" type="button" title="Révoquer cet appareil" onClick={() => revokeDevice(device)}><Trash2 size={15} /></button>}</article>)}</div>}</section>
  </div>;
}