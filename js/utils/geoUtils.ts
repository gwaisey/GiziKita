/**
 * Geospatial Utilities for Land-Sensing and Coordinate Sanitization
 * Optimized for the Indonesian Archipelago.
 */
 
import type { Map } from 'mapbox-gl';

/**
 * Checks if a point is on land using Mapbox's vector tile data.
 * This is the "sensing" part of the Enterprise strategy.
 */
export async function isPointOnLand(map: Map, lng: number, lat: number): Promise<boolean> {
  // Convert geographic coordinates to screen coordinates
  const point = map.project([lng, lat]);
  
  // Query features at this point from the 'water' layer
  // Note: 'water' is the standard ID in Mapbox Streets/Light styles
  const features = map.queryRenderedFeatures(point, {
    layers: ['water', 'waterway']
  });
  
  // If no water features are found, it's likely land
  return features.length === 0;
}

/**
 * Nudges a coordinate towards a known land center if it's currently in the water.
 * This implements the "Directional Inland Bias".
 */
export async function ensureLandBound(
  map: Map, 
  lng: number, 
  lat: number, 
  centerLng: number, 
  centerLat: number,
  maxAttempts = 5
): Promise<{lng: number, lat: number}> {
  let currentLng = lng;
  let currentLat = lat;
  
  // Check if initial point is already on land
  if (await isPointOnLand(map, currentLng, currentLat)) {
    return { lng: currentLng, lat: currentLat };
  }
  
  // If in water, nudge towards the city center in steps
  // This ensures we stay within the urban landmass
  for (let i = 1; i <= maxAttempts; i++) {
    const factor = i / maxAttempts;
    const candidateLng = currentLng + (centerLng - currentLng) * factor;
    const candidateLat = currentLat + (centerLat - currentLat) * factor;
    
    if (await isPointOnLand(map, candidateLng, candidateLat)) {
      return { lng: candidateLng, lat: candidateLat };
    }
  }
  
  // Fallback to the center itself if no intermediate land is found
  return { lng: centerLng, lat: centerLat };
}

/**
 * Validates a coordinate against the Indonesian Bounding Box (Macro Check)
 */
export function isInIndonesia(lng: number, lat: number): boolean {
  return lng >= 95 && lng <= 141 && lat >= -11 && lat <= 6;
}
/**
 * Finds a safe land point at a specific distance from a center, 
 * rotating if the initial target is in the water.
 */
export async function findSafeDistributedPoint(
  map: Map,
  centerLng: number,
  centerLat: number,
  radiusDegrees: number,
  initialAngle = 0
): Promise<{lng: number, lat: number}> {
  // Try 8 different angles (every 45 degrees)
  for (let i = 0; i < 8; i++) {
    const angle = (initialAngle + i * 45) * (Math.PI / 180);
    const candidateLng = centerLng + Math.cos(angle) * radiusDegrees;
    const candidateLat = centerLat + Math.sin(angle) * radiusDegrees;
    
    // If Mapbox is ready, check if this point is on land
    if (map) {
      if (await isPointOnLand(map, candidateLng, candidateLat)) {
        return { lng: candidateLng, lat: candidateLat };
      }
    } else {
      // Fallback if no map is provided (trust the hardcoded anchor logic)
      return { lng: candidateLng, lat: candidateLat };
    }
  }
  
  // Final fallback: the center itself
  return { lng: centerLng, lat: centerLat };
}
