'use client';

import { useEffect, useState, useRef } from 'react';
import { Marker } from 'react-map-gl/mapbox';
import { useVehicleStore, Vehicle, VehicleStatus } from '@/js/store/vehicleStore';
import { useShallow } from 'zustand/react/shallow';
import VehicleService, { VEHICLE_STATUS_META } from '@/js/services/VehicleService';

function CreateMarkerPin({ status, bearing = 0 }: { status: VehicleStatus, bearing?: number }) {
  const meta = VEHICLE_STATUS_META[status];
  const color = meta.color;
  
  return (
    <div className="vehicle-marker-wrapper" style={{ 
      cursor: 'pointer', 
      position: 'relative', 
      width: '32px', 
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: `rotate(${bearing}deg)`,
      transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      willChange: 'transform',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))'
    }}>
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Main Body */}
        <rect x="9" y="7" width="14" height="22" rx="4" fill={color} />
        {/* Windshield / Cockpit - Clearly indicates the front */}
        <path d="M10 11C10 9.34315 11.3431 8 13 8H19C20.6569 8 22 9.34315 22 11V15H10V11Z" fill="#1A1A1A" fillOpacity="0.8" />
        {/* Headlights (Front) */}
        <rect x="10" y="7" width="3" height="1.2" rx="0.4" fill="#FFFBEB" />
        <rect x="19" y="7" width="3" height="1.2" rx="0.4" fill="#FFFBEB" />
        {/* Tail Lights (Rear) */}
        <rect x="10" y="27.8" width="3" height="1" rx="0.5" fill="#FF4444" />
        <rect x="19" y="27.8" width="3" height="1" rx="0.5" fill="#FF4444" />
        {/* Subtle accent line */}
        <rect x="11" y="20" width="10" height="4" rx="1" fill="#FFFFFF" fillOpacity="0.1" />
      </svg>
    </div>
  );
}

interface AnimatedVehicleMarkerProps {
  vehicleId: string;
  onClick: (vehicle: Vehicle) => void;
}

export default function AnimatedVehicleMarker({ vehicleId, onClick }: AnimatedVehicleMarkerProps) {
  // Subscribe ONLY to this specific vehicle's data
  const vehicle = useVehicleStore(useShallow((state) => 
    state.vehicles.find(v => v.id === vehicleId)
  ));

  const [displayCoords, setDisplayCoords] = useState({
    lat: vehicle?.last_lat ?? -6.2,
    lng: vehicle?.last_lng ?? 106.8
  });

  // If vehicle is not found (e.g. deleted), don't render
  if (!vehicle) return null;

  // Shortest path rotation logic
  const [continuousBearing, setContinuousBearing] = useState(vehicle.bearing ?? 0);
  const prevBearingRef = useRef(vehicle.bearing ?? 0);
  
  // Animation state refs to avoid re-renders during the RAF loop
  const animationRef = useRef<{
    startProgress: number;
    targetProgress: number;
    startTime: number;
    lastProcessedTarget: number;
  }>({
    startProgress: vehicle.route_progress ?? 0,
    targetProgress: vehicle.route_progress ?? 0,
    startTime: Date.now(),
    lastProcessedTarget: vehicle.route_progress ?? 0
  });

  // Update target when vehicle prop changes (every ~1s from simulation)
  useEffect(() => {
    const currentTarget = vehicle.route_progress ?? 0;
    
    // Handle rotation: calculate shortest distance between angles
    const newBearing = vehicle.bearing ?? 0;
    let delta = newBearing - (prevBearingRef.current % 360);
    
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    
    const nextContinuous = prevBearingRef.current + delta;
    setContinuousBearing(nextContinuous);
    prevBearingRef.current = nextContinuous;

    // Only trigger a new interpolation if the target progress has actually changed
    if (Math.abs(currentTarget - animationRef.current.lastProcessedTarget) > 0.000001) {
      const now = Date.now();
      const elapsed = Math.min(now - animationRef.current.startTime, 1000);
      const t = elapsed / 1000;
      
      // Calculate where we are right now to start the next glide from there
      const currentInterpolatedProgress = animationRef.current.startProgress + 
        (animationRef.current.targetProgress - animationRef.current.startProgress) * t;

      animationRef.current = {
        startProgress: currentInterpolatedProgress,
        targetProgress: currentTarget,
        startTime: now,
        lastProcessedTarget: currentTarget
      };
    }
  }, [vehicle.route_progress]);

  // The high-frequency glide loop
  useEffect(() => {
    let rafId: number;
    
    const animate = () => {
      const now = Date.now();
      const { startProgress, targetProgress, startTime } = animationRef.current;
      
      // We interpolate over a 1-second window (matching the simulation tick)
      const elapsed = Math.min(now - startTime, 1000);
      const t = elapsed / 1000;
      
      // Linear interpolation along the path progress
      const nextProgress = startProgress + (targetProgress - startProgress) * t;
      
      if (vehicle.route_geometry) {
        const pos = VehicleService.getPositionAtProgress(vehicle.route_geometry, nextProgress);
        setDisplayCoords({ lat: pos.lat, lng: pos.lng });
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [vehicle.route_geometry]);

  return (
    <Marker
      latitude={displayCoords.lat}
      longitude={displayCoords.lng}
      anchor="center"
      onClick={e => {
        e.originalEvent.stopPropagation();
        onClick(vehicle);
      }}
    >
      <CreateMarkerPin status={vehicle.status} bearing={continuousBearing} />
    </Marker>
  );
}
