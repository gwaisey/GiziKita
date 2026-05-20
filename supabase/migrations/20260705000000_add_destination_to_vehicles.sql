-- Migration: add destination columns to vehicles table for route tracking
ALTER TABLE public.vehicles
ADD COLUMN destination_school_name text,
ADD COLUMN destination_lat double precision,
ADD COLUMN destination_lng double precision;
