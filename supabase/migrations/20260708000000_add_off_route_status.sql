-- Add 'off_route' to the vehicle_status ENUM type
-- This ensures the DB accepts this new status without throwing errors.

ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'off_route';
