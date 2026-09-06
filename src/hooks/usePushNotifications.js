import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function base64ToBytes(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const normalized = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(normalized), (character) => character.charCodeAt(0));
}

function deviceLabel() {
  const platform = navigator.userAgentData?.platform || navigator.platform || "Appareil";
  return `${platform} · ${/Mobile/i.test(navigator.userAgent) ? "Mobile" : "Navigateur"}`;
}

export default function usePushNotifications(userId) {
  const [permission, setPermission] = useState(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (!userId || !("serviceWorker" in navigator) || !("PushManager" in window)) return undefined;
    let active = true;
    async function register() {
      const registration = await navigator.serviceWorker.register("/sw.js");
      if (!active) return;
      setSupported(true);
      const deviceKey = `${registration.scope}:${navigator.userAgent}`;
      await supabase.from("user_devices").upsert({ user_id: userId, device_key: deviceKey, label: deviceLabel(), user_agent: navigator.userAgent, last_seen_at: new Date().toISOString(), revoked_at: null }, { onConflict: "user_id,device_key" });
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey || typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(vapidKey) });
      await supabase.from("push_subscriptions").upsert({ user_id: userId, endpoint: subscription.endpoint, device_key: deviceKey, subscription: subscription.toJSON(), user_agent: navigator.userAgent, last_seen_at: new Date().toISOString() }, { onConflict: "endpoint" });
    }
    register().catch(() => {});
    return () => { active = false; };
  }, [userId]);

  async function enablePush() {
    if (!supported || typeof Notification === "undefined") return "unsupported";
    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    if (nextPermission === "granted") window.location.reload();
    return nextPermission;
  }

  return { supported, permission, enablePush };
}
