-- Create SPPG Units table to represent distributed logistics hubs (one per sub-district)
CREATE TABLE IF NOT EXISTS sppg_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  capacity INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE sppg_units ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for demo)
CREATE POLICY "Allow public read access for sppg_units" ON sppg_units
  FOR SELECT USING (true);

-- Allow all for authenticated (for seeding)
CREATE POLICY "Allow all for authenticated users on sppg_units" ON sppg_units
  FOR ALL USING (auth.role() = 'authenticated');
