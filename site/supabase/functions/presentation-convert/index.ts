import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
    const CONVERTER_URL = Deno.env.get("CONVERTER_URL")!;
    const CONVERTER_SECRET = Deno.env.get("CONVERTER_SECRET")!;

    // 1) кто вызвал функцию (JWT пользователя)
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) проверяем роль (teacher/admin) через service_role
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const userId = userData.user.id;

    const { data: profile, error: profErr } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profErr) {
      return new Response(JSON.stringify({ error: "Profile read error", details: profErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const role = String(profile?.role || "").toLowerCase();
    if (!(role === "teacher" || role === "admin")) {
      return new Response(JSON.stringify({ error: "Forbidden (teacher/admin only)" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) lectureId из тела
    const body = await req.json().catch(() => ({}));
    const lectureId = body?.lectureId;
    if (!lectureId) {
      return new Response(JSON.stringify({ error: "lectureId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4) вызов VM-конвертера
    const r = await fetch(`${CONVERTER_URL}/convert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CONVERTER_SECRET}`,
      },
      body: JSON.stringify({ lectureId }),
    });

    const text = await r.text();
    return new Response(text, {
      status: r.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unexpected error", details: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
