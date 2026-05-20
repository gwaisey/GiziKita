import { createClient } from "supabase";

const STATUSES = [
  "idle",
  "en_route",
  "loading",
  "unloading",
  "delayed",
  "accident",
  "maintenance",
  "off_route",
  "offline",
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all vehicles
    const { data: vehicles, error: fetchErr } = await supabase
      .from("vehicles")
      .select("*");

    if (fetchErr) {
      return new Response(
        JSON.stringify({ error: fetchErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!vehicles || vehicles.length === 0) {
      return new Response(
        JSON.stringify({ message: "No vehicles to simulate" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Nudge each vehicle's position and optionally change status
    const updates = vehicles.map((v: Record<string, unknown>) => {
      const isMoving = v.status === "en_route" || v.status === "delayed";
      const deltaLat = isMoving ? (Math.random() - 0.5) * 0.003 : 0;
      const deltaLng = isMoving ? (Math.random() - 0.5) * 0.003 : 0;

      const shouldChangeStatus = Math.random() < 0.15;
      const newStatus = shouldChangeStatus
        ? STATUSES[Math.floor(Math.random() * STATUSES.length)]
        : v.status;

      return {
        id: v.id,
        last_lat: ((v.last_lat as number) ?? -6.2) + deltaLat,
        last_lng: ((v.last_lng as number) ?? 106.8) + deltaLng,
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
    });

    const { error: upsertErr } = await supabase
      .from("vehicles")
      .upsert(updates);

    if (upsertErr) {
      return new Response(
        JSON.stringify({ error: upsertErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: `Simulated ${updates.length} vehicles`, updates }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
