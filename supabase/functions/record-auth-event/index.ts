import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminClient = createClient(supabaseUrl, serviceRoleKey);
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function firstHeader(request: Request, names: string[]) {
  for (const name of names) {
    const value = request.headers.get(name)?.split(",")[0]?.trim();
    if (value) return value;
  }
  return null;
}

async function resolveIpLocation(ipAddress: string | null) {
  if (!ipAddress) return { countryCode: null, region: null, city: null };
  try {
    const result = await fetch(`https://ipapi.co/${encodeURIComponent(ipAddress)}/json/`);
    if (!result.ok) return { countryCode: null, region: null, city: null };
    const data = await result.json();
    return { countryCode: data.country_code || null, region: data.region || null, city: data.city || null };
  } catch {
    return { countryCode: null, region: null, city: null };
  }
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
  const deviceKey = String(payload.deviceKey || "").trim();
  const label = String(payload.label || "Appareil").trim().slice(0, 120);
  const userAgent = String(payload.userAgent || request.headers.get("user-agent") || "").slice(0, 500);
  const deviceModel = String(payload.deviceModel || "Inconnu").slice(0, 120);
  const osName = String(payload.osName || "Inconnu").slice(0, 80);
  const osVersion = String(payload.osVersion || "").slice(0, 40);
  const browserName = String(payload.browserName || "Inconnu").slice(0, 80);
  const browserVersion = String(payload.browserVersion || "").slice(0, 40);
  if (!deviceKey) return response({ error: "Identifiant appareil requis." }, 400);

  const ipAddress = firstHeader(request, ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"]);
  let countryCode = firstHeader(request, ["cf-ipcountry", "x-country-code"]);
  let region = firstHeader(request, ["x-vercel-ip-country-region", "x-region"]);
  let city = firstHeader(request, ["x-vercel-ip-city", "x-city"]);
  if (!countryCode || !region || !city) {
    const fallbackLocation = await resolveIpLocation(ipAddress);
    countryCode ||= fallbackLocation.countryCode;
    region ||= fallbackLocation.region;
    city ||= fallbackLocation.city;
  }
  const now = new Date().toISOString();

  const { data: existingDevice, error: existingError } = await adminClient
    .from("user_devices")
    .select("id, login_count, first_seen_at")
    .eq("user_id", user.id)
    .eq("device_key", deviceKey)
    .maybeSingle();
  if (existingError) return response({ error: existingError.message }, 500);

  const { data: device, error: deviceError } = await adminClient
    .from("user_devices")
    .upsert({
      user_id: user.id,
      device_key: deviceKey,
      label,
      user_agent: userAgent,
      last_seen_at: now,
      last_login_at: now,
      first_seen_at: existingDevice?.first_seen_at || now,
      login_count: (existingDevice?.login_count || 0) + 1,
      last_ip_address: ipAddress,
      last_country_code: countryCode,
      last_region: region,
      last_city: city,
      device_model: deviceModel,
      os_name: osName,
      os_version: osVersion,
      browser_name: browserName,
      browser_version: browserVersion,
      revoked_at: null,
    }, { onConflict: "user_id,device_key", ignoreDuplicates: false })
    .select("id, login_count, first_seen_at")
    .single();
  if (deviceError || !device) return response({ error: deviceError?.message || "Appareil non enregistré." }, 500);

  const { error: eventError } = await adminClient.from("device_login_events").insert({
    user_id: user.id,
    device_id: device.id,
    device_key: deviceKey,
    event_type: "LOGIN",
    ip_address: ipAddress,
    country_code: countryCode,
    region,
    city,
    user_agent: userAgent,
    device_model: deviceModel,
    os_name: osName,
    os_version: osVersion,
    browser_name: browserName,
    browser_version: browserVersion,
  });
  if (eventError) return response({ error: eventError.message }, 500);
  return response({ deviceId: device.id, loginCount: device.login_count });
});
