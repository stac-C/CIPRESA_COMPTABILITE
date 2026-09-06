import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const adminClient = createClient(supabaseUrl, serviceRoleKey);

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
  const { data: adminRole, error: roleError } = await adminClient.from("user_roles").select("role:roles!inner(code)").eq("user_id", user.id).eq("roles.code", "ADMIN").maybeSingle();
  if (roleError || !adminRole) return response({ error: "Droits administrateur requis." }, 403);

  const payload = await request.json();
  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "");
  const nom = String(payload.nom || "").trim();
  const prenom = String(payload.prenom || "").trim();
  const telephone = String(payload.telephone || "").trim();
  const roleCode = String(payload.roleCode || "CONSULTANT").trim();
  if (!email || !password || !nom || !prenom || password.length < 6) return response({ error: "Prénom, nom, email et mot de passe de 6 caractères minimum sont requis." }, 400);

  const { data: role, error: requestedRoleError } = await adminClient.from("roles").select("id, code, nom").eq("code", roleCode).single();
  if (requestedRoleError || !role) return response({ error: "Le rôle sélectionné est introuvable." }, 400);
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nom, prenom, telephone } });
  if (createError || !created.user) return response({ error: createError?.message || "Le compte n’a pas pu être créé." }, 400);

  const { error: assignmentError } = await adminClient.from("user_roles").insert({ user_id: created.user.id, role_id: role.id });
  if (assignmentError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return response({ error: `Compte créé mais rôle non attribué: ${assignmentError.message}` }, 500);
  }
  return response({ user: { id: created.user.id, email: created.user.email }, role: role.nom });
});