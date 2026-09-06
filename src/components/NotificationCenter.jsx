import React, { useState } from "react";
import { Bell, CircleHelp, ExternalLink } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import useRealtimeNotifications from "../hooks/useRealtimeNotifications";
import usePushNotifications from "../hooks/usePushNotifications";

export default function NotificationCenter() {
  const { session, roles } = useAuth();
  const { notifications, unreadCount, markAsRead } = useRealtimeNotifications(session?.user?.id);
  const { supported, permission, enablePush } = usePushNotifications(session?.user?.id);
  const [open, setOpen] = useState(null);

  if (!session) return null;

  return <div className="platform-tools">
    <div className="platform-tool-group">
      <button className="icon-button notification-button" type="button" title="Notifications" aria-label="Notifications" onClick={() => setOpen(open === "notifications" ? null : "notifications")}><Bell size={17} />{unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}</button>
      {open === "notifications" && <section className="tool-popover notifications-popover" aria-label="Centre de notifications"><div className="tool-popover-header"><div><strong>Notifications</strong><small>{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</small></div>{supported && permission !== "granted" && <button className="link-button" type="button" onClick={enablePush}>Activer les notifications</button>}</div>{notifications.length === 0 ? <p className="empty">Aucune notification pour le moment.</p> : <div className="notification-list">{notifications.map((notification) => <button className={notification.lu ? "notification-item is-read" : "notification-item"} type="button" key={notification.id} onClick={() => markAsRead(notification.id)}><strong>{notification.titre}</strong><span>{notification.message}</span><small>{new Date(notification.created_at).toLocaleString("fr-FR")}</small></button>)}</div>}</section>}
    </div>
    <div className="platform-tool-group">
      <button className="icon-button" type="button" title="Aide" aria-label="Aide" onClick={() => setOpen(open === "help" ? null : "help")}><CircleHelp size={17} /></button>
      {open === "help" && <section className="tool-popover help-popover" aria-label="Aide de la plateforme"><strong>Aide CIPRESA</strong><p>Les onglets visibles dépendent de vos rôles et permissions Supabase.</p><p>Pour signaler une erreur, indiquez le nom de l’onglet, l’action réalisée et le message affiché.</p><a href="mailto:support@cipresa.com?subject=Aide%20CIPRESA">Contacter le support <ExternalLink size={14} /></a><small>Rôles actifs : {roles.map(({ nom }) => nom).join(", ") || "aucun"}</small></section>}
    </div>
  </div>;
}
