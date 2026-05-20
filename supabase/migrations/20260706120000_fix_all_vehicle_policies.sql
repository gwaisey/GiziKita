-- Master Fix for Vehicles Table and Policies
-- Run this in Supabase SQL Editor to guarantee everything is set up correctly.

-- 1. Ensure table exists (safeguard)
CREATE TABLE IF NOT EXISTS public.vehicles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    license_plate text NOT NULL,
    driver_name text,
    status text NOT NULL DEFAULT 'idle',
    last_lat double precision,
    last_lng double precision,
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Add destination columns safely if they don't exist yet
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.vehicles ADD COLUMN destination_school_name text;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    BEGIN
        ALTER TABLE public.vehicles ADD COLUMN destination_lat double precision;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    BEGIN
        ALTER TABLE public.vehicles ADD COLUMN destination_lng double precision;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
END $$;

-- 3. Enable Row Level Security
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- 4. Drop any old/conflicting policies
DROP POLICY IF EXISTS "public_select" ON public.vehicles;
DROP POLICY IF EXISTS "authenticated_select" ON public.vehicles;
DROP POLICY IF EXISTS "authenticated_insert" ON public.vehicles;
DROP POLICY IF EXISTS "authenticated_update" ON public.vehicles;
DROP POLICY IF EXISTS "authenticated_delete" ON public.vehicles;
DROP POLICY IF EXISTS "service_upsert" ON public.vehicles;
DROP POLICY IF EXISTS "service_insert" ON public.vehicles;
DROP POLICY IF EXISTS "service_update" ON public.vehicles;

-- 5. Create fresh, guaranteed policies for Authenticated users
CREATE POLICY "authenticated_select" ON public.vehicles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_insert" ON public.vehicles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "authenticated_update" ON public.vehicles FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_delete" ON public.vehicles FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Grant all required privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;

-- 7. Ensure Realtime is enabled
ALTER TABLE public.vehicles REPLICA IDENTITY FULL;
