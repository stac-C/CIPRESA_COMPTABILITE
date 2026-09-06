import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "../lib/supabaseClient";

function playNotificationSound() {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(660, context.currentTime + 0.14);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);
  } catch {}
}

export default function useRealtimeNotifications(userId, enabled = true) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!userId || !enabled) {
      setNotifications([]);
      return undefined;
    }

    let mounted = true;
    supabase.from("notifications").select("id, type, titre, message, lu, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(30).then(({ data }) => {
      if (mounted) setNotifications(data || []);
    });

    const channel = supabase
      .channel(`cipresa-notifications-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload) => {
        const notification = payload.new;
        setNotifications((current) => [notification, ...current].slice(0, 30));
        playNotificationSound();
        toast.success(notification.titre || "Nouvelle notification", { description: notification.message });
        if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(notification.titre || "CIPRESA", { body: notification.message });
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [userId, enabled]);

  async function markAsRead(id) {
    const { error } = await supabase.from("notifications").update({ lu: true }).eq("id", id).eq("user_id", userId);
    if (!error) setNotifications((current) => current.map((item) => item.id === id ? { ...item, lu: true } : item));
  }

  async function enableBrowserNotifications() {
    if (typeof Notification === "undefined") return "unsupported";
    return Notification.requestPermission();
  }

  return { notifications, unreadCount: notifications.filter(({ lu }) => !lu).length, markAsRead, enableBrowserNotifications };
}
