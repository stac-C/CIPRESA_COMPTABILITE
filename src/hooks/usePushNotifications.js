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

function parseClient() {
  const userAgent = navigator.userAgent;
  const platform = navigator.userAgentData?.platform || navigator.platform || "Inconnu";
  const mobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
  let osName = platform;
  let osVersion = "";
  if (/Windows NT 10/i.test(userAgent)) { osName = "Windows"; osVersion = "10/11"; }
  else if (/Mac OS X/i.test(userAgent)) { osName = "macOS"; osVersion = userAgent.match(/Mac OS X ([\d_]+)/i)?.[1]?.replaceAll("_", ".") || ""; }
  else if (/Android/i.test(userAgent)) { osName = "Android"; osVersion = userAgent.match(/Android ([\d.]+)/i)?.[1] || ""; }
  else if (/iPhone OS|CPU OS/i.test(userAgent)) { osName = "iOS"; osVersion = userAgent.match(/(?:iPhone )?OS ([\d_]+)/i)?.[1]?.replaceAll("_", ".") || ""; }
  else if (/Linux/i.test(userAgent)) osName = "Linux";
  let browserName = "Navigateur";
  let browserVersion = "";
  const browserPatterns = [[/Edg\/([\d.]+)/, "Edge"], [/OPR\/([\d.]+)/, "Opera"], [/Chrome\/([\d.]+)/, "Chrome"], [/Firefox\/([\d.]+)/, "Firefox"], [/Version\/([\d.]+).*Safari\//, "Safari"]];
  for (const [pattern, name] of browserPatterns) {
    const match = userAgent.match(pattern);
    if (match) { browserName = name; browserVersion = match[1]; break; }
  }
  return { deviceModel: mobile ? "Appareil mobile" : "Ordinateur", osName, osVersion, browserName, browserVersion };
}

function deviceKey() {
  return `${window.location.origin}:${navigator.userAgent}`;
}

export default function usePushNotifications(userId, enabled = true) {
  const [permission, setPermission] = useState(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  const [supported, setSupported] = useState(false);
  const [configured, setConfigured] = useState(Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY));

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    async function register() {
      const key = deviceKey();
      await supabase.functions.invoke("record-auth-event", { body: { deviceKey: key, label: deviceLabel(), userAgent: navigator.userAgent, ...parseClient() } });
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      const registration = await navigator.serviceWorker.register("/sw.js");
      if (!active) return;
      setSupported(true);
      if (!enabled) return;
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      setConfigured(Boolean(vapidKey));
      if (!vapidKey || typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(vapidKey) });
      await supabase.from("push_subscriptions").upsert({ user_id: userId, endpoint: subscription.endpoint, device_key: key, subscription: subscription.toJSON(), user_agent: navigator.userAgent, last_seen_at: new Date().toISOString() }, { onConflict: "endpoint" });
    }
    register().catch(() => {});
    return () => { active = false; };
  }, [userId, enabled]);

  async function enablePush() {
    if (!supported || typeof Notification === "undefined") return "unsupported";
    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    if (nextPermission === "granted") window.location.reload();
    return nextPermission;
  }

  return { supported, configured, permission, enablePush };
}
