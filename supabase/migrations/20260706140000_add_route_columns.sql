-- Migration: add route geometry and index to vehicles table
-- This allows the map to persist the exact path even after refreshes

ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS route_geometry jsonb,
ADD COLUMN IF NOT EXISTS route_progress double precision DEFAULT 0;

-- Refresh realtime publication
ALTER TABLE public.vehicles REPLICA IDENTITY FULL;
