-- DATA INTEGRITY HARDENING: Supporting 100% Precision Seeding & Premium Registry

-- 1. Ensure Schools have a unique constraint for atomic upserting
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schools_name_province_key') THEN
    ALTER TABLE public.schools ADD CONSTRAINT schools_name_province_key UNIQUE (name, province);
  END IF;
END $$;

-- 2. Ensure SPPG Hubs have a unique constraint for atomic upserting
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sppg_units_name_province_key') THEN
    ALTER TABLE public.sppg_units ADD CONSTRAINT sppg_units_name_province_key UNIQUE (name, province);
  END IF;
END $$;

-- 3. Performance Indexes for the Premium School Registry
CREATE INDEX IF NOT EXISTS idx_schools_province ON public.schools(province);
CREATE INDEX IF NOT EXISTS idx_schools_city ON public.schools(city);

-- 4. Performance Indexes for the Vehicle Tracker
CREATE INDEX IF NOT EXISTS idx_vehicles_province ON public.vehicles(city); -- Note: city field in vehicles table often stores province name in demo data
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);

-- 5. Ensure GPS coordinates are high-precision
ALTER TABLE public.schools ALTER COLUMN lat TYPE DOUBLE PRECISION;
ALTER TABLE public.schools ALTER COLUMN lng TYPE DOUBLE PRECISION;
ALTER TABLE public.sppg_units ALTER COLUMN lat TYPE DOUBLE PRECISION;
ALTER TABLE public.sppg_units ALTER COLUMN lng TYPE DOUBLE PRECISION;
ALTER TABLE public.vehicles ALTER COLUMN last_lat TYPE DOUBLE PRECISION;
ALTER TABLE public.vehicles ALTER COLUMN last_lng TYPE DOUBLE PRECISION;
