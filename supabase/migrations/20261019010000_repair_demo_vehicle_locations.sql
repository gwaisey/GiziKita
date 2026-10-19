-- Repair coordinates from previously generated synthetic school markers.
-- Demo destinations are snapped to the regional SPPG hub centroid instead of
-- retaining randomized offsets that may place them offshore.
UPDATE public.schools AS school
SET lat = hub.lat,
    lng = hub.lng
FROM public.sppg_units AS hub
WHERE school.name LIKE 'Sekolah Bina Gizi %'
  AND hub.name = 'SPPG ' || school.city || ' - Hub 1'
  AND lower(hub.province) = lower(school.province);

-- Keep vehicles' destination data aligned with the corrected synthetic schools.
UPDATE public.vehicles AS vehicle
SET destination_lat = school.lat,
    destination_lng = school.lng,
    status = CASE
      WHEN vehicle.route_source IS DISTINCT FROM 'mapbox_driving'
           AND vehicle.status = 'unloading' THEN 'idle'::public.vehicle_status
      ELSE vehicle.status
    END,
    route_progress = CASE
      WHEN vehicle.route_source IS DISTINCT FROM 'mapbox_driving' THEN 0
      ELSE vehicle.route_progress
    END
FROM public.schools AS school
WHERE vehicle.destination_school_name = school.name
  AND school.name LIKE 'Sekolah Bina Gizi %';
