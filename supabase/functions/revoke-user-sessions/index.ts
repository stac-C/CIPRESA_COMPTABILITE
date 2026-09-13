import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminClient = createClient(supabaseUrl, serviceRoleKey);
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405);
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return response({ error: "Authentification requise." }, 401);
  const { data: { user }, error: userError } = await adminClient.auth.getUser(token);
  if (userError || !user) return response({ error: "Session invalide." }, 401);

  let payload: Record<string, unknown>;
  try { payload = await request.json(); } catch { return response({ error: "Payload invalide." }, 400); }
  const deviceId = String(payload.deviceId || "").trim();
  const { data: device, error: deviceError } = await adminClient
    .from("user_devices").select("id, user_id, device_key").eq("id", deviceId).eq("user_id", user.id).single();
  if (deviceError || !device) return response({ error: "Appareil introuvable." }, 404);

  const revokedAt = new Date().toISOString();
  const { error: revokeError } = await adminClient.from("user_devices").update({ revoked_at: revokedAt }).eq("id", device.id);
  if (revokeError) return response({ error: revokeError.message }, 500);
  await adminClient.from("push_subscriptions").delete().eq("user_id", user.id).eq("device_key", device.device_key);
  await adminClient.from("device_login_events").insert({ user_id: user.id, device_id: device.id, device_key: device.device_key, event_type: "REMOTE_SIGN_OUT", user_agent: request.headers.get("user-agent") });

  // Supabase ne propose pas de ciblage de session par device : la revocation ferme donc toutes les sessions du compte.
  const { error: signOutError } = await adminClient.auth.admin.signOut(user.id, "global");
  if (signOutError) return response({ error: signOutError.message }, 500);
  return response({ revokedAt, global: true });
});
