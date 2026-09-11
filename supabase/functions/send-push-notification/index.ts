import webpush from "npm:web-push@3.6.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:support@cipresa.com";
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const payload = await request.json();
  const record = payload.record || payload;
  if (!record.user_id) return Response.json({ error: "user_id is required" }, { status: 400 });

  const response = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?user_id=eq.${record.user_id}&select=id,subscription`, { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } });
  const subscriptions = await response.json();
  const results = await Promise.allSettled((subscriptions || []).map(async (item: { id: string; subscription: webpush.PushSubscription }) => {
    try {
      await webpush.sendNotification(item.subscription, JSON.stringify({ title: record.titre || "CIPRESA", body: record.message || "Nouvelle notification", tag: record.id, url: "/dashboard" }));
      return { id: item.id, sent: true };
    } catch (error: any) {
      if (error.statusCode === 404 || error.statusCode === 410) await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?id=eq.${item.id}`, { method: "DELETE", headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } });
      return { id: item.id, sent: false, error: error.message };
    }
  }));
  return Response.json({ delivered: results.length });
});
