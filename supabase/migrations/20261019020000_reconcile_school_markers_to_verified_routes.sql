-- Only publish synthetic demo-school coordinates when a road-verified vehicle
-- route exists. Use the last coordinate of that route as the canonical,
-- road-snapped destination so the marker and simulation endpoint agree.
WITH verified_destinations AS (
  SELECT DISTINCT ON (vehicle.destination_school_name)
    vehicle.destination_school_name AS school_name,
    (vehicle.route_geometry -> (jsonb_array_length(vehicle.route_geometry) - 1) ->> 0)::double precision AS lng,
    (vehicle.route_geometry -> (jsonb_array_length(vehicle.route_geometry) - 1) ->> 1)::double precision AS lat
  FROM public.vehicles AS vehicle
  WHERE vehicle.route_source = 'mapbox_driving'
    AND CASE WHEN jsonb_typeof(vehicle.route_geometry) = 'array'
      THEN jsonb_array_length(vehicle.route_geometry) >= 2
      ELSE false
    END
    AND vehicle.destination_school_name IS NOT NULL
  ORDER BY vehicle.destination_school_name, vehicle.updated_at DESC NULLS LAST
)
UPDATE public.schools AS school
SET lng = destination.lng,
    lat = destination.lat
FROM verified_destinations AS destination
WHERE school.name = destination.school_name
  AND school.name LIKE 'Sekolah Bina Gizi %';

-- Synthetic demo schools without a verified road destination must not be
-- represented by guessed coordinates (which can be in the sea).
UPDATE public.schools AS school
SET lat = NULL,
    lng = NULL
WHERE school.name LIKE 'Sekolah Bina Gizi %'
  AND NOT EXISTS (
    SELECT 1
    FROM public.vehicles AS vehicle
    WHERE vehicle.destination_school_name = school.name
      AND vehicle.route_source = 'mapbox_driving'
      AND CASE WHEN jsonb_typeof(vehicle.route_geometry) = 'array'
        THEN jsonb_array_length(vehicle.route_geometry) >= 2
        ELSE false
      END
  );

-- Align vehicle destinations and progress with verified route endpoints. Old
-- unverified demo paths are reset to idle rather than shown as trips to nowhere.
UPDATE public.vehicles AS vehicle
SET destination_lng = (vehicle.route_geometry -> (jsonb_array_length(vehicle.route_geometry) - 1) ->> 0)::double precision,
    destination_lat = (vehicle.route_geometry -> (jsonb_array_length(vehicle.route_geometry) - 1) ->> 1)::double precision
WHERE vehicle.route_source = 'mapbox_driving'
  AND CASE WHEN jsonb_typeof(vehicle.route_geometry) = 'array'
    THEN jsonb_array_length(vehicle.route_geometry) >= 2
    ELSE false
  END;

UPDATE public.vehicles
SET route_source = 'demo_unverified',
    route_progress = 0,
    status = CASE WHEN status IN ('en_route', 'unloading') THEN 'idle'::vehicle_status ELSE status END
WHERE destination_school_name LIKE 'Sekolah Bina Gizi %'
  AND route_source IS DISTINCT FROM 'mapbox_driving';
