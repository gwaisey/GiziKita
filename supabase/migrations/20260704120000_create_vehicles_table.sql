-- Migration: create vehicles table with status enum and RLS policies

-- 1. Create enum type for vehicle status
CREATE TYPE vehicle_status AS ENUM (
    'idle',
    'en_route',
    'loading',
    'unloading',
    'delayed',
    'accident',
    'maintenance',
    'offline'
);

-- 2. Create vehicles table
CREATE TABLE public.vehicles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    license_plate text NOT NULL,
    driver_name text,
    status vehicle_status NOT NULL DEFAULT 'idle',
    city text DEFAULT 'DKI Jakarta', -- Added for regional filtering
    last_lat double precision,
    last_lng double precision,
    destination_school_name text, -- Added for delivery tracking
    destination_lat double precision,
    destination_lng double precision,
    route_geometry jsonb, -- Added for path-following simulation
    route_progress double precision DEFAULT 0,
    bearing double precision DEFAULT 0, -- Added for smooth rotation
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Optional logs table for history (future use)
CREATE TABLE public.vehicle_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    status vehicle_status NOT NULL,
    timestamp timestamp with time zone DEFAULT now()
);

-- 4. Enable Row Level Security on vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- 5. Policy: allow any authenticated user to SELECT
CREATE POLICY "authenticated_select" ON public.vehicles
    FOR SELECT USING (auth.role() = 'authenticated');

-- 6. Policy: allow authenticated users to INSERT (for demo seeding)
CREATE POLICY "authenticated_insert" ON public.vehicles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 7. Policy: allow authenticated users to UPDATE (for demo simulation)
CREATE POLICY "authenticated_update" ON public.vehicles
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 7.5 Policy: allow authenticated users to DELETE (for demo reset)
CREATE POLICY "authenticated_delete" ON public.vehicles
    FOR DELETE USING (auth.role() = 'authenticated');

-- 8. Grant privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;

-- 8. Enable real‑time for the vehicles table (Supabase default for tables with RLS)
ALTER TABLE public.vehicles REPLICA IDENTITY FULL;
