-- Migration: Add DELETE policy for vehicles
-- This allows authenticated users to delete demo vehicles for reset purposes

-- 1. Grant DELETE privilege
GRANT DELETE ON public.vehicles TO authenticated;

-- 2. Create Policy for DELETE
CREATE POLICY "authenticated_delete" ON public.vehicles
    FOR DELETE USING (auth.role() = 'authenticated');
