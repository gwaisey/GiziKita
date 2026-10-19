-- Track whether a vehicle path is a verified road route or an old/demo fallback.
-- Existing geometries are conservatively marked unverified and will be hidden until
-- a road route is obtained from the Directions API.
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS route_source text;

UPDATE public.vehicles
SET route_source = 'legacy_unverified'
WHERE route_geometry IS NOT NULL
  AND route_source IS NULL;
