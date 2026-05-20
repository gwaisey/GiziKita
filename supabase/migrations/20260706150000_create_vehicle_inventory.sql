-- Create vehicle inventory table for asset registry
CREATE TABLE IF NOT EXISTS public.vehicle_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate TEXT UNIQUE NOT NULL,
    vin TEXT UNIQUE NOT NULL,
    model TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Truck',
    purchase_date DATE DEFAULT CURRENT_DATE,
    city TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Registered',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_inventory ENABLE ROW LEVEL SECURITY;

-- Policies for admin_pusat (assuming role 'admin_pusat' can manage)
CREATE POLICY "Admins can manage inventory" ON public.vehicle_inventory
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin_pusat');

CREATE POLICY "Users can view inventory" ON public.vehicle_inventory
    FOR SELECT USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_inventory_plate ON public.vehicle_inventory(license_plate);
CREATE INDEX IF NOT EXISTS idx_inventory_city ON public.vehicle_inventory(city);
