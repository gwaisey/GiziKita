-- Add coordinates to schools table
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- Index for spatial queries
CREATE INDEX IF NOT EXISTS idx_schools_lat_lng ON public.schools(lat, lng);
